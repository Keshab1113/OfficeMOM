const db = require("../config/db.js");

class RecordingService {
  async getRecordingsByMeetingId(meetingId) {
    try {
      
      const [recordings] = await db.execute(
        'SELECT * FROM bot_recordings WHERE meeting_id = ? ORDER BY created_at DESC',
        [meetingId]
      );
      
      return recordings;
    } catch (error) {
      console.error('Error fetching recordings:', error);
      throw error;
    }
  }

  async getAllRecordings() {
    try {
      
      const [recordings] = await db.execute(`
        SELECT r.*, m.meeting_title, m.meeting_link 
        FROM bot_recordings r 
        JOIN bot_meetings m ON r.meeting_id = m.id 
        ORDER BY r.created_at DESC
      `);
      
      return recordings;
    } catch (error) {
      console.error('Error fetching all recordings:', error);
      throw error;
    }
  }

  async deleteRecording(recordingId) {
    try {
      
      const [result] = await db.execute(
        'DELETE FROM bot_recordings WHERE id = ?',
        [recordingId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }
}

module.exports = new RecordingService();