const express = require("express");
const multer = require("multer");
const sendMeetingEmail = require("../controllers/emailController.js");

const router = express.Router();
const upload = multer(); // In-memory storage

// Handle multipart/form-data (files + JSON)
router.post("/send-meeting-email", upload.array("files"), sendMeetingEmail);

module.exports = router;
