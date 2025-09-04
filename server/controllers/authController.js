import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
} from "../validations/authValidation.js";
import uploadToFTP from "../config/uploadToFTP.js";

const transporter = nodemailer.createTransport({
  host:process.env.MAILTRAP_HOST,
  port: 587,
  secure: false,
  auth: {
    user:process.env.MAIL_USER_NOREPLY,
    pass:process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const signup = async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    const { fullName, email, password } = req.body;
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 1000000);

    await db.query(
      "INSERT INTO users (fullName, email, password, otp, isVerified) VALUES (?, ?, ?, ?, ?)",
      [fullName, email, hashedPassword, otp, false]
    );

    await transporter.sendMail({
      from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
      to: email,
      replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
      subject: "Verify your email - OfficeMoM",
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
    <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color:#4a90e2; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
                OfficeMoM Email Verification
              </td>
            </tr>
            <tr>
              <td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hello,</p>
                <p>Thank you for signing up with <b>OfficeMoM</b>. To complete your registration, please verify your email address using the OTP below:</p>
                <p style="text-align:center; margin:30px 0;">
                  <span style="display:inline-block; padding:15px 30px; font-size:22px; font-weight:bold; color:#ffffff; background-color:#4a90e2; border-radius:6px;">
                    ${otp}
                  </span>
                </p>
                <p>This OTP is valid for <b>10 minutes</b>. If you didn’t request this, you can safely ignore this email.</p>
                <p style="margin-top:30px;">Best regards,<br/>The OfficeMoM Team</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777777;">
                &copy; ${new Date().getFullYear()} OfficeMoM. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
    });

    res.status(201).json({ message: "OTP sent to email", email });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
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
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        fullName: user[0].fullName,
        email: user[0].email,
        profilePic: user[0].profilePic,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
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

export const resendOtp = async (req, res) => {
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
      text: `Your new OTP is ${otp}`,
      html: `<p>Your new OTP is <b>${otp}</b></p>`,
    });

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserProfile = async (req, res) => {
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

export const uploadProfilePicture = async (req, res) => {
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

export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [rows] = await db.query(
      "SELECT id, fullName FROM users WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res
        .status(200)
        .json({ message: "If the email exists, an OTP has been sent" });
    }

    const otp = String(crypto.randomInt(100000, 1000000)).padStart(6, "0");
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
        <div style="font-family:Arial,sans-serif">
          <h2>OfficeMoM Password Reset</h2>
          <p>Hello${rows[0].fullName ? ` ${rows[0].fullName}` : ""},</p>
          <p>Use the OTP below to reset your password. It is valid for <b>10 minutes</b>.</p>
          <div style="margin:20px 0">
            <span style="display:inline-block;padding:12px 24px;background:#4a90e2;color:#fff;font-size:20px;border-radius:6px;letter-spacing:2px">${otp}</span>
          </div>
          <p>If you did not request this, you can ignore this email.</p>
          <p>— OfficeMoM Team</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "OTP sent if email exists" });
  } catch (err) {
    console.error("sendPasswordResetOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and newPassword are required" });
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
      return res
        .status(400)
        .json({
          message: "No active reset request. Please request a new OTP.",
        });
    }

    const isExpired = new Date(user.resetOtpExpires).getTime() < Date.now();
    if (isExpired) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    if (String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
    if (!strong) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, and a number",
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
