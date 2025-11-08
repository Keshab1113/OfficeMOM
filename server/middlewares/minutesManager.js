 
// // // middlewares/minutesManager.js

// // const db = require("../config/db");
// // const fs = require("fs").promises;
// // const path = require("path");
// // const os = require("os");

// // /**
// //  * Get audio duration from buffer using multiple methods
// //  * @param {Buffer} audioBuffer - Audio file buffer
// //  * @returns {Promise<number>} Duration in minutes
// //  */
// // async function getAudioDuration(audioBuffer) {
// //   let tempFilePath = null;
  
// //   try {
// //     // Method 1: mp3-duration (most accurate for MP3 files)
// //     try {
// //       const mp3Duration = require('mp3-duration');
      
// //       const durationInSeconds = await new Promise((resolve, reject) => {
// //         mp3Duration(audioBuffer, (err, duration) => {
// //           if (err) reject(err);
// //           else resolve(duration);
// //         });
// //       });
      
// //       if (durationInSeconds && durationInSeconds > 0) {
// //         const durationInMinutes = Math.ceil(durationInSeconds / 60);
// //         console.log(`✅ Duration obtained via mp3-duration: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
// //         return durationInMinutes;
// //       }
// //     } catch (mp3Error) {
// //       console.log("📊 mp3-duration method failed, trying music-metadata...", mp3Error.message);
// //     }

// //     // Method 2: music-metadata
// //     try {
// //       const { parseBuffer } = require("music-metadata");
// //       const metadata = await parseBuffer(audioBuffer, { mimeType: 'audio/mpeg' });
      
// //       if (metadata.format.duration && metadata.format.duration > 0) {
// //         const durationInMinutes = Math.ceil(metadata.format.duration / 60);
// //         console.log(`✅ Duration obtained via music-metadata: ${durationInMinutes} minutes (${metadata.format.duration.toFixed(2)}s)`);
// //         return durationInMinutes;
// //       }
// //     } catch (metadataError) {
// //       console.log("📊 music-metadata method failed, trying ffprobe...");
// //     }

// //     // Method 3: ffprobe with temporary file
// //     const tempDir = os.tmpdir();
// //     const tempFileName = `temp_audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
// //     tempFilePath = path.join(tempDir, tempFileName);
    
// //     await fs.writeFile(tempFilePath, audioBuffer);
    
// //     try {
// //       const { exec } = require("child_process");
// //       const { promisify } = require("util");
// //       const execPromise = promisify(exec);
      
// //       // Try system ffprobe first
// //       try {
// //         const { stdout } = await execPromise(
// //           `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`
// //         );
        
// //         const durationInSeconds = parseFloat(stdout.trim());
        
// //         if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
// //           const durationInMinutes = Math.ceil(durationInSeconds / 60);
// //           console.log(`✅ Duration obtained via system ffprobe: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
// //           return durationInMinutes;
// //         }
// //       } catch (systemError) {
// //         // Try @ffprobe-installer package
// //         const ffprobePath = require("@ffprobe-installer/ffprobe").path;
// //         const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`;
        
// //         const { stdout } = await execPromise(command);
// //         const durationInSeconds = parseFloat(stdout.trim());
        
// //         if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
// //           const durationInMinutes = Math.ceil(durationInSeconds / 60);
// //           console.log(`✅ Duration obtained via installed ffprobe: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
// //           return durationInMinutes;
// //         }
// //       }
// //     } catch (ffprobeError) {
// //       console.log("⚠️ ffprobe failed:", ffprobeError.message);
// //     }

// //     // Method 4: Precise MP3 frame counting
// //     console.log("🔍 Analyzing MP3 frames for precise duration...");
    
// //     const frameDuration = analyzeMp3Frames(audioBuffer);
// //     if (frameDuration > 0) {
// //       const durationInMinutes = Math.ceil(frameDuration / 60);
// //       console.log(`📏 Duration via frame analysis: ${durationInMinutes} minutes (${frameDuration.toFixed(2)}s)`);
      
// //       return {
// //         minutes: durationInMinutes,
// //         estimated: true,
// //         method: 'frame_analysis',
// //         actualSeconds: frameDuration
// //       };
// //     }
    
// //     // Method 5: Bitrate-based calculation
// //     const bitrate = detectMP3Bitrate(audioBuffer);
// //     if (bitrate > 0) {
// //       const fileSizeInBytes = audioBuffer.length;
// //       const durationInSeconds = (fileSizeInBytes * 8) / (bitrate * 1000);
// //       const estimatedMinutes = Math.ceil(durationInSeconds / 60);
      
// //       console.log(`📏 Estimated duration via bitrate: ${estimatedMinutes} minutes (${durationInSeconds.toFixed(2)}s, bitrate: ${bitrate}kbps)`);
      
// //       return {
// //         minutes: estimatedMinutes,
// //         estimated: true,
// //         method: 'bitrate_calculation',
// //         bitrate: bitrate,
// //         actualSeconds: durationInSeconds
// //       };
// //     }
    
