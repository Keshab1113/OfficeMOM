const express = require("express");
const { getUserLocation } = require("../controllers/locationController.js");

const router = express.Router();

router.get("/", getUserLocation);

module.exports = router;
