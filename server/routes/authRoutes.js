const express = require("express");
const {
  login,
  signup,
  verifyOtp,
  resendOtp,
  updateUserProfile,
  uploadProfilePicture,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  resetPasswordWithoutOtp,
} = require("../controllers/authController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const multer = require("multer");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");

const upload = multer();
const router = express.Router();
require("../config/passport");

router.post("/signup", signup);
router.post("/login", login);
router.put("/update-user", authMiddleware, updateUserProfile);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post(
  "/upload-profile-picture",
  authMiddleware,
  upload.single("profilePic"),
  uploadProfilePicture
);
router.post("/forgot-password/send-otp", sendPasswordResetOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);
router.put("/forgot-password/reset-without-otp", resetPasswordWithoutOtp);




// Google routes (existing)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  async (req, res) => {
    try {
      if (!req.user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);

      const user = req.user;

      // Check subscription
      const [subscription] = await db.query(
        "SELECT * FROM user_subscription_details WHERE user_id = ?",
        [user.id]
      );

      let userSub = subscription[0];

      // Create default if missing
      if (!userSub) {
        await db.execute(
          `INSERT INTO user_subscription_details 
            (user_id, stripe_payment_id, total_minutes, total_remaining_time, total_used_time, monthly_limit, monthly_used, monthly_remaining) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, null, 300, 300, 0, 0, 0, 0]
        );
        userSub = { total_remaining_time: 300, total_used_time: 0 };
        console.log(`✅ Created default subscription for Google OAuth user ${user.id}`);
      }

      // Query total created MoMs count (assuming table transcript_audio_file stores them)
      const [momCount] = await db.query(
        "SELECT COUNT(*) AS totalCreatedMoMs FROM history WHERE user_id = ?",
        [user.id]
      );

      const totalCreatedMoMs = momCount[0]?.totalCreatedMoMs || 0;

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15d" });

      const redirectURL = `${process.env.FRONTEND_URL}/oauth-success?token=${token}&id=${user.id}&name=${encodeURIComponent(
        user.fullName
      )}&email=${encodeURIComponent(user.email)}&profilePic=${encodeURIComponent(
        user.profilePic || ""
      )}&totalRemainingTime=${userSub.total_remaining_time || 0}&totalTimes=${userSub.total_minutes || 0}&totalCreatedMoMs=${totalCreatedMoMs}`;

      return res.redirect(redirectURL);
    } catch (error) {
      console.error("❌ Google Auth Error:", error.message);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
  }
);


// Facebook routes (updated)
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email", "public_profile"], // Try requesting email again
  })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    console.log("✅ Facebook callback hit, user:", req.user);
    try {
      if (!req.user) {
        console.error("❌ No user returned from Facebook Strategy");
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }

      const user = req.user;

      // Check if user already has a subscription
      const [subscription] = await db.query(
        "SELECT id FROM user_subscription_details WHERE user_id = ?",
        [user.id]
      );

      // If no subscription exists, create one
      if (subscription.length === 0) {
        await db.execute(
          `INSERT INTO user_subscription_details 
            (user_id, stripe_payment_id, total_minutes, total_remaining_time, total_used_time, monthly_limit, monthly_used, monthly_remaining) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, null, 300, 300, 0, 0, 0, 0]
        );
        console.log(`✅ Created default subscription for Facebook OAuth user ${user.id}`);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15d" }
      );

      const redirectURL = `${process.env.FRONTEND_URL}/oauth-success?token=${token}&id=${user.id}&name=${encodeURIComponent(
        user.fullName
      )}&email=${encodeURIComponent(user.email)}&profilePic=${encodeURIComponent(user.profilePic || "")}`;

      console.log("➡️ Redirecting to:", redirectURL);
      return res.redirect(redirectURL);
    } catch (error) {
      console.error("❌ Facebook Auth Error:", error.message);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`);
    }
  }
);
router.get("/facebook/health", (req, res) => {
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    res.status(200).json({ status: "available" });
  } else {
    res.status(503).json({ status: "unavailable" });
  }
});

module.exports = router;