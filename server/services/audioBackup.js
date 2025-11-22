const { PassThrough } = require('stream');
const pool = require('../config/db');
const uploadToFTP = require('../config/uploadToFTP');

class AudioStreamService {
  constructor() {
    this.activeMeetings = new Map();
    this.hostSockets = new Map();

    this.config = {
      maxBufferSizeMB: parseInt(process.env.MAX_BUFFER_SIZE_MB) || 100,
      chunkSaveInterval: 10,
      maxRecordingMinutes: parseInt(process.env.MAX_RECORDING_MINUTES) || 180,
    };

    console.log('✅ AudioStreamService initialized (Direct FTP mode)');
  }

  sanitizeRoomId(roomId) {
    return String(roomId).replace(/[<>:"/\\|?*\s]/g, '_').substring(0, 100);
  }

  async initMeeting(roomId, hostId, userId) {
    if (!userId) {
      throw new Error('User ID is required to initialize meeting');
    }

    const sanitizedRoomId = this.sanitizeRoomId(roomId);

    if (this.activeMeetings.has(roomId)) {
      const meeting = this.activeMeetings.get(roomId);
      const oldHostId = this.hostSockets.get(roomId);

      if (oldHostId !== hostId) {
        console.log(`🔄 Host changed: ${oldHostId} → ${hostId}`);
        this.hostSockets.set(roomId, hostId);
        meeting.hostId = hostId;
      }

      console.log(`♻️ Reconnected: ${roomId} (${meeting.chunkCounter} chunks, ${this.getBufferSizeMB(meeting)}MB)`);
      return meeting.meetingDbId;
    }

    const existingMeeting = await this.getMeetingFromDB(roomId);
    let meetingDbId, startTime;

    if (existingMeeting) {
      meetingDbId = existingMeeting.id;
      startTime = new Date(existingMeeting.created_at).getTime();
      console.log(`📄 Resuming meeting: ${roomId} (ID: ${meetingDbId})`);
    } else {
      const [result] = await pool.query(
        `INSERT INTO meetings (room_id, host_user_id, status, created_at) 
         VALUES (?, ?, 'active', NOW())`,
        [roomId, userId]
      );
      meetingDbId = result.insertId;
      startTime = Date.now();
      console.log(`✅ Created meeting: ${roomId} (ID: ${meetingDbId})`);
    }

    this.activeMeetings.set(roomId, {
      roomId,
      sanitizedRoomId,
      hostId,
      meetingDbId,
      userId,
      participants: new Map(),
      chunkCounter: 0,
      startTime,
      isRecording: false,
      isShuttingDown: false,
      audioChunks: [],
      totalBytes: 0,
    });

    this.hostSockets.set(roomId, hostId);
    return meetingDbId;
  }

  async getMeetingFromDB(roomId) {
    try {
      const [rows] = await pool.query(
        `SELECT id, host_user_id, created_at, status, chunk_count, duration_seconds 
         FROM meetings WHERE room_id = ? ORDER BY created_at DESC LIMIT 1`,
        [roomId]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('❌ DB fetch error:', err.message);
      return null;
    }
  }

  getBufferSizeMB(meeting) {
    return (meeting.totalBytes / 1024 / 1024).toFixed(2);
  }

  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      heapUsedMB: (used.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (used.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: (used.rss / 1024 / 1024).toFixed(2),
    };
  }

  addParticipant(roomId, socketId, name) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return;
    meeting.participants.set(socketId, { name, joinedAt: Date.now() });
    console.log(`✅ Added ${name} to ${roomId}`);
  }

  storeChunk(roomId, chunkBuffer) {
    const meeting = this.activeMeetings.get(roomId);

    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    if (meeting.isShuttingDown) {
      return { success: false, error: 'Meeting is shutting down' };
    }

    const maxBytes = this.config.maxBufferSizeMB * 1024 * 1024;
    if (meeting.totalBytes + chunkBuffer.length > maxBytes) {
      console.error(`❌ Buffer limit reached for ${roomId}`);
      return { success: false, error: 'Buffer size limit reached' };
    }

    const durationMinutes = (Date.now() - meeting.startTime) / 1000 / 60;
    if (durationMinutes > this.config.maxRecordingMinutes) {
      console.error(`❌ Max duration reached for ${roomId}`);
      return { success: false, error: 'Max recording duration reached' };
    }

    meeting.audioChunks.push(Buffer.from(chunkBuffer));
    meeting.totalBytes += chunkBuffer.length;
    meeting.chunkCounter++;

    if (meeting.chunkCounter % this.config.chunkSaveInterval === 0) {
      this.saveProgressToDB(roomId);
    }

    if (meeting.chunkCounter % 50 === 0) {
      const mem = this.getMemoryUsage();
      console.log(`📊 ${roomId}: ${meeting.chunkCounter} chunks, ${this.getBufferSizeMB(meeting)}MB | Heap: ${mem.heapUsedMB}MB`);
    }

    return { success: true, chunks: meeting.chunkCounter, sizeMB: this.getBufferSizeMB(meeting) };
  }

  async saveProgressToDB(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return;

    try {
      const duration = Math.floor((Date.now() - meeting.startTime) / 1000);
      await pool.query(
        `UPDATE meetings SET duration_seconds = ?, chunk_count = ?, last_updated = NOW() WHERE id = ?`,
        [duration, meeting.chunkCounter, meeting.meetingDbId]
      );
    } catch (err) {
      console.error('❌ Progress save error:', err.message);
    }
  }

  async startRecording(roomId) {
    const meeting = this.activeMeetings.get(roomId);
    if (!meeting) return { success: false, error: 'Meeting not found' };

    meeting.isRecording = true;
    meeting.recordingStartTime = meeting.recordingStartTime || Date.now();

    await pool.query(
      `UPDATE meetings SET status = 'recording', started_at = NOW() WHERE id = ?`,
      [meeting.meetingDbId]
    );

    console.log(`🎙️ Recording started: ${roomId}`);
    return { success: true };
  }

  // ✅ FIXED: Direct FTP upload instead of HTTP call
  async stopRecording(roomId, backendUrl, token, recordingTime) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🛑 STOP RECORDING - Direct FTP Upload`);
    console.log(`   Room: ${roomId}`);
    console.log(`   Recording time: ${recordingTime}s`);
    console.log(`${'='.repeat(50)}\n`);

    const meeting = this.activeMeetings.get(roomId);

    if (!meeting) {
      console.error(`❌ Meeting ${roomId} NOT FOUND`);
      return null;
    }

    console.log(`📊 Meeting state:`);
    console.log(`   Chunks: ${meeting.chunkCounter}`);
    console.log(`   Size: ${this.getBufferSizeMB(meeting)}MB`);

    meeting.isShuttingDown = true;
    meeting.isRecording = false;

    console.log('⏳ Waiting 2s for final chunks...');
    await new Promise(r => setTimeout(r, 2000));
    await this.saveProgressToDB(roomId);

    if (meeting.audioChunks.length === 0 || meeting.totalBytes === 0) {
      console.error(`❌ No audio data!`);
      this.cleanup(roomId);
      return null;
    }

    try {
      console.log(`📦 Combining ${meeting.audioChunks.length} chunks...`);
      const audioBuffer = Buffer.concat(meeting.audioChunks);
      const fileName = `meeting_${meeting.sanitizedRoomId}_${Date.now()}.webm`;
      const sizeMB = (audioBuffer.length / 1024 / 1024).toFixed(2);

      console.log(`   Combined size: ${sizeMB}MB`);
      console.log(`   Filename: ${fileName}`);

      // ✅ Direct FTP upload - no HTTP call needed!
      console.log(`\n🚀 Starting direct FTP upload...`);
      const audioUrl = await uploadToFTP(audioBuffer, fileName, 'audio_files');

      console.log(`✅ FTP upload complete: ${audioUrl}`);

      // ✅ Update database with audio URL
      await pool.query(
        `UPDATE meetings SET audio_url = ?, status = 'completed', completed_at = NOW(), duration_seconds = ? WHERE id = ?`,
        [audioUrl, recordingTime, meeting.meetingDbId]
      );

      // ✅ Also create history entry (like your upload endpoint does)
      try {
        await pool.query(
          `INSERT INTO history (user_id, audioUrl, source, date, isMoMGenerated) VALUES (?, ?, ?, NOW(), 0)`,
          [meeting.userId, audioUrl, 'Live Meeting']
        );
        console.log(`✅ History entry created`);
      } catch (historyErr) {
        console.warn(`⚠️ History insert warning: ${historyErr.message}`);
      }

      console.log(`✅ Database updated`);
      this.cleanup(roomId);
      return audioUrl;

    } catch (err) {
      console.error(`\n❌ UPLOAD ERROR: ${err.message}`);
      console.error(`   Stack: ${err.stack}`);

      // ✅ Fixed: Don't use error_message column (it doesn't exist)
      try {
        await pool.query(
          `UPDATE meetings SET status = 'failed' WHERE id = ?`,
          [meeting.meetingDbId]
        );
      } catch (dbErr) {
        console.error(`❌ DB update error: ${dbErr.message}`);
      }

      meeting.isShuttingDown = false;
      meeting.uploadError = err.message;

      return null;
    }
  }

  async retryUpload(roomId, backendUrl, token) {
    const meeting = this.activeMeetings.get(roomId);

    if (!meeting || !meeting.uploadError) {
      return { success: false, error: 'No failed upload to retry' };
    }

    console.log(`🔄 Retrying upload for ${roomId}`);
    meeting.uploadError = null;

    const result = await this.stopRecording(roomId, backendUrl, token);
    return { success: !!result, audioUrl: result };
  }

  async getRecordingState(roomId) {
    const meeting = this.activeMeetings.get(roomId);

    if (meeting) {
      return {
        isRecording: meeting.isRecording,
        duration: Math.floor((Date.now() - meeting.startTime) / 1000),
        chunkCount: meeting.chunkCounter,
        sizeMB: this.getBufferSizeMB(meeting),
        participants: meeting.participants.size,
        hasError: !!meeting.uploadError,
        error: meeting.uploadError,
      };
    }

    const dbMeeting = await this.getMeetingFromDB(roomId);
    if (dbMeeting?.status === 'recording') {
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
    }
  }

  isCurrentHost(roomId, socketId) {
    return this.hostSockets.get(roomId) === socketId;
  }

  cleanup(roomId) {
    const meeting = this.activeMeetings.get(roomId);

    if (meeting) {
      const freedMB = this.getBufferSizeMB(meeting);
      meeting.audioChunks = [];
      meeting.totalBytes = 0;
      console.log(`🗑️ Cleared buffer for ${roomId} (freed ${freedMB}MB)`);
    }

    this.activeMeetings.delete(roomId);
    this.hostSockets.delete(roomId);
  }

  getStatus() {
    const meetings = [];

    for (const [roomId, meeting] of this.activeMeetings) {
      meetings.push({
        roomId,
        chunks: meeting.chunkCounter,
        sizeMB: this.getBufferSizeMB(meeting),
        duration: Math.floor((Date.now() - meeting.startTime) / 1000),
        isRecording: meeting.isRecording,
        participants: meeting.participants.size,
      });
    }

    return {
      activeMeetings: meetings.length,
      meetings,
      memory: this.getMemoryUsage(),
    };
  }

  async shutdown() {
    console.log('🔄 Shutting down AudioStreamService...');
    for (const [roomId] of this.activeMeetings) {
      await this.saveProgressToDB(roomId);
    }
  }
}

const service = new AudioStreamService();
process.on('SIGTERM', () => service.shutdown());
process.on('SIGINT', () => service.shutdown());

module.exports = service;