 

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
1. Extract ONLY information explicitly stated in the meeting summary.
2. Create concise, meaningful MoM entries. Avoid long descriptions.
3. Each MoM entry must cover ONE distinct topic, decision, or action discussed in the meeting.
4. All header fields provided by the user MUST be filled. If a field is not explicitly mentioned, infer the closest relevant information without inventing facts.
5. Apply the following formatting rule:
   - The **first header** in the user-provided headers list (e.g., Discussion Summary) should have a **short content-based label** summarizing the topic, e.g., "Performance concern: Manager raised issues about evaluation accuracy."
   - All other headers should contain **only the plain extracted content**, without any prefix.

6. Dates:
   - If dates are explicitly mentioned in the summary (e.g., "December 31st", "31/12", "next Friday", "end of Q3"), extract and include them in the relevant fields.
   - If dates are not explicitly mentioned, infer approximate timing intelligently based on context (e.g., "next quarter", "end of month") but do NOT invent exact dates.
   - Always reflect the date as clearly as it appears or reasonably inferred from the summary.

7. Multiple items:
   - If multiple distinct topics or decisions are present in the summary, create **separate MoM entries** for each.

8. Accuracy:
   - Do NOT hallucinate information.
   - Only extract information present in the summary.
   - Responsibilities, action items, or status must be based on what is explicitly mentioned or strongly implied.

9. Detail:
   - Include all headers with as much detail as possible from the summary.
   - List items clearly and concisely, suitable for a professional MoM.

INPUTS:
- Meeting Summary: ${text}
- Headers: ${headers} (any list of headers user sets; the first header will receive the content-based label)

OUTPUT FORMAT:
1. Return ONLY a JSON array, starting with [ and ending with ].
2. Each object must include **all headers** provided by the user.
3. Each entry should be concise, meaningful, and distinct.
4. Only the **first header** should have a short content-based label; all other headers remain plain.
5. Dates should be extracted or inferred intelligently as described above.

EXAMPLE:
If headers = ["Discussion Summary", "Action Items", "Responsibility", "Target Date", "Status"], an entry should look like:

{
  "Discussion Summary": "Performance concern: Manager raised issues about evaluation accuracy following recent incidents.",
  "Action Items": "Team Leaders to share accountability for evaluation accuracy alongside Heads of Unit.",
  "Responsibility": "Team Leaders and Heads of Unit",
  "Target Date": "December 31st (or as per Q3 deadline mentioned in text)",
  "Status": "In progress"
}

TASK:
Using the headers provided (${headers}) and the meeting summary (${text}), extract all relevant MoM entries. Only the **first header** should have a **short content-based label**; all other headers should remain plain. Ensure all details are captured, dates are included where mentioned or inferred responsibly, and multiple topics are separated into distinct, accurate entries.
`;

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