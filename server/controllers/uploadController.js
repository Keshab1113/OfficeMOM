// // uploadController.js

const db = require("../config/db");
const uploadToFTP = require("../config/uploadToFTP");
const axios = require("axios");
const { 
  getAudioDuration,
  checkUserMinutes, 
  deductUserMinutes, 
  logMinutesUsage,
  secondsToMinutes
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
  console.log("Upload audio request received", req.body);
  
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
let ftpUrlToUse = null;

// 🔥 Get audio buffer and name based on source
if (req.body.audioUrl) {
  // Direct URL (e.g., FTP or any hosted URL)
  ftpUrlToUse = req.body.audioUrl;
  originalName = `remote_audio_${Date.now()}.mp3`;
  actualSource = source || "url_audio";

} else if (driveUrl) {
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
  // Direct file upload
  buffer = req.file.buffer;
  originalName = req.file.originalname;

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
    message: "No audio file uploaded, URL or Google Drive link provided" 
  });
}


    console.log(`Processing audio - Source: ${actualSource}, File: ${originalName}`);

    // ⏱️ STEP 1: Check audio duration and user minutes
    // ⏱️ STEP 1: Get meeting duration from frontend or fallback to auto calculation
// ⏱️ STEP 1: Get audio duration in SECONDS
// ⏱️ STEP 1: Get audio duration in MINUTES
let audioDurationMinutes;
let isEstimated = false;

if (req.body.meetingDuration && !isNaN(req.body.meetingDuration)) {
  audioDurationMinutes = parseFloat(req.body.meetingDuration);
  console.log(`✅ Using frontend meeting duration: ${audioDurationMinutes} minutes`);
} else {
  const durationResult = await getAudioDuration(buffer);
  audioDurationMinutes = typeof durationResult === 'object' ? durationResult.minutes : durationResult;
  isEstimated = typeof durationResult === 'object' ? durationResult.estimated : false;
  console.log(`ℹ️ Using computed audio duration: ${audioDurationMinutes} minutes${isEstimated ? ' (estimated)' : ''}`);
}

// ⏱️ STEP 2: Check if user has sufficient minutes
// ⏱️ STEP 2: Check if user has sufficient minutes
const minutesCheck = await checkUserMinutes(userId, audioDurationMinutes);

  if (!minutesCheck.hasMinutes) {
      // Check if it's a free user limit exceeded
      if (minutesCheck.isFreeUserLimitExceeded) {
        return res.status(403).json({
          success: false,
          message: minutesCheck.message,
          requiredMinutes: minutesCheck.requiredMinutes,
          maxFreeMinutes: minutesCheck.maxFreeMinutes,
          isFreeUserLimitExceeded: true,
          upgradeRequired: true,
          upgradeUrl: "/pricing"
        });
      }
      
      // Regular insufficient minutes error
      return res.status(402).json({
        success: false,
        message: minutesCheck.message,
        requiredMinutes: minutesCheck.requiredMinutes,
        remainingMinutes: minutesCheck.remainingMinutes,
        needsRecharge: true,
        rechargeUrl: "/pricing"
      });
    }

    // ✅ User has sufficient minutes, proceed with upload

    // If we already have a URL, no need to upload
