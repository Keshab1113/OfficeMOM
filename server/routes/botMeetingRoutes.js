const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/botMeetingController.js');

// @route   POST /api/meetings
// @desc    Schedule a new meeting
// @access  Public
router.post('/', meetingController.scheduleMeeting);

// @route   GET /api/meetings
// @desc    Get all meetings
// @access  Public
router.get('/', meetingController.getAllMeetings);

// @route   GET /api/meetings/:id
// @desc    Get meeting by ID
// @access  Public
router.get('/:id', meetingController.getMeetingById);

// @route   PUT /api/meetings/:id
// @desc    Update meeting
// @access  Public
router.put('/:id', meetingController.updateMeeting);

// @route   DELETE /api/meetings/:id
// @desc    Delete meeting
// @access  Public
router.delete('/:id', meetingController.deleteMeeting);

module.exports = router;