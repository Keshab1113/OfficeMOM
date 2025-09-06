const express = require("express");
const {
  addHistory,
  getHistory,
  updateHistoryTitle,
  deleteHistory,
} = require("../controllers/historyController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/", authMiddleware, addHistory);
router.get("/", authMiddleware, getHistory);
router.put("/:id", authMiddleware, updateHistoryTitle);
router.delete("/:id", authMiddleware, deleteHistory);

module.exports = router;
