// middlewares/minutesManager.js

const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");

const execPromise = promisify(exec);

/**
 * Get audio duration from buffer using ffprobe directly
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Promise<number>} Duration in minutes
 */
async function getAudioDuration(audioBuffer) {
  let tempFilePath = null;

  try {
    const tempDir = os.tmpdir();
    const tempFileName = `temp_audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
    tempFilePath = path.join(tempDir, tempFileName);

    await fs.writeFile(tempFilePath, audioBuffer);

    try {
      const { getAudioDurationInSeconds } = require("get-audio-duration");
      const durationInSeconds = await getAudioDurationInSeconds(tempFilePath);
      const durationInMinutes = Math.ceil(durationInSeconds / 60);
      console.log("✅ Duration obtained via library:", durationInMinutes, "minutes");
      return durationInMinutes;
    } catch (libError) {
      console.log("📊 Library method unavailable, trying direct ffprobe...");
      const ffprobePath = require("@ffprobe-installer/ffprobe").path;
      const command = `"${ffprobePath}" -v error -show_entries format=duration -of json "${tempFilePath}"`;

      const { stdout } = await execPromise(command);
      const parsed = JSON.parse(stdout);
      const durationInSeconds = parseFloat(parsed.format?.duration || 0);

      if (!durationInSeconds || isNaN(durationInSeconds)) {
        throw new Error("Invalid duration from ffprobe");
      }

      const durationInMinutes = Math.ceil(durationInSeconds / 60);
      console.log("✅ Duration obtained via ffprobe:", durationInMinutes, "minutes");
      return durationInMinutes;
    }
  } catch (error) {
    // ⚠️ Fallback — approximate (very last resort)
    const fileSizeInMB = audioBuffer.length / (1024 * 1024);
    const estimatedMinutes = Math.ceil((fileSizeInMB * 8 * 60) / 128);
    console.log(`📏 Estimated duration: ${estimatedMinutes} minutes (based on ${fileSizeInMB.toFixed(2)} MB file size)`);
    return estimatedMinutes > 0 ? estimatedMinutes : 1;
  } finally {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }
  }
}


/**
 * Alternative: Get duration directly from URL (for already uploaded files)
 * @param {string} audioUrl - URL of the audio file
 * @returns {Promise<number>} Duration in minutes
 */
async function getAudioDurationFromUrl(audioUrl) {
  try {
    const ffprobePath = require("@ffprobe-installer/ffprobe").path;
    const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioUrl}"`;
    
    const { stdout } = await execPromise(command);
    const durationInSeconds = parseFloat(stdout.trim());
    
    if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
      throw new Error("Invalid duration from URL");
    }
    
    return Math.ceil(durationInSeconds / 60);
  } catch (error) {
    console.error("Error getting duration from URL:", error);
    throw new Error("Unable to determine audio duration from URL");
  }
}

/**
 * Check if user has sufficient minutes
 * @param {number} userId - User ID
 * @param {number} requiredMinutes - Required minutes for the audio
 * @returns {Promise<Object>} { hasMinutes: boolean, remainingMinutes: number, details: Object }
 */
async function checkUserMinutes(userId, requiredMinutes) {
  try {
    const [subscription] = await db.query(
      "SELECT * FROM user_subscription_details WHERE user_id = ?",
      [userId]
    );

    if (subscription.length === 0) {
      return {
        hasMinutes: false,
        remainingMinutes: 0,
        message: "No active subscription found. Please subscribe to continue.",
        details: null,
      };
    }

    const userSub = subscription[0];
    const remainingMinutes = userSub.total_remaining_time;

    if (remainingMinutes < requiredMinutes) {
      return {
        hasMinutes: false,
        remainingMinutes,
        requiredMinutes,
        message: `Insufficient minutes. You need ${requiredMinutes} minutes but only have ${remainingMinutes} minutes remaining.`,
        details: userSub,
      };
    }

    return {
      hasMinutes: true,
      remainingMinutes,
      requiredMinutes,
      message: "Sufficient minutes available",
      details: userSub,
    };
  } catch (error) {
    console.error("Error checking user minutes:", error);
    throw new Error("Failed to verify subscription minutes");
  }
}

