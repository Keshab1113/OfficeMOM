// const axios = require("axios");
// const db = require("../config/db.js");

// // =====================
// // Helper: Delay function
// // =====================
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// // =====================
// // Helper: Retry with exponential backoff
// // =====================
// async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000) {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
//       return await fn();
//     } catch (error) {
//       const isLastAttempt = attempt === maxRetries;

//       if (isLastAttempt) {
//         console.error(`❌ All ${maxRetries} attempts failed`);
//         throw error;
//       }

//       // Don't retry on certain errors
//       if (error.response?.status === 401 || error.response?.status === 403) {
//         console.error(`❌ Auth error - not retrying`);
//         throw error;
//       }

//       const waitTime = baseDelay * Math.pow(2, attempt - 1);
//       console.log(`⏳ Waiting ${waitTime}ms before retry...`);
//       await delay(waitTime);
//     }
//   }
// }

// // =====================
// // Helper: Chunk Transcript Text
// // =====================
// function chunkTranscript(text) {
//   const totalWords = text.split(/\s+/).length;

//   let maxWords = 800;
//   let overlapSentences = 1;

//   if (totalWords <= 800) {
//     maxWords = totalWords;
//     overlapSentences = 0;
//   } else if (totalWords <= 2000) {
//     maxWords = 500;
//     overlapSentences = 1;
//   } else if (totalWords <= 5000) {
//     maxWords = 700;
//     overlapSentences = 2;
//   } else if (totalWords <= 10000) {
//     maxWords = 900;
//     overlapSentences = 2;
//   } else {
//     maxWords = 1000;
//     overlapSentences = 3;
//   }

//   const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
//   const chunks = [];
//   let currentChunk = [];
//   let currentWordCount = 0;

//   for (let i = 0; i < sentences.length; i++) {
//     const sentence = sentences[i];
//     const words = sentence.trim().split(/\s+/).length;

//     if (currentWordCount + words > maxWords && currentChunk.length > 0) {
//       chunks.push(currentChunk.join(" "));
//       currentChunk = sentences.slice(Math.max(0, i - overlapSentences), i);
//       currentWordCount = currentChunk.join(" ").split(/\s+/).length;
//     }

//     currentChunk.push(sentence);
//     currentWordCount += words;
//   }

//   if (currentChunk.length > 0) {
//     chunks.push(currentChunk.join(" "));
//   }

//   console.log(
//     `🧠 Total words: ${totalWords}, Chunk size: ${maxWords}, Total chunks: ${chunks.length}`
//   );
//   return chunks;
// }

// // =====================
// // Build Summary Prompt
// // =====================
// const buildSummaryPrompt = (text) => `
// You are a meeting transcript summarizer focused on ACCURATE EXTRACTION.

// CRITICAL RULES:
// 1. Extract and summarize ONLY information explicitly present in the transcript
// 2. DO NOT infer, assume, or add any information not stated in the text
// 3. DO NOT make up names, details, or context
// 4. Stay faithful to the exact wording and meaning of the original text
// 5. Preserve all specific details: names, numbers, technical terms, timelines

// TASK:
// Create a detailed summary (150-200 words) that:
// - Captures ALL key points from the transcript
// - Uses the same terminology and phrasing as the original
// - Preserves the logical flow: what was discussed → what was decided → what needs to be done
// - Does NOT add interpretation or assumptions
// - Writes in clear paragraphs (no bullet points)

// Meeting Transcript:
// ${text}

// Return only the summary text extracted from the transcript above. No preamble, no explanations, no added information.
// `;

// // =====================
// // Build MoM prompt
// // =====================
// // const buildPrompt = (text, headers) => `
// // You are a strict information extraction system for Minutes of Meeting (MoM) creation.

// // CRITICAL RULES - READ CAREFULLY:
// // 1. Extract information ONLY from the provided text - DO NOT infer, assume, or add anything not explicitly stated
// // 2. If information is not present in the text, leave that field as "" (empty string)
// // 3. DO NOT make up names, dates, deadlines, or any other information
// // 4. DO NOT rephrase in a way that changes meaning - stay faithful to the original text
// // 5. Use direct quotes or very close paraphrasing from the source text only

// // OUTPUT FORMAT:
// // - Return a JSON array of objects
// // - Use these exact field names: ${headers.join(", ")}
// // - Create multiple objects ONLY if there are clearly distinct action items or topics in the text
// // - Each field should contain ONLY information explicitly found in the text

// // FIELD EXTRACTION RULES:
// // - "Date": Extract only if a specific date is mentioned in the text
// // - "Meeting Title": Extract only if explicitly stated, otherwise use ""
// // - "Agenda / Objective": Extract only the stated purpose/goals from the text
// // - "Key Discussion Points": List only topics actually discussed in the text
// // - "Decisions Made": Extract only explicit decisions stated in the text
// // - "Action Items": Extract only tasks/actions explicitly mentioned
// // - "Assigned To": Extract only if a person/team name is explicitly mentioned for that task
// // - "Deadline": Extract only if a specific deadline is stated in the text
// // - "Status": Extract only if status is explicitly mentioned, otherwise ""

// // DO NOT:
// // - Infer titles like "Chatbot Platform Review" unless that exact phrase is in the text
// // - Assume assignees like "Backend Team" unless explicitly stated
// // - Create statuses like "Pending" unless that word appears in the text
// // - Add any interpretation or analysis

// // Meeting Content:
// // ${text}

// // Return ONLY the JSON array with extracted information. No explanations, no markdown, no extra text.
// // `;

// const buildPrompt = (text, headers) => `
// You are a strict information extraction system for creating clear, structured Minutes of Meeting (MoM) in JSON format.

