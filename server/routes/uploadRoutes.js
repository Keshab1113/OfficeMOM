const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadAudio } = require("../controllers/uploadController");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload-audio",
  authMiddleware,
  upload.single("audio"),
  uploadAudio
);

module.exports = router;