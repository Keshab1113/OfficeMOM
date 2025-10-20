const db = require("../config/db.js");
const uploadToFTP = require("../config/uploadToFTP.js");

class BotService {
  constructor() {
    this.isRecording = false;
    this.recordedChunks = [];
  }

  async joinMeeting(meetingLink, meetingId) {
    try {
      console.log(`🤖 Bot joining meeting: ${meetingLink}`);
      
      // Update meeting status to 'joined'
      await this.updateMeetingStatus(meetingId, 'joined');

      // Simulate joining process (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.startRecording(meetingId);
      
      return true;
    } catch (error) {
      console.error('❌ Error joining meeting:', error);
      await this.updateMeetingStatus(meetingId, 'failed');
      return false;
    }
  }

  async startRecording(meetingId) {
    try {
      console.log('🎙️ Starting recording...');
      
      // Update meeting status to 'recording'
      await this.updateMeetingStatus(meetingId, 'recording');
      this.isRecording = true;

      // Get meeting duration and title
      const [meetings] = await db.execute(
        'SELECT duration, meeting_title FROM bot_meetings WHERE id = ?',
        [meetingId]
      );

      const duration = meetings[0]?.duration || 60;
      const meetingTitle = meetings[0]?.meeting_title || 'meeting';
      const recordingDuration = Math.min(duration * 60 * 1000, 300000); // Max 5 minutes for demo

      // Simulate recording process - in real implementation, this would capture actual audio
      console.log(`⏺️ Recording simulation started for meeting: ${meetingTitle}`);
      
      // Simulate collecting audio chunks (in real app, this would be from audio stream)
      this.recordedChunks = [];
      const simulatedChunk = Buffer.from('simulated_audio_data_' + Date.now());
      this.recordedChunks.push(simulatedChunk);

      setTimeout(async () => {
        await this.stopRecording(meetingId, meetingTitle);
      }, recordingDuration);

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      await this.updateMeetingStatus(meetingId, 'failed');
    }
  }

  async stopRecording(meetingId, meetingTitle) {
    try {
      console.log('⏹️ Stopping recording...');
      this.isRecording = false;

      // Generate audio buffer (in real implementation, combine recorded chunks)
      const audioBuffer = this.generateMockAudioBuffer(meetingTitle);
      
      // Upload to FTP
      console.log('📤 Uploading recording to FTP...');
      const fileName = `meeting_${meetingId}_${Date.now()}.mp3`;
      const ftpUrl = await uploadToFTP(audioBuffer, fileName, 'recordings');

      console.log('✅ Recording uploaded to FTP:', ftpUrl);

      // Update meeting status and recording path with FTP URL
      await db.execute(
        'UPDATE bot_meetings SET status = ?, recording_path = ? WHERE id = ?',
        ['completed', ftpUrl, meetingId]
      );

      // Save recording info with FTP URL
      await db.execute(
        'INSERT INTO bot_recordings (meeting_id, file_path, file_size, duration) VALUES (?, ?, ?, ?)',
        [meetingId, ftpUrl, audioBuffer.length, 300] // Example duration
      );

      // Log successful recording
      await this.logBotAction(meetingId, 'recording_stopped', 'Recording completed and uploaded to FTP', {
        ftpUrl: ftpUrl,
        fileSize: audioBuffer.length,
        meetingId: meetingId
      });

      console.log('✅ Recording completed and saved to database');

    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      await this.updateMeetingStatus(meetingId, 'failed');
      await this.logBotAction(meetingId, 'error', 'Failed to upload recording to FTP', {
        error: error.message,
        meetingId: meetingId
      });
    } finally {
      this.recordedChunks = [];
    }
  }

  // Generate mock audio buffer for simulation
  generateMockAudioBuffer(meetingTitle) {
    const mockData = `Mock audio data for meeting: ${meetingTitle} - Recorded at: ${new Date().toISOString()}`;
    return Buffer.from(mockData);
  }

  async updateMeetingStatus(meetingId, status) {
    try {
      await db.execute(
        'UPDATE bot_meetings SET status = ? WHERE id = ?',
        [status, meetingId]
      );
      
      // Log status change
      await this.logBotAction(meetingId, status, `Meeting status changed to ${status}`);
    } catch (error) {
      console.error('❌ Error updating meeting status:', error);
      throw error;
    }
  }

  async logBotAction(meetingId, action, message, details = {}) {
    try {
      await db.execute(
        'INSERT INTO bot_logs (meeting_id, action, message, details) VALUES (?, ?, ?, ?)',
        [meetingId, action, message, JSON.stringify(details)]
      );
    } catch (error) {
      console.error('❌ Error logging bot action:', error);
    }
  }

  async scheduleBotMeeting(meetingId, meetingLink, scheduledTime, duration) {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const delay = scheduled.getTime() - now.getTime();

    // Log scheduling
    await this.logBotAction(meetingId, 'scheduled', 'Meeting scheduled for bot', {
      scheduledTime: scheduledTime,
      duration: duration,
      meetingLink: meetingLink
    });

    if (delay > 0) {
      console.log(`⏰ Scheduled bot to join meeting in ${Math.round(delay / 1000 / 60)} minutes`);
      
      setTimeout(async () => {
        await this.joinMeeting(meetingLink, meetingId);
      }, delay);
    } else {
      console.log('⚠️ Meeting time is in the past, joining immediately');
      await this.joinMeeting(meetingLink, meetingId);
    }
  }
}

module.exports = new BotService();