// CRITICAL RULES:
// 1. Extract ONLY what is explicitly mentioned in the text — do NOT infer, assume, or add anything.
// 2. If information is missing, return "" for that field.
// 3. DO NOT make up names, dates, or deadlines.
// 4. Stay faithful to the original wording.
// 5. When extracting lists (Agenda, Key Discussion Points, Action Items), use clear bullet points (•) in a single string, one per line.

// OUTPUT FORMAT:
// - Return a JSON array of objects.
// - Use these exact field names: ${headers.join(", ")}.
// - Create multiple objects ONLY if there are clearly distinct topics or action items.
// - Each field must contain only explicit content from the transcript.

// FIELD EXTRACTION RULES:
// - "Date": Extract only if a specific date is mentioned.
// - "Meeting Title": Extract only if explicitly stated.
// - "Agenda / Objective": If multiple objectives exist, return them as bullet points:
//    • First agenda item
//    • Second agenda item
// - "Key Discussion Points": Return each discussion topic as bullet points:
//    • Topic 1
//    • Topic 2
// - "Decisions Made": Return direct statements of decisions (verbatim or close paraphrase).
// - "Action Items": Return each action as bullet points:
//    • Task 1
//    • Task 2
// - "Assigned To": Only if explicit name/team is mentioned.
// - "Deadline": Only if explicit date/time is mentioned.
// - "Status": Only if explicitly stated.

// DO NOT:
// - Infer missing info
// - Add extra explanation
// - Change the wording
// - Output anything except valid JSON.

// Meeting Content:
// ${text}

// Return ONLY valid JSON — no markdown, no explanations, no notes, no formatting outside JSON.
// `;

// // =====================
// // API call with better configuration
// // =====================
// async function callDeepSeekAPI(prompt, apiUrl, apiKey, timeout = 90000) {
//   const response = await axios.post(
//     apiUrl,
//     {
//       model: "deepseek-chat",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are an expert meeting note-taker who creates detailed, comprehensive summaries that preserve all important information from meeting transcripts.",
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       temperature: 0,
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${apiKey}`,
//       },
//       timeout,
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//       // Important: Configure axios to handle connection issues better
//       validateStatus: (status) => status < 500,
//       httpAgent: new (require("http").Agent)({
//         keepAlive: true,
//         keepAliveMsecs: 30000,
//       }),
//       httpsAgent: new (require("https").Agent)({
//         keepAlive: true,
//         keepAliveMsecs: 30000,
//         rejectUnauthorized: true,
//       }),
//     }
//   );

//   if (response.status >= 400) {
//     throw new Error(
//       `API error: ${response.status} - ${JSON.stringify(response.data)}`
//     );
//   }

//   return response;
// }

// // =====================
// // Process single chunk with retry
// // =====================
// async function processSingleChunk(
//   chunk,
//   chunkId,
//   chunkNumber,
//   totalChunks,
//   apiUrl,
//   apiKey
// ) {
//   console.log(
//     `\n📝 Processing chunk ${chunkNumber}/${totalChunks} (ID: ${chunkId})`
//   );
//   console.log(
//     `📊 Chunk ${chunkNumber} preview: "${chunk.substring(0, 100)}..."`
//   );

//   try {
//     console.log(`🌐 Sending chunk ${chunkNumber} to DeepSeek API...`);

//     // Wrap API call in retry logic
//     const response = await retryWithBackoff(
//       () => callDeepSeekAPI(buildSummaryPrompt(chunk), apiUrl, apiKey, 90000),
//       3,
//       3000
//     );

//     console.log(`✅ Chunk ${chunkNumber} API response received`);
//     console.log(`📊 Response status: ${response.status}`);

//     const raw = response?.data?.choices?.[0]?.message?.content?.trim();

//     if (!raw) {
//       throw new Error("Empty response from API");
//     }

//     console.log(`📄 Chunk ${chunkNumber} summary length: ${raw.length} chars`);
//     console.log(`💾 Saving chunk ${chunkNumber} summary to database...`);

//     // Update chunk with summary
//     const updateSql = `
//       UPDATE mom_chunks 
//       SET partial_mom = ?, model_response_json = ?, status = 'done', error_message = NULL
//       WHERE id = ?
//     `;

//     await db.query(updateSql, [raw, raw, chunkId]);

//     console.log(`✅ Chunk ${chunkNumber} summary saved to DB successfully`);

//     return { success: true, chunkNumber, summary: raw };
//   } catch (err) {
//     console.error(`❌ Chunk ${chunkNumber} processing failed:`, err.message);

//     // Mark as failed in DB
//     try {
//       const failSql = `
//         UPDATE mom_chunks
//         SET status='failed', error_message=?
//         WHERE id=?
//       `;
//       await db.query(failSql, [err.message, chunkId]);
//       console.log(`⚠️ Chunk ${chunkNumber} marked as failed in DB`);
//     } catch (dbErr) {
//       console.error(
//         `❌ Failed to update error status for chunk ${chunkNumber}:`,
//         dbErr.message
//       );
//     }

//     return { success: false, chunkNumber, error: err.message };
//   }
// }

// // =====================
// // Main Processing
// // =====================
// const processTranscript = async (req, res) => {
//   const { transcript, headers, audio_id, userId, transcript_audio_id, history_id } =
//     req.body;

//   console.log("📥 request.body from deepseekController:", req.body);

//   const apiKey = process.env.DEEPSEEK_API_KEY;
//   const apiUrl = process.env.DEEPSEEK_API_URL;

//   console.log("🔑 API Key exists:", !!apiKey);
//   console.log("🌐 API URL:", apiUrl);

