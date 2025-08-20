import ftp from "basic-ftp";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * Upload a file buffer to FTP and return its public URL.
 * @param {Buffer} buffer - The file data to upload
 * @param {String} originalName - The original filename (used in naming)
 * @param {String} subDir - Optional sub-directory under FTP_REMOTE_DIR
 * @returns {String} Public URL to the uploaded file
 */
export default async function uploadToFTP(buffer, originalName, subDir = "") {
  const client = new ftp.Client();
  client.ftp.verbose = false; // set true for debugging logs
  const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;

  try {
    // Connect to FTP server
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS || "Quantum#098",
      secure: process.env.FTP_SECURE === "true" ? true : false,
      port: process.env.FTP_PORT || 21,
    });

    // Navigate to target directory
    const targetDir = path.posix.join(process.env.FTP_REMOTE_DIR || "/", subDir || "");
    await client.ensureDir(targetDir);
    await client.cd(targetDir);

    // Upload the file from buffer
    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, uniqueName);

    client.close();

    // Return the public URL
    const publicUrl = `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;
    return publicUrl;
  } catch (err) {
    client.close();
    console.error("❌ [FTP Upload] Error:", err);
    throw err;
  }
}
