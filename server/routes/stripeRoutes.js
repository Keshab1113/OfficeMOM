const express = require("express");
const axios = require("axios");
const { createCheckoutSession } = require("../controllers/stripeController");
const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);

module.exports = router;