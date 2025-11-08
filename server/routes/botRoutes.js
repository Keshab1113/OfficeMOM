const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');
router.get('/status', authMiddleware, botController.getBotStatus);


router.get('/recordings', authMiddleware, botController.getAllRecordings);
router.get('/recordings/:meetingId', authMiddleware, botController.getRecordingsByMeetingId);
router.delete('/recordings/:id', authMiddleware, botController.deleteRecording);

module.exports = router;