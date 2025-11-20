
// // // backend/services/audioBackup.js



const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

class AudioBackupService {
  constructor() {
    this.activeMeetings = new Map();
    this.tempDir = path.join(__dirname, '../../temp_audio');
    this.ensureTempDir();
    this.hostSockets = new Map(); // Track host socket per room
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('✅ Temp directory ready:', this.tempDir);
    } catch (error) {
      console.error('❌ Error creating temp directory:', error);
    }
  }

  async initMeeting(roomId, hostId, userId) {
    if (this.activeMeetings.has(roomId)) {
      const meeting = this.activeMeetings.get(roomId);

      const oldHostId = this.hostSockets.get(roomId);
      if (oldHostId !== hostId) {
        console.log(`🔄 Host socket changed: ${oldHostId} → ${hostId}`);
        this.hostSockets.set(roomId, hostId);
        meeting.hostId = hostId;
      }

      console.log(`♻️ Reconnected to existing meeting: ${roomId} (${meeting.chunkCounter} chunks)`);
      return meeting.meetingDbId;
    }

    const existingMeeting = await this.getMeetingFromDB(roomId);

    let meetingDbId;
    let startTime;

    if (existingMeeting) {
      meetingDbId = existingMeeting.id;
      // ✅ FIX: Use created_at for start time
      startTime = new Date(existingMeeting.created_at).getTime();
      console.log(`📄 Resuming meeting from DB: ${roomId} (ID: ${meetingDbId})`);
    } else {
      const [result] = await pool.query(
        `INSERT INTO meetings (room_id, host_user_id, status, created_at) 
       VALUES (?, ?, 'active', NOW())`,
        [roomId, userId]
      );
      meetingDbId = result.insertId;
      startTime = Date.now();
      console.log(`✅ Created new meeting in DB: ${roomId} (ID: ${meetingDbId})`);
    }

    const tempFilePath = path.join(this.tempDir, `${roomId}_temp.webm`);

    // Check if temp file exists from previous session
    let existingChunkCount = 0;
    try {
      const stats = await fs.stat(tempFilePath);
      existingChunkCount = existingMeeting?.chunk_count || 0;
      console.log(`📁 Found existing temp file: ${(stats.size / 1024).toFixed(2)} KB, ${existingChunkCount} chunks`);
    } catch (error) {
      // Create new temp file
      await fs.writeFile(tempFilePath, Buffer.alloc(0));
      console.log('✅ Created new temp file:', tempFilePath);
    }

    this.activeMeetings.set(roomId, {
      roomId,
      hostId,
      meetingDbId,
      userId,
      participants: new Map(),
      chunkCounter: existingChunkCount,
      startTime,
      isRecording: existingMeeting?.status === 'recording',
      isShuttingDown: false,
      tempFilePath,
    });

    this.hostSockets.set(roomId, hostId);
    console.log(`✅ Backup service initialized for meeting ${roomId}`);
    return meetingDbId;
  }

  async getMeetingFromDB(roomId) {
    try {
      const [rows] = await pool.query(
        `SELECT id, host_user_id, created_at, status, chunk_count, duration_seconds 
         FROM meetings 
         WHERE room_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [roomId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error fetching meeting from DB:', error);
      return null;
    }
  }

  addParticipant(roomId, socketId, name) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return;

    meeting.participants.set(socketId, {
      name,
      joinedAt: Date.now(),
    });
    console.log(`✅ Added ${name} (${socketId}) to meeting ${roomId}`);
  }

  async storeChunk(roomId, chunkBuffer) {
    const meeting = this.activeMeetings.get(roomId);

    if (!meeting) {
      console.log(`❌ Cannot store chunk - meeting ${roomId} not found`);
      return;
    }

    try {
      await fs.appendFile(meeting.tempFilePath, chunkBuffer);
      meeting.chunkCounter++;

      if (meeting.chunkCounter % 10 === 0) {
        await this.saveProgressToDB(roomId);
      }

      if (meeting.chunkCounter % 50 === 0) {
        console.log(`📊 Progress: ${meeting.chunkCounter} chunks stored for ${roomId}`);
      }
    } catch (error) {
      console.error(`❌ Error storing chunk for ${roomId}:`, error);
    }
  }

  async saveProgressToDB(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return;

    try {
      const duration = Math.floor((Date.now() - meeting.startTime) / 1000);

      await pool.query(
        `UPDATE meetings 
         SET duration_seconds = ?, 
             chunk_count = ?,
             last_updated = NOW()
         WHERE id = ?`,
        [duration, meeting.chunkCounter, meeting.meetingDbId]
      );

      console.log(`💾 Progress saved: ${roomId} - ${duration}s, ${meeting.chunkCounter} chunks`);
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  }

  async startRecording(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) {
      console.log(`❌ Cannot start recording - meeting ${roomId} not found`);
      return;
    }

    meeting.isRecording = true;

    if (!meeting.recordingStartTime) {
      meeting.recordingStartTime = Date.now();
    }

    await pool.query(
      `UPDATE meetings SET status = 'recording', started_at = NOW() WHERE id = ?`,
      [meeting.meetingDbId]
    );

    console.log(`🎙️ Recording started for room ${roomId}`);
  }

  async stopRecording(roomId, backendUrl, token, recordingTime) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) {
      console.log(`⚠️ No meeting found for ${roomId} to stop`);
      return null;
    }

    meeting.isShuttingDown = true;
    meeting.isRecording = false;

    console.log(`🛑 Stopping recording for ${roomId}, waiting for final chunks...`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.saveProgressToDB(roomId);

    try {
      // Check if temp file exists
      try {
        await fs.access(meeting.tempFilePath);
      } catch (error) {
        console.error(`❌ Temp file not found: ${meeting.tempFilePath}`);
        return null;
      }

      const audioBuffer = await fs.readFile(meeting.tempFilePath);

      if (audioBuffer.length === 0) {
        console.log('⚠️ No audio data to save');
        await this.cleanup(roomId);
        return null;
      }

      const fileName = `meeting_${roomId}_${Date.now()}.webm`;
      const fileSizeMB = (audioBuffer.length / 1024 / 1024).toFixed(2);

      console.log(`📤 Uploading: ${fileName}`);
      console.log(`📦 Size: ${fileSizeMB} MB, Chunks: ${meeting.chunkCounter}`);

      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: fileName,
        contentType: 'audio/webm',
      });
      formData.append('meetingId', roomId);
      formData.append('source', 'Live Meeting');
      formData.append('recordingTime', recordingTime || Math.floor((Date.now() - meeting.startTime) / 1000));

      const response = await axios.post(
        `${backendUrl}/api/upload/upload-audio-ftp`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 600000, // 10 minutes
        }
      );

      if (response.data?.audioUrl) {
        await pool.query(
          `UPDATE meetings 
           SET audio_url = ?, 
               status = 'completed',
               completed_at = NOW(),
               duration_seconds = ?
           WHERE id = ?`,
          [response.data.audioUrl, recordingTime, meeting.meetingDbId]
        );

        console.log(`✅ Meeting saved: ${response.data.audioUrl}`);

        // NOW cleanup after successful save
        await this.cleanup(roomId);

        return response.data.audioUrl;
      }

      return null;
    } catch (error) {
      console.error('❌ Error saving recording:', error.message);
      // DON'T cleanup on error - keep temp file for recovery
      return null;
    }
  }

  async getRecordingState(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (meeting) {
      return {
        isRecording: meeting.isRecording,
        duration: Math.floor((Date.now() - meeting.startTime) / 1000),
        chunkCount: meeting.chunkCounter,
        participants: meeting.participants.size,
      };
    }

    const dbMeeting = await this.getMeetingFromDB(roomId);
    if (dbMeeting && dbMeeting.status === 'recording') {
      return {
        isRecording: true,
        duration: dbMeeting.duration_seconds || 0,
        chunkCount: dbMeeting.chunk_count || 0,
        fromDatabase: true,
      };
    }

    return null;
  }

  removeParticipant(roomId, socketId) {
    const meeting = this.activeMeetings.get(roomId);
    if (meeting) {
      meeting.participants.delete(socketId);
      console.log(`👋 Removed participant ${socketId} from ${roomId}`);
    }
  }

  // ✅ NEW: Check if socket is the current host
  isCurrentHost(roomId, socketId) {
    const currentHostId = this.hostSockets.get(roomId);
    return currentHostId === socketId;
  }

  async cleanup(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (meeting) {
      try {
        await fs.unlink(meeting.tempFilePath);
        console.log(`🗑️ Deleted temp file for ${roomId}`);
      } catch (error) {
        console.error('⚠️ Could not delete temp file:', error.message);
      }
    }

    this.activeMeetings.delete(roomId);
    this.hostSockets.delete(roomId);
    console.log(`🗑️ Cleaned up meeting ${roomId}`);
  }
}

module.exports = new AudioBackupService();