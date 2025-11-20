const nodemailer = require("nodemailer");
const Imap = require("imap");
const uploadToFTP = require("../config/uploadToFTP.js");

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.MAIL_USER_NOREPLY,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to save email to Sent folder via IMAP
const saveToSentFolder = async (mailOptions) => {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.MAIL_USER_NOREPLY,
      password: process.env.MAIL_PASS,
      host: process.env.DEFAULT_IMAP_HOST,
      port: process.env.DEFAULT_IMAP_PORT,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    });

    imap.once("ready", () => {
      // Create the email RFC822 message
      const message = `From: ${mailOptions.from}
To: ${mailOptions.to}
Subject: ${mailOptions.subject}
Content-Type: text/html; charset=utf-8
Date: ${new Date().toUTCString()}

${mailOptions.html || mailOptions.text}`;

      imap.append(message, { mailbox: "Sent" }, (err) => {
        imap.end();
        if (err) {
          console.error("❌ Failed to save to Sent folder:", err);
          reject(err);
        } else {
          console.log("✅ Email saved to Sent folder");
          resolve();
        }
      });
    });

    imap.once("error", (err) => {
      console.error("❌ IMAP connection error:", err);
      reject(err);
    });

    imap.connect();
  });
};

// Enhanced email sending function that saves to Sent folder
const sendEmailWithCopy = async (mailOptions) => {
  try {
    // Step 1: Send the email via SMTP
    console.log("📤 Sending email via SMTP...");
    const smtpResult = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent via SMTP");

    // Step 2: Save copy to Sent folder via IMAP
    try {
      await saveToSentFolder(mailOptions);
      console.log("✅ Email saved to Sent folder via IMAP");
    } catch (sentError) {
      console.warn(
        "⚠️ Could not save to Sent folder (email was still sent):",
        sentError.message
      );
      // Don't throw error - email was sent successfully, just couldn't save copy
    }

    return smtpResult;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

const emailController = {
  // Enhanced email sending function
  sendEmail: async (mailOptions) => {
    return await sendEmailWithCopy(mailOptions);
  },

  sendWelcomeEmail: async (email, fullName) => {
    try {
      const mailOptions = {
        from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: email,
        replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
        subject: "🎉 Welcome to OfficeMoM - Let's Transform Your Meetings!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>Welcome to OfficeMoM</title>
          </head>
          <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
            <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
              <tr><td align="center">
                <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #4a90e2, #357abd); color:#ffffff; padding:25px; text-align:center;">
                      <h1 style="margin:0; font-size:28px; font-weight:bold;">Welcome to OfficeMoM! 🎉</h1>
                      <p style="margin:10px 0 0 0; font-size:16px; opacity:0.9;">Your AI-powered meeting assistant is ready</p>
                    </td>
                  </tr>
                  
                  <tr><td style="padding:30px; color:#333333; font-size:16px; line-height:1.6;">
                    <p>Hello <strong>${fullName}</strong>,</p>
                    
                    <p>Welcome to OfficeMoM! We're thrilled to have you on board. Get ready to transform your meeting experience with our AI-powered platform that automates note-taking, action item tracking, and meeting summaries.</p>
                    
                    <div style="background:#f0f8ff; padding:20px; border-radius:8px; margin:25px 0; border-left:4px solid #4a90e2;">
                      <h3 style="margin-top:0; color:#4a90e2;">🚀 What You Can Do Now:</h3>
                      <ul style="margin-bottom:0;">
                        <li>Create automated meeting minutes</li>
                        <li>Track action items and decisions</li>
                        <li>Generate professional meeting reports</li>
                        <li>Collaborate with your team seamlessly</li>
                      </ul>
                    </div>

                    <h3 style="color:#4a90e2; margin-top:30px;">🎬 See OfficeMoM in Action</h3>
                    <p>Watch this quick demo to see how OfficeMoM can revolutionize your meetings:</p>
                    
                    <div style="text-align:center; margin:25px 0;">
                      <a href="https://www.youtube.com/watch?v=dNX-mHF5ddw" target="_blank" style="display:inline-block; text-decoration:none;">
                        <img 
                          src="https://img.youtube.com/vi/dNX-mHF5ddw/maxresdefault.jpg" 
                          alt="Watch OfficeMoM Demo Video" 
                          style="width:100%; max-width:560px; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); border:none;"
                        />
                        <div style="margin-top:10px;">
                          <span style="background:#ff0000; color:white; padding:10px 20px; border-radius:4px; font-weight:bold; display:inline-block;">
                            ▶️ Watch Demo Video
                          </span>
                        </div>
                      </a>
                    </div>

                    <div style="background:#fff3cd; padding:15px; border-radius:5px; margin:25px 0; border-left:4px solid #ffc107;">
                      <p style="margin:0;"><strong>💡 Pro Tip:</strong> Start by exploring the dashboard and try creating your first meeting minutes. You have <strong>100 free minutes</strong> to get started!</p>
                    </div>

                    <div style="text-align:center; margin:30px 0;">
                      <a href="${process.env.FRONTEND_URL}" 
                         style="background: linear-gradient(135deg, #4a90e2, #357abd); color:white; padding:14px 32px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px; display:inline-block; box-shadow:0 4px 12px rgba(74, 144, 226, 0.3);">
                         Go to Your Dashboard
                      </a>
                    </div>

                    <p>If you have any questions or need help getting started, feel free to reply to this email or check out our help center.</p>
                    
                    <p style="margin-top:30px;">Happy meeting organizing!<br/><strong>The OfficeMoM Team</strong></p>
                  </td></tr>
                  
                  <tr>
                    <td style="background:#f8f9fa; padding:20px; text-align:center; font-size:14px; color:#666; border-top:1px solid #e9ecef;">
                      <p style="margin:0 0 10px 0;">
                        <a href="${
                          process.env.FRONTEND_URL
                        }/features" style="color:#4a90e2; text-decoration:none; margin:0 10px;">Features</a> • 
                        <a href="${
                          process.env.FRONTEND_URL
                        }/pricing" style="color:#4a90e2; text-decoration:none; margin:0 10px;">Pricing</a> • 
                        <a href="${
                          process.env.FRONTEND_URL
                        }/help" style="color:#4a90e2; text-decoration:none; margin:0 10px;">Help Center</a>
                      </p>
                      <p style="margin:0; font-size:12px;">
                        &copy; ${new Date().getFullYear()} OfficeMoM. All rights reserved.<br/>
                        Making meetings meaningful, one minute at a time.
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      };

      await emailController.sendEmail(mailOptions);
      console.log(`✅ Welcome email sent to: ${email}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
      return false;
    }
  },

  // Existing function for sending meeting emails
  sendMeetingEmail: async (req, res) => {
    let { name, email, tableData, downloadOptions } = req.body;
    if (typeof downloadOptions === "string") {
      try {
        downloadOptions = JSON.parse(downloadOptions);
      } catch {
        downloadOptions = {};
      }
    }
    const { word, excel } = downloadOptions || {};

    const parsedTableData = JSON.parse(tableData || "[]");

    if (!email || !Array.isArray(parsedTableData)) {
      return res.status(400).json({
        success: false,
        message: "Missing email or invalid tableData",
      });
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const ftpUrl = await uploadToFTP(
          file.buffer,
          file.originalname,
          "meeting_notes"
        );
        uploadedFiles.push({ name: file.originalname, url: ftpUrl });
      }
    }

    const headers = Object.keys(parsedTableData[0] || {});
    const tableHeaders = headers.includes("Sr No")
      ? headers
      : ["Sr No", ...headers];

    const tableHtml = `
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px; width:100%; max-width:100%; margin-top:10px;">
  <thead>
    <tr>
      ${tableHeaders
        .map(
          (h) =>
            `<th style="border:1px solid #ddd; padding:8px; background:#007bff; color:white; text-align:center; font-size:12px;">${h}</th>`
        )
        .join("")}
    </tr>
  </thead>
  <tbody>
    ${parsedTableData
      .map(
        (row, i) => `
      <tr>
        ${tableHeaders
          .map(
            (key) =>
              `<td style="border:1px solid #ddd; padding:8px; text-align:center; font-size:12px;">
            ${key === "Sr No" ? i + 1 : row[key] ?? ""}
          </td>`
          )
          .join("")}
      </tr>`
      )
      .join("")}
  </tbody>
</table>
`;

    const wordFile = uploadedFiles.find((f) =>
      f.name.toLowerCase().endsWith(".docx")
    );
    const excelFile = uploadedFiles.find((f) =>
      f.name.toLowerCase().endsWith(".xlsx")
    );

    // Buttons for download
    let buttonsHtml = "";
    if (word && wordFile) {
      buttonsHtml += `<a href="${wordFile.url}" 
                      style="display:inline-block;margin:10px;padding:10px 20px;background:#28a745;color:white;text-decoration:none;border-radius:4px;">
                      Download Word File
                    </a>`;
    }
    if (excel && excelFile) {
      buttonsHtml += `<a href="${excelFile.url}" 
                      style="display:inline-block;margin:10px;padding:10px 20px;background:#007bff;color:white;text-decoration:none;border-radius:4px;">
                      Download Excel File
                    </a>`;
    }
    if (!word && !excel && wordFile) {
      buttonsHtml += `<a href="${wordFile.url}"
                      style="display:inline-block;margin:10px;padding:10px 20px;background:#28a745;color:white;text-decoration:none;border-radius:4px;">
                      Download Word File
                    </a>`;
    }

    try {
      const mailOptions = {
        from: `"OfficeMoM Notifications" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: email,
        subject: "Your OfficeMoM Meeting Notes",
        html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-text-size-adjust: 100%;">
      <div style="max-width: 100%; width: 100%; margin: 0 auto;">
        <div style="background-color:#007bff; padding:15px; text-align:center; color:white; font-weight:bold; font-size:16px;">
          OfficeMoM
        </div>
        <div style="padding:20px; background-color:#fff; color:#333;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your meeting notes have been successfully generated. Please review below:</p>
          
          <!-- Responsive table container -->
          <div style="max-height:300px; overflow:auto; border:1px solid #ddd; margin-top:10px;">
            ${tableHtml}
          </div>
          
          <div style="margin-top:20px; text-align:center;">
            ${buttonsHtml}
          </div>
          <p style="margin-top:20px;">Best regards,<br/><strong>OfficeMoM Team</strong></p>
        </div>
        <div style="background-color:#f5f5f5; text-align:center; padding:10px; font-size:12px; color:#777;">
          OfficeMoM • Automated Meeting Organizer
        </div>
      </div>
    </body>
    </html>
  `,
      };

      await emailController.sendEmail(mailOptions);
      res.status(200).json({
        success: true,
        message: "Email sent successfully",
        files: uploadedFiles,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Email failed to send" });
    }
  },

  // NEW: Function to send processing completion email
  sendProcessingCompleteEmail: async (
    userEmail,
    userName,
    meetingTitle,
    historyId
  ) => {
    try {
      console.log(`📧 Preparing to send email to: ${userEmail}`);

      // Validate email parameters
      if (!userEmail || !userName || !meetingTitle || !historyId) {
        console.error("❌ Missing email parameters:", {
          userEmail,
          userName,
          meetingTitle,
          historyId,
        });
        return false;
      }

      // Check environment variables
      if (!process.env.MAIL_USER_NOREPLY_VIEW || !process.env.FRONTEND_URL) {
        console.error("❌ Missing required environment variables");
        console.error(
          "MAIL_USER_NOREPLY_VIEW:",
          process.env.MAIL_USER_NOREPLY_VIEW ? "Set" : "Not set"
        );
        console.error(
          "FRONTEND_URL:",
          process.env.FRONTEND_URL ? "Set" : "Not set"
        );
        return false;
      }

      const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /><title>Meeting Processing Complete</title></head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <tr><td style="background-color:#4a90e2; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
              OfficeMoM - Meeting Processing Complete! 🎉
            </td></tr>
            <tr><td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
              <p>Hello ${userName},</p>
              <p>Great news! Your meeting "<strong>${meetingTitle}</strong>" has been successfully processed and your Minutes of Meeting is ready.</p>
              <p>You can now view and download your completed MoM document from your OfficeMoM dashboard.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/momGenerate/${historyId}" 
                   style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                  View Your MoM
                </a>
              </div>
              <p>Thank you for using OfficeMoM to streamline your meeting documentation process!</p>
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
    `;

      const mailOptions = {
        from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: userEmail,
        replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
        subject: `Your MoM for "${meetingTitle}" is ready! 🎉`,
        html: emailHtml,
      };

      console.log(`📤 Sending email to: ${userEmail}`);

      // Send the email
      await emailController.sendEmail(mailOptions);
      console.log(`✅ Email sent successfully!`);

      return true;
    } catch (error) {
      console.error("❌ Error sending completion email:", error);
      console.error("Error details:", {
        userEmail,
        userName,
        meetingTitle,
        historyId,
        errorMessage: error.message,
      });
      return false;
    }
  },

  sendVerificationOtp: async (email, fullName, otp) => {
    try {
      const mailOptions = {
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
                    <p>Hello${fullName ? ` ${fullName}` : ""},</p>
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
      };

      await emailController.sendEmail(mailOptions);
      return true;
    } catch (error) {
      console.error("❌ Error sending verification OTP email:", error);
      return false;
    }
  },

  // NEW: Function to send resend OTP email
  sendResendOtp: async (email, fullName, otp) => {
    try {
      const mailOptions = {
        from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: email,
        subject: "Resend OTP - OfficeMoM",
        replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
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
                    <p>Hello${fullName ? ` ${fullName}` : ""},</p>
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
      };

      await emailController.sendEmail(mailOptions);
      return true;
    } catch (error) {
      console.error("❌ Error sending resend OTP email:", error);
      return false;
    }
  },

  // NEW: Function to send password reset OTP email
  sendPasswordResetOtpEmail: async (email, fullName, otp) => {
    try {
      const mailOptions = {
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
                    <p>Hello${fullName ? ` ${fullName}` : ""},</p>
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
      };

      await emailController.sendEmail(mailOptions);
      return true;
    } catch (error) {
      console.error("❌ Error sending password reset OTP email:", error);
      return false;
    }
  },

  // NEW: Function to send contact form acknowledgment to user
  sendContactAcknowledgment: async (email, name, message) => {
    try {
      const mailOptions = {
        from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: email,
        replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
        subject: "We received your message 🎉",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8" /><title>Contact</title></head>
          <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
            <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
              <tr><td align="center">
                <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
                  <tr><td style="background-color:#4a90e2; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
                    OfficeMoM Contact Form Acknowledgment
                  </td></tr>
                  <tr><td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                    <p>Hello ${name},</p>
                    <p>Thanks for reaching out to OfficeMoM. We've received your message:</p>
                    <blockquote>${message}</blockquote>
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
      };

      await emailController.sendEmail(mailOptions);
      return true;
    } catch (error) {
      console.error("❌ Error sending contact acknowledgment email:", error);
      return false;
    }
  },

  // NEW: Function to send contact form notification to admin
  sendContactNotificationToAdmin: async (name, email, message) => {
    try {
      const mailOptions = {
        from: `"OfficeMoM Notifications" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: process.env.MAIL_USER,
        replyTo: email,
        subject: "📩 New Contact Form Submission",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8" /><title>Contact</title></head>
          <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
            <table align="center" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0;">
              <tr><td align="center">
                <table cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
                  <tr><td style="background-color:#4a90e2; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
                    OfficeMoM New Contact Message
                  </td></tr>
                  <tr><td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                    <p>Hello Admin,</p>
                    <p>Someone is trying to contact with OfficeMoM, Here is the details:</p>
                    <p><b>Name:</b> ${name}</p>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Message:</b></p>
                    <blockquote>${message}</blockquote>
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
      };

      await emailController.sendEmail(mailOptions);
      return true;
    } catch (error) {
      console.error("❌ Error sending contact notification to admin:", error);
      return false;
    }
  },

  // NEW: Function to send payment success email
  sendPaymentSuccessEmail: async (paymentData, userData = null) => {
    try {
      const {
        customer_email,
        customer_name,
        plan_name,
        amount,
        currency,
        billing_cycle,
        invoice_pdf,
        receipt_url,
        type,
        metadata,
      } = paymentData;

      // Prepare attachments
      const attachments = [];

      // Add invoice PDF if available (for subscriptions)
      if (invoice_pdf) {
        attachments.push({
          filename: `invoice_${plan_name}.pdf`,
          path: invoice_pdf,
        });
      }

      // Add receipt URL if available (for one-time payments)
      if (receipt_url) {
        attachments.push({
          filename: `receipt_${plan_name || "recharge"}.pdf`,
          path: receipt_url,
        });
      }

      // Determine email content based on payment type
      let emailSubject, emailHtml;

      if (type === "recharge") {
        // Parse metadata to get minutes
        let minutes = 0;
        if (typeof metadata === "string") {
          try {
            const parsed = JSON.parse(metadata);
            minutes = parseInt(parsed.minutes) || 0;
          } catch (e) {
            console.error("Error parsing metadata:", e);
          }
        } else if (metadata) {
          minutes = parseInt(metadata.minutes) || 0;
        }

        emailSubject = "Payment Successful - Minutes Recharged - OfficeMoM";
        emailHtml = `
          <html>
          <body style="font-family:Arial, sans-serif; background:#f8f9fa; padding:20px;">
            <table style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background:#28a745; color:#fff; text-align:center; padding:20px; font-size:20px; font-weight:bold;">
                  Payment Successful!
                </td>
              </tr>
              <tr>
                <td style="padding:30px; color:#333;">
                  <p>Hello ${
                    userData?.fullName || customer_name || "Valued Customer"
                  },</p>
                  <p>Thank you for your recharge! Your payment has been processed successfully.</p>
                  
                  <div style="background:#f0f8ff; padding:15px; border-radius:5px; margin:20px 0;">
                    <h3 style="margin-top:0; color:#4a90e2;">Recharge Details</h3>
                    <p><b>Amount:</b> $${amount} ${currency.toUpperCase()}</p>
                    <p><b>Minutes Added:</b> ${minutes} minutes</p>
                    <p><b>Date:</b> ${new Date().toLocaleString()}</p>
                  </div>

                  <p>Your minutes have been added to your account and are ready to use.</p>
                  <p>The receipt is attached to this email for your records.</p>
                  
                  <p style="margin-top:30px;">Best regards,<br/>The OfficeMoM Team</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f0f0f0; text-align:center; padding:10px; font-size:12px; color:#777;">
                  © ${new Date().getFullYear()} OfficeMoM. All rights reserved.
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
      } else {
        // Subscription payment
        emailSubject = "Payment Successful - Subscription Active - OfficeMoM";
        emailHtml = `
          <html>
          <body style="font-family:Arial, sans-serif; background:#f8f9fa; padding:20px;">
            <table style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background:#4a90e2; color:#fff; text-align:center; padding:20px; font-size:20px; font-weight:bold;">
                  Welcome to ${plan_name}!
                </td>
              </tr>
              <tr>
                <td style="padding:30px; color:#333;">
                  <p>Hello ${
                    userData?.fullName || customer_name || "Valued Customer"
                  },</p>
                  <p>Thank you for subscribing! Your payment has been processed successfully.</p>
                  
                  <div style="background:#f0f8ff; padding:15px; border-radius:5px; margin:20px 0;">
                    <h3 style="margin-top:0; color:#4a90e2;">Subscription Details</h3>
                    <p><b>Plan:</b> ${plan_name}</p>
                    <p><b>Billing Cycle:</b> ${billing_cycle}</p>
                    <p><b>Amount:</b> $${amount} ${currency.toUpperCase()}</p>
                    <p><b>Start Date:</b> ${new Date().toLocaleString()}</p>
                  </div>

                  <p>Your subscription is now active and ready to use!</p>
                  <p>The invoice is attached to this email for your records.</p>
                  
                  <div style="background:#fff3cd; padding:15px; border-radius:5px; margin:20px 0; border-left:4px solid #ffc107;">
                    <p style="margin:0;"><b>Note:</b> You can cancel your subscription within 7 days of purchase.</p>
                  </div>
                  
                  <p style="margin-top:30px;">Best regards,<br/>The OfficeMoM Team</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f0f0f0; text-align:center; padding:10px; font-size:12px; color:#777;">
                  © ${new Date().getFullYear()} OfficeMoM. All rights reserved.
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
      }

      const mailOptions = {
        from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: customer_email,
        subject: emailSubject,
        html: emailHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await emailController.sendEmail(mailOptions);
      console.log(`✅ Payment success email sent to ${customer_email}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending payment success email:", error);
      return false;
    }
  },

  // NEW: Function to send subscription cancellation emails
  sendSubscriptionCancellationEmails: async (
    userEmail,
    userData,
    subscription,
    reason,
    adminData
  ) => {
    try {
      const safeReason = reason ? String(reason) : "Not provided";
      const {
        total_used_time = 0,
        total_used_balance = 0,
        total_minutes = 0,
        total_remaining_time = 0,
      } = adminData || {};

      // User cancellation confirmation email
      const userHtml = `
        <html>
        <body style="font-family:Arial, sans-serif; background:#f8f9fa; padding:20px;">
          <table style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <tr>
              <td style="background:#4a90e2; color:#fff; text-align:center; padding:20px; font-size:20px; font-weight:bold;">
                Subscription Cancellation Confirmation
              </td>
            </tr>
            <tr>
              <td style="padding:30px; color:#333;">
                <p>Hello ${userData?.fullName || "Valued Customer"},</p>
                <p>Your subscription for <b>${
                  subscription.product_name || subscription.plan_name
                }</b> has been scheduled for cancellation.</p>
                <p><b>Plan:</b> ${subscription.plan_name}<br/>
                   <b>Billing Cycle:</b> ${subscription.billing_cycle}<br/>
                   <b>Amount:</b> $${subscription.amount} ${
        subscription.currency
      }<br/>
                   <b>Subscription ID:</b> ${
                     subscription.stripe_subscription_id
                   }<br/>
                   <b>Valid Until:</b> ${new Date(
                     subscription.current_period_end
                   ).toLocaleString()}</p>

                <p><b>Reason for cancellation:</b> ${safeReason}</p>

                <p><b>Total Used Time:</b> ${total_used_time} minutes<br/>
                   <b>Total Used Balance:</b> $${total_used_balance}</p>

                <p>You'll retain access until the end of your current billing period.</p>
                <p>A refund will be processed within <b>15 working days</b> (if applicable).</p>
                <p style="margin-top:30px;">Best,<br/>The OfficeMoM Team</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f0f0f0; text-align:center; padding:10px; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} OfficeMoM. All rights reserved.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Admin notification email
      const adminHtml = `
        <html>
        <body style="font-family:Arial, sans-serif; background:#f8f9fa; padding:20px;">
          <table style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <tr>
              <td style="background:#dc3545; color:#fff; text-align:center; padding:20px; font-size:20px; font-weight:bold;">
                New Subscription Cancellation Request
              </td>
            </tr>
            <tr>
              <td style="padding:30px; color:#333;">
                <p><b>User Email:</b> ${userEmail}</p>
                <p><b>Subscription ID:</b> ${
                  subscription.stripe_subscription_id
                }</p>
                <p><b>Plan:</b> ${subscription.plan_name}</p>
                <p><b>Amount:</b> $${subscription.amount} ${
        subscription.currency
      }</p>
                <p><b>Billing Cycle:</b> ${subscription.billing_cycle}</p>
                <p><b>Current Period End:</b> ${new Date(
                  subscription.current_period_end
                ).toLocaleString()}</p>
                <p><b>Reason for cancellation:</b> ${safeReason}</p>
                <p><b>Invoice:</b> <a href="${
                  subscription.invoice_pdf || "#"
                }" target="_blank">View PDF</a></p>
                <p>Status: <b>Pending Refund</b></p>
                <p><b>Total Used Time:</b> ${total_used_time} minutes</p>
                <p><b>Total Used Balance:</b> $${total_used_balance}</p>
                <p><b>Total Recharge Time:</b> ${total_minutes} min</p>
                <p><b>Total Remaining Time:</b> ${total_remaining_time} min</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const adminEmail = process.env.MAIL_USER;

      // Send user email
      await emailController.sendEmail({
        from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: userEmail,
        subject: "Your subscription cancellation confirmation - OfficeMoM",
        html: userHtml,
      });

      // Send admin email
      await emailController.sendEmail({
        from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
        to: adminEmail,
        subject: `User canceled subscription - ${userEmail}`,
        html: adminHtml,
      });

      console.log(`✅ Cancellation emails sent to ${userEmail} and admin`);
      return true;
    } catch (error) {
      console.error("❌ Error sending cancellation emails:", error);
      return false;
    }
  },
};

module.exports = emailController;
