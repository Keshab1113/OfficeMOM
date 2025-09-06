const express = require("express");
const createContact = require("../controllers/contactController.js");

const router = express.Router();

router.post("/", createContact);

module.exports = router;
