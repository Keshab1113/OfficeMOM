const db = require("../config/db.js");
const { contactSchema } = require("../validations/authValidation.js");
const nodemailer = require("nodemailer");


const createContact = async (req, res) => {
  try {
    const { error, value } = contactSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }
    const { name, email, message } = value;
    const [result] = await db.execute(
      "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), message.trim()]
    );
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

    await transporter.sendMail({
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
                  <p>Thanks for reaching out to OfficeMoM. We’ve received your message:</p>
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
    });

    await transporter.sendMail({
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
    });

    return res.status(201).json({
      success: true,
      data: { id: result.insertId, name, email, message },
      message: "Message stored and emails sent successfully",
    });
  } catch (err) {
    console.error("createContact error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = createContact;
