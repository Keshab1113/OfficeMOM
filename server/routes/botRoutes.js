const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');
router.get('/status', authMiddleware, botController.getBotStatus);

// @route   GET /api/bot/recordings
// @desc    Get all recordings
// @access  Public
router.get('/recordings', authMiddleware, botController.getAllRecordings);

// @route   GET /api/bot/recordings/:meetingId
// @desc    Get recordings by meeting ID
// @access  Public
router.get('/recordings/:meetingId', authMiddleware, botController.getRecordingsByMeetingId);

// @route   DELETE /api/bot/recordings/:id
// @desc    Delete recording
// @access  Public
router.delete('/recordings/:id', authMiddleware, botController.deleteRecording);

module.exports = router;