//   if (!apiKey) {
//     return res
//       .status(400)
//       .json({ error: "DeepSeek API key is missing in backend." });
//   }

//   if (!apiUrl) {
//     return res
//       .status(400)
//       .json({ error: "DeepSeek API URL is missing in backend." });
//   }

//   if (!transcript || !headers) {
//     return res
//       .status(400)
//       .json({ error: "Transcript and headers are required." });
//   }

//   try {
//     // STEP 1: Chunk transcript
//     const chunks = chunkTranscript(transcript);
//     console.log(`🧠 Chunking transcript into ${chunks.length} parts`);

//     // STEP 2: Insert all chunks with pending status
//     console.log("💾 STEP 2: Inserting chunks into database...");
//     console.log(`📊 Number of chunks to insert: ${chunks.length}`);

//     const chunkIds = [];

//     for (let idx = 0; idx < chunks.length; idx++) {
//       try {
//         console.log(`\n💾 Inserting chunk ${idx + 1}/${chunks.length}...`);

//         const chunk = chunks[idx];
//         const tokens = chunk.split(/\s+/).length;

//         const sql = `
//           INSERT INTO mom_chunks
//             (user_id, audio_id, transcript_audio_id, chunk_index, chunk_text, chunk_tokens, model_name, status)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const values = [
//           userId,
//           audio_id || null,
//           transcript_audio_id || null,
//           idx + 1,
//           chunk,
//           tokens,
//           "deepseek-chat",
//           "pending",
//         ];

//         const [result] = await db.query(sql, values);

//         console.log(
//           `✅ Chunk ${idx + 1} inserted successfully with ID: ${
//             result.insertId
//           }`
//         );
//         chunkIds.push(result.insertId);
//       } catch (insertError) {
//         console.error(
//           `❌ CRITICAL ERROR inserting chunk ${idx + 1}:`,
//           insertError.message
//         );
//         throw insertError;
//       }
//     }

//     console.log(`\n✅ STEP 2 COMPLETE: Inserted ${chunkIds.length} chunks`);

//     // STEP 3: Process chunks in BATCHES (parallel within batch, sequential between batches)
//     console.log("\n🚀 STEP 3: Starting BATCHED PARALLEL summarization...");
//     console.log(`🔢 Total chunks to process: ${chunks.length}`);

//     const BATCH_SIZE = 3; // Process 3 chunks at a time
//     const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
//     const summaryResults = [];

//     for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
//       const batchEnd = Math.min(i + BATCH_SIZE, chunks.length);
//       const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
//       const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

//       console.log(
//         `\n🔄 Processing batch ${batchNumber}/${totalBatches} (chunks ${
//           i + 1
//         }-${batchEnd})`
//       );

//       // Create promises for this batch
//       const batchPromises = [];
//       for (let idx = i; idx < batchEnd; idx++) {
//         const chunk = chunks[idx];
//         const chunkId = chunkIds[idx];
//         const chunkNumber = idx + 1;

//         batchPromises.push(
//           processSingleChunk(
//             chunk,
//             chunkId,
//             chunkNumber,
//             chunks.length,
//             apiUrl,
//             apiKey
//           )
//         );
//       }

//       // Process batch in parallel
//       try {
//         const batchResults = await Promise.all(batchPromises);
//         summaryResults.push(...batchResults);

//         const batchSuccess = batchResults.filter((r) => r.success).length;
//         const batchFail = batchResults.filter((r) => !r.success).length;
//         console.log(
//           `✅ Batch ${batchNumber} complete: ${batchSuccess} success, ${batchFail} failed`
//         );
//       } catch (batchError) {
//         console.error(`❌ Batch ${batchNumber} error:`, batchError.message);
//         // Continue with next batch even if this one fails
//       }

//       // Add delay between batches (except after last batch)
//       if (batchEnd < chunks.length) {
//         console.log(
//           `⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`
//         );
//         await delay(DELAY_BETWEEN_BATCHES);
//       }
//     }

//     console.log("\n✅ STEP 3 COMPLETE: All batches processed");

//     const successCount = summaryResults.filter((r) => r.success).length;
//     const failCount = summaryResults.filter((r) => !r.success).length;
//     console.log(`✅ Successful: ${successCount}, ❌ Failed: ${failCount}`);

//     // STEP 4: Fetch all chunk summaries from DB
//     console.log("\n📦 STEP 4: Fetching processed chunks from database...");
//     console.log(
//       `🔍 Query params: audio_id=${audio_id}, transcript_audio_id=${transcript_audio_id}, userId=${userId}`
//     );

//     // ✅ IMPROVED QUERY: Use BOTH audio_id and transcript_audio_id for better matching
//     // Also filter by userId for security and use the chunk IDs we just inserted
//     const [finalChunks] = await db.query(
//       `SELECT chunk_index, partial_mom, status, id, audio_id, transcript_audio_id 
//        FROM mom_chunks 
//        WHERE user_id = ? 
//        AND (audio_id = ? OR transcript_audio_id = ?)
//        AND status = 'done'
//        ORDER BY chunk_index ASC`,
//       [userId, audio_id, transcript_audio_id]
//     );

//     console.log(`✅ Fetched ${finalChunks.length} processed chunks from DB`);

//     if (finalChunks.length > 0) {
//       console.log(
//         `📋 Retrieved chunk IDs: ${finalChunks.map((c) => c.id).join(", ")}`
//       );
//       console.log(
//         `📋 Retrieved chunk indices: ${finalChunks
//           .map((c) => c.chunk_index)
//           .join(", ")}`
//       );
//     } else {
//       console.error(
//         `❌ No chunks found! Expected to find chunks with IDs: [${chunkIds.join(
//           ", "
//         )}]`
//       );
//       console.error(
//         `🔍 Debugging query with audio_id=${audio_id}, transcript_audio_id=${transcript_audio_id}`
//       );

