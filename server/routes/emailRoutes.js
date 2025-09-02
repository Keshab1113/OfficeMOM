import express from "express";
import multer from "multer";
import sendMeetingEmail from "../controllers/emailController.js";

const router = express.Router();
const upload = multer(); // In-memory storage

// Handle multipart/form-data (files + JSON)
router.post("/send-meeting-email", upload.array("files"), sendMeetingEmail);

export default router;
