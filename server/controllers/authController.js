const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");
const crypto = require("crypto");
const {
  signupSchema,
  loginSchema,
  updateProfileSchema,
} = require("../validations/authValidation.js");
const { OAuth2Client } = require("google-auth-library");
const uploadToFTP = require("../config/uploadToFTP.js");
const emailController = require("./emailController.js");

const signup = async (req, res) => {
  const connection = await db.getConnection(); // get a connection from the pool
  try {
    const { error } = signupSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    const { fullName, email, password } = req.body;

    await connection.beginTransaction();

    const [existingUser] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 1000000);

    const [result] = await connection.query(
      "INSERT INTO users (fullName, email, password, otp, isVerified) VALUES (?, ?, ?, ?, ?)",
      [fullName, email, hashedPassword, otp, false]
    );
    const userId = result.insertId;
    await connection.execute(
      `INSERT INTO user_subscription_details 
        (user_id,plan_id, stripe_payment_id, total_minutes, total_remaining_time, total_used_time, monthly_limit, monthly_used, monthly_remaining) 
       VALUES (?,?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, 1, null, 100, 100, 0, 0, 0, 0]
    );

    // Try sending OTP email using emailController
    const otpEmailSent = await emailController.sendVerificationOtp(email, fullName, otp);

    if (!otpEmailSent) {
      await connection.rollback();
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    // Send welcome email (don't block registration if this fails)
    const welcomeEmailSent = await emailController.sendWelcomeEmail(email, fullName);
    if (!welcomeEmailSent) {
      console.warn("⚠️ Welcome email failed to send, but registration continues");
    }

    await connection.commit();

    res.status(201).json({
      message: "OTP sent to email",
      email,
      welcomeEmailSent: welcomeEmailSent
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  } finally {
    if (connection) connection.release();
  }
};

const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }
    const { email, password } = req.body;
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Longer expiry, we'll manage refresh on frontend
    );
    await db.query("UPDATE users SET active_token = ? WHERE id = ?", [token, user[0].id]);
    const [subscription] = await db.query(
      "SELECT * FROM user_subscription_details WHERE user_id = ?",
      [user[0].id]
    );

    const [momCount] = await db.query(
      "SELECT COUNT(*) AS totalCreatedMoMs FROM history WHERE user_id = ?",
      [user[0].id]
    );

    const totalCreatedMoMs = momCount[0]?.totalCreatedMoMs || 0;

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        fullName: user[0].fullName,
        email: user[0].email,
        profilePic: user[0].profilePic,
        totalTimes: subscription[0].total_minutes,
        totalRemainingTime: subscription[0].total_remaining_time,
        totalCreatedMoMs: totalCreatedMoMs,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login Failed" });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Clear active_token from database
    await db.query("UPDATE users SET active_token = NULL WHERE id = ?", [userId]);

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const oldToken = req.headers.authorization?.split(" ")[1];
    if (!oldToken) {
      return res.status(401).json({
        message: "No token provided",
        code: "NO_TOKEN"
      });
    }

    let decoded;
    let isExpired = false;

    try {
      // Verify token
      decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Token recently expired - allow refresh within grace period
        decoded = jwt.decode(oldToken);
        isExpired = true;

        if (!decoded || !decoded.id || !decoded.exp) {
          return res.status(401).json({
            message: "Invalid token format",
            code: "TOKEN_INVALID"
          });
        }

        // Only allow refresh within 7 days of expiration
        const expiredAt = decoded.exp * 1000;
        const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (Date.now() - expiredAt > gracePeriod) {
          return res.status(401).json({
            message: "Token expired beyond grace period. Please login again.",
            code: "TOKEN_EXPIRED"
          });
        }
      } else {
        return res.status(401).json({
          message: "Invalid token",
          code: "TOKEN_INVALID"
        });
      }
    }

    // Get user and their active token
    const [user] = await db.query(
      "SELECT active_token, id, email FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!user.length) {
      return res.status(401).json({
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // CRITICAL FIX: Allow refresh if token matches OR if token expired recently
    // This prevents logout when multiple refresh requests happen simultaneously
    const tokenMatches = user[0].active_token === oldToken;

    if (!tokenMatches && !isExpired) {
      // Token doesn't match and isn't expired - someone else logged in or token was revoked
      return res.status(401).json({
        message: "Session expired. Please login again.",
        code: "TOKEN_REVOKED"
      });
    }

    // If token is expired, verify it was the last active token by checking if current token is also expired or null
    if (isExpired && user[0].active_token !== null) {
      try {
        const currentDecoded = jwt.verify(user[0].active_token, process.env.JWT_SECRET);
        // Current token is valid, old token was replaced
        return res.status(401).json({
          message: "Session replaced. Please use current session.",
          code: "TOKEN_REPLACED"
        });
      } catch (err) {
        // Current token is also expired/invalid, allow refresh
      }
    }

    // Generate new token with fresh expiration (7 days from now)
    const newToken = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update active token in database
    await db.query("UPDATE users SET active_token = ? WHERE id = ?", [
      newToken,
      user[0].id
    ]);

    console.log(`✅ Token refreshed for user ${user[0].id}`);

    res.json({
      token: newToken,
      message: "Token refreshed successfully"
    });
  } catch (err) {
    console.error("❌ Refresh token error:", err);
    res.status(401).json({
      message: "Token refresh failed",
      code: "REFRESH_FAILED"
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const [user] = await db.query("SELECT otp FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    if (String(user[0].otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await db.query(
      "UPDATE users SET isVerified = ?, otp = NULL WHERE email = ?",
      [true, email]
    );

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const [user] = await db.query("SELECT id, fullName FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 1000000);
    await db.query("UPDATE users SET otp = ? WHERE email = ?", [otp, email]);

    // Use emailController to send resend OTP email
    const emailSent = await emailController.sendResendOtp(email, user[0].fullName, otp);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to resend OTP email" });
    }

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { error } = updateProfileSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    const { fullName, email, profilePic } = req.body;
    const userId = req.user.id;

    const [user] = await db.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.query(
      "UPDATE users SET fullName = ?, email= ?, profilePic = ? WHERE id = ?",
      [fullName, email, profilePic || null, userId]
    );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const userId = req.user.id;
    const buffer = req.file.buffer;
    const originalName = req.file.originalname;
    const ftpUrl = await uploadToFTP(buffer, originalName, "profile_pictures");
    const [user] = await db.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    await db.query("UPDATE users SET profilePic = ? WHERE id = ?", [
      ftpUrl,
      userId,
    ]);

    console.log(
      `✅ [Profile Upload] Profile picture updated for user ${userId}`
    );
    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePic: ftpUrl,
    });
  } catch (err) {
    console.error("❌ [Profile Upload] Error:", err);
    res
      .status(500)
      .json({ message: "Server error while uploading profile picture" });
  }
};

const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [rows] = await db.query(
      "SELECT id, fullName FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000)).padStart(6, "0");
    const expires = Date.now() + 10 * 60 * 1000; // store expiry as ms timestamp (10 min)

    await db.query(
      "UPDATE users SET resetOtp = ?, resetOtpExpires = ? WHERE email = ?",
      [otp, expires, email]
    );

    // Use emailController to send password reset OTP email
    const emailSent = await emailController.sendPasswordResetOtpEmail(email, rows[0].fullName, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset OTP has been sent to your email",
    });
  } catch (err) {
    console.error("sendPasswordResetOtp error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    const [rows] = await db.query(
      "SELECT id, resetOtp, resetOtpExpires FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or OTP" });
    }

    const user = rows[0];

    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({
        message: "No active reset request. Please request a new OTP.",
      });
    }

    // check expiry using UNIX timestamp (ms)
    const isExpired = Number(user.resetOtpExpires) < Date.now();
    if (isExpired) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
    if (!strong) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include uppercase, lowercase, and a number",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ?, resetOtp = NULL, resetOtpExpires = NULL WHERE email = ?",
      [hashed, email]
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPasswordWithOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const resetPasswordWithoutOtp = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }

    // Find user
    const [rows] = await db.query(
      "SELECT id, password FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = rows[0];

    // Validate that new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // Validate password strength
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
    if (!strongPassword) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and include uppercase letter, lowercase letter, and a number"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (err) {
    console.error("resetPasswordWithoutOtp error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};

module.exports = {
  signup,
  login,
  verifyOtp,
  resendOtp,
  updateUserProfile,
  uploadProfilePicture,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  resetPasswordWithoutOtp,
  logout,
  refreshToken,
};