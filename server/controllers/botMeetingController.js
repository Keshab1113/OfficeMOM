const db = require("../config/db.js");
const botService = require('../services/botService.js');

const meetingController = {
  // Schedule a new meeting
  async scheduleMeeting(req, res) {
    // Set longer timeout for this endpoint
    req.setTimeout(30000); // 30 seconds
    
    try {
      const { meetingLink, scheduledTime, meetingTitle, duration, participants, joinUntilEnd } = req.body;
      const userId = req.user?.id;

      // Validate required fields
      if (!meetingLink || !scheduledTime || !meetingTitle) {
        return res.status(400).json({
          success: false,
          message: 'Meeting link, scheduled time, and title are required'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: user ID missing'
        });
      }

      // Validate meeting link format
      try {
        new URL(meetingLink);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid meeting link format'
        });
      }

      // Validate scheduled time is in the future
      const scheduled = new Date(scheduledTime);
      const now = new Date();
      if (scheduled <= now) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be in the future'
        });
      }

      // Use user's name as default if participants field is empty
      const botDisplayName = participants || req.user?.name || 'Recording Bot';

      console.log('📅 Scheduling meeting for user:', userId);
      console.log('🕐 Scheduled time:', scheduledTime);

      // Insert into DB with user_id and new fields
      const [result] = await db.execute(
        `INSERT INTO bot_meetings 
         (user_id, meeting_link, meeting_title, scheduled_time, duration, participants, join_until_end) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, meetingLink, meetingTitle, scheduledTime, duration || 60, botDisplayName, joinUntilEnd || false]
      );

      console.log('✅ Meeting saved to database with ID:', result.insertId);

      // Schedule bot with the bot display name
      await botService.scheduleBotMeeting(
        result.insertId, 
        meetingLink, 
        scheduledTime, 
        duration,
        joinUntilEnd,
        botDisplayName
      );

      console.log('✅ Bot scheduled successfully');

      res.status(201).json({
        success: true,
        message: 'Meeting scheduled successfully',
        data: {
          meetingId: result.insertId,
          userId,
          meetingLink,
          meetingTitle,
          scheduledTime,
          duration,
          participants: botDisplayName,
          joinUntilEnd
        }
      });

    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      
      // Specific error handling
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'Database connection failed. Please try again.'
        });
      }
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'A meeting with these details already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to schedule meeting',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get all meetings for the logged-in user
  async getAllMeetings(req, res) {
    try {
      const userId = req.user?.id;

      const [meetings] = await db.execute(
        `SELECT * FROM bot_meetings 
         WHERE user_id = ? 
         ORDER BY scheduled_time DESC`,
        [userId]
      );

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

  // Get a specific meeting by ID (only if it belongs to user)
  async getMeetingById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const [meetings] = await db.execute(
        'SELECT * FROM bot_meetings WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (meetings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found or not accessible'
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
      const { meetingLink, meetingTitle, scheduledTime, duration, participants, joinUntilEnd } = req.body;
      const userId = req.user?.id;

      const [result] = await db.execute(
        `UPDATE bot_meetings 
         SET meeting_link = ?, meeting_title = ?, scheduled_time = ?, duration = ?, participants = ?, join_until_end = ?
         WHERE id = ? AND user_id = ?`,
        [meetingLink, meetingTitle, scheduledTime, duration, participants, joinUntilEnd, id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found or not accessible'
        });
      }

      // Reschedule bot if needed
      await botService.rescheduleBotMeeting(id, meetingLink, scheduledTime, duration, joinUntilEnd);

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
      const userId = req.user?.id;

      const [result] = await db.execute(
        'DELETE FROM bot_meetings WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found or not accessible'
        });
      }

      // Cancel bot scheduling
      await botService.cancelBotMeeting(id);

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
  },

  // Get bot status
  async getBotStatus(req, res) {
    try {
      const botStatus = botService.getBotStatus();
      res.json({
        success: true,
        data: {
          status: botStatus
        }
      });
    } catch (error) {
      console.error('Error fetching bot status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bot status',
        error: error.message
      });
    }
  }
};

module.exports = meetingController;