// // backend/services/audioBackup.js
// const axios = require('axios');
// const FormData = require('form-data');

// class AudioBackupService {
//   constructor() {
//     this.activeMeetings = new Map();
//   }

//   initMeeting(roomId, hostId) {
//     this.activeMeetings.set(roomId, {
//       roomId,
//       hostId,
//       participants: new Map(),
//       startTime: Date.now(),
//       isRecording: false,
//         isShuttingDown: false, 
//     });
//     console.log(`✅ Backup initialized for meeting ${roomId}`);
//   }

//   addParticipant(roomId, socketId, name) {
//     const meeting = this.activeMeetings.get(roomId);
//     if (!meeting) return;

//     meeting.participants.set(socketId, {
//       name,
//       audioChunks: [],
//     });
//     console.log(`✅ Added ${name} (${socketId}) to backup for ${roomId}`);
//   }

//   // storeChunk(roomId, socketId, chunkBuffer) {
//   //   const meeting = this.activeMeetings.get(roomId);
//   //   if (!meeting || !meeting.isRecording) {
//   //     console.log(`❌ BACKUP: Cannot store chunk - meeting ${roomId} not found or not recording`);
//   //     return;
//   //   }

//   //   const participant = meeting.participants.get(socketId);
//   //   if (participant) {
//   //     participant.audioChunks.push(chunkBuffer);
//   //     console.log(`✅ BACKUP: Stored chunk for ${participant.name} (${socketId}) in room ${roomId}, total chunks: ${participant.audioChunks.length}`);
//   //   } else {
//   //     console.log(`❌ BACKUP: Participant ${socketId} not found in room ${roomId}`);
//   //   }
//   // }

//   storeChunk(roomId, socketId, chunkBuffer) {
//   const meeting = this.activeMeetings.get(roomId);
  
//   // 🔥 FIXED: Accept chunks even during shutdown
//   if (!meeting) {
//     console.log(`❌ BACKUP: Cannot store chunk - meeting ${roomId} not found`);
//     return;
//   }

//   if (!meeting.isRecording && !meeting.isShuttingDown) {
//     console.log(`❌ BACKUP: Cannot store chunk - meeting ${roomId} not recording`);
//     return;
//   }

//   const participant = meeting.participants.get(socketId);
//   if (participant) {
//     participant.audioChunks.push(chunkBuffer);
//     console.log(`✅ BACKUP: Stored chunk for ${participant.name} (${socketId}) in room ${roomId}, total chunks: ${participant.audioChunks.length}`);
//   } else {
//     console.log(`❌ BACKUP: Participant ${socketId} not found in room ${roomId}`);
//   }
// }

//   startRecording(roomId) {
//     const meeting = this.activeMeetings.get(roomId);
//     if (meeting) {
//       meeting.isRecording = true;
//       meeting.recordingStartTime = Date.now();
//       console.log(`🎙️ BACKUP: Recording started for room ${roomId}, participants: ${meeting.participants.size}`);
//     } else {
//       console.log(`❌ BACKUP: Cannot start recording - meeting ${roomId} not found`);
//     }
//   }

//   // async stopRecording(roomId, backendUrl, token) {
//   //   const meeting = this.activeMeetings.get(roomId);
//   //   if (!meeting) return null;

//   //   meeting.isRecording = false;

//   //   const allChunks = [];
//   //   meeting.participants.forEach((participant) => {
//   //     allChunks.push(...participant.audioChunks);
//   //   });

//   //   if (allChunks.length === 0) {
//   //     console.log('⚠️ No audio chunks to save');
//   //     return null;
//   //   }

//   //   try {
//   //     const combinedBuffer = Buffer.concat(allChunks);
//   //     const fileName = `backup_${roomId}_${Date.now()}.webm`;
      
//   //     const formData = new FormData();
//   //     formData.append('audio', combinedBuffer, {
//   //       filename: fileName,
//   //       contentType: 'audio/webm',
//   //     });

//   //     const response = await axios.post(
//   //       `${backendUrl}/api/upload/upload-audio-ftp`,
//   //       formData,
//   //       {
//   //         headers: {
//   //           ...formData.getHeaders(),
//   //           Authorization: `Bearer ${token}`,
//   //         },
//   //       }
//   //     );

//   //     if (response.data?.audioUrl) {
//   //       console.log(`✅ Backup uploaded: ${response.data.audioUrl}`);
//   //       return response.data.audioUrl;
//   //     }

