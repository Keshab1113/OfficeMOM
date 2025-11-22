const ftp = require("basic-ftp");
const { Readable } = require("stream");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

async function uploadToFTP(buffer, originalName, subDir = "", retries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < retries) {
    attempt++;

    try {
      console.log(`\n📁 Upload attempt ${attempt}/${retries}: ${originalName}`);
      console.log(`📦 File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

      const result = await performFTPUpload(buffer, originalName, subDir);

      console.log(`✅ Upload successful on attempt ${attempt}`);
      return result;
    } catch (err) {
      lastError = err;
      console.error(`❌ Attempt ${attempt} failed: ${err.message}`);
      console.error(`Stack: ${err.stack}`);

      // Don't retry on certain errors
      if (
        err.message.includes("Authentication") ||
        err.message.includes("Permission denied") ||
        err.message.includes("ENOTFOUND")
      ) {
        throw err;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(
    `Upload failed after ${retries} attempts: ${lastError.message}`
  );
}

async function performFTPUpload(buffer, originalName, subDir) {
  const client = new ftp.Client();
  
  // More aggressive timeouts for VPS
  // client.ftp.verbose = true; // Enable verbose for debugging
  client.ftp.timeout = 60000; // 60 second command timeout
  client.ftp.socketTimeout = 60 * 60 * 1000; // 60 minutes for socket
  client.ftp.ipFamily = 4;

  const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;
  let keepAliveInterval = null;
  let uploadStartTime = null;
  let uploadPromise = null;

  try {
    // Connect with better timeout handling
    console.log(`🔌 Connecting to FTP: ${process.env.FTP_HOST}`);
    
    await Promise.race([
      client.access({
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASS,
        secure: process.env.FTP_SECURE === "true",
        port: parseInt(process.env.FTP_PORT || 21),
        secureOptions: {
          rejectUnauthorized: false,
          keepAlive: true,
          keepAliveInitialDelay: 10000,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout (60s)")), 60000)
      ),
    ]);

    console.log(`✅ Connected to FTP: ${process.env.FTP_HOST}`);

    const targetDir = path.posix.join(
      process.env.FTP_REMOTE_DIR || "/",
      subDir || ""
    );

    await client.ensureDir(targetDir);
    await client.cd(targetDir);
    // console.log(`📂 Directory: ${targetDir}`);

    // Set binary mode explicitly
    await client.send("TYPE I");
    console.log(`✅ Binary mode enabled`);

    // Keep-alive ONLY before upload starts
    keepAliveInterval = setInterval(async () => {
      if (!client.closed && !uploadPromise) {
        try {
          await client.send("NOOP");
          console.log(`💓 Keep-alive sent`);
        } catch (err) {
          console.warn(`⚠️ Keep-alive failed: ${err.message}`);
        }
      }
    }, 30000);

    uploadStartTime = Date.now();
    console.log(`🚀 Upload started at ${new Date(uploadStartTime).toISOString()}`);

    // Create stream with optimal chunk size
    const chunkSize = buffer.length > 100 * 1024 * 1024 
      ? 16 * 1024 * 1024  // 16MB for files > 100MB
      : 8 * 1024 * 1024;   // 8MB for smaller files
    
    const stream = Readable.from(buffer, {
      highWaterMark: chunkSize,
    });

    // Add error handler to stream
    stream.on('error', (err) => {
      console.error(`❌ Stream error: ${err.message}`);
    });

    // Progress tracking with less frequent logging
    let lastLogTime = Date.now();
    let lastLoggedBytes = 0;
    let logCount = 0;

    client.trackProgress((info) => {
      const now = Date.now();
      const timeSinceLastLog = now - lastLogTime;

      // Log every 10 seconds or when complete
      if (timeSinceLastLog >= 10000 || info.bytes === buffer.length) {
        const percentage = Math.round((info.bytes / buffer.length) * 100);
        const uploadedMB = (info.bytes / 1024 / 1024).toFixed(2);
        const totalMB = (buffer.length / 1024 / 1024).toFixed(2);
        const elapsedSeconds = (now - uploadStartTime) / 1000;

        // Calculate current speed
        const bytesSinceLastLog = info.bytes - lastLoggedBytes;
        const currentSpeed = bytesSinceLastLog / 1024 / 1024 / (timeSinceLastLog / 1000);

        // Calculate ETA
        const avgSpeed = info.bytes / 1024 / 1024 / elapsedSeconds;
        const remainingMB = (buffer.length - info.bytes) / 1024 / 1024;
        const etaSeconds = avgSpeed > 0 ? remainingMB / avgSpeed : 0;
        const etaMinutes = Math.floor(etaSeconds / 60);
        const etaSecs = Math.floor(etaSeconds % 60);

        logCount++;
        console.log(
          `📤 [${logCount}] ${percentage}% | ${uploadedMB}/${totalMB} MB | ` +
          `Speed: ${currentSpeed.toFixed(2)} MB/s (avg: ${avgSpeed.toFixed(2)}) | ` +
          `ETA: ${etaMinutes}m ${etaSecs}s | ` +
          `Elapsed: ${elapsedSeconds.toFixed(0)}s`
        );

        lastLogTime = now;
        lastLoggedBytes = info.bytes;
      }
    });

    // STOP keep-alive before upload
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
      console.log(`🛑 Keep-alive stopped, starting upload...`);
    }

    // Upload with extended timeout for large files
    const uploadTimeout = Math.max(
      60 * 60 * 1000, // Minimum 60 minutes
      (buffer.length / 1024 / 1024) * 1000 * 10 // 10 seconds per MB
    );

    console.log(`⏱️  Upload timeout set to: ${(uploadTimeout / 1000 / 60).toFixed(1)} minutes`);

    uploadPromise = client.uploadFrom(stream, uniqueName);
    
    await Promise.race([
      uploadPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Upload timeout (${uploadTimeout / 1000 / 60} minutes exceeded)`)),
          uploadTimeout
        )
      ),
    ]);

    client.trackProgress(); // Stop tracking
    uploadPromise = null;

    console.log(`✅ Upload command completed`);

    // Verify upload with retry
    let uploadedFile = null;
    for (let i = 0; i < 3; i++) {
      try {
        const fileList = await client.list();
        uploadedFile = fileList.find((f) => f.name === uniqueName);
        if (uploadedFile) break;
        
        // console.log(`⏳ File not in list yet, waiting... (attempt ${i + 1}/3)`);
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.warn(`⚠️ List failed: ${err.message}`);
      }
    }

    if (!uploadedFile) {
      throw new Error("File not found on server after upload");
    }

    // Check file size
    const sizeDiff = Math.abs(uploadedFile.size - buffer.length);
    const sizePercent = (sizeDiff / buffer.length) * 100;
    
    if (sizeDiff > 0) {
      console.warn(
        `⚠️ Size mismatch: expected ${buffer.length}, got ${uploadedFile.size} ` +
        `(diff: ${sizeDiff} bytes, ${sizePercent.toFixed(2)}%)`
      );
      
      // Only fail if difference is significant (> 0.1%)
      if (sizePercent > 0.1) {
        throw new Error(`Significant size mismatch: ${sizePercent.toFixed(2)}% difference`);
      }
    }

    // Close connection gracefully
    try {
      await client.send("QUIT");
    } catch (err) {
      console.warn(`⚠️ QUIT failed: ${err.message}`);
    }
    
    client.close();

    const totalTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    const avgSpeed = (buffer.length / 1024 / 1024 / totalTime).toFixed(2);
    const fileUrl = `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;

    // console.log(`\n✅ Upload complete!`);
    // console.log(`📁 File: ${uniqueName}`);
    // console.log(`📊 Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    // console.log(`⏱️  Total time: ${totalTime}s (${(totalTime / 60).toFixed(2)} min)`);
    // console.log(`⚡ Average speed: ${avgSpeed} MB/s`);
    // console.log(`📎 URL: ${fileUrl}`);
    // console.log(`─────────────────────────────────────────────────────\n`);

    return fileUrl;
    
  } catch (err) {
    console.error(`\n❌ Upload error: ${err.message}`);
    console.error(`📁 File: ${originalName}`);
    console.error(`📊 Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.error(`⏱️  Time elapsed: ${uploadStartTime ? ((Date.now() - uploadStartTime) / 1000).toFixed(2) + 's' : 'N/A'}`);
    console.error(`Stack: ${err.stack}`);
    console.error(`─────────────────────────────────────────────────────\n`);

    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }

    if (!client.closed) {
      try {
        client.close();
      } catch (closeErr) {
        console.error(`⚠️ Error closing client: ${closeErr.message}`);
      }
    }

    throw err;
  }
}

module.exports = uploadToFTP;