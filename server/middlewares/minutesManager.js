
 

// middlewares/minutesManager.js

const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

/**
 * Detect file type from buffer and filename
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Optional filename for extension checking
 * @returns {Object} { type: string, needsFfprobe: boolean }
 */
function detectFileType(buffer, filename = '') {
  // Check magic numbers
  if (buffer.length < 12) return { type: 'unknown', needsFfprobe: true };
  
  // Get file extension
  const ext = filename ? path.extname(filename).toLowerCase().replace('.', '') : '';
  
  // MP3: FF FB or FF F3 or FF F2 or ID3 tag
  if ((buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) || 
      (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)) {
    return { type: 'mp3', needsFfprobe: false };
  }
  
  // MP4/M4A/MPEG: Check for 'ftyp' at offset 4
  if (buffer.slice(4, 8).toString() === 'ftyp') {
    const ftypDetails = buffer.slice(8, 12).toString();
    
    // M4A audio files
    if (ftypDetails.includes('M4A') || ext === 'm4a') {
      return { type: 'm4a', needsFfprobe: true };
    }
    
    // MP4 video/audio
    if (ftypDetails.includes('mp4') || ftypDetails.includes('isom') || ext === 'mp4') {
      return { type: 'mp4', needsFfprobe: true };
    }
    
    return { type: 'mp4', needsFfprobe: true };
  }
  
  // MPEG (MPG/MPEG): 00 00 01 BA or 00 00 01 B3
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && 
      (buffer[3] === 0xBA || buffer[3] === 0xB3)) {
    return { type: 'mpeg', needsFfprobe: true };
  }
  
  // WebM/MKV: 1A 45 DF A3
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return { type: 'webm', needsFfprobe: true };
  }
  
  // WAV: RIFF....WAVE
  if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WAVE') {
    return { type: 'wav', needsFfprobe: false };
  }
  
  // Fallback to extension if magic number detection fails
  if (ext) {
    const extensionMap = {
      'mp3': { type: 'mp3', needsFfprobe: false },
      'wav': { type: 'wav', needsFfprobe: false },
      'mp4': { type: 'mp4', needsFfprobe: true },
      'm4a': { type: 'm4a', needsFfprobe: true },
      'webm': { type: 'webm', needsFfprobe: true },
      'mpeg': { type: 'mpeg', needsFfprobe: true },
      'mpg': { type: 'mpeg', needsFfprobe: true }
    };
    
    if (extensionMap[ext]) {
      console.log(`⚠️ Using extension-based detection: ${ext}`);
      return extensionMap[ext];
    }
  }
  
  return { type: 'unknown', needsFfprobe: true };
}

/**
 * Get audio duration from buffer using multiple methods
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} filename - Optional filename for better detection
 * @returns {Promise<number>} Duration in minutes (rounded up)
 */
