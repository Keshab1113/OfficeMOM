const express = require("express");
const { getPlans } = require("../controllers/planController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

const router = express.Router();
router.get("/plans", getPlans);

module.exports = router;