//       // Debug query to see what's actually in the database
//       const [debugChunks] = await db.query(
//         `SELECT id, chunk_index, status, audio_id, transcript_audio_id 
//          FROM mom_chunks 
//          WHERE user_id = ? 
//          AND (audio_id = ? OR transcript_audio_id = ?)
//          ORDER BY chunk_index ASC`,
//         [userId, audio_id, transcript_audio_id]
//       );

//       console.log(
//         `🔍 Debug: Found ${debugChunks.length} chunks (any status):`,
//         debugChunks
//           .map((c) => `ID:${c.id} Index:${c.chunk_index} Status:${c.status}`)
//           .join(", ")
//       );
//     }

//     if (finalChunks.length === 0) {
//       throw new Error(
//         "No successful chunks to process for final MoM. Check if all chunks failed or are still processing."
//       );
//     }

//     // Merge all chunk summaries
//     const combinedText =
//       finalChunks.length === 1
//         ? finalChunks[0].partial_mom
//         : finalChunks
//             .map((c, idx) => `## Section ${idx + 1}\n${c.partial_mom}`)
//             .join("\n\n");

//     console.log(`\n📝 Combined text for final MoM:`);
//     console.log(`   - Total chunks merged: ${finalChunks.length}`);
//     console.log(`   - Combined length: ${combinedText.length} chars`);
//     console.log(
//       `   - Preview (first 300 chars): ${combinedText.substring(0, 300)}...`
//     );
//     console.log(
//       `   - Preview (last 300 chars): ...${combinedText.substring(
//         combinedText.length - 300
//       )}`
//     );

//     // Verify we're using summaries, not raw transcript
//     if (transcript && combinedText.includes(transcript.substring(0, 100))) {
//       console.warn(
//         "⚠️ WARNING: Combined text contains raw transcript! Should be summaries only."
//       );
//     } else {
//       console.log("✅ Confirmed: Using chunk summaries (not raw transcript)");
//     }

//     // STEP 5: Final MoM generation with retry
//     console.log("\n🎯 STEP 5: Generating final MoM...");
//     console.log(
//       `📝 Input for final MoM: ${combinedText.length} chars from ${finalChunks.length} chunk summaries`
//     );

//     const finalPrompt = buildPrompt(combinedText, headers);
//     console.log(`📦 Final prompt length: ${finalPrompt.length} chars`);
//     console.log(`📋 Headers to extract: ${headers.join(", ")}`);

//     const finalResponse = await retryWithBackoff(
//       () => callDeepSeekAPI(finalPrompt, apiUrl, apiKey, 120000),
//       3,
//       5000
//     );

//     console.log("✅ Final MoM API response received");
//     console.log(`📊 Response status: ${finalResponse.status}`);

//     const finalRaw = finalResponse.data.choices[0].message.content.trim();
//     console.log(`📄 Final MoM raw response length: ${finalRaw.length} chars`);
//     console.log(
//       `📄 Final MoM raw response preview:\n${finalRaw.substring(0, 500)}...`
//     );

//     let finalData;
//     try {
//       finalData = JSON.parse(finalRaw);
//       console.log("✅ Final MoM parsed successfully as JSON");
//     } catch {
//       console.log("⚠️ Attempting to extract JSON from response...");
//       const match = finalRaw.match(/\[.*\]/s);
//       if (match) {
//         finalData = JSON.parse(match[0]);
//         console.log("✅ JSON extracted successfully using regex");
//       } else {
//         console.error("❌ Failed to extract JSON from response");
//         finalData = [];
//       }
//     }

//     console.log(`📊 Final MoM structure:`);
//     console.log(`   - Number of items: ${finalData.length}`);
//     if (finalData.length > 0) {
//       console.log(
//         `   - First item keys: ${Object.keys(finalData[0]).join(", ")}`
//       );
//       console.log(`   - Sample item:`, JSON.stringify(finalData[0], null, 2));
//     }

//     // =====================
//     // STEP 6: Save Final MoM into history + Mark mom_chunks processed
//     // =====================
//     try {
//       console.log("💾 STEP 6: Saving final MoM to history...");

//       // Use the provided history_id directly to update the existing record
//       if (history_id) {
//         console.log(`📝 Updating existing history ID: ${history_id}`);
        
//         // Fetch existing record details first to preserve them
//         const [existingHistory] = await db.query(
//           `SELECT title, audioUrl, source FROM history WHERE id = ? AND user_id = ?`,
//           [history_id, userId]
//         );

//         let title = "Auto Generated MoM";
//         let audioUrl = null;
//         let source = audio_id;

//         if (existingHistory.length > 0) {
//           const row = existingHistory[0];
//           title = row.title || title;
//           audioUrl = row.audioUrl || audioUrl;
//           source = row.source || source;
//         }

//         const formattedDate = req.body.date || new Date().toISOString().slice(0, 19).replace("T", " ");

// await db.query(
//   `UPDATE history
//    SET isMoMGenerated = 1,
//        data = ?,
//        language = ?,
//        date = ?,
//        uploadedAt = ?
//    WHERE id = ? AND user_id = ?`,
//   [JSON.stringify(finalData), "english", formattedDate, formattedDate, history_id, userId]
// );

//         console.log(`✅ Updated existing history record ID: ${history_id}`);
//       } else {
//         console.log("🆕 No history_id provided — inserting new record");

//         // const formattedDate = req.body.date || new Date().toISOString().slice(0, 19).replace("T", " ");


