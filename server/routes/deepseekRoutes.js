const express = require("express");
const { processTranscript } = require("../controllers/deepseekController.js");

const router = express.Router();

router.post("/process", processTranscript);

module.exports = router;