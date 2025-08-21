import db from "../config/db.js";

export const addHistory = async (req, res) => {
  try {
    const { source, date, data } = req.body;
    if (!source || !date || !data) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userId = req.user.id;
    await db.query(
      "INSERT INTO history (user_id, source, date, data) VALUES (?, ?, ?, ?)",
      [userId, source, date, data ? JSON.stringify(data) : null]
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
      "SELECT id, source, date, created_at, data FROM history WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
