// // const ftp = require("basic-ftp");
// // const { Readable } = require("stream");
// // const { v4: uuidv4 } = require("uuid");
// // const path = require("path");

// // async function uploadToFTP(buffer, originalName, subDir = "") {
// //   const client = new ftp.Client();
// //   client.ftp.verbose = false;
// //   const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;

// //   try {
// //     await client.access({
// //       host: process.env.FTP_HOST,
// //       user: process.env.FTP_USER,
// //       password: process.env.FTP_PASS || "Quantum#098",
// //       secure: process.env.FTP_SECURE === "true",
// //       port: process.env.FTP_PORT || 21,
// //     });

// //     const targetDir = path.posix.join(process.env.FTP_REMOTE_DIR || "/", subDir || "");
// //     await client.ensureDir(targetDir);
// //     await client.cd(targetDir);

// //     const stream = Readable.from(buffer);
// //     await client.uploadFrom(stream, uniqueName);

// //     // ✅ Verify upload
// //     const fileList = await client.list();
// //     const uploadedFile = fileList.find((f) => f.name === uniqueName);

// //     if (!uploadedFile) {
// //       throw new Error("Upload failed: file not found on FTP server");
// //     }

// //     client.close();

// //     return `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;
// //   } catch (err) {
// //     client.close();
// //     console.error("❌ [FTP Upload] Error:", err.message);
// //     throw err;
// //   }
// // }

// // module.exports = uploadToFTP;


// const ftp = require("basic-ftp");
// const { Readable } = require("stream");
// const { v4: uuidv4 } = require("uuid");
// const path = require("path");

// async function uploadToFTP(buffer, originalName, subDir = "") {
//   const client = new ftp.Client();
//   client.ftp.verbose = true;
//   client.ftp.timeout = 0; // 🔥 no timeout on control socket
//   client.ftp.socketTimeout = 10 * 60 * 1000; // 10 mins for large uploads

//   const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;

//   try {
//     await client.access({
//       host: process.env.FTP_HOST,
//       user: process.env.FTP_USER,
//       password: process.env.FTP_PASS,
//       secure: process.env.FTP_SECURE === "true",
//       port: parseInt(process.env.FTP_PORT || 21),
//       secureOptions: { rejectUnauthorized: false },
//     });

//     // console.log("✅ Connected to FTP server");

//     const targetDir = path.posix.join(process.env.FTP_REMOTE_DIR || "/", subDir || "");
//     await client.ensureDir(targetDir);
//     await client.cd(targetDir);

//     // 🩵 Keep control connection alive
//     const keepAlive = setInterval(() => {
//       if (!client.closed) client.send("NOOP").catch(() => {});
//     }, 30000);

//     const stream = Readable.from(buffer);
//     await client.uploadFrom(stream, uniqueName);

//     clearInterval(keepAlive);
//     client.close();

//     // console.log(`✅ Uploaded large file successfully: ${uniqueName}`);

//     return `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;
//   } catch (err) {
//     console.error("❌ [FTP Upload] Error:", err.message);
//     client.close();
//     throw err;
//   }
// }

// module.exports = uploadToFTP;

const ftp = require("basic-ftp");
const { Readable } = require("stream");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

async function uploadToFTP(buffer, originalName, subDir = "") {
  const client = new ftp.Client();
  
  // 🚀 Performance optimizations
  client.ftp.verbose = false;
  client.ftp.timeout = 0;
  client.ftp.socketTimeout = 20 * 60 * 1000;
  client.ftp.ipFamily = 4;

  const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;
  let keepAliveInterval = null;
  let isUploading = false;

  console.log(`\n📁 Starting upload: ${originalName}`);
  console.log(`📦 File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  try {
    await client.access({
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
    });

    console.log(`✅ Connected to FTP server: ${process.env.FTP_HOST}`);

    const targetDir = path.posix.join(
      process.env.FTP_REMOTE_DIR || "/", 
      subDir || ""
    );
    
    await client.ensureDir(targetDir);
    await client.cd(targetDir);
    console.log(`📂 Target directory: ${targetDir}`);

    await client.sendIgnoringError("TYPE I");

    keepAliveInterval = setInterval(async () => {
      if (!client.closed && !isUploading) {
        try {
          await client.send("NOOP");
        } catch (err) {
          // Ignore errors
        }
      }
    }, 45000);

    isUploading = true;
    console.log(`🚀 Upload started...`);

    const stream = Readable.from(buffer, {
      highWaterMark: 1024 * 1024 * 4,
    });

    // 📊 Track progress with better logging
    let lastLoggedPercentage = 0;
    const startTime = Date.now();

    client.trackProgress((info) => {
      const percentage = Math.round((info.bytes / buffer.length) * 100);
      const uploadedMB = (info.bytes / 1024 / 1024).toFixed(2);
      const totalMB = (buffer.length / 1024 / 1024).toFixed(2);
      
      // Log every 10% or when complete
      if (percentage >= lastLoggedPercentage + 10 || percentage === 100) {
        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
        const speed = (info.bytes / 1024 / 1024 / (elapsedSeconds || 1)).toFixed(2);
        
        console.log(
          `📤 Progress: ${percentage}% | ` +
          `${uploadedMB}/${totalMB} MB | ` +
          `Speed: ${speed} MB/s | ` +
          `Time: ${elapsedSeconds}s`
        );
        
        lastLoggedPercentage = percentage;
      }
    });

    await client.uploadFrom(stream, uniqueName);
    
    client.trackProgress();
    isUploading = false;

    clearInterval(keepAliveInterval);
    client.close();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const avgSpeed = (buffer.length / 1024 / 1024 / totalTime).toFixed(2);
    const fileUrl = `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;

    console.log(`\n✅ Upload complete!`);
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log(`⚡ Average speed: ${avgSpeed} MB/s`);
    console.log(`📎 File URL: ${fileUrl}`);
    console.log(`─────────────────────────────────────────────────────\n`);

    return fileUrl;
  } catch (err) {
    console.error(`\n❌ Upload failed: ${err.message}`);
    console.error(`📁 File: ${originalName}`);
    console.error(`─────────────────────────────────────────────────────\n`);
    
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    client.close();
    throw err;
  }
}

module.exports = uploadToFTP;