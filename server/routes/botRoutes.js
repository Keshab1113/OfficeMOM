const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController.js');

// @route   GET /api/bot/status
// @desc    Get bot status
// @access  Public
router.get('/status', botController.getBotStatus);

// @route   GET /api/bot/recordings
// @desc    Get all recordings
// @access  Public
router.get('/recordings', botController.getAllRecordings);

// @route   GET /api/bot/recordings/:meetingId
// @desc    Get recordings by meeting ID
// @access  Public
router.get('/recordings/:meetingId', botController.getRecordingsByMeetingId);

// @route   DELETE /api/bot/recordings/:id
// @desc    Delete recording
// @access  Public
router.delete('/recordings/:id', botController.deleteRecording);

module.exports = router;