// //     // Method 6: Fallback estimation
// //     const fileSizeInMB = audioBuffer.length / (1024 * 1024);
// //     const estimatedMinutes = Math.ceil((fileSizeInMB * 8 * 60) / 64); // 64kbps for low-quality recordings
    
// //     console.log(`📏 Fallback estimation: ${estimatedMinutes} minutes (${fileSizeInMB.toFixed(2)} MB @ 64kbps)`);
    
// //     return {
// //       minutes: estimatedMinutes > 0 ? estimatedMinutes : 1,
// //       estimated: true,
// //       method: 'size_based',
// //       fileSize: fileSizeInMB
// //     };
    
// //   } catch (error) {
// //     console.error("❌ All duration detection methods failed:", error);
    
// //     const fileSizeInMB = audioBuffer.length / (1024 * 1024);
// //     const fallbackMinutes = Math.max(1, Math.ceil((fileSizeInMB * 8 * 60) / 64));
    
// //     console.log(`⚠️ Using fallback: ${fallbackMinutes} minutes`);
    
// //     return {
// //       minutes: fallbackMinutes,
// //       estimated: true,
// //       method: 'fallback'
// //     };
    
// //   } finally {
// //     if (tempFilePath) {
// //       try {
// //         await fs.unlink(tempFilePath);
// //       } catch (cleanupError) {
// //         console.error("Error cleaning up temp file:", cleanupError);
// //       }
// //     }
// //   }
// // }

// // /**
// //  * Analyze MP3 frames to calculate exact duration
// //  * @param {Buffer} buffer - Audio buffer
// //  * @returns {number} Duration in seconds
// //  */
// // function analyzeMp3Frames(buffer) {
// //   try {
// //     const versions = [
// //       [0, 2], // MPEG 2.5
// //       null,   // reserved
// //       [1, 2], // MPEG 2
// //       [1, 1]  // MPEG 1
// //     ];
    
// //     const layers = [
// //       null, // reserved
// //       [3, 384],  // Layer 3
// //       [2, 1152], // Layer 2
// //       [1, 1152]  // Layer 1
// //     ];
    
// //     const bitrates = {
// //       'V1L1': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
// //       'V1L2': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
// //       'V1L3': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
// //       'V2L1': [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
// //       'V2L2': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
// //       'V2L3': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
// //     };
    
// //     const sampleRates = [
// //       [44100, 22050, 11025], // MPEG 1
// //       [48000, 24000, 12000], // MPEG 2
// //       [32000, 16000, 8000]   // MPEG 2.5
// //     ];
    
// //     let offset = 0;
// //     let duration = 0;
// //     let frameCount = 0;
    
// //     while (offset < buffer.length - 4) {
// //       // Look for frame sync (11 bits set)
// //       if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
// //         const versionBits = (buffer[offset + 1] >> 3) & 0x03;
// //         const layerBits = (buffer[offset + 1] >> 1) & 0x03;
// //         const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0F;
// //         const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
// //         const padding = (buffer[offset + 2] >> 1) & 0x01;
        
// //         const version = versions[versionBits];
// //         const layer = layers[layerBits];
        
// //         if (!version || !layer || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
// //           offset++;
// //           continue;
// //         }
        
// //         const key = `V${version[0]}L${layer[0]}`;
// //         const bitrate = bitrates[key] ? bitrates[key][bitrateIndex] : 0;
// //         const sampleRate = sampleRates[version[1] - 1] ? sampleRates[version[1] - 1][sampleRateIndex] : 0;
        
// //         if (bitrate === 0 || sampleRate === 0) {
// //           offset++;
// //           continue;
// //         }
        
// //         // Calculate frame length
// //         const samplesPerFrame = layer[1];
// //         const frameLength = Math.floor((samplesPerFrame / 8 * bitrate * 1000) / sampleRate) + padding;
        
// //         // Calculate frame duration
// //         const frameDuration = samplesPerFrame / sampleRate;
// //         duration += frameDuration;
        
// //         frameCount++;
// //         offset += frameLength;
// //       } else {
// //         offset++;
// //       }
// //     }
    
// //     if (frameCount > 0) {
// //       console.log(`🎵 Analyzed ${frameCount} MP3 frames, total duration: ${duration.toFixed(2)}s`);
// //       return duration;
// //     }
    
// //     return 0;
// //   } catch (error) {
// //     console.error("Error analyzing MP3 frames:", error);
// //     return 0;
// //   }
// // }

// // /**
// //  * Detect MP3 bitrate by analyzing frame headers
// //  * @param {Buffer} buffer - Audio buffer
// //  * @returns {number} Bitrate in kbps, or 0 if detection fails
// //  */
// // function detectMP3Bitrate(buffer) {
// //   try {
// //     const bitrateTable = [
// //       0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320
// //     ];
    
// //     for (let i = 0; i < Math.min(buffer.length - 4, 10000); i++) {
// //       if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
// //         const bitrateIndex = (buffer[i + 2] >> 4) & 0x0F;
        
