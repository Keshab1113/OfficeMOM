const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadAudio } = require("../controllers/uploadController");
const { uploadAudioToFTPOnly } = require("../controllers/uploadController");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload-audio",
  authMiddleware,
  upload.single("audio"),
  uploadAudio
);

router.post(
  "/upload-audio-ftp",
  authMiddleware,
  upload.single("audio"),
  uploadAudioToFTPOnly
);

module.exports = router;