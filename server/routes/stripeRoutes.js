const express = require("express");
const {
  createCheckoutSession,
  handlePaymentSuccess,
  getBillingHistory,
  getSubscriptionDetails,
  cancelSubscription,
  handleStripeWebhook, // Add the webhook handler
} = require("../controllers/stripeController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// 🔹 WEBHOOK ROUTE - Must be before body parser and without auth middleware
// This should be mounted before any express.json() middleware in your main app file
// Alternatively, you can handle it in your main app.js file

// 🔹 PROTECTED ROUTES (require authentication)
router.post("/create-checkout-session", authMiddleware, createCheckoutSession);
router.get("/payment-success", authMiddleware, handlePaymentSuccess);
router.get("/billing-history", authMiddleware, getBillingHistory);
router.get("/subscription-details", authMiddleware, getSubscriptionDetails);
router.post("/cancel-subscription", authMiddleware, cancelSubscription);

module.exports = router;