//         await db.query(
//           `INSERT INTO history (user_id, source, title, audioUrl, isMoMGenerated, date, data, language, uploadedAt)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             userId,
//             audio_id,
//             "Auto Generated MoM",
//             null,
//             1,
//             formattedDate,
//             JSON.stringify(finalData),
//             "english",
//             formattedDate,
//           ]
//         );
//         console.log("✅ Created new history record");
//       }

//       console.log("✅ Final MoM saved successfully in history table");

//       // Mark chunks as processed
//       await db.query(
//         `UPDATE mom_chunks
//          SET is_final_processed = 1
//          WHERE user_id = ? AND (audio_id = ? OR transcript_audio_id = ?)`,
//         [userId, audio_id, transcript_audio_id]
//       );

//       console.log("✅ All mom_chunks marked as final processed");
//     } catch (saveErr) {
//       console.error("⚠️ Error saving final MoM to history:", saveErr.message);
//     }


//     // STEP 7: Return final MoM
//     console.log("\n✅ ALL STEPS COMPLETE - Sending response to frontend");

//     res.status(200).json({
//       success: true,
//       chunks: finalChunks,
//       final_mom: finalData,
//       summary: {
//         total_chunks: chunks.length,
//         successful_chunks: successCount,
//         failed_chunks: failCount,
//       },
//     });
//   } catch (error) {
//     console.error("\n❌ FATAL ERROR:", error.message);
//     console.error("Error stack:", error.stack);

//     res.status(500).json({
//       success: false,
//       error:
//         error.response?.data?.error?.message ||
//         error.message ||
//         "Failed to process transcript",
//     });
//   }
// };

// module.exports = { processTranscript };


const axios = require("axios");
const db = require("../config/db.js");

// =====================
// Helper: Delay function
// =====================
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =====================
// Helper: Retry with exponential backoff
// =====================
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        console.error(`❌ All ${maxRetries} attempts failed`);
        throw error;
      }

      // Don't retry on certain errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error(`❌ Auth error - not retrying`);
        throw error;
      }

      const waitTime = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }
}

// =====================
// Helper: Chunk Transcript Text
// =====================
function chunkTranscript(text) {
  const totalWords = text.split(/\s+/).length;

  let maxWords = 800;
  let overlapSentences = 1;

  if (totalWords <= 800) {
    maxWords = totalWords;
    overlapSentences = 0;
  } else if (totalWords <= 2000) {
    maxWords = 500;
    overlapSentences = 1;
  } else if (totalWords <= 5000) {
    maxWords = 700;
    overlapSentences = 2;
  } else if (totalWords <= 10000) {
    maxWords = 900;
    overlapSentences = 2;
  } else {
    maxWords = 1000;
    overlapSentences = 3;
  }

  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const words = sentence.trim().split(/\s+/).length;

    if (currentWordCount + words > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
      currentChunk = sentences.slice(Math.max(0, i - overlapSentences), i);
      currentWordCount = currentChunk.join(" ").split(/\s+/).length;
    }

    currentChunk.push(sentence);
    currentWordCount += words;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  console.log(
    `🧠 Total words: ${totalWords}, Chunk size: ${maxWords}, Total chunks: ${chunks.length}`
  );
  return chunks;
}

// =====================
// Build Summary Prompt
// =====================
const buildSummaryPrompt = (text) => `
You are a meeting transcript analyzer. Create a comprehensive summary that captures ALL critical information needed for generating Minutes of Meeting.

EXTRACTION GUIDELINES:
1. Extract ONLY information explicitly stated in the transcript
2. Preserve exact names, roles, dates, numbers, and technical terms
3. Capture the complete context: discussions → decisions → action items
4. Maintain chronological flow and logical connections between topics
5. Include ALL specific commitments, deadlines, and responsibilities mentioned
6. DO NOT infer, interpret, or add information not present in the text

SUMMARY STRUCTURE (150-250 words):
- Opening: Meeting context and participants (if mentioned)
- Key Discussions: Main topics covered with relevant details
- Decisions Made: Clear outcomes and agreements
- Action Items: Tasks identified with any mentioned owners/deadlines
- Closing: Next steps or follow-up points (if discussed)

Write in clear, connected paragraphs. Preserve the original terminology and phrasing.

Meeting Transcript:
${text}

Return only the detailed summary. No preamble or additional commentary.
`;

