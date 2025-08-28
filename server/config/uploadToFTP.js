import ftp from "basic-ftp";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import url from "url";

export default async function uploadToFTP(buffer, originalName, subDir = "") {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS || "Quantum#098",
      secure: process.env.FTP_SECURE === "true",
      port: process.env.FTP_PORT || 21,
    });

    const targetDir = path.posix.join(process.env.FTP_REMOTE_DIR || "/", subDir || "");
    await client.ensureDir(targetDir);
    await client.cd(targetDir);

    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, uniqueName);
    client.close();

    return `${process.env.FTP_BASE_URL}/${subDir ? subDir + "/" : ""}${uniqueName}`;
  } catch (err) {
    client.close();
    console.error("❌ [FTP Upload] Error:", err);
    throw err;
  }
}

