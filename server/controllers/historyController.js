import db from "../config/db.js";

export const addHistory = async (req, res) => {
  try {
    const { source, date, data, title, language } = req.body;
    if (!source || !date || !data) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const userId = req.user.id;
    const isMoMGenerated = source !== "Live Transcript Conversion" ? 1 : 0;
    await db.query(
      "INSERT INTO history (user_id, source, date, data, title, isMoMGenerated, language) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, source, date, data ? JSON.stringify(data) : null, title, isMoMGenerated, language]
    );
    res.status(201).json({ message: "History added successfully" });
  } catch (err) {
    console.error("Add history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, source, date, created_at, data, title, isMoMGenerated, uploadedAt, audioUrl, language FROM history WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateHistoryTitle = async (req, res) => {
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

export const deleteHistory = async (req, res) => {
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
