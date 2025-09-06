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
} = require("../controllers/authController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const multer = require("multer");

const upload = multer();
const router = express.Router();

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

module.exports = router;