// //         if (bitrateIndex > 0 && bitrateIndex < bitrateTable.length) {
// //           const bitrate = bitrateTable[bitrateIndex];
// //           console.log(`🔍 Detected MP3 bitrate: ${bitrate} kbps`);
// //           return bitrate;
// //         }
// //       }
// //     }
    
// //     return 0;
// //   } catch (error) {
// //     console.error("Error detecting MP3 bitrate:", error);
// //     return 0;
// //   }
// // }

// // /**
// //  * Alternative: Get duration directly from URL (for already uploaded files)
// //  * @param {string} audioUrl - URL of the audio file
// //  * @returns {Promise<number>} Duration in minutes
// //  */
// // async function getAudioDurationFromUrl(audioUrl) {
// //   try {
// //     const { exec } = require("child_process");
// //     const { promisify } = require("util");
// //     const execPromise = promisify(exec);
    
// //     const ffprobePath = require("@ffprobe-installer/ffprobe").path;
// //     const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioUrl}"`;
    
// //     const { stdout } = await execPromise(command);
// //     const durationInSeconds = parseFloat(stdout.trim());
    
// //     if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
// //       throw new Error("Invalid duration from URL");
// //     }
    
// //     return Math.ceil(durationInSeconds / 60);
// //   } catch (error) {
// //     console.error("Error getting duration from URL:", error);
// //     throw new Error("Unable to determine audio duration from URL");
// //   }
// // }

// // /**
// //  * Check if user has sufficient minutes
// //  * @param {number} userId - User ID
// //  * @param {number} requiredMinutes - Required minutes for the audio
// //  * @returns {Promise<Object>} { hasMinutes: boolean, remainingMinutes: number, details: Object }
// //  */
// // async function checkUserMinutes(userId, requiredMinutes) {
// //   try {
// //     const [subscription] = await db.query(
// //       "SELECT * FROM user_subscription_details WHERE user_id = ?",
// //       [userId]
// //     );

// //     if (subscription.length === 0) {
// //       return {
// //         hasMinutes: false,
// //         remainingMinutes: 0,
// //         message: "No active subscription found. Please subscribe to continue.",
// //         details: null,
// //       };
// //     }

// //     const userSub = subscription[0];
// //     const remainingMinutes = userSub.total_remaining_time;

// //     if (remainingMinutes < requiredMinutes) {
// //       return {
// //         hasMinutes: false,
// //         remainingMinutes,
// //         requiredMinutes,
// //         message: `Insufficient minutes. You need ${requiredMinutes} minutes but only have ${remainingMinutes} minutes remaining.`,
// //         details: userSub,
// //       };
// //     }

// //     return {
// //       hasMinutes: true,
// //       remainingMinutes,
// //       requiredMinutes,
// //       message: "Sufficient minutes available",
// //       details: userSub,
// //     };
// //   } catch (error) {
// //     console.error("Error checking user minutes:", error);
// //     throw new Error("Failed to verify subscription minutes");
// //   }
// // }

// // /**
// //  * Deduct minutes from user's subscription
// //  * @param {number} userId - User ID
// //  * @param {number} minutesToDeduct - Minutes to deduct
// //  * @returns {Promise<Object>} Updated subscription details
// //  */
// // async function deductUserMinutes(userId, minutesToDeduct) {
// //   try {
// //     const [subscription] = await db.query(
// //       "SELECT * FROM user_subscription_details WHERE user_id = ?",
// //       [userId]
// //     );

// //     if (subscription.length === 0) {
// //       throw new Error("Subscription not found");
// //     }

// //     const currentSub = subscription[0];
// //     const newRemainingTime = currentSub.total_remaining_time - minutesToDeduct;
// //     const newUsedTime = currentSub.total_used_time + minutesToDeduct;
// //     const newMonthlyUsed = currentSub.monthly_used + minutesToDeduct;
// //     const newMonthlyRemaining = currentSub.monthly_remaining - minutesToDeduct;

// //     await db.query(
// //       `UPDATE user_subscription_details 
// //        SET total_remaining_time = ?,
// //            total_used_time = ?,
// //            monthly_used = ?,
// //            monthly_remaining = ?,
// //            updated_at = CURRENT_TIMESTAMP
// //        WHERE user_id = ?`,
// //       [
// //         newRemainingTime,
// //         newUsedTime,
// //         newMonthlyUsed,
// //         newMonthlyRemaining,
// //         userId,
// //       ]
// //     );

// //     return {
// //       success: true,
// //       deductedMinutes: minutesToDeduct,
// //       remainingMinutes: newRemainingTime,
// //       message: `Successfully deducted ${minutesToDeduct} minutes. Remaining: ${newRemainingTime} minutes`,
// //     };
// //   } catch (error) {
// //     console.error("Error deducting user minutes:", error);
// //     throw new Error("Failed to deduct minutes from subscription");
// //   }
// // }

// // /**
// //  * Express middleware to check and validate audio minutes before processing
// //  */
// // const validateAudioMinutes = async (req, res, next) => {
// //   try {
// //     const userId = req.user?.id;
    
