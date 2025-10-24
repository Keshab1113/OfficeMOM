const express = require("express");
const { getPlans } = require("../controllers/planController.js");

const router = express.Router();
router.get("/", getPlans);

module.exports = router;
