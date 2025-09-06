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
      port: 587,
      secure: false,
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
        <h2>Hello ${name},</h2>
        <p>Thanks for reaching out to OfficeMoM. We’ve received your message:</p>
        <blockquote>${message}</blockquote>
        <p>Our team will get back to you shortly!</p>
        <br/>
        <p>– OfficeMoM Team</p>
      `,
    });

    await transporter.sendMail({
      from: `"OfficeMoM Notifications" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
      to: process.env.MAIL_USER_NOREPLY,
      replyTo: process.env.MAIL_USER_NOREPLY_VIEW,
      subject: "📩 New Contact Form Submission",
      html: `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <blockquote>${message}</blockquote>
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
