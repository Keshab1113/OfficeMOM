// uploadController.js - Complete fixed version

const db = require("../config/db");
const uploadToFTP = require("../config/uploadToFTP");
const axios = require("axios");
const {
  getAudioDuration,
  checkUserMinutes,
  deductUserMinutes,
  refundUserMinutes,
  secondsToMinutes
} = require("./../middlewares/minutesManager");
const { processTranscript } = require("./deepseekController");

const ASSEMBLY_KEY = process.env.ASSEMBLYAI_API_KEY;
const UPLOAD_URL = process.env.ASSEMBLYAI_API_UPLOAD_URL;
const TRANSCRIPT_URL = process.env.ASSEMBLYAI_API_TRANSCRIPT_URL;

// ✅ Helper: Refund minutes and emit socket event
async function refundMinutesOnError(userId, historyId, minutesToRefund, errorContext) {
  try {
    console.log(`💰 Refunding ${minutesToRefund} minutes to user ${userId} due to: ${errorContext}`);

    const refundResult = await refundUserMinutes(userId, minutesToRefund);

    // Update history with refund info
    await db.query(
      `UPDATE history 
       SET error_message = CONCAT(IFNULL(error_message, ''), ' | Refunded: ${minutesToRefund} min'),
           minutes_refunded = 1,
           refunded_minutes = ?
       WHERE id = ? AND user_id = ?`,
      [minutesToRefund, historyId, userId]
    );

    console.log(`✅ Successfully refunded ${minutesToRefund} minutes`);

    // ✅ Emit subscription update via Socket.IO
    if (global.socketManager) {
      global.socketManager.emitToUser(userId, 'subscription-updated', {
        totalMinutes: refundResult.newBalance,
        remainingMinutes: refundResult.newBalance,
        refunded: true,
        refundedAmount: minutesToRefund
      });
    }

    return refundResult;
  } catch (refundError) {
    console.error(`❌ Failed to refund minutes:`, refundError);
  }
}

// ✅ Helper: Sanitize filename
function sanitizeFileName(fileName) {
  if (!fileName) fileName = `file_${Date.now()}.bin`;

  fileName = fileName.split("/").pop().split("\\").pop();
  fileName = fileName.trim().replace(/\s+/g, "_");

  const lastDot = fileName.lastIndexOf(".");
  let namePart = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  let extPart = lastDot > 0 ? fileName.substring(lastDot) : "";

  namePart = namePart.replace(/[^a-zA-Z0-9_-]/g, "");

  if (!namePart.trim()) {
    namePart = `file_${Date.now()}`;
  }

  if (!extPart || !/^\.[a-zA-Z0-9]+$/.test(extPart)) {
    extPart = ".bin";
  }

  return `${namePart}${extPart}`;
}