/**
 * Deduct minutes from user's subscription
 * @param {number} userId - User ID
 * @param {number} minutesToDeduct - Minutes to deduct
 * @returns {Promise<Object>} Updated subscription details
 */
async function deductUserMinutes(userId, minutesToDeduct) {
  try {
    // Get current subscription
    const [subscription] = await db.query(
      "SELECT * FROM user_subscription_details WHERE user_id = ?",
      [userId]
    );

    if (subscription.length === 0) {
      throw new Error("Subscription not found");
    }

    const currentSub = subscription[0];
    const newRemainingTime = currentSub.total_remaining_time - minutesToDeduct;
    const newUsedTime = currentSub.total_used_time + minutesToDeduct;
    const newMonthlyUsed = currentSub.monthly_used + minutesToDeduct;
    const newMonthlyRemaining = currentSub.monthly_remaining - minutesToDeduct;

    // Update subscription
    await db.query(
      `UPDATE user_subscription_details 
       SET total_remaining_time = ?,
           total_used_time = ?,
           monthly_used = ?,
           monthly_remaining = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        newRemainingTime,
        newUsedTime,
        newMonthlyUsed,
        newMonthlyRemaining,
        userId,
      ]
    );

    return {
      success: true,
      deductedMinutes: minutesToDeduct,
      remainingMinutes: newRemainingTime,
      message: `Successfully deducted ${minutesToDeduct} minutes. Remaining: ${newRemainingTime} minutes`,
    };
  } catch (error) {
    console.error("Error deducting user minutes:", error);
    throw new Error("Failed to deduct minutes from subscription");
  }
}

/**
 * Express middleware to check and validate audio minutes before processing
 * Can be used directly in routes
 */
const validateAudioMinutes = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized: no user ID" 
      });
    }

    let audioBuffer;
    const { driveUrl } = req.body;

    // Get audio buffer based on source
    if (driveUrl) {
      const axios = require("axios");
      const fileId = driveUrl.match(/\/d\/(.*?)\//)?.[1];
      if (!fileId) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Google Drive URL format" 
        });
      }
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const fileRes = await axios.get(directUrl, { responseType: "arraybuffer" });
      audioBuffer = Buffer.from(fileRes.data);
    } else if (req.file) {
      audioBuffer = req.file.buffer;
    } else {
      return res.status(400).json({ 
        success: false,
        message: "No audio file or Drive URL provided" 
      });
    }

    // Get audio duration
    const durationInMinutes = await getAudioDuration(audioBuffer);

    // Check if user has sufficient minutes
    const minutesCheck = await checkUserMinutes(userId, durationInMinutes);

    if (!minutesCheck.hasMinutes) {
      return res.status(402).json({
        success: false,
        message: minutesCheck.message,
        requiredMinutes: durationInMinutes,
        remainingMinutes: minutesCheck.remainingMinutes,
        needsRecharge: true,
      });
    }

    // Attach info to request for use in controller
    req.audioDuration = durationInMinutes;
    req.audioBuffer = audioBuffer;
    req.subscriptionCheck = minutesCheck;

    next();
  } catch (error) {
    console.error("Minutes validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate audio duration",
      error: error.message,
    });
  }
};

/**
 * Log minutes usage for audit trail (optional but recommended)
 */
async function logMinutesUsage(userId, audioId, minutesUsed, source, action = "deducted") {
  try {
    await db.query(
      `INSERT INTO minutes_usage_log (user_id, audio_id, minutes_used, source, action, created_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, audioId, minutesUsed, source, action]
    );
  } catch (error) {
    console.error("Error logging minutes usage:", error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

module.exports = {
  getAudioDuration,
  getAudioDurationFromUrl,
  checkUserMinutes,
  deductUserMinutes,
  validateAudioMinutes,
  logMinutesUsage,
};