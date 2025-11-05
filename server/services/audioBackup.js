// backend/services/audioBackup.js
const axios = require('axios');
const FormData = require('form-data');

class AudioBackupService {
  constructor() {
    this.activeMeetings = new Map();
  }

  initMeeting(roomId, hostId) {
    this.activeMeetings.set(roomId, {
      roomId,
      hostId,
      participants: new Map(),
      startTime: Date.now(),
      isRecording: false,
    });
    console.log(`✅ Backup initialized for meeting ${roomId}`);
  }

  addParticipant(roomId, socketId, name) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return;

    meeting.participants.set(socketId, {
      name,
      audioChunks: [],
    });
    console.log(`✅ Added ${name} (${socketId}) to backup for ${roomId}`);
  }

  storeChunk(roomId, socketId, chunkBuffer) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting || !meeting.isRecording) {
      console.log(`❌ BACKUP: Cannot store chunk - meeting ${roomId} not found or not recording`);
      return;
    }

    const participant = meeting.participants.get(socketId);
    if (participant) {
      participant.audioChunks.push(chunkBuffer);
      console.log(`✅ BACKUP: Stored chunk for ${participant.name} (${socketId}) in room ${roomId}, total chunks: ${participant.audioChunks.length}`);
    } else {
      console.log(`❌ BACKUP: Participant ${socketId} not found in room ${roomId}`);
    }
  }

  startRecording(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (meeting) {
      meeting.isRecording = true;
      meeting.recordingStartTime = Date.now();
      console.log(`🎙️ BACKUP: Recording started for room ${roomId}, participants: ${meeting.participants.size}`);
    } else {
      console.log(`❌ BACKUP: Cannot start recording - meeting ${roomId} not found`);
    }
  }

  async stopRecording(roomId, backendUrl, token) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return null;

    meeting.isRecording = false;

    const allChunks = [];
    meeting.participants.forEach((participant) => {
      allChunks.push(...participant.audioChunks);
    });

    if (allChunks.length === 0) {
      console.log('⚠️ No audio chunks to save');
      return null;
    }

    try {
      const combinedBuffer = Buffer.concat(allChunks);
      const fileName = `backup_${roomId}_${Date.now()}.webm`;
      
      const formData = new FormData();
      formData.append('audio', combinedBuffer, {
        filename: fileName,
        contentType: 'audio/webm',
      });

      const response = await axios.post(
        `${backendUrl}/api/upload/upload-audio-ftp`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.audioUrl) {
        console.log(`✅ Backup uploaded: ${response.data.audioUrl}`);
        return response.data.audioUrl;
      }

      return null;
    } catch (error) {
      console.error('❌ Backup upload failed:', error.message);
      return null;
    }
  }

  getMeetingStatus(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return null;

    return {
      roomId,
      isRecording: meeting.isRecording,
      participants: Array.from(meeting.participants.keys()).length,
      duration: meeting.isRecording 
        ? Date.now() - meeting.recordingStartTime 
        : 0,
    };
  }

  removeParticipant(roomId, socketId) {
    const meeting = this.activeMeetings.get(roomId);
    if (meeting) {
      meeting.participants.delete(socketId);
      console.log(`👋 Removed participant ${socketId} from backup`);
    }
  }

  cleanup(roomId) {
    this.activeMeetings.delete(roomId);
    console.log(`🗑️ Cleaned up meeting ${roomId}`);
  }
}

module.exports = new AudioBackupService();