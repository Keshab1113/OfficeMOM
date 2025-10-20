// const ftp = require("basic-ftp");
// const { Readable } = require("stream");
// const { v4: uuidv4 } = require("uuid");
// const path = require("path");

// async function uploadToFTP(buffer, originalName, subDir = "") {
//   const client = new ftp.Client();
//   client.ftp.verbose = false;
//   const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;

//   try {
//     await client.access({
//       host: process.env.FTP_HOST,
//       user: process.env.FTP_USER,
//       password: process.env.FTP_PASS || "Quantum#098",
//       secure: process.env.FTP_SECURE === "true",
//       port: process.env.FTP_PORT || 21,
//     });

//     const targetDir = path.posix.join(process.env.FTP_REMOTE_DIR || "/", subDir || "");
//     await client.ensureDir(targetDir);
//     await client.cd(targetDir);

//     const stream = Readable.from(buffer);
//     await client.uploadFrom(stream, uniqueName);

//     // ✅ Verify upload
//     const fileList = await client.list();
//     const uploadedFile = fileList.find((f) => f.name === uniqueName);

//     if (!uploadedFile) {
//       throw new Error("Upload failed: file not found on FTP server");
//     }

//     client.close();

//     return `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;
//   } catch (err) {
//     client.close();
//     console.error("❌ [FTP Upload] Error:", err.message);
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
  client.ftp.verbose = true;
  client.ftp.timeout = 0; // 🔥 no timeout on control socket
  client.ftp.socketTimeout = 10 * 60 * 1000; // 10 mins for large uploads

  const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: process.env.FTP_SECURE === "true",
      port: parseInt(process.env.FTP_PORT || 21),
      secureOptions: { rejectUnauthorized: false },
    });

    // console.log("✅ Connected to FTP server");

    const targetDir = path.posix.join(process.env.FTP_REMOTE_DIR || "/", subDir || "");
    await client.ensureDir(targetDir);
    await client.cd(targetDir);

    // 🩵 Keep control connection alive
    const keepAlive = setInterval(() => {
      if (!client.closed) client.send("NOOP").catch(() => {});
    }, 30000);

    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, uniqueName);

    clearInterval(keepAlive);
    client.close();

    // console.log(`✅ Uploaded large file successfully: ${uniqueName}`);

    return `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;
  } catch (err) {
    console.error("❌ [FTP Upload] Error:", err.message);
    client.close();
    throw err;
  }
}

module.exports = uploadToFTP;