async function getAudioDuration(audioBuffer, filename = '') {
  try {
    const fileDetection = detectFileType(audioBuffer, filename);
    const fileType = fileDetection.type;
    const needsFfprobe = fileDetection.needsFfprobe;
    
    console.log(`🔍 Detected file type: ${fileType} | Needs ffprobe: ${needsFfprobe}`);
    
    // For video files and complex audio formats, ALWAYS use ffprobe first
    if (needsFfprobe || ['mp4', 'm4a', 'webm', 'mpeg'].includes(fileType)) {
      console.log('📹 Using ffprobe for accurate duration (video/complex format)...');
      try {
        return await getDurationViaFfprobe(audioBuffer);
      } catch (ffprobeError) {
        console.log('⚠️ ffprobe failed, trying alternative methods...', ffprobeError.message);
      }
    }
    
    // Method 1: WAV file - calculate from header
    if (fileType === 'wav') {
      try {
        const duration = getWavDuration(audioBuffer);
        if (duration > 0) {
          const durationInMinutes = Math.ceil(duration / 60);
          console.log(`✅ Duration obtained via WAV header: ${durationInMinutes} minutes (${duration.toFixed(2)}s)`);
          return durationInMinutes;
        }
      } catch (wavError) {
        console.log("📊 WAV header parsing failed, trying music-metadata...");
      }
    }
    
    // Method 2: mp3-duration (ONLY for MP3 files)
    if (fileType === 'mp3') {
      try {
        const mp3Duration = require('mp3-duration');
        
        const durationInSeconds = await new Promise((resolve, reject) => {
          mp3Duration(audioBuffer, (err, duration) => {
            if (err) reject(err);
            else resolve(duration);
          });
        });
        
        if (durationInSeconds && durationInSeconds > 0) {
          const durationInMinutes = Math.ceil(durationInSeconds / 60);
          console.log(`✅ Duration obtained via mp3-duration: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
          return durationInMinutes;
        }
      } catch (mp3Error) {
        console.log("📊 mp3-duration method failed, trying music-metadata...", mp3Error.message);
      }
    }

    // Method 3: music-metadata (works for most audio formats)
    try {
      const { parseBuffer } = require("music-metadata");
      const mimeTypes = {
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'm4a': 'audio/mp4',
        'webm': 'video/webm',
        'wav': 'audio/wav',
        'mpeg': 'video/mpeg'
      };
      
      const metadata = await parseBuffer(audioBuffer, { 
        mimeType: mimeTypes[fileType] || 'audio/mpeg' 
      });
      
      if (metadata.format.duration && metadata.format.duration > 0) {
        const durationInMinutes = Math.ceil(metadata.format.duration / 60);
        console.log(`✅ Duration obtained via music-metadata: ${durationInMinutes} minutes (${metadata.format.duration.toFixed(2)}s)`);
        return durationInMinutes;
      }
    } catch (metadataError) {
      console.log("📊 music-metadata method failed, trying ffprobe...", metadataError.message);
    }

    // Method 4: ffprobe with temporary file (most reliable fallback)
    try {
      return await getDurationViaFfprobe(audioBuffer);
    } catch (ffprobeError) {
      console.log("⚠️ ffprobe failed:", ffprobeError.message);
    }
    
    // Method 5: MP3 frame analysis (for MP3 only)
    if (fileType === 'mp3') {
      console.log("🔍 Analyzing MP3 frames for precise duration...");
      
      const frameDuration = analyzeMp3Frames(audioBuffer);
      if (frameDuration > 0) {
        const durationInMinutes = Math.ceil(frameDuration / 60);
        console.log(`📏 Duration via frame analysis: ${durationInMinutes} minutes (${frameDuration.toFixed(2)}s)`);
        return durationInMinutes;
      }
    }
    
    // Method 6: Bitrate-based calculation (MP3 only)
    if (fileType === 'mp3') {
      const bitrate = detectMP3Bitrate(audioBuffer);
      if (bitrate > 0) {
        const fileSizeInBytes = audioBuffer.length;
        const durationInSeconds = (fileSizeInBytes * 8) / (bitrate * 1000);
        const estimatedMinutes = Math.ceil(durationInSeconds / 60);
        
        console.log(`📏 Estimated duration via bitrate: ${estimatedMinutes} minutes (${durationInSeconds.toFixed(2)}s, bitrate: ${bitrate}kbps)`);
        return estimatedMinutes;
      }
    }
    
    // Method 7: Fallback estimation based on file type
    const fileSizeInMB = audioBuffer.length / (1024 * 1024);
    let estimatedBitrate = 64; // Default for unknown formats
    
    // Better bitrate estimates by file type
    const bitrateEstimates = {
      'mp3': 128,
      'wav': 1411, // CD quality
      'mp4': 128,
      'm4a': 128,
      'webm': 128,
      'mpeg': 192
    };
    
    estimatedBitrate = bitrateEstimates[fileType] || 64;
    const estimatedMinutes = Math.ceil((fileSizeInMB * 8 * 60) / estimatedBitrate);
    
    console.log(`📏 Fallback estimation: ${estimatedMinutes} minutes (${fileSizeInMB.toFixed(2)} MB @ ${estimatedBitrate}kbps)`);
    
    return Math.max(1, estimatedMinutes);
    
  } catch (error) {
    console.error("❌ All duration detection methods failed:", error);
    
    const fileSizeInMB = audioBuffer.length / (1024 * 1024);
    const fallbackMinutes = Math.max(1, Math.ceil((fileSizeInMB * 8 * 60) / 64));
    
    console.log(`⚠️ Using final fallback: ${fallbackMinutes} minutes`);
    return fallbackMinutes;
  }
}

/**
 * Get WAV file duration from header
 * @param {Buffer} buffer - WAV file buffer
 * @returns {number} Duration in seconds
 */
function getWavDuration(buffer) {
  try {
    // Verify RIFF header
    if (buffer.slice(0, 4).toString() !== 'RIFF' || 
        buffer.slice(8, 12).toString() !== 'WAVE') {
      throw new Error('Not a valid WAV file');
    }
    
    // Find the 'fmt ' chunk
    let offset = 12;
    while (offset < buffer.length - 8) {
      const chunkId = buffer.slice(offset, offset + 4).toString();
      const chunkSize = buffer.readUInt32LE(offset + 4);
      
      if (chunkId === 'fmt ') {
        // Parse format chunk
        const sampleRate = buffer.readUInt32LE(offset + 12);
        const byteRate = buffer.readUInt32LE(offset + 16);
        
        // Find the 'data' chunk
        let dataOffset = offset + 8 + chunkSize;
        while (dataOffset < buffer.length - 8) {
          const dataChunkId = buffer.slice(dataOffset, dataOffset + 4).toString();
          const dataChunkSize = buffer.readUInt32LE(dataOffset + 4);
          
          if (dataChunkId === 'data') {
            // Calculate duration
            const duration = dataChunkSize / byteRate;
            return duration;
          }
          
          dataOffset += 8 + dataChunkSize;
        }
      }
      
      offset += 8 + chunkSize;
    }
    
    throw new Error('Could not find required WAV chunks');
  } catch (error) {
    console.error('Error parsing WAV file:', error);
    return 0;
  }
}

/**
 * Get duration using ffprobe (most reliable for all formats)
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Promise<number>} Duration in minutes (rounded up)
 */
async function getDurationViaFfprobe(audioBuffer) {
  let tempFilePath = null;
  
  try {
    const tempDir = os.tmpdir();
    const tempFileName = `temp_audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.tmp`;
    tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempFilePath, audioBuffer);
    
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execPromise = promisify(exec);
    
    // Try system ffprobe first
    let durationInSeconds;
    try {
      const { stdout } = await execPromise(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`,
        { timeout: 30000 } // 30 second timeout
      );
      
      durationInSeconds = parseFloat(stdout.trim());
      
      if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
        const durationInMinutes = Math.ceil(durationInSeconds / 60);
        console.log(`✅ Duration obtained via system ffprobe: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
        return durationInMinutes;
      }
    } catch (systemError) {
      console.log("📊 System ffprobe failed, trying installed ffprobe...");
      
      // Try @ffprobe-installer package
      const ffprobePath = require("@ffprobe-installer/ffprobe").path;
      const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`;
      
      const { stdout } = await execPromise(command, { timeout: 30000 });
      durationInSeconds = parseFloat(stdout.trim());
      
      if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
        const durationInMinutes = Math.ceil(durationInSeconds / 60);
        console.log(`✅ Duration obtained via installed ffprobe: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
        return durationInMinutes;
      }
    }
    
    throw new Error("ffprobe returned invalid duration");
    
  } catch (error) {
    console.error("❌ ffprobe failed:", error.message);
    throw error;
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
 * Analyze MP3 frames to calculate exact duration
 * @param {Buffer} buffer - Audio buffer
 * @returns {number} Duration in seconds
 */
function analyzeMp3Frames(buffer) {
  try {
    const versions = [
      [0, 2], // MPEG 2.5
      null,   // reserved
      [1, 2], // MPEG 2
      [1, 1]  // MPEG 1
    ];
    
    const layers = [
      null, // reserved
      [3, 384],  // Layer 3
      [2, 1152], // Layer 2
      [1, 1152]  // Layer 1
    ];
    
    const bitrates = {
      'V1L1': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
      'V1L2': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
      'V1L3': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
      'V2L1': [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
      'V2L2': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
      'V2L3': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
    };
    
    const sampleRates = [
      [44100, 22050, 11025], // MPEG 1
      [48000, 24000, 12000], // MPEG 2
      [32000, 16000, 8000]   // MPEG 2.5
    ];
    
    let offset = 0;
    let duration = 0;
    let frameCount = 0;
    
    while (offset < buffer.length - 4) {
      // Look for frame sync (11 bits set)
      if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
        const versionBits = (buffer[offset + 1] >> 3) & 0x03;
        const layerBits = (buffer[offset + 1] >> 1) & 0x03;
        const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0F;
        const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
        const padding = (buffer[offset + 2] >> 1) & 0x01;
        
        const version = versions[versionBits];
        const layer = layers[layerBits];
        
        if (!version || !layer || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
          offset++;
          continue;
        }
        
        const key = `V${version[0]}L${layer[0]}`;
        const bitrate = bitrates[key] ? bitrates[key][bitrateIndex] : 0;
        const sampleRate = sampleRates[version[1] - 1] ? sampleRates[version[1] - 1][sampleRateIndex] : 0;
        
        if (bitrate === 0 || sampleRate === 0) {
          offset++;
          continue;
        }
        
        // Calculate frame length
        const samplesPerFrame = layer[1];
        const frameLength = Math.floor((samplesPerFrame / 8 * bitrate * 1000) / sampleRate) + padding;
        
        // Calculate frame duration
        const frameDuration = samplesPerFrame / sampleRate;
        duration += frameDuration;
        
        frameCount++;
        offset += frameLength;
      } else {
        offset++;
      }
    }
    
    if (frameCount > 0) {
      console.log(`🎵 Analyzed ${frameCount} MP3 frames, total duration: ${duration.toFixed(2)}s`);
      return duration;
    }
    
    return 0;
  } catch (error) {
    console.error("Error analyzing MP3 frames:", error);
    return 0;
  }
}

/**
 * Detect MP3 bitrate by analyzing frame headers
 * @param {Buffer} buffer - Audio buffer
 * @returns {number} Bitrate in kbps, or 0 if detection fails
 */
function detectMP3Bitrate(buffer) {
  try {
    const bitrateTable = [
      0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320
    ];
    
    for (let i = 0; i < Math.min(buffer.length - 4, 10000); i++) {
      if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
        const bitrateIndex = (buffer[i + 2] >> 4) & 0x0F;
        
        if (bitrateIndex > 0 && bitrateIndex < bitrateTable.length) {
          const bitrate = bitrateTable[bitrateIndex];
          console.log(`🔍 Detected MP3 bitrate: ${bitrate} kbps`);
          return bitrate;
        }
      }
    }
    
    return 0;
  } catch (error) {
    console.error("Error detecting MP3 bitrate:", error);
    return 0;
  }
}

/**
 * Alternative: Get duration directly from URL (for already uploaded files)
 * @param {string} audioUrl - URL of the audio file
 * @returns {Promise<number>} Duration in minutes (rounded up)
 */
async function getAudioDurationFromUrl(audioUrl) {
  try {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execPromise = promisify(exec);
    
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
 * Convert seconds to minutes (rounded up)
 * @param {number} seconds - Duration in seconds
 * @returns {number} Duration in minutes (rounded up)
 */
function secondsToMinutes(seconds) {
  return Math.ceil(seconds / 60);
}

/**
 * Check if user has sufficient minutes
/**
 * Check if user is on free plan
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is on free plan
 */
async function isFreePlanUser(userId) {
  try {
    const [subscription] = await db.query(
      "SELECT plan_id FROM user_subscription_details WHERE user_id = ?",
      [userId]
    );

    if (subscription.length === 0) return true; // No subscription = free user
    
    const planId = subscription[0].plan_id;
    
    // Check if plan is free (plan_id = 1 or plan name contains 'free')
    const [plan] = await db.query(
      "SELECT id, name, price FROM plans WHERE id = ?",
      [planId]
    );
    
    if (plan.length === 0) return true;
    
    // Free plan is typically id=1 or price=0
    return plan[0].id === 1 || plan[0].price === 0 || plan[0].name.toLowerCase().includes('free');
    
  } catch (error) {
    console.error("Error checking free plan status:", error);
    return true; // Default to free user on error
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
    // Check if user is on free plan
    const isFreeUser = await isFreePlanUser(userId);
    
    // Free users can only upload files up to 30 minutes
    if (isFreeUser && requiredMinutes > 30) {
      return {
        hasMinutes: false,
        remainingMinutes: 0,
        requiredMinutes,
        message: "You're on the free plan — audio uploads are limited to 30 minutes. Please upgrade to continue recording longer sessions.",
        isFreeUserLimitExceeded: true,
        maxFreeMinutes: 30,
        details: null,
      };
    }
    
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
    const remainingMinutes = userSub.total_remaining_time; // Already in minutes

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
    const [subscription] = await db.query(
      "SELECT * FROM user_subscription_details WHERE user_id = ?",
      [userId]
    );

    if (subscription.length === 0) {
      throw new Error("Subscription not found");
    }

    const currentSub = subscription[0];
    
    const newRemainingTime = parseFloat((currentSub.total_remaining_time - minutesToDeduct).toFixed(2));
    const newUsedTime = parseFloat((currentSub.total_used_time + minutesToDeduct).toFixed(2));
    const newMonthlyUsed = parseFloat((currentSub.monthly_used + minutesToDeduct).toFixed(2));
    const newMonthlyRemaining = parseFloat((currentSub.monthly_remaining - minutesToDeduct).toFixed(2));

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

    // Get filename for better detection
    const filename = req.file?.originalname || driveUrl?.split('/').pop() || '';
    console.log(`📄 Processing file: ${filename}`);

    const durationResult = await getAudioDuration(audioBuffer, filename);
    const durationInMinutes = typeof durationResult === 'object' ? durationResult.minutes : durationResult;

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
 * Log minutes usage for audit trail
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
  }
}

module.exports = {
  getAudioDuration,
  getAudioDurationFromUrl,
  checkUserMinutes,
  deductUserMinutes,
  validateAudioMinutes,
  logMinutesUsage,
  secondsToMinutes,
  isFreePlanUser,
};