let ftpUrl;
if (ftpUrlToUse) {
  ftpUrl = ftpUrlToUse;
  console.log(`✅ Using existing audio URL: ${ftpUrl}`);
} else {
  ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");
  console.log(`✅ Uploaded to FTP: ${ftpUrl}`);
}


    // Verify user exists
    const [user] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Format current date
   // Format current date
    const curDate = new Date();
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, "0");
    const day = String(curDate.getDate()).padStart(2, "0");
    const hours = String(curDate.getHours()).padStart(2, "0");
    const minutes = String(curDate.getMinutes()).padStart(2, "0");
    const seconds = String(curDate.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // 🔥 Check if historyId already exists (from upload-audio-to-ftp)
    let historyId;
    if (req.body.historyId) {
      historyId = req.body.historyId;
      console.log(`✅ Using existing history_id: ${historyId}`);
      
      // Update existing history record instead of inserting new one
      await db.query(
        "UPDATE history SET audioUrl = ?, isMoMGenerated = ?, source = ?, uploadedAt = ? WHERE id = ? AND user_id = ?",
        [ftpUrl, false, actualSource, formattedDate, historyId, userId]
      );
    } else {
      // Insert new history record
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
      historyId = result.insertId;
      console.log(`✅ Created new history_id: ${historyId}`);
    }

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

     
  // ⏱️ STEP 3: Deduct minutes BEFORE sending to AssemblyAI (pass seconds)
   // ⏱️ STEP 3: Deduct minutes BEFORE sending to AssemblyAI
    const deductionResult = await deductUserMinutes(userId, audioDurationMinutes);
    
    console.log(`✅ Minutes deducted: ${deductionResult.deductedMinutes}, Remaining: ${deductionResult.remainingMinutes}`);

    // 🔥 STEP 4: Now send to AssemblyAI for transcription
let assemblyUrl = ftpUrl;

if (ftpUrlToUse) {
  try {
    console.log(`🎧 Trying to send FTP URL directly to AssemblyAI: ${ftpUrl}`);

    // Try sending the FTP/public URL directly to AssemblyAI
    const testResponse = await axios.post(
      TRANSCRIPT_URL,
      { 
        audio_url: ftpUrl, 
        language_detection: true, 
        speaker_labels: true 
      },
      { headers: { authorization: ASSEMBLY_KEY } }
    );

    if (testResponse.data && testResponse.data.id) {
      console.log("✅ AssemblyAI accepted FTP URL directly.");
      assemblyUrl = ftpUrl;
    } else {
      throw new Error("AssemblyAI did not accept URL properly");
    }

    // Wait for completion
    const resultTranscript = await pollTranscription(testResponse.data.id);
    var finalTranscript = resultTranscript;

  } catch (err) {
    console.warn("⚠️ AssemblyAI might not have fetched full audio, reuploading...");

    // Fallback: fetch the FTP audio and upload manually to AssemblyAI
    try {
      const audioRes = await axios.get(ftpUrl, { responseType: "arraybuffer" });
      const uploadRes = await axios.post(
        UPLOAD_URL,
        audioRes.data,
        {
          headers: {
            authorization: ASSEMBLY_KEY,
            "content-type": "application/octet-stream",
          },
        }
      );
      assemblyUrl = uploadRes.data.upload_url;
      console.log(`✅ Reuploaded to AssemblyAI successfully: ${assemblyUrl}`);

      const created = await createTranscription(assemblyUrl);
      const resultTranscript = await pollTranscription(created.id);
      finalTranscript = resultTranscript;

    } catch (uploadErr) {
      console.error("❌ Fallback upload failed:", uploadErr.message);
      throw new Error("AssemblyAI upload failed");
    }
  }
} else {
  // Default flow for uploaded file or Google Drive
  const created = await createTranscription(ftpUrl);
  const resultTranscript = await pollTranscription(created.id);
  finalTranscript = resultTranscript;
}


    // 📝 Use plain transcript text
const speakerText = finalTranscript.text || "";

// 📝 Insert transcript into database
const [transcriptResult] = await db.query(
  "INSERT INTO transcript_audio_file (audio_id, userId, transcript, language) VALUES (?, ?, ?, ?)",
  [
    uploadAudioResult.insertId,
    userId,
    JSON.stringify(finalTranscript),
    finalTranscript.language_code || null,
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
      id: historyId,
      userId,
      audioId: uploadAudioResult.insertId,
      transcriptAudioId: transcriptResult.insertId,
      title: originalName,
      audioUrl: ftpUrl,
      isMoMGenerated: false,
      uploadedAt: formattedDate,
      transcription: speakerText,
      full: finalTranscript,
      language: finalTranscript.language_code,
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
  console.log("response from uploadtoftp",req.body)
  try {
    const userId = req.user?.id;
   const { meetingId, recordingTime: recordingTimeRaw } = req.body;
const recordingTime = recordingTimeRaw ? parseInt(recordingTimeRaw, 10) : 0; // ✅ Parse as integer

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: no user ID" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    if (!meetingId) {
      return res.status(400).json({ message: "Missing meeting ID" });
    }

    const buffer = req.file.buffer;
    const originalName = req.file.originalname;

    console.log(`📤 Uploading meeting audio for meetingId: ${meetingId}`);

    // Upload to FTP
    const ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");

    console.log(`✅ Uploaded to FTP: ${ftpUrl}`);

    // ✅ Determine final duration to save (Priority: Timer > Database > File)
let finalMinutesValue = 0;

if (recordingTime && recordingTime > 0) {
  // Priority 1: Use timer duration from frontend (most accurate)
  finalMinutesValue = secondsToMinutes(recordingTime);
  console.log(`⏱️ Using timer duration: ${recordingTime}s = ${finalMinutesValue} minutes (rounded up)`);
} else {
  // Priority 2: Check database for existing duration
  try {
    const [meeting] = await db.query(
      "SELECT duration_minutes FROM meetings WHERE room_id = ?",
      [meetingId]
    );
    
    if (meeting.length > 0 && meeting[0].duration_minutes > 0) {
      finalMinutesValue = parseFloat(meeting[0].duration_minutes);
      console.log(`✅ Using database duration: ${finalMinutesValue} minutes`);
    } else {
      // Priority 3: Calculate from uploaded file as last resort
      console.log(`⚠️ No timer or database duration, calculating from file...`);
      const durationResult = await getAudioDuration(buffer);
      finalMinutesValue = typeof durationResult === "object" ? durationResult.minutes : durationResult;
      console.log(`ℹ️ Calculated duration from file: ${finalMinutesValue} minutes (rounded up)`);
    }
  } catch (error) {
    console.error("Error getting duration from database:", error);
    // Fallback to file calculation
    const durationResult = await getAudioDuration(buffer);
    finalMinutesValue = typeof durationResult === "object" ? durationResult.minutes : durationResult;
    console.log(`ℹ️ Fallback: Calculated from file: ${finalMinutesValue} minutes (rounded up)`);
  }
}

// Update meeting record with final duration
const [updateResult] = await db.query(
  `UPDATE meetings 
   SET 
     audio_url = ?,
     duration_minutes = ?,
     ended_at = NOW()
   WHERE room_id = ?`,
  [ftpUrl, finalMinutesValue, meetingId]
);
// 🔍 Get numeric meeting.id for this room_id
const [meetingRow] = await db.query(
  `SELECT id FROM meetings WHERE room_id = ?`,
  [meetingId]
);

if (!meetingRow.length) {
  return res.status(404).json({ message: "Meeting not found for room_id" });
}

const meetingNumericId = meetingRow[0].id;




    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found or not owned by user",
      });
    }

    // console.log(`✅ Meeting ${meetingId} updated with audio URL and ${finalMinutesValue} minutes`);

    // res.status(200).json({
    //   success: true,
    //   message: "Audio uploaded and meeting updated successfully",
    //   meetingId,
    //   audioUrl: ftpUrl,
    //   fileName: originalName,
    //   durationMinutes: finalMinutesValue,
    // });
    console.log(`✅ Meeting ${meetingId} updated with audio URL and ${finalMinutesValue} minutes`);

