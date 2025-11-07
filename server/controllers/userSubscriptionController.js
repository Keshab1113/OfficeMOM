const db = require("../config/db.js");

const userSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user?.id; // from authMiddleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const [rows] = await db.execute(
      `SELECT 
    usd.id, 
    usd.user_id,
    usd.plan_id,
    usd.stripe_payment_id, 
    usd.total_minutes, 
    usd.total_remaining_time, 
    usd.total_used_time, 
    usd.created_at, 
    usd.updated_at, 
    usd.monthly_limit, 
    usd.monthly_used, 
    usd.monthly_remaining,
    usd.totalCreatedMoM,
    sp.plan_name,
    CASE 
      WHEN sp.plan_name = 'Professional' THEN 1
      WHEN sp.plan_name = 'Professional Plus' THEN 2
      WHEN sp.plan_name = 'Business' THEN 3
      WHEN sp.plan_name = 'Business Plus' THEN 4
      ELSE 0
    END AS plan_id
  FROM user_subscription_details AS usd
  LEFT JOIN stripe_payments AS sp 
    ON usd.stripe_payment_id = sp.id
  WHERE usd.user_id = ?`,
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
