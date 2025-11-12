// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegPath = require("ffmpeg-static");
// const { PassThrough } = require("stream");

// ffmpeg.setFfmpegPath(ffmpegPath);

// /**
//  * Converts MP4 (video) to MP3 (audio buffer)
//  * @param {Buffer} inputBuffer - the MP4 file buffer
//  * @returns {Promise<Buffer>} MP3 buffer
//  */
// async function convertMp4ToMp3(inputBuffer) {
//   return new Promise((resolve, reject) => {
//     const inputStream = new PassThrough();
//     const outputStream = new PassThrough();
//     const chunks = [];

//     inputStream.end(inputBuffer);

//     ffmpeg(inputStream)
//       .toFormat("mp3")
//       .audioCodec("libmp3lame")
//       .audioBitrate("128k")
//       .on("error", (err) => reject(err))
//       .on("end", () => resolve(Buffer.concat(chunks)))
//       .pipe(outputStream, { end: true });

//     outputStream.on("data", (chunk) => chunks.push(chunk));
//   });
// }

// module.exports = { convertMp4ToMp3 };


// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegStatic = require("ffmpeg-static");
// const fs = require("fs");
// const path = require("path");

// async function convertMp4ToMp3(buffer) {
//   return new Promise((resolve, reject) => {
//     try {
//       // ­ЪДа Detect correct ffmpeg binary
//       if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
//         ffmpeg.setFfmpegPath(ffmpegStatic);
//       } else {
//         console.warn("Рџа ffmpeg-static not found, trying system ffmpeg");
//         ffmpeg.setFfmpegPath("ffmpeg"); // fallback
//       }

//       const tmpDir = path.join(__dirname, "../temp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

//       const inputPath = path.join(tmpDir, `input_${Date.now()}.mp4`);
//       const outputPath = path.join(tmpDir, `output_${Date.now()}.mp3`);

//       fs.writeFileSync(inputPath, buffer);

//       ffmpeg(inputPath)
//         .toFormat("mp3")
//         .on("end", () => {
//           const outputBuffer = fs.readFileSync(outputPath);
//           fs.unlinkSync(inputPath);
//           fs.unlinkSync(outputPath);
//           resolve(outputBuffer);
//         })
//         .on("error", (err) => {
//           console.error("РЮї ffmpeg conversion error:", err);
//           reject(new Error("Unable to convert video file to audio"));
//         })
//         .save(outputPath);
//     } catch (err) {
//       console.error("РЮї convertMp4ToMp3 failed:", err);
//       reject(err);
//     }
//   });
// }

// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegPath = require("ffmpeg-static");
// const { PassThrough } = require("stream");

// ffmpeg.setFfmpegPath(ffmpegPath);

// /**
//  * Converts MP4 (video) to MP3 (audio buffer)
//  * @param {Buffer} inputBuffer - the MP4 file buffer
//  * @returns {Promise<Buffer>} MP3 buffer
//  */
// async function convertMp4ToMp3(inputBuffer) {
//   return new Promise((resolve, reject) => {
//     const inputStream = new PassThrough();
//     const outputStream = new PassThrough();
//     const chunks = [];

//     inputStream.end(inputBuffer);

//     ffmpeg(inputStream)
//       .toFormat("mp3")
//       .audioCodec("libmp3lame")
//       .audioBitrate("128k")
//       .on("error", (err) => reject(err))
//       .on("end", () => resolve(Buffer.concat(chunks)))
//       .pipe(outputStream, { end: true });

//     outputStream.on("data", (chunk) => chunks.push(chunk));
//   });
// }

// module.exports = { convertMp4ToMp3 };

// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegStatic = require("ffmpeg-static");
// const fs = require("fs");
// const path = require("path");

// async function convertMp4ToMp3(buffer) {
//   return new Promise((resolve, reject) => {
//     try {
//       // ­ЪДа Detect correct ffmpeg binary
//       if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
//         ffmpeg.setFfmpegPath(ffmpegStatic);
//       } else {
//         console.warn("Рџа ffmpeg-static not found, trying system ffmpeg");
//         ffmpeg.setFfmpegPath("ffmpeg"); // fallback
//       }

//       const tmpDir = path.join(__dirname, "../temp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

//       const inputPath = path.join(tmpDir, `input_${Date.now()}.mp4`);
//       const outputPath = path.join(tmpDir, `output_${Date.now()}.mp3`);

//       fs.writeFileSync(inputPath, buffer);

//       ffmpeg(inputPath)
//         .toFormat("mp3")
//         .on("end", () => {
//           const outputBuffer = fs.readFileSync(outputPath);
//           fs.unlinkSync(inputPath);
//           fs.unlinkSync(outputPath);
//           resolve(outputBuffer);
//         })
//         .on("error", (err) => {
//           console.error("РЮї ffmpeg conversion error:", err);
//           reject(new Error("Unable to convert video file to audio"));
//         })
//         .save(outputPath);
//     } catch (err) {
//       console.error("РЮї convertMp4ToMp3 failed:", err);
//       reject(err);
//     }
//   });
// }

// module.exports = { convertMp4ToMp3 };


// module.exports = { convertMp4ToMp3 };
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Get the correct ffmpeg path with permission fixes
 */
function getFFmpegPath() {
  try {
    // Check if system ffmpeg works
    execSync("ffmpeg -version", { stdio: "ignore" });
    console.log("✅ Using system ffmpeg (from VPS)");
    return "ffmpeg";
  } catch (err) {
    console.error("❌ System ffmpeg not found, please install with: sudo yum install ffmpeg -y");
    throw new Error("System ffmpeg not found");
  }
}

/**
 * Convert MP4 buffer to MP3 buffer
 */
async function convertMp4ToMp3(buffer) {
  return new Promise((resolve, reject) => {
    let inputPath = null;
    let outputPath = null;

    try {
      // Get ffmpeg path
      const ffmpegPath = getFFmpegPath();
      ffmpeg.setFfmpegPath(ffmpegPath);

      // Create temp directory
      const tmpDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Create unique file names
      const timestamp = Date.now();
      inputPath = path.join(tmpDir, `input_${timestamp}.mp4`);
      outputPath = path.join(tmpDir, `output_${timestamp}.mp3`);

      // Write input buffer to file
      fs.writeFileSync(inputPath, buffer);

      // Convert to MP3
      ffmpeg(inputPath)
        .toFormat("mp3")
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .on("start", (cmd) => {
          console.log(`🎬 Starting conversion: ${cmd}`);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`⏳ Processing: ${Math.round(progress.percent)}%`);
          }
        })
        .on("end", () => {
          try {
            console.log("✅ Conversion completed");
            const outputBuffer = fs.readFileSync(outputPath);
            
            // Cleanup
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            
            resolve(outputBuffer);
          } catch (readErr) {
            console.error("❌ Error reading output file:", readErr);
            reject(new Error("Failed to read converted MP3 file"));
          }
        })
        .on("error", (err) => {
          console.error("❌ ffmpeg conversion error:", err);
          
          // Cleanup on error
          try {
            if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch (cleanupErr) {
            console.error("⚠️ Cleanup error:", cleanupErr);
          }
          
          reject(new Error(`MP4 to MP3 conversion failed: ${err.message}`));
        })
        .save(outputPath);

    } catch (err) {
      console.error("❌ convertMp4ToMp3 setup failed:", err);
      
      // Cleanup on setup error
      try {
        if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.error("⚠️ Cleanup error:", cleanupErr);
      }
      
      reject(new Error(`Conversion setup failed: ${err.message}`));
    }
  });
}

module.exports = { convertMp4ToMp3 };