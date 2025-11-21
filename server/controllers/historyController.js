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
      "SELECT id,is_viewed, source, date, created_at, data, title, isMoMGenerated, uploadedAt, audioUrl, language FROM history WHERE user_id = ? ORDER BY created_at DESC",
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

const getMeetingAudios = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
          id,
          meeting_id,
          title,
          audioUrl,
          created_at,
          uploadedAt
       FROM history
       WHERE user_id = ? 
         AND audioUrl IS NOT NULL
         AND source = 'Live Transcript Conversion'
       ORDER BY created_at DESC`,
      [userId]
    );

    const formatted = rows.map((r) => ({
      ...r,
      created_at: r.created_at
        ? DateTime.fromSQL(r.created_at, { zone: "utc" }).toISO()
        : null,
      uploadedAt: r.uploadedAt
        ? DateTime.fromSQL(r.uploadedAt, { zone: "utc" }).toISO()
        : null,
    }));

    res.status(200).json({ meetings: formatted });
  } catch (err) {
    console.error("Get meeting audios error:", err);
    res.status(500).json({ message: "Server error" });
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

const markAsViewed = async (req, res) => {
  try {
    const { id: historyId } = req.params;
    const userId = req.user.id;

    console.log(`Marking history ${historyId} as viewed for user ${userId}`);

    const [result] = await db.query(
      `UPDATE history SET is_viewed = 1 WHERE id = ? AND user_id = ?`,
      [historyId, userId]
    );

    console.log(`Update result:`, result);

    if (result.affectedRows === 0) {
      console.log(`No rows affected - record may not exist or already be viewed`);
      return res.status(404).json({
        success: false,
        message: "History record not found or already viewed"
      });
    }

    console.log(`Successfully updated ${result.affectedRows} row(s)`);
    res.json({
      success: true,
      message: "Marked as viewed"
    });
  } catch (error) {
    console.error("Error marking as viewed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark as viewed"
    });
  }
}

module.exports = {
  addHistory,
  getHistory,
  updateHistoryTitle,
  deleteHistory,
  getUserHistoryStats,
  getMeetingAudios,
  markAsViewed,
};
