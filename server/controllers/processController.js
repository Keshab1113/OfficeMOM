const db = require("../config/db");
const { processTranscript } = require("./deepseekController");

const processController = {
    // ✅ NEW: Save headers and start MoM generation
    async saveHeadersAndStartMoM(req, res) {
        try {
            const { historyId, headers, useDefault } = req.body;
            const userId = req.user.id;

            console.log('📝 Headers received:', { historyId, headers, useDefault, userId });

            // Validate
            if (!historyId || !userId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing historyId or userId"
                });
            }

            // Use provided headers or defaults
            const finalHeaders = headers && headers.length > 0
                ? headers
                : ["Discussion Summary", "Action Items", "Responsibility", "Target Date", "Status"];

            // ✅ Save headers to database
            await db.query(
                `INSERT INTO meeting_headers (history_id, user_id, headers, is_default) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             headers = VALUES(headers), 
             is_default = VALUES(is_default), 
             updated_at = CURRENT_TIMESTAMP`,
                [historyId, userId, JSON.stringify(finalHeaders), useDefault ? 1 : 0]
            );

            // ✅ Update history - headers are set
            await db.query(
                `UPDATE history 
             SET headers_set = 1, 
                 awaiting_headers = 0
             WHERE id = ? AND user_id = ?`,
                [historyId, userId]
            );

            // Check if transcription is already complete
            const [historyRows] = await db.query(
                `SELECT data, processing_status, processing_progress FROM history WHERE id = ? AND user_id = ?`,
                [historyId, userId]
            );

            if (historyRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "History record not found"
                });
            }

            const history = historyRows[0];
            const currentProgress = history.processing_progress || 0;
            let storedData = null;

            // Parse stored data if it exists
            if (history.data) {
                try {
                    storedData = typeof history.data === 'string' ? JSON.parse(history.data) : history.data;
                } catch (e) {
                    console.error("Failed to parse stored data:", e);
                }
            }

            // If transcription data is available, start MoM generation immediately
            if (storedData && storedData.transcription) {
                console.log(`🚀 Transcription available at ${currentProgress}%, starting MoM generation for history ${historyId}`);

                // Start MoM generation in background - pass current progress
                startMoMGeneration({
                    finalTranscript: storedData.transcription,
                    headers: finalHeaders,
                    audioId: storedData.audioId,
                    userId,
                    transcriptAudioId: storedData.transcriptAudioId,
                    detectLanguage: storedData.language,
                    historyID: historyId,
                    storageKey: `meeting_${historyId}`,
                    currentProgress: currentProgress // Pass current progress
                });

                // DON'T update queue status here - let startMoMGeneration handle it

            } else {
                // Transcription not ready yet, MoM will start automatically when transcription completes
                console.log(`⏳ Headers saved, waiting for transcription to complete for history ${historyId}`);

                await db.query(
                    `UPDATE processing_queue 
                 SET status = 'awaiting_transcription', 
                     task_type = 'Headers set - Waiting for transcription'
                 WHERE history_id = ? AND user_id = ?`,
                    [historyId, userId]
                );
            }

            console.log(`✅ Headers saved for history ${historyId}`);

            res.status(200).json({
                success: true,
                message: "Headers saved successfully!",
                historyId: historyId
            });

        } catch (error) {
            console.error("Error saving headers:", error);
            res.status(500).json({
                success: false,
                message: "Failed to save headers",
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
                `SELECT 
                    processing_status, 
                    processing_progress, 
                    error_message, 
                    data,
                    awaiting_headers,
                    headers_set
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

            const record = history[0];

            res.json({
                success: true,
                status: record.processing_status,
                progress: record.processing_progress,
                error: record.error_message,
                awaitingHeaders: record.awaiting_headers === 1,
                headersSet: record.headers_set === 1,
                data: record.data ? (typeof record.data === 'string' ? JSON.parse(record.data) : record.data) : null
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
                `SELECT 
                    h.id, 
                    h.title, 
                    h.processing_status, 
                    h.processing_progress,
                    h.uploadedAt, 
                    h.source, 
                    h.error_message,
                    h.awaiting_headers,
                    h.headers_set,
                    q.progress as queue_progress,
                    q.task_type
                 FROM history h
                 LEFT JOIN processing_queue q ON h.id = q.history_id
                 WHERE h.user_id = ? 
                 AND (
                     h.processing_status IN ('pending', 'transcribing', 'generating_mom')
                     OR h.awaiting_headers = 1
                 )
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
                    error: item.error_message,
                    awaitingHeaders: item.awaiting_headers === 1,
                    headersSet: item.headers_set === 1,
                    taskType: item.task_type
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

    // Get saved headers for a history record
    async getHeaders(req, res) {
        try {
            const { historyId } = req.params;
            const userId = req.user.id;

            const [headers] = await db.query(
                `SELECT headers, is_default FROM meeting_headers WHERE history_id = ? AND user_id = ?`,
                [historyId, userId]
            );

            if (headers.length === 0) {
                return res.json({
                    success: true,
                    headers: ["Discussion Summary", "Action Items", "Responsibility", "Target Date", "Status"],
                    isDefault: true
                });
            }

            const savedHeaders = typeof headers[0].headers === 'string'
                ? JSON.parse(headers[0].headers)
                : headers[0].headers;

            res.json({
                success: true,
                headers: savedHeaders,
                isDefault: headers[0].is_default === 1
            });

        } catch (error) {
            console.error("Error getting headers:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get headers"
            });
        }
    },

    async getLastUsedHeaders(req, res) {
        try {
            const userId = req.user.id;

            const [headers] = await db.query(
                `SELECT headers, is_default, updated_at 
             FROM meeting_headers 
             WHERE user_id = ? 
             ORDER BY updated_at DESC 
             LIMIT 1`,
                [userId]
            );

            if (headers.length === 0) {
                return res.json({
                    success: true,
                    headers: ["Discussion Summary", "Action Items", "Responsibility", "Target Date", "Status"],
                    isDefault: true,
                    message: "Using default headers"
                });
            }

            const savedHeaders = typeof headers[0].headers === 'string'
                ? JSON.parse(headers[0].headers)
                : headers[0].headers;

            res.json({
                success: true,
                headers: savedHeaders,
                isDefault: headers[0].is_default === 1,
                lastUsed: headers[0].updated_at
            });

        } catch (error) {
            console.error("Error getting last used headers:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get last used headers",
                error: error.message
            });
        }
    }
};

