const express = require("express");
const { getFAQsByPage } = require("../controllers/faqController.js");
const router = express.Router();

// Public routes
router.get('/faq/:pageType', getFAQsByPage);

module.exports = router;