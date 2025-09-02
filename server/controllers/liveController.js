import fs from "fs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import uploadToFTP from "../config/uploadToFTP.js";

const ASSEMBLY_KEY = process.env.ASSEMBLYAI_API_KEY;
const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";

async function uploadFileToAssemblyAI(buffer, filename) {
  const headers = {
    authorization: ASSEMBLY_KEY,
    "transfer-encoding": "chunked",
    "content-type": "application/octet-stream",
  };

  const res = await axios.post(UPLOAD_URL, buffer, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return res.data.upload_url;
}

async function createTranscription(audioUrl) {
  const res = await axios.post(
    TRANSCRIPT_URL,
    { audio_url: audioUrl, language_detection: true, },
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
    const audioUrl = await uploadFileToAssemblyAI(
      file.buffer,
      file.originalname
    );
    const created = await createTranscription(audioUrl);
    const result = await pollTranscription(created.id);
    // fs.unlink(file.path, () => {});

    res.json({ text: result.text, full: result, language: result.language_code, });
  } catch (err) {
    console.error(err);
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: err.message || "Server error" });
  }
};
export const transcribeAudioFromURL = async (req, res) => {
  const { audioUrl } = req.body;
  if (!audioUrl) {
    return res.status(400).json({ error: "No audio URL provided" });
  }
  try {
    const created = await createTranscription(audioUrl);
    const result = await pollTranscription(created.id);
    res.json({ text: result.text, full: result });
  } catch (err) {
    console.error("Error in transcribeAudio:", err);
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
  await db.query(
    'UPDATE meetings SET status="ended", ended_at=NOW() WHERE room_id=?',
    [meetingId]
  );
  res.json({ ok: true });
};

export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: no user ID" });
    }

    const buffer = req.file.buffer;
    const originalName = req.file.originalname;

    const ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");

    const [user] = await db.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const curDate = new Date();
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, "0");
    const day = String(curDate.getDate()).padStart(2, "0");
    const hours = String(curDate.getHours()).padStart(2, "0");
    const minutes = String(curDate.getMinutes()).padStart(2, "0");
    const seconds = String(curDate.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const [result] = await db.query(
      "INSERT INTO history (user_id, title, audioUrl, uploadedAt, isMoMGenerated, source, data, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        originalName,
        ftpUrl,
        formattedDate,
        false,
        "Live Transcript Conversion",
        null,
        null,
      ]
    );

    res.status(200).json({
      message: "Audio uploaded successfully",
      id: result.insertId,
      userId,
      title: originalName,
      audioUrl: ftpUrl,
      isMoMGenerated: false,
      uploadedAt: formattedDate,
    });
  } catch (err) {
    console.error("Upload audio error:", err);
    res.status(500).json({
      message: "Server error while uploading audio",
      error: err.message,
    });
  }
};

export const getAllAudios = async (req, res) => {
  try {
    const userId = req.user.id;
    const [audios] = await db.query(
      "SELECT id, audioUrl, uploadedAt FROM user_audios WHERE userId = ? ORDER BY uploadedAt DESC",
      [userId]
    );

    res.status(200).json({
      message: "Audio files fetched successfully",
      audios,
    });
  } catch (err) {
    console.error("❌ [Get Audio Files] Error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching audio files" });
  }
};

export const deleteAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // First check if the record exists for this user
    const [audio] = await db.query(
      "SELECT audioUrl FROM history WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (audio.length === 0) {
      return res.status(404).json({ message: "Audio not found" });
    }

    const audioUrl = audio[0].audioUrl;

    // Now delete the record
    await db.query("DELETE FROM history WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    res.status(200).json({
      message: "Audio deleted successfully",
      id,
    });
  } catch (err) {
    console.error("❌ [Audio Delete] Error:", err);
    res.status(500).json({ message: "Server error while deleting audio" });
  }
};

export const updateAudioHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { data } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Missing history record ID" });
    }
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: no user ID" });
    }

    // Ensure record belongs to user
    const [existing] = await db.query(
      "SELECT id FROM history WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "History record not found" });
    }

    // Generate current timestamp
    const curDate = new Date();
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, "0");
    const day = String(curDate.getDate()).padStart(2, "0");
    const hours = String(curDate.getHours()).padStart(2, "0");
    const minutes = String(curDate.getMinutes()).padStart(2, "0");
    const seconds = String(curDate.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Update in one query since all fields always updated
    await db.query(
      "UPDATE history SET isMoMGenerated = ?, date = ?, data = ? WHERE id = ? AND user_id = ?",
      [1, formattedDate, data ? JSON.stringify(data) : null, id, userId]
    );

    res.status(200).json({ message: "History record updated successfully" });
  } catch (err) {
    console.error("Update history error:", err);
    res.status(500).json({
      message: "Server error while updating history",
      error: err.message,
    });
  }
};


