import express from "express";
import { login, signup, verifyOtp, resendOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login",login);
router.post("/verify-otp",verifyOtp);
router.post("/resend-otp",resendOtp);

export default router;
