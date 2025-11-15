const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {
  signupSchema,
  loginSchema,
  updateProfileSchema,
} = require("../validations/authValidation.js");
const { OAuth2Client } = require("google-auth-library");
const uploadToFTP = require("../config/uploadToFTP.js");

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  secure: true,
  auth: {
    user: process.env.MAIL_USER_NOREPLY,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

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
    // Try sending OTP email
    await transporter.sendMail({
      from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
      to: email,
      replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
      subject: "Verify your email - OfficeMoM",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8" /><title>Email Verification</title></head>
        <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
          <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
            <tr><td align="center">
              <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
                <tr><td style="background-color:#4a90e2; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
                  OfficeMoM Email Verification
                </td></tr>
                <tr><td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                  <p>Hello,</p>
                  <p>Thank you for signing up with <b>OfficeMoM</b>. Please verify your email using this OTP:</p>
                  <p style="text-align:center; margin:30px 0;">
                    <span style="display:inline-block; padding:15px 30px; font-size:22px; font-weight:bold; color:#ffffff; background-color:#4a90e2; border-radius:6px;">${otp}</span>
                  </p>
                  <p>This OTP is valid for <b>10 minutes</b>.</p>
                  <p style="margin-top:30px;">Best regards,<br/>The OfficeMoM Team</p>
                </td></tr>
                <tr><td style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777777;">
                  &copy; ${new Date().getFullYear()} OfficeMoM. All rights reserved.
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>`,
    });

    await connection.commit();

    res.status(201).json({ message: "OTP sent to email", email });
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
  // { expiresIn: "2m" } // 2 minutes for testing
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
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
      // Verify token
      decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Allow refresh for recently expired tokens (within 7 days)
        decoded = jwt.decode(oldToken);
        if (!decoded || !decoded.id) {
          return res.status(401).json({ message: "Invalid token" });
        }
      } else {
        return res.status(401).json({ message: "Invalid token" });
      }
    }

    // Check if token is still active in database
    const [user] = await db.query(
      "SELECT active_token, id, email FROM users WHERE id = ?", 
      [decoded.id]
    );
    
    if (!user.length || user[0].active_token !== oldToken) {
      return res.status(401).json({ 
        message: "Session expired. Please login again." 
      });
    }

    // Generate new token with fresh expiration (7 days from now)
    const newToken = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
      // { expiresIn: "2m" } // 2 minutes for testing
    );

    // Update active token in database
    await db.query("UPDATE users SET active_token = ? WHERE id = ?", [
      newToken, 
      user[0].id
    ]);

    res.json({ token: newToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({ message: "Token refresh failed" });
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
    const [user] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 1000000);
    await db.query("UPDATE users SET otp = ? WHERE email = ?", [otp, email]);

    await transporter.sendMail({
      from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
      to: email,
      subject: "Resend OTP",
      replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
      subject: "Resend OTP - OfficeMoM",
      html: `
      <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8" /><title>Resend OTP</title></head>
        <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
          <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
            <tr><td align="center">
              <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
                <tr><td style="background-color:#4a90e2; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
                  OfficeMoM Resend OTP
                </td></tr>
                <tr><td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                  <p>Hello,</p>
                  <p>Your new OTP is:</p>
                  <p style="text-align:center; margin:30px 0;">
                    <span style="display:inline-block; padding:15px 30px; font-size:22px; font-weight:bold; color:#ffffff; background-color:#4a90e2; border-radius:6px;">${otp}</span>
                  </p>
                  <p>This OTP is valid for <b>10 minutes</b>.</p>
                  <p style="margin-top:30px;">Best regards,<br/>The OfficeMoM Team</p>
                </td></tr>
                <tr><td style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777777;">
                  &copy; ${new Date().getFullYear()} OfficeMoM. All rights reserved.
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>`,
    });

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

    await transporter.sendMail({
      from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
      to: email,
      replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
      subject: "Password Reset OTP - OfficeMoM",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8" /><title>OfficeMoM Password Reset</title></head>
        <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
          <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
            <tr><td align="center">
              <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
                <tr><td style="background-color:#4a90e2; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
                  OfficeMoM Password Reset
                </td></tr>
                <tr><td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                  <p>Hello${rows[0].fullName ? ` ${rows[0].fullName}` : ""},</p>
                  <p>Use the OTP below to reset your password. It is valid for <b>10 minutes</b>:</p>
                  <p style="text-align:center; margin:30px 0;">
                    <span style="display:inline-block; padding:15px 30px; font-size:22px; font-weight:bold; color:#ffffff; background-color:#4a90e2; border-radius:6px;">${otp}</span>
                  </p>
                  <p style="margin-top:30px;">Best regards,<br/>The OfficeMoM Team</p>
                </td></tr>
                <tr><td style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777777;">
                  &copy; ${new Date().getFullYear()} OfficeMoM. All rights reserved.
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

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
