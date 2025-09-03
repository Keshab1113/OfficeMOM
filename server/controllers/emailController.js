import nodemailer from "nodemailer";
import uploadToFTP from "../config/uploadToFTP.js";

const sendMeetingEmail = async (req, res) => {
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
    return res
      .status(400)
      .json({ success: false, message: "Missing email or invalid tableData" });
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
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"OfficeMoM Notifications" <${process.env.MAIL_USER}>`,
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

    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Email failed to send" });
  }
};

export default sendMeetingEmail;
