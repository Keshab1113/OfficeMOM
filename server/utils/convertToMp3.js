const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const { PassThrough } = require("stream");

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Converts MP4 (video) to MP3 (audio buffer)
 * @param {Buffer} inputBuffer - the MP4 file buffer
 * @returns {Promise<Buffer>} MP3 buffer
 */
async function convertMp4ToMp3(inputBuffer) {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough();
    const outputStream = new PassThrough();
    const chunks = [];

    inputStream.end(inputBuffer);

    ffmpeg(inputStream)
      .toFormat("mp3")
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .on("error", (err) => reject(err))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe(outputStream, { end: true });

    outputStream.on("data", (chunk) => chunks.push(chunk));
  });
}

module.exports = { convertMp4ToMp3 };
