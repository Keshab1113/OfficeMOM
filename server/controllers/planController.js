const db = require("../config/db.js");

const getPlans = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        name,
        price,
        priceID,
        yearly_priceID,
        yearly_price as yearlyPrice,
        monthly_minutes as monthlyMinutes,
        description,
        features,
        button_text as buttonText,
        is_highlighted as isHighlighted,
        is_popular as isPopular,
        extra_minute_cost as extraMinuteCost,
        requires_recharge as requiresRecharge,
        per_file_minutes_limit as perFileMinutesLimit,
        per_meeting_minutes_limit as perMeetingMinutesLimit,
        total_lifetime_minutes as totalLifetimeMinutes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM plans 
      ORDER BY id ASC
    `);

    // Parse JSON features if they're stored as JSON string
    const plans = rows.map(plan => {
      if (typeof plan.features === 'string') {
        try {
          plan.features = JSON.parse(plan.features);
        } catch (error) {
          plan.features = [];
        }
      }
      return plan;
    });

    res.json({
      success: true,
      data: plans,
      message: 'Plans retrieved successfully'
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching plans',
      error: error.message
    });
  }
};

module.exports = {
  getPlans
};