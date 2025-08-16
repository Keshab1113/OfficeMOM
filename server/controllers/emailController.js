import nodemailer from "nodemailer";

const sendMeetingEmail = async (req, res) => {
  const { name, email, fileName } = req.body;
  const file = req.file;

  if (!email || !file) {
    return res.status(400).json({ success: false, message: "Missing email or file" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS || "S9867867878$#@4delta",
      },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
      from: `"SmartMom Notifications" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your SmartMom Meeting Notes",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
          <div style="background-color:#007bff; padding:20px; text-align:center; color:white; font-weight:bold; font-size:18px;">
            SmartMom
          </div>
          <div style="padding:30px; background-color:#fff; color:#333;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your meeting notes have been successfully generated.</p>
            <p>Please find the file attached. Click to open or download it.</p>
            <p style="margin-top:20px;">Best regards,<br/><strong>SmartMom Team</strong></p>
          </div>
          <div style="background-color:#f5f5f5; text-align:center; padding:10px; font-size:12px; color:#777;">
            SmartMom • Automated Meeting Organizer
          </div>
        </div>
      `,
      attachments: [{
        filename: fileName,
        content: file.buffer
      }]
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Email failed to send" });
  }
};

export default sendMeetingEmail;
