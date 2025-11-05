// // uploadController.js

const db = require("../config/db");
const uploadToFTP = require("../config/uploadToFTP");
const axios = require("axios");
const { 
   getAudioDuration,
  checkUserMinutes, 
  deductUserMinutes, 
  logMinutesUsage 
} = require("./../middlewares/minutesManager");

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
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized: no user ID" 
      });
    }

    let buffer;
    let originalName;
    let actualSource = source || "upload";

    // 🔥 Get audio buffer and name based on source
    if (driveUrl) {
      // Google Drive URL
      if (!driveUrl.includes("drive.google.com")) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Google Drive URL" 
        });
      }
      buffer = await downloadFromDrive(driveUrl);
      originalName = `drive_audio_${Date.now()}.mp3`;
      actualSource = source || "google_drive";
      
    } else if (req.file) {
      // Direct file upload (from computer, recorded audio, etc.)
      buffer = req.file.buffer;
      originalName = req.file.originalname;
      
      // Determine source based on originalname or source field
      if (!source) {
        if (originalName.includes("recorded_audio")) {
          actualSource = "Live Transcript Conversion";
        } else {
          actualSource = "Generate Notes Conversion";
        }
      }
      
    } else {
      return res.status(400).json({ 
        success: false,
        message: "No audio file uploaded or Google Drive URL provided" 
      });
    }

    console.log(`Processing audio - Source: ${actualSource}, File: ${originalName}`);

    // ⏱️ STEP 1: Check audio duration and user minutes
    // ⏱️ STEP 1: Get meeting duration from frontend or fallback to auto calculation
let audioDurationMinutes;
let isEstimated = false;

if (req.body.meetingDuration && !isNaN(req.body.meetingDuration)) {
  audioDurationMinutes = parseInt(req.body.meetingDuration);
  console.log(`✅ Using frontend meeting duration: ${audioDurationMinutes} minutes`);
} else {
  const durationResult = await getAudioDuration(buffer);
  audioDurationMinutes = typeof durationResult === 'object' ? durationResult.minutes : durationResult;
  isEstimated = typeof durationResult === 'object' ? durationResult.estimated : false;
  console.log(`ℹ️ Using computed audio duration: ${audioDurationMinutes} minutes${isEstimated ? ' (estimated)' : ''}`);
}

// ⏱️ STEP 2: Check if user has sufficient minutes
const minutesCheck = await checkUserMinutes(userId, audioDurationMinutes);

    if (!minutesCheck.hasMinutes) {
      return res.status(402).json({
        success: false,
        message: minutesCheck.message,
        requiredMinutes: audioDurationMinutes,
        remainingMinutes: minutesCheck.remainingMinutes,
        needsRecharge: true,
        rechargeUrl: "/pricing"
      });
    }

    // ✅ User has sufficient minutes, proceed with upload

    // Upload to FTP
    const ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");

    // Verify user exists
    const [user] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
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
        actualSource,
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
        actualSource
      ]
    );

    // ⏱️ STEP 3: Deduct minutes BEFORE sending to AssemblyAI
    const deductionResult = await deductUserMinutes(userId, audioDurationMinutes);
    
    console.log(`Minutes deducted: ${deductionResult.deductedMinutes}, Remaining: ${deductionResult.remainingMinutes}`);

    // 📊 Log the usage (optional but recommended for audit trail)
    // Uncomment after creating the minutes_usage_log table
    // await logMinutesUsage(
    //   userId, 
    //   uploadAudioResult.insertId, 
    //   audioDurationMinutes, 
    //   actualSource
    // );

    // 🔥 STEP 4: Now send to AssemblyAI for transcription
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

    // Success response with appropriate message based on source
    let successMessage = "Audio uploaded and transcribed successfully";
    if (driveUrl) {
      successMessage = "Google Drive audio processed and transcribed successfully";
    } else if (actualSource === "Live Transcript Conversion") {
      successMessage = "Live recording transcribed successfully";
    }

    res.status(200).json({
      success: true,
      message: successMessage,
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
      source: actualSource,
      // ⏱️ Include minutes info in response
      minutesUsed: audioDurationMinutes,
      remainingMinutes: deductionResult.remainingMinutes,
    });

  } catch (err) {
    console.error("Upload audio error:", err);
    
    // Better error messages
    let errorMessage = "Server error while processing audio";
    let statusCode = 500;
    
    if (err.message.includes("Unable to determine audio duration")) {
      errorMessage = "Could not read audio file. Using estimated duration based on file size.";
      statusCode = 400;
    } else if (err.message.includes("Insufficient minutes")) {
      errorMessage = err.message;
      statusCode = 402;
    } else if (err.message.includes("Invalid Google Drive")) {
      errorMessage = err.message;
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
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