// ✅ Helper: Extract Google Drive file ID
function extractDriveFileId(driveUrl) {
  const match = driveUrl.match(/\/d\/(.*?)\//);
  if (!match) throw new Error("Invalid Google Drive URL format");
  return match[1];
}

// ✅ Helper: Download from Google Drive
async function downloadFromDrive(driveUrl) {
  const fileId = extractDriveFileId(driveUrl);
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  const fileRes = await axios.get(directUrl, {
    responseType: "arraybuffer",
  });

  return Buffer.from(fileRes.data);
}

// ✅ Helper: Create transcription
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

// ✅ Helper: Poll transcription
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

// ✅ Helper: Update transcription progress and emit socket event
async function updateTranscriptionProgress(historyId, userId, progress, status, message) {
  try {
    await db.query(
      `UPDATE history SET processing_progress = ?, processing_status = ? WHERE id = ? AND user_id = ?`,
      [progress, status, historyId, userId]
    );

    await db.query(
      `UPDATE processing_queue SET progress = ?, task_type = ?, status = ? WHERE history_id = ?`,
      [progress, message || status, status, historyId]
    );

    console.log(`📊 Progress: ${progress}% - ${message || status}`);

    // ✅ Emit progress update via Socket.IO
    if (global.socketManager) {
      global.socketManager.emitToUser(userId, 'processing-update', {
        historyId,
        progress,
        status,
        message: message || status
      });
    }
  } catch (error) {
    console.error("Error updating progress:", error);
  }
}

// ✅ Main: Upload audio background
const uploadAudioBackground = async (req, res) => {
  const { source, driveUrl } = req.body;
  console.log("🔥 Background audio upload request received");

  let historyId = null;
  let deductedMinutes = 0;
  let userId = null;

  try {
    userId = req.user?.id;
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

    // Get audio buffer
    if (req.body.audioUrl) {
      ftpUrlToUse = req.body.audioUrl;
      originalName = `remote_audio_${Date.now()}.mp3`;
      actualSource = source || "url_audio";
    } else if (driveUrl) {
      if (!driveUrl.includes("drive.google.com")) {
        return res.status(400).json({
          success: false,
          message: "Invalid Google Drive URL"
        });
      }
      try {
        buffer = await downloadFromDrive(driveUrl);
        originalName = `drive_audio_${Date.now()}.mp3`;
        actualSource = source || "google_drive";
      } catch (driveError) {
        return res.status(400).json({
          success: false,
          message: "Failed to download from Google Drive",
          error: driveError.message
        });
      }
    } else if (req.file) {
      buffer = req.file.buffer;
      originalName = req.file.originalname;

      if (!source) {
        actualSource = originalName.includes("recorded_audio")
          ? "Live Transcript Conversion"
          : "Generate Notes Conversion";
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "No audio file provided"
      });
    }

    // Get duration
    let audioDurationMinutes;
    try {
      if (req.body.meetingDuration && !isNaN(req.body.meetingDuration)) {
        audioDurationMinutes = parseFloat(req.body.meetingDuration);
      } else {
        const durationResult = await getAudioDuration(buffer);
        audioDurationMinutes = typeof durationResult === 'object' ? durationResult.minutes : durationResult;
      }
    } catch (durationError) {
      return res.status(400).json({
        success: false,
        message: "Unable to determine audio duration",
        error: durationError.message
      });
    }

    // Check minutes
    const minutesCheck = await checkUserMinutes(userId, audioDurationMinutes);

    if (!minutesCheck.hasMinutes) {
      if (minutesCheck.isFreeUserLimitExceeded) {
        return res.status(403).json({
          success: false,
          message: minutesCheck.message,
          isFreeUserLimitExceeded: true
        });
      }

      return res.status(402).json({
        success: false,
        message: minutesCheck.message,
        requiredMinutes: minutesCheck.requiredMinutes,
        remainingMinutes: minutesCheck.remainingMinutes
      });
    }

    // Create history record
    const formattedDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    originalName = sanitizeFileName(originalName);

    try {
      const [historyResult] = await db.query(
        `INSERT INTO history (
          user_id, title, audioUrl, uploadedAt, isMoMGenerated, 
          source, data, date, processing_status, processing_progress, 
          headers_set, awaiting_headers, deducted_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, originalName, null, formattedDate, false,
          actualSource, null, null, 'awaiting_headers', 0,
          0, 1, audioDurationMinutes
        ]
      );

      historyId = historyResult.insertId;
      console.log(`✅ Created history record: ${historyId}`);

      // Add to processing queue
      await db.query(
        `INSERT INTO processing_queue (history_id, user_id, task_type, status, progress) 
         VALUES (?, ?, ?, ?, ?)`,
        [historyId, userId, 'awaiting_headers', 'awaiting_headers', 0]
      );

    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to initialize upload",
        error: dbError.message
      });
    }

    // Deduct minutes
    try {
      const deductionResult = await deductUserMinutes(userId, audioDurationMinutes);
      deductedMinutes = audioDurationMinutes;
      console.log(`✅ Minutes deducted: ${deductionResult.deductedMinutes}`);

      // ✅ Emit subscription update
      if (global.socketManager) {
        global.socketManager.emitToUser(userId, 'subscription-updated', {
          totalMinutes: deductionResult.newBalance,
          remainingMinutes: deductionResult.remainingMinutes,
          minutesUsed: audioDurationMinutes
        });
      }
    } catch (deductError) {
      // Rollback: Delete history
      await db.query(`DELETE FROM history WHERE id = ?`, [historyId]);
      await db.query(`DELETE FROM processing_queue WHERE history_id = ?`, [historyId]);

      return res.status(500).json({
        success: false,
        message: "Failed to process payment",
        error: deductError.message
      });
    }

    // Start background processing
    processTranscriptionInBackground({
      buffer,
      originalName,
      ftpUrlToUse,
      actualSource,
      audioDurationMinutes,
      userId,
      historyId,
      deductedMinutes
    }).catch(err => {
      console.error(`❌ Background processing error for history ${historyId}:`, err);
    });

    // Return immediate response
    const [remainingMinutes] = await db.query(
      `SELECT total_remaining_time FROM user_subscription_details WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Upload successful! Redirecting to set headers...",
      historyId: historyId,
      userId: userId,
      minutesUsed: audioDurationMinutes,
      remainingMinutes: remainingMinutes[0]?.total_remaining_time || 0,
      processing: true,
      awaitingHeaders: true
    });

  } catch (err) {
    console.error("❌ Upload error:", err);

    // Refund minutes if deducted
    if (historyId && deductedMinutes > 0 && userId) {
      await refundMinutesOnError(userId, historyId, deductedMinutes, "Upload failed");
    }

    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: err.message,
      minutesRefunded: deductedMinutes > 0
    });
  }
};