// //     if (!userId) {
// //       return res.status(401).json({ 
// //         success: false,
// //         message: "Unauthorized: no user ID" 
// //       });
// //     }

// //     let audioBuffer;
// //     const { driveUrl } = req.body;

// //     if (driveUrl) {
// //       const axios = require("axios");
// //       const fileId = driveUrl.match(/\/d\/(.*?)\//)?.[1];
// //       if (!fileId) {
// //         return res.status(400).json({ 
// //           success: false,
// //           message: "Invalid Google Drive URL format" 
// //         });
// //       }
// //       const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
// //       const fileRes = await axios.get(directUrl, { responseType: "arraybuffer" });
// //       audioBuffer = Buffer.from(fileRes.data);
// //     } else if (req.file) {
// //       audioBuffer = req.file.buffer;
// //     } else {
// //       return res.status(400).json({ 
// //         success: false,
// //         message: "No audio file or Drive URL provided" 
// //       });
// //     }

// //     const durationResult = await getAudioDuration(audioBuffer);
// //     const durationInMinutes = typeof durationResult === 'object' ? durationResult.minutes : durationResult;

// //     const minutesCheck = await checkUserMinutes(userId, durationInMinutes);

// //     if (!minutesCheck.hasMinutes) {
// //       return res.status(402).json({
// //         success: false,
// //         message: minutesCheck.message,
// //         requiredMinutes: durationInMinutes,
// //         remainingMinutes: minutesCheck.remainingMinutes,
// //         needsRecharge: true,
// //       });
// //     }

// //     req.audioDuration = durationInMinutes;
// //     req.audioBuffer = audioBuffer;
// //     req.subscriptionCheck = minutesCheck;

// //     next();
// //   } catch (error) {
// //     console.error("Minutes validation error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to validate audio duration",
// //       error: error.message,
// //     });
// //   }
// // };

// // /**
// //  * Log minutes usage for audit trail
// //  */
// // async function logMinutesUsage(userId, audioId, minutesUsed, source, action = "deducted") {
// //   try {
// //     await db.query(
// //       `INSERT INTO minutes_usage_log (user_id, audio_id, minutes_used, source, action, created_at) 
// //        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
// //       [userId, audioId, minutesUsed, source, action]
// //     );
// //   } catch (error) {
// //     console.error("Error logging minutes usage:", error);
// //   }
// // }

// // module.exports = {
// //   getAudioDuration,
// //   getAudioDurationFromUrl,
// //   checkUserMinutes,
// //   deductUserMinutes,
// //   validateAudioMinutes,
// //   logMinutesUsage,
// // };

// // middlewares/minutesManager.js

// const db = require("../config/db");
// const fs = require("fs").promises;
// const path = require("path");
// const os = require("os");

// /**
//  * Get audio duration from buffer using multiple methods
//  * @param {Buffer} audioBuffer - Audio file buffer
//  * @returns {Promise<number>} Duration in seconds (precise)
//  */
// async function getAudioDuration(audioBuffer) {
//   let tempFilePath = null;
  
//   try {
//     // Method 1: mp3-duration (most accurate for MP3 files)
//     try {
//       const mp3Duration = require('mp3-duration');
      
//       const durationInSeconds = await new Promise((resolve, reject) => {
//         mp3Duration(audioBuffer, (err, duration) => {
//           if (err) reject(err);
//           else resolve(duration);
//         });
//       });
      
//       if (durationInSeconds && durationInSeconds > 0) {
//         console.log(`✅ Duration obtained via mp3-duration: ${durationInSeconds.toFixed(2)} seconds (${(durationInSeconds / 60).toFixed(2)} minutes)`);
//         return durationInSeconds;
//       }
//     } catch (mp3Error) {
//       console.log("📊 mp3-duration method failed, trying music-metadata...", mp3Error.message);
//     }

//     // Method 2: music-metadata
//     try {
//       const { parseBuffer } = require("music-metadata");
//       const metadata = await parseBuffer(audioBuffer, { mimeType: 'audio/mpeg' });
      
//       if (metadata.format.duration && metadata.format.duration > 0) {
//         const durationInSeconds = metadata.format.duration;
//         console.log(`✅ Duration obtained via music-metadata: ${durationInSeconds.toFixed(2)} seconds (${(durationInSeconds / 60).toFixed(2)} minutes)`);
//         return durationInSeconds;
//       }
//     } catch (metadataError) {
//       console.log("📊 music-metadata method failed, trying ffprobe...");
//     }

//     // Method 3: ffprobe with temporary file
//     const tempDir = os.tmpdir();
//     const tempFileName = `temp_audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
//     tempFilePath = path.join(tempDir, tempFileName);
    
//     await fs.writeFile(tempFilePath, audioBuffer);
    
//     try {
//       const { exec } = require("child_process");
//       const { promisify } = require("util");
//       const execPromise = promisify(exec);
      
//       // Try system ffprobe first
//       try {
//         const { stdout } = await execPromise(
//           `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`
//         );
        
