const db = require("../config/db");
const uploadToFTP = require("../config/uploadToFTP");


const uploadAudio = async (req, res) => {
  const { source } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: no user ID" });
    }

    const buffer = req.file.buffer;
    const originalName = req.file.originalname;

    const ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");

    const [user] = await db.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const curDate = new Date();
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, "0");
    const day = String(curDate.getDate()).padStart(2, "0");
    const hours = String(curDate.getHours()).padStart(2, "0");
    const minutes = String(curDate.getMinutes()).padStart(2, "0");
    const seconds = String(curDate.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const [result] = await db.query(
      "INSERT INTO history (user_id, title, audioUrl, uploadedAt, isMoMGenerated, source, data, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        originalName,
        ftpUrl,
        formattedDate,
        false,
        source,
        null,
        null,
      ]
    );
    const [uploadAudio] = await db.query(
      "INSERT INTO user_audios (userId, title, audioUrl, uploadedAt, source) VALUES (?, ?, ?, ?, ?)",
      [userId, originalName, ftpUrl, formattedDate, source]
    );

    res.status(200).json({
      message: "Audio uploaded successfully",
      id: result.insertId,
      userId,
      audioId: uploadAudio.insertId,
      title: originalName,
      audioUrl: ftpUrl,
      isMoMGenerated: false,
      uploadedAt: formattedDate,
    });
  } catch (err) {
    console.error("Upload audio error:", err);
    res.status(500).json({
      message: "Server error while uploading audio",
      error: err.message,
    });
  }
};

module.exports = {
  uploadAudio,
};