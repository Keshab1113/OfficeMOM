  const fs = require("fs");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db.js");
const uploadToFTP = require("../config/uploadToFTP.js");

const ASSEMBLY_KEY = process.env.ASSEMBLYAI_API_KEY;
const UPLOAD_URL = process.env.ASSEMBLYAI_API_UPLOAD_URL;
const TRANSCRIPT_URL = process.env.ASSEMBLYAI_API_TRANSCRIPT_URL;

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
    { audio_url: audioUrl, language_detection: true,speaker_labels: true },
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

const transcribeAudio = async (req, res) => {
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

    res.json({
      text: result.text,
      full: result,
      language: result.language_code,
    });
  } catch (err) {
    console.error(err);
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: err.message || "Server error" });
  }
};
const transcribeAudioFromURL = async (req, res) => {
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

const createMeeting = async (req, res) => {
  const room_id = uuidv4();
  const [r] = await db.query(
    "INSERT INTO meetings (room_id, host_user_id) VALUES (?,?)",
    [room_id, req.user.id]
  );
  res.json({ roomId: room_id, meetingId: r.insertId });
};

const endMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const { audioUrl, durationMinutes } = req.body;
  await db.query(
    'UPDATE meetings SET status="ended", ended_at=NOW() WHERE room_id=?',
    [meetingId]
  );
  res.json({ ok: true });
};

 

// ✅ Get the latest meeting record for a given meetingId (room_id)
const getLatestMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const hostUserId = req.user?.id; // ✅ extracted from authMiddleware

    // Fetch the most recent meeting record for this room_id
    const [rows] = await db.query(
      `SELECT * FROM meetings 
       WHERE room_id = ? AND host_user_id = ? 
       ORDER BY id DESC LIMIT 1`,
      [meetingId, hostUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Meeting not found for this user" });
    }

    const latestMeeting = rows[0];

    // 🔥 NEW: Fetch the associated history_id from history table
    const [historyRows] = await db.query(
      `SELECT id FROM history 
       WHERE user_id = ? AND audioUrl = ? 
       ORDER BY id DESC LIMIT 1`,
      [hostUserId, latestMeeting.audio_url]
    );

    // Add history_id to the response
    const historyId = historyRows.length > 0 ? historyRows[0].id : null;

    res.json({
      success: true,
      latestMeeting: {
        ...latestMeeting,
        history_id: historyId, // 🔥 Include history_id in response
      },
    });
  } catch (error) {
    console.error("❌ Error fetching latest meeting:", error);
    res.status(500).json({ message: "Server error fetching latest meeting" });
  }
};

// ✅ Get meeting details (audio_url + duration + status) by meetingId for logged-in host
const getMeetingDetails = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const hostUserId = req.user?.id;

    const [rows] = await db.query(
      `SELECT id, room_id, audio_url, duration_minutes, status, created_at, ended_at
       FROM meetings
       WHERE room_id = ? AND host_user_id = ?
       ORDER BY id DESC LIMIT 1`,
      [meetingId, hostUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Meeting not found for this user" });
    }

    const meeting = rows[0];

    // ✅ If meeting is ended, reactivate it
    if (meeting.status === "ended") {
      await db.query(
        `UPDATE meetings 
         SET status = 'active', ended_at = NULL 
         WHERE id = ?`,
        [meeting.id]
      );
      console.log(`🔄 Meeting ${meeting.room_id} reactivated for host ${hostUserId}`);
      meeting.status = "active";
      meeting.ended_at = null;
    }

    return res.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error("❌ Error fetching meeting details:", error);
    return res.status(500).json({ success: false, message: "Server error fetching meeting details" });
  }
};


const updateMeetingTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title required" });
    }

    const [result] = await db.query(
      `UPDATE meetings SET title = ? WHERE id = ? AND host_user_id = ?`,
      [title.trim(), id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    res.json({ success: true, message: "Title updated successfully" });
  } catch (err) {
    console.error("❌ Error updating title:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getAllAudios = async (req, res) => {
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

// const deleteAudio = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { id } = req.params;

//     // First check if the record exists for this user
//     const [audio] = await db.query(
//       "SELECT audioUrl FROM history WHERE id = ? AND user_id = ?",
//       [id, userId]
//     );

//     if (audio.length === 0) {
//       return res.status(404).json({ message: "Audio not found" });
//     }

//     const audioUrl = audio[0].audioUrl;

//     // Now delete the record
//     await db.query("DELETE FROM history WHERE id = ? AND user_id = ?", [
//       id,
//       userId,
//     ]);

//     res.status(200).json({
//       message: "Audio deleted successfully",
//       id,
//     });
//   } catch (err) {
//     console.error("❌ [Audio Delete] Error:", err);
//     res.status(500).json({ message: "Server error while deleting audio" });
//   }
// };

const deleteAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 🧩 Step 1: Check if the meeting exists for this user
    const [meeting] = await db.query(
      "SELECT audio_url FROM meetings WHERE id = ? AND host_user_id = ?",
      [id, userId]
    );

    if (meeting.length === 0) {
      return res.status(404).json({ message: "Meeting not found or unauthorized" });
    }

    const audioUrl = meeting[0].audio_url;

    // 🧩 Step 2: Delete the meeting record
    await db.query("DELETE FROM meetings WHERE id = ? AND host_user_id = ?", [
      id,
      userId,
    ]);

    res.status(200).json({
      success: true,
      message: "Audio deleted successfully from meetings table",
      deletedMeetingId: id,
      audioUrl,
    });
  } catch (err) {
    console.error("❌ [Audio Delete] Error:", err);
    res.status(500).json({ message: "Server error while deleting meeting audio" });
  }
};


const updateAudioHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { data, audio_id, language } = req.body;

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
      "UPDATE history SET isMoMGenerated = ?, date = ?, data = ?, language = ? WHERE id = ? AND user_id = ?",
      [1, formattedDate, data ? JSON.stringify(data) : null,language, id, userId]
    );

    if (audio_id) {
      await db.query(
        `INSERT INTO transcript_audio_file (audio_id, userId, transcript, language)
       VALUES (?, ?, ?, ?)`,
        [audio_id, userId, JSON.stringify(data), language]
      );
    }

    res.status(200).json({ message: "History record updated successfully" });
  } catch (err) {
    console.error("Update history error:", err);
    res.status(500).json({
      message: "Server error while updating history",
      error: err.message,
    });
  }
};

module.exports = {
  updateAudioHistory,
  deleteAudio,
  getAllAudios,
  endMeeting,
  createMeeting,
  transcribeAudioFromURL,
  transcribeAudio,
  getLatestMeeting,
  getMeetingDetails,
  updateMeetingTitle,
};
