const express = require("express");
const {
  createCheckoutSession,
  handlePaymentSuccess,
  getBillingHistory,
  getSubscriptionDetails,
  cancelSubscription,
} = require("../controllers/stripeController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/create-checkout-session", authMiddleware, createCheckoutSession);
router.get("/payment-success", authMiddleware, handlePaymentSuccess);
router.get("/billing-history", authMiddleware, getBillingHistory);
router.get("/subscription-details", authMiddleware, getSubscriptionDetails);
router.post("/cancel-subscription", authMiddleware, cancelSubscription);

module.exports = router;
