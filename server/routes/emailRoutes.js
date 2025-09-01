import express from "express";
import sendMeetingEmail from "../controllers/emailController.js";

const router = express.Router();

// Parse JSON input for email sending
router.post("/send-meeting-email", express.json(), sendMeetingEmail);


export default router;
