// processController.js - Fixed version with Socket.IO

const db = require("../config/db");
const { processTranscript } = require("./deepseekController");
const { refundUserMinutes } = require("../middlewares/minutesManager.js");

const processController = {
    // Save headers and start MoM generation
    async saveHeadersAndStartMoM(req, res) {
        try {
            const { historyId, headers, useDefault } = req.body;
            const userId = req.user.id;

            console.log('📝 Headers received:', { historyId, headers, useDefault, userId });

            if (!historyId || !userId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing historyId or userId"
                });
            }

            const finalHeaders = headers && headers.length > 0
                ? headers
                : ["Discussion Summary", "Action Items", "Responsibility", "Target Date", "Status"];

            // Save headers
            await db.query(
                `INSERT INTO meeting_headers (history_id, user_id, headers, is_default) 
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 headers = VALUES(headers), 
                 is_default = VALUES(is_default), 
                 updated_at = CURRENT_TIMESTAMP`,
                [historyId, userId, JSON.stringify(finalHeaders), useDefault ? 1 : 0]
            );

            // Update history record
            await db.query(
                `UPDATE history 
                 SET headers_set = 1, 
                     awaiting_headers = 0
                 WHERE id = ? AND user_id = ?`,
                [historyId, userId]
            );

            // Get history data
            const [historyRows] = await db.query(
                `SELECT data, processing_status, processing_progress, deducted_minutes 
                 FROM history 
                 WHERE id = ? AND user_id = ?`,
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
            const deductedMinutes = history.deducted_minutes || 0;
            let storedData = null;

            if (history.data) {
                try {
                    storedData = typeof history.data === 'string' ? JSON.parse(history.data) : history.data;
                } catch (e) {
                    console.error("Failed to parse stored data:", e);
                }
            }

            if (storedData && storedData.transcription) {
                console.log(`🚀 Transcription available, starting MoM generation for history ${historyId}`);

                // Start MoM generation in background
                startMoMGeneration({
                    finalTranscript: storedData.transcription,
                    headers: finalHeaders,
                    audioId: storedData.audioId,
                    userId,
                    transcriptAudioId: storedData.transcriptAudioId,
                    detectLanguage: storedData.language,
                    historyID: historyId,
                    currentProgress,
                    deductedMinutes
                }).catch(err => {
                    console.error(`❌ MoM generation error for history ${historyId}:`, err);
                });
            } else {
                console.log(`⏳ Headers saved, waiting for transcription for history ${historyId}`);

                await db.query(
                    `UPDATE processing_queue 
                     SET status = 'awaiting_transcription', 
                         task_type = 'Headers set - Waiting for transcription'
                     WHERE history_id = ? AND user_id = ?`,
                    [historyId, userId]
                );
            }

            res.status(200).json({
                success: true,
                message: "Headers saved successfully!",
                historyId
            });

        } catch (error) {
            console.error("❌ Error saving headers:", error);
            res.status(500).json({
                success: false,
                message: "Failed to save headers",
                error: error.message
            });
        }
    },

    // Check processing status (used only once, not in polling)
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
                    headers_set,
                    minutes_refunded,
                    refunded_minutes
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
                minutesRefunded: record.minutes_refunded === 1,
                refundedMinutes: record.refunded_minutes,
                data: record.data ? (typeof record.data === 'string' ? JSON.parse(record.data) : record.data) : null
            });

        } catch (error) {
            console.error("❌ Error getting processing status:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get processing status",
                error: error.message
            });
        }
    },

    // Get all processing items (used only once initially, then Socket.IO takes over)
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
                    h.minutes_refunded,
                    h.refunded_minutes,
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
                    taskType: item.task_type,
                    minutesRefunded: item.minutes_refunded === 1,
                    refundedMinutes: item.refunded_minutes
                }))
            });

        } catch (error) {
            console.error("❌ Error getting processing items:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get processing items",
                error: error.message
            });
        }
    },

    // Get saved headers
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
            console.error("❌ Error getting headers:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get headers",
                error: error.message
            });
        }
    },

    // Get last used headers
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
            console.error("❌ Error getting last used headers:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get last used headers",
                error: error.message
            });
        }
    }
};

