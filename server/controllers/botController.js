const recordingService = require('../services/botRecordingService');
const botService = require('../services/botService');

const botController = {
  // Get all recordings
  async getAllRecordings(req, res) {
    try {
      const recordings = await recordingService.getAllRecordings();

      res.json({
        success: true,
        data: recordings
      });
    } catch (error) {
      console.error('Error fetching recordings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recordings',
        error: error.message
      });
    }
  },

  // Get recordings by meeting ID
  async getRecordingsByMeetingId(req, res) {
    try {
      const { meetingId } = req.params;
      const recordings = await recordingService.getRecordingsByMeetingId(meetingId);

      res.json({
        success: true,
        data: recordings
      });
    } catch (error) {
      console.error('Error fetching recordings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recordings',
        error: error.message
      });
    }
  },

  // Delete recording
  async deleteRecording(req, res) {
    try {
      const { id } = req.params;
      const deleted = await recordingService.deleteRecording(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Recording not found'
        });
      }

      res.json({
        success: true,
        message: 'Recording deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete recording',
        error: error.message
      });
    }
  },

  // Get bot status
  // In botController.js, update getBotStatus method:
async getBotStatus(req, res) {
  try {
    const activeMeetings = botService.getActiveMeetings();
    
    res.json({
      success: true,
      data: {
        isRecording: botService.isRecording,
        status: botService.isRecording ? 'recording' : 'idle',
        activeMeetings: activeMeetings,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bot status',
      error: error.message
    });
  }
}
};

module.exports = botController;