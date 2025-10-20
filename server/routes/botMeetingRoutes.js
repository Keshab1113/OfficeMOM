const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/botMeetingController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');

router.post('/', authMiddleware, meetingController.scheduleMeeting);
router.get('/', authMiddleware, meetingController.getAllMeetings);
router.get('/:id', authMiddleware, meetingController.getMeetingById);
router.put('/:id', authMiddleware, meetingController.updateMeeting);
router.delete('/:id', authMiddleware, meetingController.deleteMeeting);

module.exports = router;