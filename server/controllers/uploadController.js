// // uploadController.js

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

// 🔥 New function to extract Google Drive file ID
function extractDriveFileId(driveUrl) {
  const match = driveUrl.match(/\/d\/(.*?)\//);
  if (!match) throw new Error("Invalid Google Drive URL format");
  return match[1];
}

// 🔥 New function to download from Google Drive
async function downloadFromDrive(driveUrl) {
  const fileId = extractDriveFileId(driveUrl);
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  const fileRes = await axios.get(directUrl, {
    responseType: "arraybuffer",
  });
  
  return Buffer.from(fileRes.data);
}

const uploadAudio = async (req, res) => {
  const { source, driveUrl } = req.body;
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: no user ID" });
    }

    let buffer;
    let originalName;

    // 🔥 Check if it's a Google Drive URL or file upload
    if (driveUrl) {
      // Handle Google Drive URL
      if (!driveUrl.includes("drive.google.com")) {
        return res.status(400).json({ message: "Invalid Google Drive URL" });
      }
      
      buffer = await downloadFromDrive(driveUrl);
      originalName = `drive_audio_${Date.now()}.mp3`; // Default name for Drive files
      
    } else if (req.file) {
      // Handle direct file upload
      buffer = req.file.buffer;
      originalName = req.file.originalname;
      
    } else {
      return res.status(400).json({ 
        message: "No audio file uploaded or Google Drive URL provided" 
      });
    }

    // Upload to FTP
    const ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");

    // Verify user exists
    const [user] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format current date
    const curDate = new Date();
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, "0");
    const day = String(curDate.getDate()).padStart(2, "0");
    const hours = String(curDate.getHours()).padStart(2, "0");
    const minutes = String(curDate.getMinutes()).padStart(2, "0");
    const seconds = String(curDate.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Insert into history table
    const [result] = await db.query(
      "INSERT INTO history (user_id, title, audioUrl, uploadedAt, isMoMGenerated, source, data, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        originalName,
        ftpUrl,
        formattedDate,
        false,
        source || (driveUrl ? "google_drive" : "upload"),
        null,
        null,
      ]
    );

    // Insert into user_audios table
    const [uploadAudioResult] = await db.query(
      "INSERT INTO user_audios (userId, title, audioUrl, uploadedAt, source) VALUES (?, ?, ?, ?, ?)",
      [
        userId, 
        originalName, 
        ftpUrl, 
        formattedDate, 
        source || (driveUrl ? "google_drive" : "upload")
      ]
    );

    // 🔥 Start AssemblyAI transcription
    const created = await createTranscription(ftpUrl);
    const resultTranscript = await pollTranscription(created.id);

    // 📝 Use plain transcript text
    const speakerText = resultTranscript.text || "";

    // 📝 Insert transcript into database
    const [transcriptResult] = await db.query(
      "INSERT INTO transcript_audio_file (audio_id, userId, transcript, language) VALUES (?, ?, ?, ?)",
      [
        uploadAudioResult.insertId,
        userId,
        JSON.stringify(resultTranscript),
        resultTranscript.language_code || null,
      ]
    );

    res.status(200).json({
      message: driveUrl 
        ? "Google Drive audio processed and transcribed successfully"
        : "Audio uploaded and transcribed successfully",
      id: result.insertId,
      userId,
      audioId: uploadAudioResult.insertId,
      transcriptAudioId: transcriptResult.insertId,
      title: originalName,
      audioUrl: ftpUrl,
      isMoMGenerated: false,
      uploadedAt: formattedDate,
      transcription: speakerText,
      full: resultTranscript,
      language: resultTranscript.language_code,
      source: source || (driveUrl ? "google_drive" : "upload"),
    });

  } catch (err) {
    console.error("Upload audio error:", err);
    res.status(500).json({
      message: "Server error while processing audio",
      error: err.message,
    });
  }
};

const uploadAudioToFTPOnly = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: no user ID" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const buffer = req.file.buffer;
    const originalName = req.file.originalname;

    // Upload to FTP
    const ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");

    res.status(200).json({
      message: "Audio uploaded successfully to FTP",
      audioUrl: ftpUrl,
      fileName: originalName,
    });
  } catch (err) {
    console.error("FTP upload error:", err);
    res.status(500).json({
      message: "Error uploading audio to FTP",
      error: err.message,
    });
  }
};

module.exports = {
  uploadAudio,
  uploadAudioToFTPOnly,
};