const db = require("../config/db.js");
const uploadToFTP = require("../config/uploadToFTP.js");

class BotService {
  constructor() {
    this.isRecording = false;
    this.recordedChunks = [];
    this.activeMeetings = new Map();
  }


  async scheduleBotMeeting(meetingId, meetingLink, scheduledTime, duration, joinUntilEnd, botDisplayName) {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const delay = scheduled.getTime() - now.getTime();

    // Log scheduling with bot display name
    await this.logBotAction(meetingId, 'scheduled', 'Meeting scheduled for bot', {
      scheduledTime: scheduledTime,
      duration: duration,
      meetingLink: meetingLink,
      botDisplayName: botDisplayName,
      joinUntilEnd: joinUntilEnd
    });

    if (delay > 0) {
      console.log(`⏰ Scheduled bot to join meeting in ${Math.round(delay / 1000 / 60)} minutes as "${botDisplayName}"`);
      
      setTimeout(async () => {
        await this.joinMeeting(meetingLink, meetingId, botDisplayName, duration, joinUntilEnd);
      }, delay);
    } else {
      console.log('⚠️ Meeting time is in the past, joining immediately');
      await this.joinMeeting(meetingLink, meetingId, botDisplayName, duration, joinUntilEnd);
    }
  }

  async joinMeeting(meetingLink, meetingId, botDisplayName, duration, joinUntilEnd) {
    try {
      console.log(`🤖 Bot joining meeting as: ${botDisplayName}`);
      console.log(`🔗 Meeting: ${meetingLink}`);
      
      // Update meeting status to 'joined'
      await this.updateMeetingStatus(meetingId, 'joined');

      // Store meeting info for tracking
      this.activeMeetings.set(meetingId, {
        meetingLink,
        botDisplayName,
        duration,
        joinUntilEnd,
        startTime: new Date()
      });

      // Simulate joining process with display name (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`✅ Bot "${botDisplayName}" successfully joined the meeting`);
      
      await this.startRecording(meetingId, duration, joinUntilEnd, botDisplayName);
      
      return true;
    } catch (error) {
      console.error('❌ Error joining meeting:', error);
      await this.updateMeetingStatus(meetingId, 'failed');
      this.activeMeetings.delete(meetingId);
      return false;
    }
  }

  async startRecording(meetingId, duration, joinUntilEnd, botDisplayName) {
    try {
      console.log(`🎙️ Starting recording as "${botDisplayName}"...`);
      
      // Update meeting status to 'recording'
      await this.updateMeetingStatus(meetingId, 'recording');
      this.isRecording = true;

      // Get meeting title for recording
      const [meetings] = await db.execute(
        'SELECT meeting_title FROM bot_meetings WHERE id = ?',
        [meetingId]
      );

      const meetingTitle = meetings[0]?.meeting_title || 'meeting';
      
      let recordingDuration;
      if (joinUntilEnd) {
        // For "join until end" mode, use longer duration or implement meeting end detection
        recordingDuration = 4 * 60 * 60 * 1000; // 4 hours max for safety
        console.log(`⏱️ Recording until meeting ends (max 4 hours)`);
      } else {
        recordingDuration = Math.min(duration * 60 * 1000, 300000); // Max 5 minutes for demo
        console.log(`⏱️ Recording for ${duration} minutes`);
      }

      // Simulate recording process
      console.log(`⏺️ Recording simulation started for meeting: ${meetingTitle}`);
      console.log(`👤 Bot display name: ${botDisplayName}`);
      
      // Simulate collecting audio chunks
      this.recordedChunks = [];
      const simulatedChunk = Buffer.from(`audio_data_${meetingId}_${Date.now()}`);
      this.recordedChunks.push(simulatedChunk);

      setTimeout(async () => {
        await this.stopRecording(meetingId, meetingTitle, botDisplayName);
      }, recordingDuration);

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      await this.updateMeetingStatus(meetingId, 'failed');
      this.activeMeetings.delete(meetingId);
    }
  }

  async stopRecording(meetingId, meetingTitle, botDisplayName) {
    try {
      console.log(`⏹️ Stopping recording for bot "${botDisplayName}"...`);
      this.isRecording = false;

      // Generate audio buffer
      const audioBuffer = this.generateMockAudioBuffer(meetingTitle, botDisplayName);
      
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
        'INSERT INTO bot_recordings (meeting_id, file_path, file_size, duration, bot_display_name) VALUES (?, ?, ?, ?, ?)',
        [meetingId, ftpUrl, audioBuffer.length, 100, botDisplayName]
      );

      // Log successful recording
      await this.logBotAction(meetingId, 'recording_stopped', 'Recording completed and uploaded to FTP', {
        ftpUrl: ftpUrl,
        fileSize: audioBuffer.length,
        meetingId: meetingId,
        botDisplayName: botDisplayName,
        duration: '5 minutes' // Example duration
      });

      console.log(`✅ Recording completed for bot "${botDisplayName}" and saved to database`);
      
      // Remove from active meetings
      this.activeMeetings.delete(meetingId);

    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      await this.updateMeetingStatus(meetingId, 'failed');
      this.activeMeetings.delete(meetingId);
      await this.logBotAction(meetingId, 'error', 'Failed to upload recording to FTP', {
        error: error.message,
        meetingId: meetingId,
        botDisplayName: botDisplayName
      });
    } finally {
      this.recordedChunks = [];
    }
  }

  // Update mock audio buffer to include bot display name
  generateMockAudioBuffer(meetingTitle, botDisplayName) {
    const mockData = `Mock audio data for meeting: ${meetingTitle} - Recorded by: ${botDisplayName} - Recorded at: ${new Date().toISOString()}`;
    return Buffer.from(mockData);
  }

  // Add method to get active meetings info
  getActiveMeetings() {
    return Array.from(this.activeMeetings.entries()).map(([meetingId, meetingInfo]) => ({
      meetingId,
      ...meetingInfo
    }));
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
}

module.exports = new BotService();