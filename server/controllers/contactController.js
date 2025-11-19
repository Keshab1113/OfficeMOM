const db = require("../config/db.js");
const { contactSchema } = require("../validations/authValidation.js");
const emailController = require("./emailController.js");

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

    // Insert contact into database
    const [result] = await db.execute(
      "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), message.trim()]
    );

    // Send acknowledgment email to user
    const userEmailSent = await emailController.sendContactAcknowledgment(email, name, message);

    // Send notification email to admin
    const adminEmailSent = await emailController.sendContactNotificationToAdmin(name, email, message);

    // Check if emails were sent successfully
    if (!userEmailSent || !adminEmailSent) {
      console.warn("⚠️ One or more emails failed to send, but contact was stored in database");
    }

    return res.status(201).json({
      success: true,
      data: { id: result.insertId, name, email, message },
      message: "Message stored successfully" +
        (userEmailSent && adminEmailSent ? " and emails sent successfully" :
          " but some emails failed to send"),
    });
  } catch (err) {
    console.error("createContact error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to process contact form submission"
    });
  }
};

module.exports = createContact;