// ✅ Background processing function
async function processTranscriptionInBackground(params) {
  const {
    buffer,
    originalName,
    ftpUrlToUse,
    actualSource,
    audioDurationMinutes,
    userId,
    historyId,
    deductedMinutes
  } = params;

  let audioId = null;
  let transcriptAudioId = null;
  let currentStage = "initialization";

  try {
    console.log(`🚀 Starting transcription for history ${historyId}`);

    // PHASE 1: Upload to FTP
    currentStage = "FTP upload";
    await updateTranscriptionProgress(historyId, userId, 10, 'transcribing', 'Uploading audio...');

    let ftpUrl;
    try {
      if (ftpUrlToUse) {
        ftpUrl = ftpUrlToUse;
      } else {
        ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");
      }
      console.log(`✅ Uploaded to FTP: ${ftpUrl}`);
    } catch (ftpError) {
      throw new Error(`FTP upload failed: ${ftpError.message}`);
    }

    await updateTranscriptionProgress(historyId, userId, 20, 'transcribing', 'Audio uploaded');
    await db.query(`UPDATE history SET audioUrl = ? WHERE id = ?`, [ftpUrl, historyId]);

    try {
      const [uploadAudioResult] = await db.query(
        "INSERT INTO user_audios (userId, title, audioUrl, uploadedAt, source) VALUES (?, ?, ?, ?, ?)",
        [userId, originalName, ftpUrl, new Date().toISOString().slice(0, 19).replace("T", " "), actualSource]
      );
      audioId = uploadAudioResult.insertId;
    } catch (audioDbError) {
      throw new Error(`Database error: ${audioDbError.message}`);
    }

    // PHASE 2: Transcription
    currentStage = "transcription";
    await updateTranscriptionProgress(historyId, userId, 30, 'transcribing', 'Sending to transcription...');

    let finalTranscript;
    try {
      const created = await createTranscription(ftpUrl);
      await updateTranscriptionProgress(historyId, userId, 50, 'transcribing', 'Transcribing audio...');
      finalTranscript = await pollTranscription(created.id);
    } catch (transcriptionError) {
      throw new Error(`Transcription failed: ${transcriptionError.message}`);
    }

    await updateTranscriptionProgress(historyId, userId, 80, 'transcribing', 'Transcription complete');

    const speakerText = finalTranscript.text || "";

    try {
      const [transcriptResult] = await db.query(
        "INSERT INTO transcript_audio_file (audio_id, userId, transcript, language) VALUES (?, ?, ?, ?)",
        [audioId, userId, JSON.stringify(finalTranscript), finalTranscript.language_code || null]
      );
      transcriptAudioId = transcriptResult.insertId;
    } catch (transcriptDbError) {
      throw new Error(`Database error saving transcript: ${transcriptDbError.message}`);
    }

    console.log(`✅ Transcription complete. Audio ID: ${audioId}, Transcript ID: ${transcriptAudioId}`);

    // Check if headers are already set
    const [historyCheck] = await db.query(
      `SELECT headers_set FROM history WHERE id = ? AND user_id = ?`,
      [historyId, userId]
    );

    const headersSet = historyCheck[0]?.headers_set === 1;

    if (headersSet) {
      console.log(`🚀 Headers already set, starting MoM generation`);

      const [headersRows] = await db.query(
        `SELECT headers FROM meeting_headers WHERE history_id = ? AND user_id = ?`,
        [historyId, userId]
      );

      const headers = headersRows.length > 0
        ? (typeof headersRows[0].headers === 'string'
          ? JSON.parse(headersRows[0].headers)
          : headersRows[0].headers)
        : ["Discussion Summary", "Action Items", "Responsibility", "Target Date", "Status"];

      await startMoMGeneration({
        finalTranscript: speakerText,
        headers,
        audioId,
        userId,
        transcriptAudioId,
        detectLanguage: finalTranscript.language_code,
        historyID: historyId,
        deductedMinutes
      });
    } else {
      console.log(`⏸️ Waiting for headers for history ${historyId}`);

      await db.query(
        `UPDATE history 
         SET processing_status = 'awaiting_headers', 
             processing_progress = 100,
             awaiting_headers = 1,
             data = JSON_OBJECT(
                 'audioId', ?,
                 'transcriptAudioId', ?,
                 'transcription', ?,
                 'language', ?
             )
         WHERE id = ? AND user_id = ?`,
        [audioId, transcriptAudioId, speakerText, finalTranscript.language_code, historyId, userId]
      );

      await db.query(
        `UPDATE processing_queue 
         SET status = 'awaiting_headers', 
             progress = 100, 
             task_type = 'Transcription complete - Set headers'
         WHERE history_id = ?`,
        [historyId]
      );

      // ✅ Emit awaiting headers event
      if (global.socketManager) {
        global.socketManager.emitToUser(userId, 'processing-update', {
          historyId,
          progress: 100,
          status: 'awaiting_headers',
          message: 'Ready for headers'
        });
      }
    }

  } catch (error) {
    console.error(`❌ Transcription failed at ${currentStage}:`, error);

    // ✅ Emit failure event
    if (global.socketManager) {
      global.socketManager.emitToUser(userId, 'processing-failed', {
        historyId,
        title: originalName,
        error: error.message,
        stage: currentStage,
        refundedMinutes: deductedMinutes
      });
    }

    // Refund minutes
    if (deductedMinutes > 0) {
      await refundMinutesOnError(userId, historyId, deductedMinutes, `${currentStage} failed`);
    }

    await db.query(
      `UPDATE history 
       SET processing_status = 'failed', 
           error_message = ?,
           awaiting_headers = 0
       WHERE id = ? AND user_id = ?`,
      [`Failed at ${currentStage}: ${error.message}`, historyId, userId]
    );

    await db.query(
      `UPDATE processing_queue 
       SET status = 'failed',
           task_type = ?
       WHERE history_id = ?`,
      [`Failed: ${error.message}`, historyId]
    );
  }
}