// 📝 Also update or insert into history table
// 📝 Also update or insert into history table
let existingHistory = [];
let nullMeeting = [];

try {
  const formattedDate = new Date().toISOString().slice(0, 19).replace("T", " ");

  // 1️⃣ Try to find any history row with this meeting_id or same audioUrl
  [existingHistory] = await db.query(
    `SELECT id, meeting_id FROM history 
     WHERE user_id = ? AND (meeting_id = ? OR audioUrl = ?) 
     ORDER BY uploadedAt DESC LIMIT 1`,
    [userId, meetingId, ftpUrl]
  );

  if (existingHistory.length > 0) {
    // ✅ Update existing record
   // ✅ Update existing record
await db.query(
  `UPDATE history 
   SET 
     audioUrl = ?, 
     uploadedAt = ?, 
     meeting_id = ?, 
     isMoMGenerated = 0, 
     source = ?, 
     title = ? 
   WHERE id = ?`,
  [ftpUrl, formattedDate, meetingNumericId, "Live Transcript Conversion", originalName, existingHistory[0].id]
);


    console.log(`♻️ Updated existing history record with meeting_id ${meetingId}`);
  } else {
    // 2️⃣ If none found, check if there’s an old record missing meeting_id
    const [nullMeeting] = await db.query(
      `SELECT id FROM history 
       WHERE user_id = ? AND meeting_id IS NULL 
       AND audioUrl IS NULL 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (nullMeeting.length > 0) {
      // 🧩 Backfill that record
     await db.query(
  `UPDATE history 
   SET 
     meeting_id = ?, 
     audioUrl = ?, 
     uploadedAt = ?, 
     source = ?, 
     title = ?,
     isMoMGenerated = 0
   WHERE id = ?`,
  [meetingNumericId, ftpUrl, formattedDate, "Live Transcript Conversion", originalName, nullMeeting[0].id]
);


      console.log(`🔗 Linked old NULL history record with meeting_id ${meetingId}`);
    } else {
      // 3️⃣ Insert fresh record
      await db.query(
  `INSERT INTO history 
   (user_id, meeting_id, title, audioUrl, uploadedAt, isMoMGenerated, source, data, date) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    userId,
    meetingNumericId,
    originalName,
    ftpUrl,
    formattedDate,
    false,
    "Live Transcript Conversion",
    null,
    null
  ]
);


      console.log(`🆕 Inserted new history record for meeting ${meetingId}`);
    }
  }
} catch (historyErr) {
  console.error("⚠️ Error inserting/updating history:", historyErr);
}

// ✅ Return correct history_id
let finalHistoryId = null;

if (existingHistory?.length > 0) {
  finalHistoryId = existingHistory[0].id;
} else if (nullMeeting?.length > 0) {
  finalHistoryId = nullMeeting[0].id;
} else {
  const [insertedHistory] = await db.query(
    `SELECT id FROM history 
     WHERE user_id = ? AND meeting_id = ? 
     ORDER BY uploadedAt DESC LIMIT 1`,
    [userId, meetingNumericId]
  );
  if (insertedHistory.length > 0) {
    finalHistoryId = insertedHistory[0].id;
  }
}

res.status(200).json({
  success: true,
  message: "Audio uploaded, meeting and history updated successfully",
  meetingId,
  audioUrl: ftpUrl,
  fileName: originalName,
  durationMinutes: finalMinutesValue,
  history_id: finalHistoryId, // ✅ Return history_id here
});


  } catch (err) {
    console.error("❌ FTP upload error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading audio or updating meeting",
      error: err.message,
    });
  }
};


module.exports = {
  uploadAudio,
  uploadAudioToFTPOnly,
};