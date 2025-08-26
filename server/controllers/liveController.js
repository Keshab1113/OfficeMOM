import fs from "fs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";

const ASSEMBLY_KEY = process.env.ASSEMBLYAI_API_KEY;
const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";

async function uploadFileToAssemblyAI(filePath) {
  const stat = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

  const res = await axios.post(UPLOAD_URL, fileStream, {
    headers: {
      Authorization: ASSEMBLY_KEY,
      "Transfer-Encoding": "chunked",
      "Content-Type": "application/octet-stream",
      "Content-Length": stat.size,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return res.data.upload_url;
}

async function createTranscription(audioUrl) {
  const res = await axios.post(
    TRANSCRIPT_URL,
    { audio_url: audioUrl },
    {
      headers: {
        Authorization: ASSEMBLY_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

async function pollTranscription(id, interval = 3000, timeout = 5 * 60 * 1000) {
  const start = Date.now();
  while (true) {
    const res = await axios.get(`${TRANSCRIPT_URL}/${id}`, {
      headers: { Authorization: ASSEMBLY_KEY },
    });
    const data = res.data;
    if (data.status === "completed") return data;
    if (data.status === "error")
      throw new Error(data.error || "Transcription error");
    if (Date.now() - start > timeout) throw new Error("Transcription timeout");
    await new Promise((r) => setTimeout(r, interval));
  }
}

export const transcribeAudio = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const audioUrl = await uploadFileToAssemblyAI(file.path);
    const created = await createTranscription(audioUrl);
    const result = await pollTranscription(created.id);
    fs.unlink(file.path, () => {});

    res.json({ text: result.text, full: result });
  } catch (err) {
    console.error(err);
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: err.message || "Server error" });
  }
};

export const createMeeting = async (req, res) => {
  const room_id = uuidv4();
  const [r] = await db.query(
    "INSERT INTO meetings (room_id, host_user_id) VALUES (?,?)",
    [room_id, req.user.id]
  );
  res.json({ roomId: room_id, meetingId: r.insertId });
};
export const endMeeting = async (req, res) => {
  const { meetingId } = req.params;
  await db.query('UPDATE meetings SET status="ended", ended_at=NOW() WHERE room_id=?', [meetingId]);
  res.json({ ok: true });
};