//         const durationInSeconds = parseFloat(stdout.trim());
        
//         if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
//           console.log(`✅ Duration obtained via system ffprobe: ${durationInSeconds.toFixed(2)} seconds (${(durationInSeconds / 60).toFixed(2)} minutes)`);
//           return durationInSeconds;
//         }
//       } catch (systemError) {
//         // Try @ffprobe-installer package
//         const ffprobePath = require("@ffprobe-installer/ffprobe").path;
//         const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`;
        
//         const { stdout } = await execPromise(command);
//         const durationInSeconds = parseFloat(stdout.trim());
        
//         if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
//           console.log(`✅ Duration obtained via installed ffprobe: ${durationInSeconds.toFixed(2)} seconds (${(durationInSeconds / 60).toFixed(2)} minutes)`);
//           return durationInSeconds;
//         }
//       }
//     } catch (ffprobeError) {
//       console.log("⚠️ ffprobe failed:", ffprobeError.message);
//     }

//     // Method 4: Precise MP3 frame counting
//     console.log("🔍 Analyzing MP3 frames for precise duration...");
    
//     const frameDuration = analyzeMp3Frames(audioBuffer);
//     if (frameDuration > 0) {
//       console.log(`📏 Duration via frame analysis: ${frameDuration.toFixed(2)} seconds (${(frameDuration / 60).toFixed(2)} minutes)`);
      
//       return {
//         seconds: frameDuration,
//         estimated: true,
//         method: 'frame_analysis'
//       };
//     }
    
//     // Method 5: Bitrate-based calculation
//     const bitrate = detectMP3Bitrate(audioBuffer);
//     if (bitrate > 0) {
//       const fileSizeInBytes = audioBuffer.length;
//       const durationInSeconds = (fileSizeInBytes * 8) / (bitrate * 1000);
      
//       console.log(`📏 Estimated duration via bitrate: ${durationInSeconds.toFixed(2)} seconds (${(durationInSeconds / 60).toFixed(2)} minutes, bitrate: ${bitrate}kbps)`);
      
//       return {
//         seconds: durationInSeconds,
//         estimated: true,
//         method: 'bitrate_calculation',
//         bitrate: bitrate
//       };
//     }
    
//     // Method 6: Fallback estimation
//     const fileSizeInMB = audioBuffer.length / (1024 * 1024);
//     const estimatedSeconds = (fileSizeInMB * 8 * 60) / 64; // 64kbps for low-quality recordings
    
//     console.log(`📏 Fallback estimation: ${estimatedSeconds.toFixed(2)} seconds (${(estimatedSeconds / 60).toFixed(2)} minutes, ${fileSizeInMB.toFixed(2)} MB @ 64kbps)`);
    
//     return {
//       seconds: estimatedSeconds > 0 ? estimatedSeconds : 1,
//       estimated: true,
//       method: 'size_based',
//       fileSize: fileSizeInMB
//     };
    
//   } catch (error) {
//     console.error("❌ All duration detection methods failed:", error);
    
//     const fileSizeInMB = audioBuffer.length / (1024 * 1024);
//     const fallbackSeconds = Math.max(1, (fileSizeInMB * 8 * 60) / 64);
    
//     console.log(`⚠️ Using fallback: ${fallbackSeconds.toFixed(2)} seconds`);
    
//     return {
//       seconds: fallbackSeconds,
//       estimated: true,
//       method: 'fallback'
//     };
    
//   } finally {
//     if (tempFilePath) {
//       try {
//         await fs.unlink(tempFilePath);
//       } catch (cleanupError) {
//         console.error("Error cleaning up temp file:", cleanupError);
//       }
//     }
//   }
// }

// /**
//  * Analyze MP3 frames to calculate exact duration
//  * @param {Buffer} buffer - Audio buffer
//  * @returns {number} Duration in seconds
//  */
// function analyzeMp3Frames(buffer) {
//   try {
//     const versions = [
//       [0, 2], // MPEG 2.5
//       null,   // reserved
//       [1, 2], // MPEG 2
//       [1, 1]  // MPEG 1
//     ];
    
//     const layers = [
//       null, // reserved
//       [3, 384],  // Layer 3
//       [2, 1152], // Layer 2
//       [1, 1152]  // Layer 1
//     ];
    
//     const bitrates = {
//       'V1L1': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
//       'V1L2': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
//       'V1L3': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
//       'V2L1': [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
//       'V2L2': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
//       'V2L3': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
//     };
    
//     const sampleRates = [
//       [44100, 22050, 11025], // MPEG 1
//       [48000, 24000, 12000], // MPEG 2
//       [32000, 16000, 8000]   // MPEG 2.5
//     ];
    
//     let offset = 0;
//     let duration = 0;
//     let frameCount = 0;
    
//     while (offset < buffer.length - 4) {
//       // Look for frame sync (11 bits set)
//       if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
//         const versionBits = (buffer[offset + 1] >> 3) & 0x03;
//         const layerBits = (buffer[offset + 1] >> 1) & 0x03;
//         const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0F;
//         const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
//         const padding = (buffer[offset + 2] >> 1) & 0x01;
        
