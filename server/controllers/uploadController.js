// uploadController.js

const db = require("../config/db");
const uploadToFTP = require("../config/uploadToFTP");
const axios = require("axios");

const ASSEMBLY_KEY = process.env.ASSEMBLYAI_API_KEY;
const UPLOAD_URL = process.env.ASSEMBLYAI_API_UPLOAD_URL;
const TRANSCRIPT_URL = process.env.ASSEMBLYAI_API_TRANSCRIPT_URL;

async function createTranscription(audioUrl) {
  const res = await axios.post(
    TRANSCRIPT_URL,
    {
      audio_url: audioUrl,
      language_detection: true,
      speaker_labels: true,
    },
    {
      headers: {
        Authorization: ASSEMBLY_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

async function pollTranscription(id, interval = 3000, timeout = 5 * 60 * 1000) {
  const start = Date.now();
  while (true) {
    const res = await axios.get(`${TRANSCRIPT_URL}/${id}`, {
      headers: { Authorization: ASSEMBLY_KEY },
    });
    const data = res.data;
    if (data.status === "completed") return data;
    if (data.status === "error") throw new Error(data.error || "Transcription error");
    if (Date.now() - start > timeout) throw new Error("Transcription timeout");
    await new Promise((r) => setTimeout(r, interval));
  }
}


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

    // 🔥 Start AssemblyAI transcription here
const created = await createTranscription(ftpUrl);
const resultTranscript = await pollTranscription(created.id);

// 📝 Use plain transcript text (utterances removed)
const speakerText = resultTranscript.text || "";


// Optional: store transcript in DB
// 📝 Insert transcript and store insertId
    const [transcriptResult] = await db.query(
      "INSERT INTO transcript_audio_file (audio_id, userId, transcript, language) VALUES (?, ?, ?, ?)",
      [
        uploadAudio.insertId,
        userId,
        JSON.stringify(resultTranscript),
        resultTranscript.language_code || null,
      ]
    );

res.status(200).json({
  message: "Audio uploaded and transcribed successfully",
  id: result.insertId,
  userId,
  audioId: uploadAudio.insertId,
   transcriptAudioId: transcriptResult.insertId, 
  title: originalName,
  audioUrl: ftpUrl,
  isMoMGenerated: false,
  uploadedAt: formattedDate,
  transcription: speakerText,

  full: resultTranscript,
  language: resultTranscript.language_code,
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