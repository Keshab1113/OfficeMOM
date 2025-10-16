const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { userSubscriptionDetails } = require("../controllers/userSubscriptionController.js");

const router = express.Router();
router.get("/",authMiddleware, userSubscriptionDetails);

module.exports = router;