// ✅ MoM Generation function
async function startMoMGeneration(params) {
  const {
    finalTranscript,
    headers,
    audioId,
    userId,
    transcriptAudioId,
    detectLanguage,
    historyID,
    deductedMinutes
  } = params;

  let currentStage = "MoM initialization";

  try {
    console.log(`🚀 Starting MoM generation for history ${historyID}`);

    currentStage = "MoM generation";
    await updateTranscriptionProgress(historyID, userId, 75, 'generating_mom', 'Starting MoM generation...');

    const mockReq = {
      body: {
        transcript: finalTranscript,
        headers,
        audio_id: audioId,
        userId,
        transcript_audio_id: transcriptAudioId,
        detectLanguage,
        history_id: historyID
      }
    };

    const mockRes = {
      statusCode: null,
      responseData: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.responseData = data;
        return this;
      }
    };

    await updateTranscriptionProgress(historyID, userId, 85, 'generating_mom', 'Generating MoM with AI...');

    try {
      await processTranscript(mockReq, mockRes);

      if (mockRes.statusCode !== 200 || !mockRes.responseData?.success) {
        throw new Error(mockRes.responseData?.error || "MoM generation failed");
      }
    } catch (momError) {
      throw new Error(`AI processing error: ${momError.message}`);
    }

    await updateTranscriptionProgress(historyID, userId, 95, 'generating_mom', 'Finalizing...');

    // Update to completed
    await db.query(
      `UPDATE history 
       SET processing_status = 'completed', 
           processing_progress = 100,
           awaiting_headers = 0
       WHERE id = ?`,
      [historyID]
    );

    await db.query(
      `UPDATE processing_queue 
       SET status = 'completed', 
           progress = 100
       WHERE history_id = ?`,
      [historyID]
    );

    console.log(`✅ MoM generation completed for history ${historyID}`);

    // ✅ Emit completion event
    if (global.socketManager) {
      global.socketManager.emitToUser(userId, 'processing-completed', {
        historyId: historyID,
        message: 'MoM generation completed successfully'
      });
    }

  } catch (error) {
    console.error(`❌ MoM generation failed at ${currentStage}:`, error);

    // ✅ Emit failure event
    if (global.socketManager) {
      global.socketManager.emitToUser(userId, 'processing-failed', {
        historyId: historyID,
        error: error.message,
        stage: currentStage,
        refundedMinutes: deductedMinutes
      });
    }

    // Refund minutes
    if (deductedMinutes > 0) {
      await refundMinutesOnError(userId, historyID, deductedMinutes, `${currentStage} failed`);
    }

    await db.query(
      `UPDATE history 
       SET processing_status = 'failed', 
           error_message = ?,
           awaiting_headers = 0
       WHERE id = ? AND user_id = ?`,
      [`Failed at ${currentStage}: ${error.message}`, historyID, userId]
    );

    await db.query(
      `UPDATE processing_queue 
       SET status = 'failed',
           task_type = ?
       WHERE history_id = ?`,
      [`Failed: ${error.message}`, historyID]
    );
  }
}

module.exports = {
  uploadAudioBackground,
};