// =====================
// Build MoM prompt
// =====================
const buildPrompt = (text, headers) => `
You are a precision extraction system for Minutes of Meeting (MoM) generation.

CRITICAL INSTRUCTIONS:
1. Extract ONLY information explicitly stated in the meeting summary
2. Create concise, meaningful MoM entries - avoid lengthy descriptions
3. Each MoM entry = ONE distinct topic/decision/action discussed in the meeting
4. ALL header fields MUST be filled - use "" ONLY if information is genuinely absent
5. DO NOT infer or assume - extract only what is stated

FIELD-BY-FIELD EXTRACTION RULES (Headers: ${headers.join(", ")}):

For each distinct meeting topic, extract:

**Discussion Summary / Description**:
- Write 2-3 concise sentences maximum
- Focus on: What was discussed + Key decision/outcome
- Avoid unnecessary details - capture only the core point
- Example: "Team discussed Q3 evaluation process. Agreed to add team leaders as second reviewers to improve accuracy."

**Action Items**:
- List specific tasks to be completed
- Use bullet points (•) for multiple items
- Be specific and actionable
- If discussion implies work but no explicit action mentioned, derive the logical action
- Example: "• Complete Q3 evaluations • Send updated sheets to manager"
- NEVER leave empty if the discussion indicates follow-up work

**Responsibility / Action Party**:
- Extract specific names, roles, or teams mentioned
- If multiple people, list all: "Team leaders, Mr. Faisal, GSU team"
- If responsibility is implied from context (e.g., someone presenting/leading), include them
- Look for: who presented, who was assigned, who is accountable
- NEVER leave empty if people/teams are mentioned in the discussion

**Target Date / Deadline**:
- Extract any specific date or timeframe mentioned
- Include: exact dates, relative timeframes ("within a week", "by Q3 end")
- If no deadline exists, use ""
- Example: "December 31st" or "within one week"

**Status**:
- Extract current status if explicitly mentioned: "Completed", "In Progress", "Pending"
- Use "" if no status is mentioned

CONSOLIDATION RULES:
- Group related discussions into ONE entry (don't fragment the same topic)
- If a topic has multiple aspects (problem + solution + action), combine them coherently
- Avoid redundant entries that repeat the same discussion

WHAT TO AVOID:
- Long, verbose descriptions (keep it concise!)
- Leaving fields empty when information exists in the summary
- Creating multiple entries for the same topic
- Including unnecessary background details

EXTRACTION PROCESS:
1. Identify each distinct meeting topic/decision point
2. For EACH topic, scan the summary for ALL related information
3. Extract and fill ALL header fields based on available information
4. Keep descriptions brief but complete
5. Ensure action items and responsibilities are specific

OUTPUT FORMAT:
- Return ONLY valid JSON array: [ {...}, {...} ]
- NO markdown, NO code blocks, NO explanatory text
- Each object must have ALL fields: ${headers.join(", ")}
- Use "" only when information is truly absent

Meeting Summary:
${text}

Return the JSON array only, starting with [ and ending with ]:`;

// =====================
// Enhanced API Configuration
// =====================
async function callDeepSeekAPI(prompt, apiUrl, apiKey, timeout = 120000) {
  const response = await axios.post(
    apiUrl,
    {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at creating concise, accurate Minutes of Meeting. Extract all relevant information from meeting summaries and organize it into clear, brief MoM entries. Every field should be filled when information is available. Focus on clarity, completeness, and brevity. Never leave fields empty unnecessarily.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      top_p: 0.95,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: (status) => status < 500,
      httpAgent: new (require("http").Agent)({
        keepAlive: true,
        keepAliveMsecs: 30000,
      }),
      httpsAgent: new (require("https").Agent)({
        keepAlive: true,
        keepAliveMsecs: 30000,
        rejectUnauthorized: true,
      }),
    }
  );

  if (response.status >= 400) {
    throw new Error(
      `API error: ${response.status} - ${JSON.stringify(response.data)}`
    );
  }

  return response;
}
// =====================
// Process single chunk with retry
// =====================
async function processSingleChunk(
  chunk,
  chunkId,
  chunkNumber,
  totalChunks,
  apiUrl,
  apiKey
) {
  console.log(
    `\n📝 Processing chunk ${chunkNumber}/${totalChunks} (ID: ${chunkId})`
  );
  console.log(
    `📊 Chunk ${chunkNumber} preview: "${chunk.substring(0, 100)}..."`
  );

  try {
    console.log(`🌐 Sending chunk ${chunkNumber} to DeepSeek API...`);

    // Wrap API call in retry logic
    const response = await retryWithBackoff(
      () => callDeepSeekAPI(buildSummaryPrompt(chunk), apiUrl, apiKey, 90000),
      3,
      3000
    );

    console.log(`✅ Chunk ${chunkNumber} API response received`);
    console.log(`📊 Response status: ${response.status}`);

    const raw = response?.data?.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      throw new Error("Empty response from API");
    }

    console.log(`📄 Chunk ${chunkNumber} summary length: ${raw.length} chars`);
    console.log(`💾 Saving chunk ${chunkNumber} summary to database...`);

    // Update chunk with summary
    const updateSql = `
      UPDATE mom_chunks 
      SET partial_mom = ?, model_response_json = ?, status = 'done', error_message = NULL
      WHERE id = ?
    `;

    await db.query(updateSql, [raw, raw, chunkId]);

    console.log(`✅ Chunk ${chunkNumber} summary saved to DB successfully`);

    return { success: true, chunkNumber, summary: raw };
  } catch (err) {
    console.error(`❌ Chunk ${chunkNumber} processing failed:`, err.message);

    // Mark as failed in DB
    try {
      const failSql = `
        UPDATE mom_chunks
        SET status='failed', error_message=?
        WHERE id=?
      `;
      await db.query(failSql, [err.message, chunkId]);
      console.log(`⚠️ Chunk ${chunkNumber} marked as failed in DB`);
    } catch (dbErr) {
      console.error(
        `❌ Failed to update error status for chunk ${chunkNumber}:`,
        dbErr.message
      );
    }

    return { success: false, chunkNumber, error: err.message };
  }
}

