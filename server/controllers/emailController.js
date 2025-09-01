import nodemailer from "nodemailer";

const sendMeetingEmail = async (req, res) => {
  const { name, email, tableData, downloadOptions } = req.body;
  const { word, excel } = downloadOptions || {};

  if (!email || !Array.isArray(tableData)) {
    return res
      .status(400)
      .json({ success: false, message: "Missing email or tableData" });
  }

  const headers = Object.keys(tableData[0] || {});
  const tableHeaders = headers.includes("Sr No")
    ? headers
    : ["Sr No", ...headers];

  const tableHtml = `
  <div style="overflow-x:auto; overflow-y:auto; max-height:300px; display:block; border:1px solid #ddd; margin-top:10px;">
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px; min-width:600px;">
      <thead>
        <tr>
          ${tableHeaders
            .map(
              (h) =>
                `<th style="border:1px solid #ddd; padding:8px; background:#007bff; color:white;">${h}</th>`
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${tableData
          .map(
            (row, i) => `
          <tr>
            ${tableHeaders
              .map(
                (key) =>
                  `<td style="border:1px solid #ddd; padding:8px; text-align:center;">
                ${key === "Sr No" ? i + 1 : row[key] ?? ""}
              </td>`
              )
              .join("")}
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>
`;


  // Buttons for download
  let buttonsHtml = "";
  if (word) {
    buttonsHtml += `<a href="${process.env.FRONTEND_URL}/download/word" 
                      style="display:inline-block;margin:10px;padding:10px 20px;background:#28a745;color:white;text-decoration:none;border-radius:4px;">
                      Download Word File
                    </a>`;
  }
  if (excel) {
    buttonsHtml += `<a href="${process.env.FRONTEND_URL}/download/excel" 
                      style="display:inline-block;margin:10px;padding:10px 20px;background:#007bff;color:white;text-decoration:none;border-radius:4px;">
                      Download Excel File
                    </a>`;
  }
  if (!word && !excel) {
    buttonsHtml += `<a href="${process.env.FRONTEND_URL}/download/word"
                      style="display:inline-block;margin:10px;padding:10px 20px;background:#28a745;color:white;text-decoration:none;border-radius:4px;">
                      Download Word File
                    </a>`;
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
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
      from: `"SmartMom Notifications" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your SmartMom Meeting Notes",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin:auto;">
          <div style="background-color:#007bff; padding:20px; text-align:center; color:white; font-weight:bold; font-size:18px;">
            SmartMom
          </div>
          <div style="padding:30px; background-color:#fff; color:#333;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your meeting notes have been successfully generated. Please review below:</p>
            ${tableHtml}
            <div style="margin-top:20px;text-align:center;">
              ${buttonsHtml}
            </div>
            <p style="margin-top:20px;">Best regards,<br/><strong>SmartMom Team</strong></p>
          </div>
          <div style="background-color:#f5f5f5; text-align:center; padding:10px; font-size:12px; color:#777;">
            SmartMom • Automated Meeting Organizer
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Email failed to send" });
  }
};

export default sendMeetingEmail;
