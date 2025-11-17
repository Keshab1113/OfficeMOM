const db = require("../config/db");
const { processTranscript } = require("./deepseekController"); // Fix the import

const processController = {
    // Start background MoM generation
    async startMoMGeneration(req, res) {
        try {
            const {
                finalTranscript,
                headers,
                audioId,
                userId,
                transcriptAudioId,
                detectLanguage,
                historyID,
                storageKey
            } = req.body;

            // Validate required fields
            if (!finalTranscript || !headers || !userId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required parameters"
                });
            }

            // Update history status to 'generating_mom'
            await db.query(
                `UPDATE history SET processing_status = 'generating_mom', processing_progress = 10 WHERE id = ? AND user_id = ?`,
                [historyID, userId]
            );

            // Add to processing queue
            const [queueResult] = await db.query(
                `INSERT INTO processing_queue (history_id, user_id, task_type, status, progress) VALUES (?, ?, ?, ?, ?)`,
                [historyID, userId, 'mom_generation', 'queued', 10]
            );

            // Start background processing (non-blocking)
            processMoMInBackground({
                finalTranscript,
                headers,
                audioId,
                userId,
                transcriptAudioId,
                detectLanguage,
                historyID,
                storageKey,
                queueId: queueResult.insertId
            });

            res.status(200).json({
                success: true,
                message: "MoM generation started in background",
                historyId: historyID,
                queueId: queueResult.insertId
            });

        } catch (error) {
            console.error("Error starting MoM generation:", error);

            // Update status to failed
            if (historyID) {
                await db.query(
                    `UPDATE history SET processing_status = 'failed', error_message = ? WHERE id = ?`,
                    [error.message, historyID]
                );
            }

            res.status(500).json({
                success: false,
                message: "Failed to start MoM generation",
                error: error.message
            });
        }
    },

    // Check processing status
    async getProcessingStatus(req, res) {
        try {
            const { historyId } = req.params;
            const userId = req.user.id;

            const [history] = await db.query(
                `SELECT processing_status, processing_progress, error_message, data 
         FROM history 
         WHERE id = ? AND user_id = ?`,
                [historyId, userId]
            );

            if (history.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "History item not found"
                });
            }

            res.json({
                success: true,
                status: history[0].processing_status,
                progress: history[0].processing_progress,
                error: history[0].error_message,
                data: history[0].data ? JSON.parse(history[0].data) : null
            });

        } catch (error) {
            console.error("Error getting processing status:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get processing status"
            });
        }
    },

    // Get all processing items for user
    async getUserProcessingItems(req, res) {
        try {
            const userId = req.user.id;

            const [processingItems] = await db.query(
                `SELECT h.id, h.title, h.processing_status, h.processing_progress, 
                h.uploadedAt, h.source, h.error_message,
                q.progress as queue_progress
         FROM history h
         LEFT JOIN processing_queue q ON h.id = q.history_id
         WHERE h.user_id = ? AND h.processing_status IN ('pending', 'transcribing', 'generating_mom')
         ORDER BY h.uploadedAt DESC`,
                [userId]
            );

            res.json({
                success: true,
                processingItems: processingItems.map(item => ({
                    id: item.id,
                    title: item.title,
                    status: item.processing_status,
                    progress: item.processing_progress || item.queue_progress || 0,
                    uploadedAt: item.uploadedAt,
                    source: item.source,
                    error: item.error_message
                }))
            });

        } catch (error) {
            console.error("Error getting processing items:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get processing items"
            });
        }
    },

    async updateProcessingStatus(req, res) {
    try {
        const { historyId, status, progress } = req.body;
        const userId = req.user.id;

        await db.query(
            `UPDATE history SET processing_status = ?, processing_progress = ? WHERE id = ? AND user_id = ?`,
            [status, progress, historyId, userId]
        );

        res.json({
            success: true,
            message: "Status updated successfully"
        });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update status"
        });
    }
}
};

// Background processing function
async function processMoMInBackground(params) {
    const {
        finalTranscript,
        headers,
        audioId,
        userId,
        transcriptAudioId,
        detectLanguage,
        historyID,
        storageKey,
        queueId
    } = params;

    try {
        console.log(`🚀 Starting background MoM generation for history ${historyID}`);

        // Update progress to 30%
        await updateProgress(historyID, userId, queueId, 30, 'generating_mom');

        // Create a mock request object for processTranscript
        const mockReq = {
            body: {
                transcript: finalTranscript,
                headers: headers,
                audio_id: audioId,
                userId: userId,
                transcript_audio_id: transcriptAudioId,
                detectLanguage: detectLanguage,
                history_id: historyID
            }
        };

        // Create a mock response object that captures the result
        const mockRes = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.responseData = data;
                return this;
            }
        };

        // Process with DeepSeek using the existing function
        await processTranscript(mockReq, mockRes);

        if (mockRes.responseData && !mockRes.responseData.success) {
            throw new Error(mockRes.responseData.error || "MoM generation failed");
        }

        // Update progress to 90%
        await updateProgress(historyID, userId, queueId, 90, 'generating_mom');

        // The data should already be saved in history table by processTranscript
        // Just update the processing status to completed
        await db.query(
            `UPDATE history 
       SET processing_status = 'completed', processing_progress = 100
       WHERE id = ? AND user_id = ?`,
            [historyID, userId]
        );

        // Update queue status
        await db.query(
            `UPDATE processing_queue SET status = 'completed', progress = 100 WHERE id = ?`,
            [queueId]
        );

        console.log(`✅ Background MoM generation completed for history ${historyID}`);

    } catch (error) {
        console.error(`❌ Background MoM generation failed for history ${historyID}:`, error);

        // Update status to failed
        await db.query(
            `UPDATE history SET processing_status = 'failed', error_message = ? WHERE id = ?`,
            [error.message, historyID]
        );

        await db.query(
            `UPDATE processing_queue SET status = 'failed' WHERE id = ?`,
            [queueId]
        );
    }
}

async function updateProgress(historyId, userId, queueId, progress, status) {
    try {
        // Update history
        await db.query(
            `UPDATE history SET processing_progress = ?, processing_status = ? WHERE id = ? AND user_id = ?`,
            [progress, status, historyId, userId]
        );

        // Update queue
        await db.query(
            `UPDATE processing_queue SET progress = ? WHERE id = ?`,
            [progress, queueId]
        );

        console.log(`📊 Progress updated: ${progress}% for history ${historyId}`);
    } catch (error) {
        console.error("Error updating progress:", error);
    }
}

// Add this method to processController


module.exports = processController;