// =====================
// Main Processing
// =====================
const processTranscript = async (req, res) => {
  const { transcript, headers, audio_id, userId, transcript_audio_id, history_id } =
    req.body;

  console.log("📥 request.body from deepseekController:", req.body);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL;

  console.log("🔑 API Key exists:", !!apiKey);
  console.log("🌐 API URL:", apiUrl);

  if (!apiKey) {
    return res
      .status(400)
      .json({ error: "DeepSeek API key is missing in backend." });
  }

  if (!apiUrl) {
    return res
      .status(400)
      .json({ error: "DeepSeek API URL is missing in backend." });
  }

  if (!transcript || !headers) {
    return res
      .status(400)
      .json({ error: "Transcript and headers are required." });
  }

  try {
    // STEP 1: Chunk transcript
    const chunks = chunkTranscript(transcript);
    console.log(`🧠 Chunking transcript into ${chunks.length} parts`);

    // STEP 2: Insert all chunks with pending status
    console.log("💾 STEP 2: Inserting chunks into database...");
    console.log(`📊 Number of chunks to insert: ${chunks.length}`);

    const chunkIds = [];

    for (let idx = 0; idx < chunks.length; idx++) {
      try {
        console.log(`\n💾 Inserting chunk ${idx + 1}/${chunks.length}...`);

        const chunk = chunks[idx];
        const tokens = chunk.split(/\s+/).length;

        const sql = `
          INSERT INTO mom_chunks
            (user_id, audio_id, transcript_audio_id, chunk_index, chunk_text, chunk_tokens, model_name, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          userId,
          audio_id || null,
          transcript_audio_id || null,
          idx + 1,
          chunk,
          tokens,
          "deepseek-chat",
          "pending",
        ];

        const [result] = await db.query(sql, values);

        console.log(
          `✅ Chunk ${idx + 1} inserted successfully with ID: ${
            result.insertId
          }`
        );
        chunkIds.push(result.insertId);
      } catch (insertError) {
        console.error(
          `❌ CRITICAL ERROR inserting chunk ${idx + 1}:`,
          insertError.message
        );
        throw insertError;
      }
    }

    console.log(`\n✅ STEP 2 COMPLETE: Inserted ${chunkIds.length} chunks`);

    // STEP 3: Process chunks in BATCHES (parallel within batch, sequential between batches)
    console.log("\n🚀 STEP 3: Starting BATCHED PARALLEL summarization...");
    console.log(`🔢 Total chunks to process: ${chunks.length}`);

    const BATCH_SIZE = 3; // Process 3 chunks at a time
    const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
    const summaryResults = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, chunks.length);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

      console.log(
        `\n🔄 Processing batch ${batchNumber}/${totalBatches} (chunks ${
          i + 1
        }-${batchEnd})`
      );

      // Create promises for this batch
      const batchPromises = [];
      for (let idx = i; idx < batchEnd; idx++) {
        const chunk = chunks[idx];
        const chunkId = chunkIds[idx];
        const chunkNumber = idx + 1;

        batchPromises.push(
          processSingleChunk(
            chunk,
            chunkId,
            chunkNumber,
            chunks.length,
            apiUrl,
            apiKey
          )
        );
      }

      // Process batch in parallel
      try {
        const batchResults = await Promise.all(batchPromises);
        summaryResults.push(...batchResults);

        const batchSuccess = batchResults.filter((r) => r.success).length;
        const batchFail = batchResults.filter((r) => !r.success).length;
        console.log(
          `✅ Batch ${batchNumber} complete: ${batchSuccess} success, ${batchFail} failed`
        );
      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} error:`, batchError.message);
        // Continue with next batch even if this one fails
      }

      // Add delay between batches (except after last batch)
      if (batchEnd < chunks.length) {
        console.log(
          `⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`
        );
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log("\n✅ STEP 3 COMPLETE: All batches processed");

    const successCount = summaryResults.filter((r) => r.success).length;
    const failCount = summaryResults.filter((r) => !r.success).length;
    console.log(`✅ Successful: ${successCount}, ❌ Failed: ${failCount}`);

    // STEP 4: Fetch all chunk summaries from DB
    console.log("\n📦 STEP 4: Fetching processed chunks from database...");
    console.log(
      `🔍 Query params: audio_id=${audio_id}, transcript_audio_id=${transcript_audio_id}, userId=${userId}`
    );

    const [finalChunks] = await db.query(
      `SELECT chunk_index, partial_mom, status, id, audio_id, transcript_audio_id 
       FROM mom_chunks 
       WHERE user_id = ? 
       AND (audio_id = ? OR transcript_audio_id = ?)
       AND status = 'done'
       ORDER BY chunk_index ASC`,
      [userId, audio_id, transcript_audio_id]
    );

    console.log(`✅ Fetched ${finalChunks.length} processed chunks from DB`);

    if (finalChunks.length > 0) {
      console.log(
        `📋 Retrieved chunk IDs: ${finalChunks.map((c) => c.id).join(", ")}`
      );
      console.log(
        `📋 Retrieved chunk indices: ${finalChunks
          .map((c) => c.chunk_index)
          .join(", ")}`
      );
    } else {
      console.error(
        `❌ No chunks found! Expected to find chunks with IDs: [${chunkIds.join(
          ", "
        )}]`
      );
      console.error(
        `🔍 Debugging query with audio_id=${audio_id}, transcript_audio_id=${transcript_audio_id}`
      );

      // Debug query to see what's actually in the database
      const [debugChunks] = await db.query(
        `SELECT id, chunk_index, status, audio_id, transcript_audio_id 
         FROM mom_chunks 
         WHERE user_id = ? 
         AND (audio_id = ? OR transcript_audio_id = ?)
         ORDER BY chunk_index ASC`,
        [userId, audio_id, transcript_audio_id]
      );

      console.log(
        `🔍 Debug: Found ${debugChunks.length} chunks (any status):`,
        debugChunks
          .map((c) => `ID:${c.id} Index:${c.chunk_index} Status:${c.status}`)
          .join(", ")
      );
    }

    if (finalChunks.length === 0) {
      throw new Error(
        "No successful chunks to process for final MoM. Check if all chunks failed or are still processing."
      );
    }

    // Merge all chunk summaries
    const combinedText =
      finalChunks.length === 1
        ? finalChunks[0].partial_mom
        : finalChunks
            .map((c, idx) => `## Section ${idx + 1}\n${c.partial_mom}`)
            .join("\n\n");

    console.log(`\n📝 Combined text for final MoM:`);
    console.log(`   - Total chunks merged: ${finalChunks.length}`);
    console.log(`   - Combined length: ${combinedText.length} chars`);
    console.log(
      `   - Preview (first 300 chars): ${combinedText.substring(0, 300)}...`
    );
    console.log(
      `   - Preview (last 300 chars): ...${combinedText.substring(
        combinedText.length - 300
      )}`
    );

    // Verify we're using summaries, not raw transcript
    if (transcript && combinedText.includes(transcript.substring(0, 100))) {
      console.warn(
        "⚠️ WARNING: Combined text contains raw transcript! Should be summaries only."
      );
    } else {
      console.log("✅ Confirmed: Using chunk summaries (not raw transcript)");
    }

    // STEP 5: Final MoM generation with retry
    console.log("\n🎯 STEP 5: Generating final MoM...");
    console.log(
      `📝 Input for final MoM: ${combinedText.length} chars from ${finalChunks.length} chunk summaries`
    );

    const finalPrompt = buildPrompt(combinedText, headers);
    console.log(`📦 Final prompt length: ${finalPrompt.length} chars`);
    console.log(`📋 Headers to extract: ${headers.join(", ")}`);

    const finalResponse = await retryWithBackoff(
      () => callDeepSeekAPI(finalPrompt, apiUrl, apiKey, 120000),
      3,
      5000
    );

    console.log("✅ Final MoM API response received");
    console.log(`📊 Response status: ${finalResponse.status}`);

    const finalRaw = finalResponse.data.choices[0].message.content.trim();
    console.log(`📄 Final MoM raw response length: ${finalRaw.length} chars`);
    console.log(
      `📄 Final MoM raw response preview:\n${finalRaw.substring(0, 500)}...`
    );

    let finalData;
    try {
      // Remove markdown code blocks if present
      let cleaned = finalRaw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      finalData = JSON.parse(cleaned);
      console.log("✅ Final MoM parsed successfully as JSON");
      
      // If it's a single object, wrap in array
      if (!Array.isArray(finalData)) {
        console.log("⚠️ Response is object, wrapping in array");
        finalData = [finalData];
      }
    } catch {
      console.log("⚠️ Attempting to extract JSON from response...");
      
      // Try to match array first
      let match = finalRaw.match(/\[[\s\S]*\]/);
      if (match) {
        finalData = JSON.parse(match[0]);
        console.log("✅ JSON array extracted successfully");
      } else {
        // Try to match object and wrap in array
        match = finalRaw.match(/\{[\s\S]*\}/);
        if (match) {
          finalData = [JSON.parse(match[0])];
          console.log("✅ JSON object extracted and wrapped in array");
        } else {
          console.error("❌ Failed to extract JSON from response");
          finalData = [];
        }
      }
    }

    console.log(`📊 Final MoM structure:`);
    console.log(`   - Number of items: ${finalData.length}`);
    if (finalData.length > 0) {
      console.log(
        `   - First item keys: ${Object.keys(finalData[0]).join(", ")}`
      );
      console.log(`   - Sample item:`, JSON.stringify(finalData[0], null, 2));
    }

    // =====================
    // STEP 6: Save Final MoM into history + Mark mom_chunks processed
    // =====================
    try {
      console.log("💾 STEP 6: Saving final MoM to history...");

      const formattedDate = req.body.date || new Date().toISOString().slice(0, 19).replace("T", " ");

      // Use the provided history_id directly to update the existing record
      if (history_id) {
        console.log(`📝 Updating existing history ID: ${history_id}`);
        
        // Fetch existing record details first to preserve them
        const [existingHistory] = await db.query(
          `SELECT title, audioUrl, source FROM history WHERE id = ? AND user_id = ?`,
          [history_id, userId]
        );

        let title = "Auto Generated MoM";
        let audioUrl = null;
        let source = audio_id;

        if (existingHistory.length > 0) {
          const row = existingHistory[0];
          title = row.title || title;
          audioUrl = row.audioUrl || audioUrl;
          source = row.source || source;
        }

        await db.query(
          `UPDATE history
           SET isMoMGenerated = 1,
               data = ?,
               language = ?,
               date = ?,
               uploadedAt = ?
           WHERE id = ? AND user_id = ?`,
          [JSON.stringify(finalData), "english", formattedDate, formattedDate, history_id, userId]
        );

        console.log(`✅ Updated existing history record ID: ${history_id}`);
      } else {
        console.log("🆕 No history_id provided — inserting new record");

        await db.query(
          `INSERT INTO history (user_id, source, title, audioUrl, isMoMGenerated, date, data, language, uploadedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            audio_id,
            "Auto Generated MoM",
            null,
            1,
            formattedDate,
            JSON.stringify(finalData),
            "english",
            formattedDate,
          ]
        );
        console.log("✅ Created new history record");
      }

      console.log("✅ Final MoM saved successfully in history table");

      // Mark chunks as processed
      await db.query(
        `UPDATE mom_chunks
         SET is_final_processed = 1
         WHERE user_id = ? AND (audio_id = ? OR transcript_audio_id = ?)`,
        [userId, audio_id, transcript_audio_id]
      );

      console.log("✅ All mom_chunks marked as final processed");
    } catch (saveErr) {
      console.error("⚠️ Error saving final MoM to history:", saveErr.message);
    }


    // STEP 7: Return final MoM
    console.log("\n✅ ALL STEPS COMPLETE - Sending response to frontend");

    res.status(200).json({
      success: true,
      chunks: finalChunks,
      final_mom: finalData,
      summary: {
        total_chunks: chunks.length,
        successful_chunks: successCount,
        failed_chunks: failCount,
      },
    });
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to process transcript",
    });
  }
};

module.exports = { processTranscript };