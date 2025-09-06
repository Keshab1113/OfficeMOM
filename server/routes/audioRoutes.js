const express = require("express");
const multer = require("multer");
const { processAudio } = require("../controllers/audioController.js");


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/process-audio", upload.single("audio"), processAudio);

module.exports = router;
