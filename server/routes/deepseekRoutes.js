const express = require("express");
const { processTranscript } = require("../controllers/deepseekController.js");

const router = express.Router();

router.post("/", processTranscript);

module.exports = router;