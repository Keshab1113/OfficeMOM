const express = require("express");
const multer = require("multer");
const db = require("../config/db.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const {
  createMeeting,
  endMeeting,
  getAllAudios,
  deleteAudio,
  transcribeAudioFromURL,
  transcribeAudio,
  updateAudioHistory,
  getLatestMeeting,
  getMeetingDetails,
  updateMeetingTitle,
} = require("../controllers/liveController.js");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/createlive", authMiddleware, createMeeting);
router.post("/:meetingId/end", authMiddleware, endMeeting);
router.get("/:meetingId/details", authMiddleware, getMeetingDetails);
router.put("/:id/title", authMiddleware, updateMeetingTitle);

router.post(
  "/:roomId/recording",
  authMiddleware,
  upload.single("mixed"),
  transcribeAudio
);

router.post(
  "/upload-audio-from-url",
  authMiddleware,
  upload.single("audioUrl"),
  transcribeAudioFromURL
);

// ✅ FIXED: Get latest meeting by roomId
router.get('/:roomId/latest', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // ✅ Changed from query() to db.query()
    const [meetings] = await db.query(
      `SELECT id, room_id, audio_url, duration_seconds, status, created_at, chunk_count
       FROM meetings 
       WHERE room_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [roomId]
    );

    if (meetings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No meeting found' 
      });
    }

    // ✅ Fetch history_id from history table
    const [historyRows] = await db.query(
      `SELECT id FROM history 
       WHERE user_id = ? AND audioUrl = ? 
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, meetings[0].audio_url]
    );

    const historyId = historyRows.length > 0 ? historyRows[0].id : null;

    res.json({
      success: true,
      latestMeeting: {
        ...meetings[0],
        duration_minutes: Math.ceil((meetings[0].duration_seconds || 0) / 60),
        history_id: historyId
      }
    });
  } catch (error) {
    console.error('❌ Error fetching latest meeting:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

// Add this route to your liveRoutes.js

// Get active (incomplete) meetings for the current user
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the most recent meeting that's not completed
    const [meetings] = await db.query(
      `SELECT id, room_id, status, created_at, duration_seconds, chunk_count, audio_url
       FROM meetings 
       WHERE host_user_id = ? 
       AND status IN ('active', 'recording')
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (meetings.length === 0) {
      return res.json({ 
        success: true, 
        activeMeeting: null 
      });
    }

    const meeting = meetings[0];
    
    // Check if meeting was created within last 24 hours
    const createdAt = new Date(meeting.created_at);
    const now = new Date();
    const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
    
    if (hoursSinceCreated > 24) {
      // Auto-expire old meetings
      await db.query(
        `UPDATE meetings SET status = 'expired' WHERE id = ?`,
        [meeting.id]
      );
      
      return res.json({ 
        success: true, 
        activeMeeting: null 
      });
    }

    res.json({
      success: true,
      activeMeeting: {
        ...meeting,
        duration_minutes: Math.ceil((meeting.duration_seconds || 0) / 60)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching active meeting:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});
// Expire/discard old meeting
router.post('/:roomId/expire', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    await db.query(
      `UPDATE meetings SET status = 'expired' WHERE room_id = ? AND host_user_id = ?`,
      [roomId, userId]
    );
    
    res.json({ success: true, message: 'Meeting expired' });
  } catch (error) {
    console.error('Error expiring meeting:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get("/audio-files", authMiddleware, getAllAudios);
router.delete("/audio-files/:id", authMiddleware, deleteAudio);
router.patch("/audio-files/:id", authMiddleware, updateAudioHistory);

module.exports = router;