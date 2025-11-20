const express = require("express");
const multer = require("multer");
const emailController = require("../controllers/emailController");

const router = express.Router();
const upload = multer(); // In-memory storage

// Handle multipart/form-data (files + JSON)
router.post("/", upload.array("files"), emailController.sendMeetingEmail);

module.exports = router;