//         const version = versions[versionBits];
//         const layer = layers[layerBits];
        
//         if (!version || !layer || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
//           offset++;
//           continue;
//         }
        
//         const key = `V${version[0]}L${layer[0]}`;
//         const bitrate = bitrates[key] ? bitrates[key][bitrateIndex] : 0;
//         const sampleRate = sampleRates[version[1] - 1] ? sampleRates[version[1] - 1][sampleRateIndex] : 0;
        
//         if (bitrate === 0 || sampleRate === 0) {
//           offset++;
//           continue;
//         }
        
//         // Calculate frame length
//         const samplesPerFrame = layer[1];
//         const frameLength = Math.floor((samplesPerFrame / 8 * bitrate * 1000) / sampleRate) + padding;
        
//         // Calculate frame duration
//         const frameDuration = samplesPerFrame / sampleRate;
//         duration += frameDuration;
        
//         frameCount++;
//         offset += frameLength;
//       } else {
//         offset++;
//       }
//     }
    
//     if (frameCount > 0) {
//       console.log(`🎵 Analyzed ${frameCount} MP3 frames, total duration: ${duration.toFixed(2)}s`);
//       return duration;
//     }
    
//     return 0;
//   } catch (error) {
//     console.error("Error analyzing MP3 frames:", error);
//     return 0;
//   }
// }

// /**
//  * Detect MP3 bitrate by analyzing frame headers
//  * @param {Buffer} buffer - Audio buffer
//  * @returns {number} Bitrate in kbps, or 0 if detection fails
//  */
// function detectMP3Bitrate(buffer) {
//   try {
//     const bitrateTable = [
//       0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320
//     ];
    
//     for (let i = 0; i < Math.min(buffer.length - 4, 10000); i++) {
//       if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
//         const bitrateIndex = (buffer[i + 2] >> 4) & 0x0F;
        
//         if (bitrateIndex > 0 && bitrateIndex < bitrateTable.length) {
//           const bitrate = bitrateTable[bitrateIndex];
//           console.log(`🔍 Detected MP3 bitrate: ${bitrate} kbps`);
//           return bitrate;
//         }
//       }
//     }
    
//     return 0;
//   } catch (error) {
//     console.error("Error detecting MP3 bitrate:", error);
//     return 0;
//   }
// }

// /**
//  * Alternative: Get duration directly from URL (for already uploaded files)
//  * @param {string} audioUrl - URL of the audio file
//  * @returns {Promise<number>} Duration in seconds
//  */
// async function getAudioDurationFromUrl(audioUrl) {
//   try {
//     const { exec } = require("child_process");
//     const { promisify } = require("util");
//     const execPromise = promisify(exec);
    
//     const ffprobePath = require("@ffprobe-installer/ffprobe").path;
//     const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioUrl}"`;
    
//     const { stdout } = await execPromise(command);
//     const durationInSeconds = parseFloat(stdout.trim());
    
//     if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
//       throw new Error("Invalid duration from URL");
//     }
    
//     return durationInSeconds;
//   } catch (error) {
//     console.error("Error getting duration from URL:", error);
//     throw new Error("Unable to determine audio duration from URL");
//   }
// }

// /**
//  * Convert seconds to minutes with precision
//  * @param {number} seconds - Duration in seconds
//  * @param {number} precision - Decimal places (default: 2)
//  * @returns {number} Duration in minutes
//  */
// function secondsToMinutes(seconds, precision = 2) {
//   const minutes = seconds / 60;
//   return parseFloat(minutes.toFixed(precision));
// }

// /**
//  * Check if user has sufficient minutes
//  * @param {number} userId - User ID
//  * @param {number} requiredSeconds - Required seconds for the audio
//  * @returns {Promise<Object>} { hasMinutes: boolean, remainingMinutes: number, details: Object }
//  */
// async function checkUserMinutes(userId, requiredSeconds) {
//   try {
//     const [subscription] = await db.query(
//       "SELECT * FROM user_subscription_details WHERE user_id = ?",
//       [userId]
//     );

//     if (subscription.length === 0) {
//       return {
//         hasMinutes: false,
//         remainingMinutes: 0,
//         remainingSeconds: 0,
//         message: "No active subscription found. Please subscribe to continue.",
//         details: null,
//       };
//     }

//     const userSub = subscription[0];
//     const remainingMinutes = userSub.total_remaining_time; // This is in minutes
//     const remainingSeconds = remainingMinutes * 60;
//     const requiredMinutes = secondsToMinutes(requiredSeconds, 2);

//     if (remainingSeconds < requiredSeconds) {
//       return {
//         hasMinutes: false,
//         remainingMinutes,
//         remainingSeconds,
//         requiredMinutes,
//         requiredSeconds,
//         message: `Insufficient minutes. You need ${requiredMinutes} minutes (${requiredSeconds.toFixed(0)}s) but only have ${remainingMinutes} minutes (${remainingSeconds.toFixed(0)}s) remaining.`,
//         details: userSub,
//       };
//     }

