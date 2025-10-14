const express = require("express");
const multer = require("multer");
const { processDrive } = require("../controllers/driveController.js");

const upload = multer();
const router = express.Router();

router.post("/", upload.none(), processDrive);

module.exports = router;
