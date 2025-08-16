import express from "express";
import multer from "multer";
import sendMeetingEmail from "../controllers/emailController.js";

const router = express.Router();
const upload = multer();

router.post("/send-meeting-email", upload.single("file"), sendMeetingEmail);

export default router;
