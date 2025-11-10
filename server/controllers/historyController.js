const db = require("../config/db.js");
const { DateTime } = require("luxon");

const addHistory = async (req, res) => {
  try {
    const { source, date, data, title, language, audio_id } = req.body;

    if (!source || !date || !data) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userId = req.user.id;
    const isMoMGenerated = source !== "Live Transcript Conversion" ? 1 : 0;

    // 1️⃣ Insert into history table
    const [historyResult] = await db.query(
      `INSERT INTO history 
      (user_id, source, date, data, title, isMoMGenerated, language) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        source,
        date,
        JSON.stringify(data),
        title,
        isMoMGenerated,
        language,
      ]
    );

    // 2️⃣ Insert into transcript_audio_file table (if audioId is provided)
    if (audio_id) {
      await db.query(
        `INSERT INTO transcript_audio_file (audio_id, userId, transcript, language)
   VALUES (?, ?, ?, ?)`,
        [audio_id, userId, JSON.stringify(data), language]
      );
    }

    res
      .status(201)
      .json({ message: "History and transcript saved successfully" });
  } catch (err) {
    console.error("Add history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, source, date, created_at, data, title, isMoMGenerated, uploadedAt, audioUrl, language FROM history WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    const fixed = rows.map((r) => ({
      ...r,
      date: r.date ? DateTime.fromSQL(r.date, { zone: "utc" }).toISO() : null,
      created_at: r.created_at
        ? DateTime.fromSQL(r.created_at, { zone: "utc" }).toISO()
        : null,
      uploadedAt: r.uploadedAt
        ? DateTime.fromSQL(r.uploadedAt, { zone: "utc" }).toISO()
        : null,
    }));

    res.status(200).json(fixed);
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// const getMeetingAudios = async (req, res) => {
//   try {
//     const hostUserId = req.user.id;

//     // Fetch meetings where this user is the host
//     const [rows] = await db.query(
//       `
//       SELECT
//         m.id AS meetingId,
//         m.room_id AS roomId,
//         m.audio_url AS audioUrl,
//         m.duration_minutes AS duration,
//         m.created_at,
//         m.ended_at,
//         h.isMoMGenerated
//       FROM meetings m
//       LEFT JOIN history h
//         ON h.meeting_id = m.id
//         AND h.user_id = ?
//       WHERE
//         m.host_user_id = ?
//         AND m.audio_url IS NOT NULL
//         AND m.audio_url != ''
//         AND m.ended_at IS NOT NULL
//       ORDER BY m.created_at DESC
//       `,
//       [hostUserId, hostUserId]
//     );

//     // Filter out any invalid URLs
//     // Filter out any invalid URLs
//     // Filter out any invalid URLs and old entries without audio
//     const validRows = rows.filter((r) => {
//       // Skip if no audio URL
//       if (!r.audioUrl || r.audioUrl.trim() === "") {
//         return false;
//       }

//       // Check if URL is valid format
//       // Check if URL is valid format
//       try {
//         new URL(r.audioUrl);
//       } catch {
//         return false;
//       }

//       // Check if URL looks like it has proper file extension
//       if (!r.audioUrl.match(/\.(mp3|wav|webm|m4a|ogg)(\?.*)?$/i)) {
//         return false;
//       }
//       // Only include meetings that ended at least 5 seconds ago (to avoid fetching incomplete files)
//       if (r.ended_at) {
//         const endedDate = new Date(r.ended_at);
//         const now = new Date();
//         const secondsSinceEnd = (now - endedDate) / 1000;

//         if (secondsSinceEnd < 5) {
//           console.log(
//             `Meeting ${r.meetingId} ended too recently (${secondsSinceEnd}s ago), skipping`
//           );
//           return false;
//         }
//       }

//       return true;
//     });

//     // Format timestamps and add title
//     // Format timestamps and add title
//     // Format timestamps and add title (using native Date for simplicity)
//     const formatted = validRows.map((r) => {
//       // Convert MySQL dates to ISO strings
//       const createdAt = r.created_at
//         ? new Date(r.created_at).toISOString()
//         : null;
//       const endedAt = r.ended_at ? new Date(r.ended_at).toISOString() : null;

//       // Generate title from room_id
//       const title = `Meeting ${r.roomId.substring(0, 8)}`;

//       // Use ended_at for uploadedAt, fallback to created_at
//       const uploadedAt = endedAt || createdAt || new Date().toISOString();

//       return {
//         id: r.meetingId,
//         meetingId: r.meetingId,
//         roomId: r.roomId,
//         audioUrl: r.audioUrl,
//         duration: r.duration,
//         title: title,
//         uploadedAt: uploadedAt,
//         created_at: createdAt,
//         ended_at: endedAt,
//         isMoMGenerated: r.isMoMGenerated,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       count: formatted.length,
//       meetings: formatted,
//     });
//   } catch (err) {
//     console.error("❌ Get meeting audios error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const getMeetingAudios = async (req, res) => {
  try {
    const hostUserId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT 
        m.id AS meetingId,
        m.room_id AS roomId,
        m.title,
        m.audio_url AS audioUrl,
        m.duration_minutes AS duration,
        m.created_at,
        m.ended_at,
        h.isMoMGenerated
      FROM meetings m
      LEFT JOIN history h 
        ON h.meeting_id = m.id 
        AND h.user_id = ?
      WHERE 
        m.host_user_id = ? 
        AND m.audio_url IS NOT NULL
        AND m.audio_url != ''
        AND m.ended_at IS NOT NULL
        AND (h.isMoMGenerated = 0 OR h.isMoMGenerated IS NULL)
      ORDER BY m.created_at DESC
      `,
      [hostUserId, hostUserId]
    );

    // Filter invalid URLs
    const validRows = rows.filter((r) => {
      if (!r.audioUrl?.trim()) return false;
      try {
        new URL(r.audioUrl);
      } catch {
        return false;
      }
      if (!r.audioUrl.match(/\.(mp3|wav|webm|m4a|ogg)(\?.*)?$/i)) return false;

      if (r.ended_at) {
        const secondsSinceEnd =
          (new Date() - new Date(r.ended_at)) / 1000;
        if (secondsSinceEnd < 5) return false;
      }
      return true;
    });

    // 🧠 Generate title if missing and save it
    for (const row of validRows) {
      if (!row.title) {
        const newTitle = `Meeting ${row.roomId.substring(0, 8)}`;
        await db.query("UPDATE meetings SET title = ? WHERE id = ?", [
          newTitle,
          row.meetingId,
        ]);
        row.title = newTitle; // update in memory too
      }
    }

    // Format and send response
    const formatted = validRows.map((r) => ({
      id: r.meetingId,
      meetingId: r.meetingId,
      roomId: r.roomId,
      audioUrl: r.audioUrl,
       duration: parseFloat(r.duration) || 0,
      title: r.title, // now saved to DB
      uploadedAt: r.ended_at
        ? new Date(r.ended_at).toISOString()
        : new Date(r.created_at).toISOString(),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      ended_at: r.ended_at ? new Date(r.ended_at).toISOString() : null,
      isMoMGenerated: r.isMoMGenerated,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      meetings: formatted,
    });
  } catch (err) {
    console.error("❌ Get meeting audios error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateHistoryTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const [result] = await db.query(
      "UPDATE history SET title = ? WHERE id = ? AND user_id = ?",
      [title, id, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "History not found or unauthorized" });
    }

    res.status(200).json({ message: "History title updated successfully" });
  } catch (err) {
    console.error("Update history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [audio] = await db.query(
      "SELECT audioUrl FROM history WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (audio.length === 0) {
      return res.status(404).json({ message: "Audio not found" });
    }

    const audioUrl = audio[0].audioUrl;
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

const getUserHistoryStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [historyRows] = await db.execute(
      `
      SELECT 
        COUNT(*) as totalHistory,
        SUM(CASE WHEN source = 'Generate Notes Conversion' AND isMoMGenerated = 1 THEN 1 ELSE 0 END) as totalGeneratesNotes,
        SUM(CASE WHEN source = 'Online Meeting Conversion' AND isMoMGenerated = 1 THEN 1 ELSE 0 END) as totalOnlineMeeting,
        SUM(CASE WHEN source = 'Live Transcript Conversion' AND isMoMGenerated = 1 THEN 1 ELSE 0 END) as totalLiveMeeting
      FROM history 
      WHERE user_id = ? AND isMoMGenerated = 1 AND source IN ('Generate Notes Conversion', 'Online Meeting Conversion', 'Live Transcript Conversion')
    `,
      [userId]
    );

    const stats = historyRows[0];

    res.status(200).json({
      success: true,
      data: {
        totalHistory: parseInt(stats.totalHistory) || 0,
        totalGeneratesNotes: parseInt(stats.totalGeneratesNotes) || 0,
        totalOnlineMeeting: parseInt(stats.totalOnlineMeeting) || 0,
        totalLiveMeeting: parseInt(stats.totalLiveMeeting) || 0,
      },
      message: "History statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get user history stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching history statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  addHistory,
  getHistory,
  updateHistoryTitle,
  deleteHistory,
  getUserHistoryStats,
  getMeetingAudios,
};