// ✅ Helper: Refund minutes with Socket.IO event
async function refundMinutesOnError(userId, historyId, minutesToRefund, errorContext) {
    try {
        console.log(`💰 Refunding ${minutesToRefund} minutes due to: ${errorContext}`);

        const refundResult = await refundUserMinutes(userId, minutesToRefund);

        await db.query(
            `UPDATE history 
             SET error_message = CONCAT(IFNULL(error_message, ''), ' | Refunded: ${minutesToRefund} min'),
                 minutes_refunded = 1,
                 refunded_minutes = ?
             WHERE id = ? AND user_id = ?`,
            [minutesToRefund, historyId, userId]
        );

        console.log(`✅ Refunded ${minutesToRefund} minutes`);

        // ✅ Emit subscription update
        if (global.socketManager) {
            global.socketManager.emitToUser(userId, 'subscription-updated', {
                totalMinutes: refundResult.newBalance,
                remainingMinutes: refundResult.newBalance,
                refunded: true,
                refundedAmount: minutesToRefund
            });
        }

        return refundResult;
    } catch (refundError) {
        console.error(`❌ Failed to refund minutes:`, refundError);
    }
}

// ✅ Helper: Update MoM progress with Socket.IO event
async function updateMoMProgress(historyId, userId, newProgress, status) {
    try {
        const [current] = await db.query(
            `SELECT processing_progress FROM history WHERE id = ? AND user_id = ?`,
            [historyId, userId]
        );

        const currentProgress = current[0]?.processing_progress || 0;

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

            console.log(`📊 Progress: ${currentProgress}% → ${newProgress}% (${status})`);

            // ✅ Emit progress update
            if (global.socketManager) {
                global.socketManager.emitToUser(userId, 'processing-update', {
                    historyId,
                    progress: newProgress,
                    status,
                    message: status
                });
            }
        }
    } catch (error) {
        console.error("❌ Error updating MoM progress:", error);
    }
}

// ✅ Start MoM generation
async function startMoMGeneration(params) {
    const {
        finalTranscript,
        headers,
        audioId,
        userId,
        transcriptAudioId,
        detectLanguage,
        historyID,
        currentProgress = 0,
        deductedMinutes = 0
    } = params;

    let currentStage = "MoM initialization";

    try {
        console.log(`🚀 Starting MoM generation for history ${historyID} from ${currentProgress}%`);

        let startProgress = currentProgress < 70 ? 70 : currentProgress;
        currentStage = "MoM setup";
        await updateMoMProgress(historyID, userId, startProgress, 'generating_mom');

        const mockReq = {
            body: {
                transcript: finalTranscript,
                headers,
                audio_id: audioId,
                userId,
                transcript_audio_id: transcriptAudioId,
                detectLanguage,
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

        await updateMoMProgress(historyID, userId, Math.max(startProgress, 75), 'generating_mom');

        currentStage = "AI processing";
        await processTranscript(mockReq, mockRes);

        if (mockRes.statusCode !== 200 || (mockRes.responseData && !mockRes.responseData.success)) {
            throw new Error(mockRes.responseData?.error || "MoM generation failed");
        }

        await updateMoMProgress(historyID, userId, 90, 'generating_mom');
        await updateMoMProgress(historyID, userId, 95, 'generating_mom');
        await new Promise(resolve => setTimeout(resolve, 300));
        await updateMoMProgress(historyID, userId, 100, 'completed');

        console.log(`✅ MoM generation completed for history ${historyID}`);

        // ✅ Emit completion event
        if (global.socketManager) {
            global.socketManager.emitToUser(userId, 'processing-completed', {
                historyId: historyID,
                message: 'MoM generation completed successfully'
            });
        }

    } catch (error) {
        console.error(`❌ MoM generation failed at ${currentStage}:`, error);

        // ✅ Emit failure event
        if (global.socketManager) {
            global.socketManager.emitToUser(userId, 'processing-failed', {
                historyId: historyID,
                error: error.message,
                stage: currentStage,
                refundedMinutes: deductedMinutes
            });
        }

        if (deductedMinutes > 0) {
            await refundMinutesOnError(userId, historyID, deductedMinutes, `${currentStage} failed`);
        }

        await db.query(
            `UPDATE history 
             SET processing_status = 'failed', 
                 error_message = ?,
                 awaiting_headers = 0
             WHERE id = ? AND user_id = ?`,
            [`Failed at ${currentStage}: ${error.message}`, historyID, userId]
        );

        await db.query(
            `UPDATE processing_queue 
             SET status = 'failed',
                 task_type = ?
             WHERE history_id = ?`,
            [`Failed: ${error.message}`, historyID]
        );
    }
}



module.exports = processController;