//     return {
//       hasMinutes: true,
//       remainingMinutes,
//       remainingSeconds,
//       requiredMinutes,
//       requiredSeconds,
//       message: "Sufficient minutes available",
//       details: userSub,
//     };
//   } catch (error) {
//     console.error("Error checking user minutes:", error);
//     throw new Error("Failed to verify subscription minutes");
//   }
// }

// /**
//  * Deduct minutes from user's subscription (accepts seconds, deducts as minutes)
//  * @param {number} userId - User ID
//  * @param {number} seconds - Seconds to deduct (will be converted to minutes)
//  * @returns {Promise<Object>} Updated subscription details
//  */
// async function deductUserMinutes(userId, seconds) {
//   try {
//     const [subscription] = await db.query(
//       "SELECT * FROM user_subscription_details WHERE user_id = ?",
//       [userId]
//     );

//     if (subscription.length === 0) {
//       throw new Error("Subscription not found");
//     }

//     const currentSub = subscription[0];
//     const minutesToDeduct = secondsToMinutes(seconds, 2);
    
//     const newRemainingTime = parseFloat((currentSub.total_remaining_time - minutesToDeduct).toFixed(2));
//     const newUsedTime = parseFloat((currentSub.total_used_time + minutesToDeduct).toFixed(2));
//     const newMonthlyUsed = parseFloat((currentSub.monthly_used + minutesToDeduct).toFixed(2));
//     const newMonthlyRemaining = parseFloat((currentSub.monthly_remaining - minutesToDeduct).toFixed(2));

//     await db.query(
//       `UPDATE user_subscription_details 
//        SET total_remaining_time = ?,
//            total_used_time = ?,
//            monthly_used = ?,
//            monthly_remaining = ?,
//            updated_at = CURRENT_TIMESTAMP
//        WHERE user_id = ?`,
//       [
//         newRemainingTime,
//         newUsedTime,
//         newMonthlyUsed,
//         newMonthlyRemaining,
//         userId,
//       ]
//     );

//     return {
//       success: true,
//       deductedMinutes: minutesToDeduct,
//       deductedSeconds: seconds,
//       remainingMinutes: newRemainingTime,
//       message: `Successfully deducted ${minutesToDeduct} minutes (${seconds.toFixed(0)}s). Remaining: ${newRemainingTime} minutes`,
//     };
//   } catch (error) {
//     console.error("Error deducting user minutes:", error);
//     throw new Error("Failed to deduct minutes from subscription");
//   }
// }

// /**
//  * Express middleware to check and validate audio minutes before processing
//  */
// const validateAudioMinutes = async (req, res, next) => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       return res.status(401).json({ 
//         success: false,
//         message: "Unauthorized: no user ID" 
//       });
//     }

//     let audioBuffer;
//     const { driveUrl } = req.body;

//     if (driveUrl) {
//       const axios = require("axios");
//       const fileId = driveUrl.match(/\/d\/(.*?)\//)?.[1];
//       if (!fileId) {
//         return res.status(400).json({ 
//           success: false,
//           message: "Invalid Google Drive URL format" 
//         });
//       }
//       const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
//       const fileRes = await axios.get(directUrl, { responseType: "arraybuffer" });
//       audioBuffer = Buffer.from(fileRes.data);
//     } else if (req.file) {
//       audioBuffer = req.file.buffer;
//     } else {
//       return res.status(400).json({ 
//         success: false,
//         message: "No audio file or Drive URL provided" 
//       });
//     }

//     const durationResult = await getAudioDuration(audioBuffer);
//     const durationInSeconds = typeof durationResult === 'object' ? durationResult.seconds : durationResult;

//     const minutesCheck = await checkUserMinutes(userId, durationInSeconds);

//     if (!minutesCheck.hasMinutes) {
//       return res.status(402).json({
//         success: false,
//         message: minutesCheck.message,
//         requiredMinutes: minutesCheck.requiredMinutes,
//         requiredSeconds: durationInSeconds,
//         remainingMinutes: minutesCheck.remainingMinutes,
//         needsRecharge: true,
//       });
//     }

//     req.audioDurationSeconds = durationInSeconds;
//     req.audioDurationMinutes = secondsToMinutes(durationInSeconds, 2);
//     req.audioBuffer = audioBuffer;
//     req.subscriptionCheck = minutesCheck;

//     next();
//   } catch (error) {
//     console.error("Minutes validation error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to validate audio duration",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Log minutes usage for audit trail
//  */
// async function logMinutesUsage(userId, audioId, seconds, source, action = "deducted") {
//   try {
//     const minutesUsed = secondsToMinutes(seconds, 2);
//     await db.query(
//       `INSERT INTO minutes_usage_log (user_id, audio_id, minutes_used, seconds_used, source, action, created_at) 
//        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
//       [userId, audioId, minutesUsed, seconds, source, action]
//     );
//   } catch (error) {
//     console.error("Error logging minutes usage:", error);
//   }
// }

