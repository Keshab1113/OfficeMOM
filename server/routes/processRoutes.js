// routes/process.js
const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');
const authMiddleware = require("../middlewares/authMiddleware.js");

// router.post('/start-mom', authMiddleware, processController.startMoMGeneration);
// router.get('/status/:historyId', authMiddleware, processController.getProcessingStatus);
// router.get('/history/processing', authMiddleware, processController.getUserProcessingItems);
// router.post('/update-status', authMiddleware, processController.updateProcessingStatus);

router.post('/save-headers', authMiddleware, processController.saveHeadersAndStartMoM);

// ✅ EXISTING ROUTES (keep these)
router.get('/status/:historyId', authMiddleware, processController.getProcessingStatus);
router.get('/history/processing', authMiddleware, processController.getUserProcessingItems);
router.get('/headers/:historyId', authMiddleware, processController.getHeaders);

module.exports = router;