// ✅ SAFE UPDATE: Only update if new progress is HIGHER than current
async function updateMoMProgress(historyId, userId, newProgress, status) {
    try {
        // First, get current progress
        const [current] = await db.query(
            `SELECT processing_progress FROM history WHERE id = ? AND user_id = ?`,
            [historyId, userId]
        );

        const currentProgress = current[0]?.processing_progress || 0;

        // Only update if new progress is higher (prevents backwards progress)
        if (newProgress >= currentProgress) {
            await db.query(
                `UPDATE history 
                 SET processing_progress = ?, 
                     processing_status = ? 
                 WHERE id = ? AND user_id = ?`,
                [newProgress, status, historyId, userId]
            );

            await db.query(
                `UPDATE processing_queue 
                 SET progress = ?,
                     status = ?
                 WHERE history_id = ? AND user_id = ?`,
                [newProgress, status, historyId, userId]
            );

            console.log(`📊 Progress: ${currentProgress}% → ${newProgress}% (${status}) for history ${historyId}`);
        } else {
            console.log(`⚠️  Skipped update: ${newProgress}% is not higher than current ${currentProgress}% for history ${historyId}`);
        }
    } catch (error) {
        console.error("Error updating MoM progress:", error);
    }
}

async function startMoMGeneration(params) {
    const {
        finalTranscript,
        headers,
        audioId,
        userId,
        transcriptAudioId,
        detectLanguage,
        historyID,
        storageKey,
        currentProgress = 0
    } = params;

    try {
        console.log(`🚀 Starting MoM generation for history ${historyID} from ${currentProgress}%`);

        // ✅ Calculate smart starting progress
        // If transcription completed (currentProgress >= 70), continue from there
        // Otherwise, start from 70% as MoM generation phase
        let startProgress = currentProgress;

        if (currentProgress < 70) {
            startProgress = 70; // Transcription phase ends at 70%
        }

        // Update to generating_mom status with current progress
        await updateMoMProgress(historyID, userId, startProgress, 'generating_mom');

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

        const mockRes = {
            statusCode: null,
            responseData: null,
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.responseData = data;
                return this;
            }
        };

        // Progress: Starting DeepSeek processing
        await updateMoMProgress(historyID, userId, Math.max(startProgress, 75), 'generating_mom');

        // Process with DeepSeek
        await processTranscript(mockReq, mockRes);

        if (mockRes.statusCode !== 200 || (mockRes.responseData && !mockRes.responseData.success)) {
            throw new Error(mockRes.responseData?.error || "MoM generation failed");
        }

        // Progress: DeepSeek completed
        await updateMoMProgress(historyID, userId, 90, 'generating_mom');

        // Progress: Finalizing
        await updateMoMProgress(historyID, userId, 95, 'generating_mom');

        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));

        // Final: Completed
        await updateMoMProgress(historyID, userId, 100, 'completed');

        console.log(`✅ MoM generation completed for history ${historyID}`);

    } catch (error) {
        console.error(`❌ MoM generation failed for history ${historyID}:`, error);

        await db.query(
            `UPDATE history 
             SET processing_status = 'failed', 
                 error_message = ?,
                 awaiting_headers = 0
             WHERE id = ? AND user_id = ?`,
            [error.message, historyID, userId]
        );

        await db.query(
            `UPDATE processing_queue 
             SET status = 'failed' 
             WHERE history_id = ? AND user_id = ?`,
            [historyID, userId]
        );
    }
}

module.exports = processController;