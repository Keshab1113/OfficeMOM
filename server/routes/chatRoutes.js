const express = require("express");
const chatController = require("../controllers/chatController.js");

const router = express.Router();

// @desc    Send message to chatbot
// @route   POST /api/chat/message
// @access  Public
router.post("/message", chatController.sendMessage);

// @desc    Get chat history (optional)
// @route   GET /api/chat/history/:sessionId
// @access  Public
router.get("/history/:sessionId", chatController.getChatHistory);

// @desc    Health check for chat service
// @route   GET /api/chat/health
// @access  Public
router.get("/health", chatController.healthCheck);

module.exports = router;
