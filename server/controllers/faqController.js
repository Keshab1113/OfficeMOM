const db = require("../config/db.js");

const getFAQsByPage = async (req, res) => {
  try {
    const { pageType } = req.params;
    
    // Validate pageType
    const validPageTypes = ['mainPage', 'planPage'];
    if (!validPageTypes.includes(pageType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page type. Use "mainPage" or "planPage"'
      });
    }


    const [rows] = await db.execute(`
      SELECT 
        id,
        question,
        answer,
        category,
        need_for as needFor,
        display_order as displayOrder,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM faqs 
      WHERE need_for = ? AND is_active = TRUE
      ORDER BY display_order ASC
    `, [pageType]);

    res.json({
      success: true,
      data: rows,
      message: `FAQs for ${pageType} retrieved successfully`
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching FAQs',
      error: error.message
    });
  }
};

module.exports = {
  getFAQsByPage
};