//   //     return null;
//   //   } catch (error) {
//   //     console.error('❌ Backup upload failed:', error.message);
//   //     return null;
//   //   }
//   // }


//   async stopRecording(roomId, backendUrl, token) {
//   const meeting = this.activeMeetings.get(roomId);
//   if (!meeting) {
//     console.log(`⚠️ No meeting found for ${roomId} to stop`);
//     return null;
//   }

//   // 🔥 ADD THESE TWO LINES
//   meeting.isShuttingDown = true;
//   meeting.isRecording = false;
  
//   console.log(`🛑 Stopping recording for ${roomId}, waiting for final chunks...`);

//   // 🔥 ADD THIS LINE - Wait for any final chunks to arrive
//   await new Promise(resolve => setTimeout(resolve, 1000));

//   const allChunks = [];
//   meeting.participants.forEach((participant) => {
//     allChunks.push(...participant.audioChunks);
//     console.log(`📊 ${participant.name}: ${participant.audioChunks.length} chunks`);
//   });

//   if (allChunks.length === 0) {
//     console.log('⚠️ No audio chunks to save');
//     return null;
//   }

//   try {
//     const combinedBuffer = Buffer.concat(allChunks);
//     const fileName = `backup_${roomId}_${Date.now()}.webm`;
    
//     console.log(`📁 Starting upload: ${fileName}`);
//     console.log(`📦 File size: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
//     const formData = new FormData();
//     formData.append('audio', combinedBuffer, {
//       filename: fileName,
//       contentType: 'audio/webm',
//     });

//     const response = await axios.post(
//       `${backendUrl}/api/upload/upload-audio-ftp`,
//       formData,
//       {
//         headers: {
//           ...formData.getHeaders(),
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     if (response.data?.audioUrl) {
//       console.log(`✅ Backup uploaded: ${response.data.audioUrl}`);
//       return response.data.audioUrl;
//     }

//     return null;
//   } catch (error) {
//     console.error('❌ Backup upload failed:', error.message);
//     return null;
//   }
// }

//   getMeetingStatus(roomId) {
//     const meeting = this.activeMeetings.get(roomId);
//     if (!meeting) return null;

//     return {
//       roomId,
//       isRecording: meeting.isRecording,
//       participants: Array.from(meeting.participants.keys()).length,
//       duration: meeting.isRecording 
//         ? Date.now() - meeting.recordingStartTime 
//         : 0,
//     };
//   }

//   removeParticipant(roomId, socketId) {
//     const meeting = this.activeMeetings.get(roomId);
//     if (meeting) {
//       meeting.participants.delete(socketId);
//       console.log(`👋 Removed participant ${socketId} from backup`);
//     }
//   }

//   cleanup(roomId) {
//     this.activeMeetings.delete(roomId);
//     console.log(`🗑️ Cleaned up meeting ${roomId}`);
//   }
// }

// module.exports = new AudioBackupService();

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
      isShuttingDown: false,
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
    
    // 🔥 IMPROVED: Accept chunks even during shutdown for grace period
    if (!meeting) {
      console.log(`❌ BACKUP: Cannot store chunk - meeting ${roomId} not found`);
      return;
    }

    if (!meeting.isRecording && !meeting.isShuttingDown) {
      console.log(`❌ BACKUP: Cannot store chunk - meeting ${roomId} not recording`);
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
    if (!meeting) {
      console.log(`⚠️ No meeting found for ${roomId} to stop`);
      return null;
    }

    // 🔥 Mark as shutting down to accept final chunks
    meeting.isShuttingDown = true;
    meeting.isRecording = false;
    
    console.log(`🛑 Stopping recording for ${roomId}, waiting for final chunks...`);

    // 🔥 INCREASED: Wait longer for any final chunks to arrive (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    const allChunks = [];
    meeting.participants.forEach((participant) => {
      allChunks.push(...participant.audioChunks);
      console.log(`📊 ${participant.name}: ${participant.audioChunks.length} chunks`);
    });

    if (allChunks.length === 0) {
      console.log('⚠️ No audio chunks to save');
      return null;
    }

    try {
      const combinedBuffer = Buffer.concat(allChunks);
      const fileName = `backup_${roomId}_${Date.now()}.webm`;
      
      console.log(`📁 Starting upload: ${fileName}`);
      console.log(`📦 File size: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📦 Total chunks combined: ${allChunks.length}`);
      
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