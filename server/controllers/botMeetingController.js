const db = require("../config/db.js");
const botService = require('../services/botService.js');

const meetingController = {
  // Schedule a new meeting
  async scheduleMeeting(req, res) {
    try {
      const { meetingLink, scheduledTime, meetingTitle, duration } = req.body;

      // Validate required fields
      if (!meetingLink || !scheduledTime || !meetingTitle) {
        return res.status(400).json({
          success: false,
          message: 'Meeting link, scheduled time, and title are required'
        });
      }

      
      const [result] = await db.execute(
        'INSERT INTO bot_meetings (meeting_link, meeting_title, scheduled_time, duration) VALUES (?, ?, ?, ?)',
        [meetingLink, meetingTitle, scheduledTime, duration || 60]
      );
      

      // Schedule the bot to join the meeting
      await botService.scheduleBotMeeting(result.insertId, meetingLink, scheduledTime, duration);

      res.status(201).json({
        success: true,
        message: 'Meeting scheduled successfully',
        data: {
          meetingId: result.insertId,
          meetingLink,
          meetingTitle,
          scheduledTime,
          duration
        }
      });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule meeting',
        error: error.message
      });
    }
  },

  // Get all meetings
  async getAllMeetings(req, res) {
    try {
      
      const [meetings] = await db.execute(`
        SELECT * FROM bot_meetings 
        ORDER BY scheduled_time DESC
      `);
      

      res.json({
        success: true,
        data: meetings
      });
    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch meetings',
        error: error.message
      });
    }
  },

  // Get meeting by ID
  async getMeetingById(req, res) {
    try {
      const { id } = req.params;
      
      
      const [meetings] = await db.execute(
        'SELECT * FROM bot_meetings WHERE id = ?',
        [id]
      );
      

      if (meetings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        data: meetings[0]
      });
    } catch (error) {
      console.error('Error fetching meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch meeting',
        error: error.message
      });
    }
  },

  // Update meeting
  async updateMeeting(req, res) {
    try {
      const { id } = req.params;
      const { meetingLink, meetingTitle, scheduledTime, duration } = req.body;

      
      const [result] = await db.execute(
        `UPDATE bot_meetings 
         SET meeting_link = ?, meeting_title = ?, scheduled_time = ?, duration = ?
         WHERE id = ?`,
        [meetingLink, meetingTitle, scheduledTime, duration, id]
      );
      

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        message: 'Meeting updated successfully'
      });
    } catch (error) {
      console.error('Error updating meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update meeting',
        error: error.message
      });
    }
  },

  // Delete meeting
  async deleteMeeting(req, res) {
    try {
      const { id } = req.params;

      
      const [result] = await db.execute(
        'DELETE FROM bot_meetings WHERE id = ?',
        [id]
      );
      

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        message: 'Meeting deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete meeting',
        error: error.message
      });
    }
  }
};

module.exports = meetingController;