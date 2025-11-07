const express = require("express");
const {
  createCheckoutSession,
  handlePaymentSuccess,
  getBillingHistory,
  getSubscriptionDetails,
  cancelSubscription,
  createRechargeSession,
  getUserMinutes,
} = require("../controllers/stripeController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Authenticated routes
router.post("/create-checkout-session", authMiddleware, createCheckoutSession);
router.get("/payment-success", authMiddleware, handlePaymentSuccess);
router.get("/billing-history", authMiddleware, getBillingHistory);
router.get("/subscription-details", authMiddleware, getSubscriptionDetails);
router.post("/cancel-subscription", authMiddleware, cancelSubscription);

// Recharge
router.post("/create-recharge-session", authMiddleware, createRechargeSession);
router.get("/user-minutes", authMiddleware, getUserMinutes);

module.exports = router;
