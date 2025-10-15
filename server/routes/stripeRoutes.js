const express = require("express");
const axios = require("axios");
const { createCheckoutSession, handlePaymentSuccess, getBillingHistory } = require("../controllers/stripeController");
const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.get("/payment-success", handlePaymentSuccess);
router.get("/billing-history", getBillingHistory);

module.exports = router;