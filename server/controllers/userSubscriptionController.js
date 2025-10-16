const db = require("../config/db.js");

const userSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user?.id; // from authMiddleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const [rows] = await db.execute(
      `SELECT 
        id, 
        user_id, 
        stripe_payment_id, 
        total_minutes, 
        total_remaining_time, 
        total_used_time, 
        created_at, 
        updated_at, 
        monthly_limit, 
        monthly_used, 
        monthly_remaining,
        totalCreatedMoM 
      FROM user_subscription_details 
      WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No subscription found" });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Error fetching subscription details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  userSubscriptionDetails,
};
