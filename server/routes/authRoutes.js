import express from "express";
import {
  login,
  signup,
  verifyOtp,
  resendOtp,
  updateUserProfile,
  uploadProfilePicture,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import multer from "multer";

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

export default router;
