// routes/process.js
const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');
const authMiddleware = require("../middlewares/authMiddleware.js");

router.post('/start-mom', authMiddleware, processController.startMoMGeneration);
router.get('/status/:historyId', authMiddleware, processController.getProcessingStatus);
router.get('/history/processing', authMiddleware, processController.getUserProcessingItems);
router.post('/update-status', authMiddleware, processController.updateProcessingStatus);

module.exports = router;