// module.exports = {
//   getAudioDuration,
//   getAudioDurationFromUrl,
//   checkUserMinutes,
//   deductUserMinutes,
//   validateAudioMinutes,
//   logMinutesUsage,
//   secondsToMinutes,
// };

// middlewares/minutesManager.js

const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

/**
 * Get audio duration from buffer using multiple methods
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Promise<number>} Duration in minutes (rounded up)
 */
async function getAudioDuration(audioBuffer) {
  let tempFilePath = null;
  
  try {
    // Method 1: mp3-duration (most accurate for MP3 files)
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

    // Method 2: music-metadata
    try {
      const { parseBuffer } = require("music-metadata");
      const metadata = await parseBuffer(audioBuffer, { mimeType: 'audio/mpeg' });
      
      if (metadata.format.duration && metadata.format.duration > 0) {
        const durationInMinutes = Math.ceil(metadata.format.duration / 60);
        console.log(`✅ Duration obtained via music-metadata: ${durationInMinutes} minutes (${metadata.format.duration.toFixed(2)}s)`);
        return durationInMinutes;
      }
    } catch (metadataError) {
      console.log("📊 music-metadata method failed, trying ffprobe...");
    }

    // Method 3: ffprobe with temporary file
    const tempDir = os.tmpdir();
    const tempFileName = `temp_audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
    tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempFilePath, audioBuffer);
    
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execPromise = promisify(exec);
      
      // Try system ffprobe first
      try {
        const { stdout } = await execPromise(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`
        );
        
        const durationInSeconds = parseFloat(stdout.trim());
        
        if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
          const durationInMinutes = Math.ceil(durationInSeconds / 60);
          console.log(`✅ Duration obtained via system ffprobe: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
          return durationInMinutes;
        }
      } catch (systemError) {
        // Try @ffprobe-installer package
        const ffprobePath = require("@ffprobe-installer/ffprobe").path;
        const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`;
        
        const { stdout } = await execPromise(command);
        const durationInSeconds = parseFloat(stdout.trim());
        
        if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
          const durationInMinutes = Math.ceil(durationInSeconds / 60);
          console.log(`✅ Duration obtained via installed ffprobe: ${durationInMinutes} minutes (${durationInSeconds.toFixed(2)}s)`);
          return durationInMinutes;
        }
      }
    } catch (ffprobeError) {
      console.log("⚠️ ffprobe failed:", ffprobeError.message);
    }

    // Method 4: Precise MP3 frame counting
    console.log("🔍 Analyzing MP3 frames for precise duration...");
    
    const frameDuration = analyzeMp3Frames(audioBuffer);
    if (frameDuration > 0) {
      const durationInMinutes = Math.ceil(frameDuration / 60);
      console.log(`📏 Duration via frame analysis: ${durationInMinutes} minutes (${frameDuration.toFixed(2)}s)`);
      
      return {
        minutes: durationInMinutes,
        estimated: true,
        method: 'frame_analysis',
        actualSeconds: frameDuration
      };
    }
    
    // Method 5: Bitrate-based calculation
    const bitrate = detectMP3Bitrate(audioBuffer);
    if (bitrate > 0) {
      const fileSizeInBytes = audioBuffer.length;
      const durationInSeconds = (fileSizeInBytes * 8) / (bitrate * 1000);
      const estimatedMinutes = Math.ceil(durationInSeconds / 60);
      
      console.log(`📏 Estimated duration via bitrate: ${estimatedMinutes} minutes (${durationInSeconds.toFixed(2)}s, bitrate: ${bitrate}kbps)`);
      
      return {
        minutes: estimatedMinutes,
        estimated: true,
        method: 'bitrate_calculation',
        bitrate: bitrate,
        actualSeconds: durationInSeconds
      };
    }
    
    // Method 6: Fallback estimation
    const fileSizeInMB = audioBuffer.length / (1024 * 1024);
    const estimatedMinutes = Math.ceil((fileSizeInMB * 8 * 60) / 64); // 64kbps for low-quality recordings
    
    console.log(`📏 Fallback estimation: ${estimatedMinutes} minutes (${fileSizeInMB.toFixed(2)} MB @ 64kbps)`);
    
    return {
      minutes: estimatedMinutes > 0 ? estimatedMinutes : 1,
      estimated: true,
      method: 'size_based',
      fileSize: fileSizeInMB
    };
    
  } catch (error) {
    console.error("❌ All duration detection methods failed:", error);
    
    const fileSizeInMB = audioBuffer.length / (1024 * 1024);
    const fallbackMinutes = Math.max(1, Math.ceil((fileSizeInMB * 8 * 60) / 64));
    
    console.log(`⚠️ Using fallback: ${fallbackMinutes} minutes`);
    
    return {
      minutes: fallbackMinutes,
      estimated: true,
      method: 'fallback'
    };
    
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

    const durationResult = await getAudioDuration(audioBuffer);
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
};