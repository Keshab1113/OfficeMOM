// // utils/semanticChunker.js
// const axios = require("axios");

// const cosineSimilarity = (a, b) => {
//   const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
//   const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
//   const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
//   return dot / (magA * magB);
// };

// async function getEmbeddings(sentences, apiKey, model = "text-embedding-3-small") {
//   try {
//     const res = await axios.post(
//       "https://api.openai.com/v1/embeddings",
//       { model, input: sentences },
//       { headers: { Authorization: `Bearer ${apiKey}` } }
//     );
//     return res.data.data.map((d) => d.embedding);
//   } catch (err) {
//     console.error("❌ Error generating embeddings:", err.response?.data || err.message);
//     throw err;
//   }
// }

// async function semanticChunkTranscript(text, apiKey) {
//   // 1️⃣ Better sentence splitting using punctuation + newlines
//   const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);

//   if (sentences.length <= 3) {
//     console.log("⚠️ Too few sentences, returning single chunk");
//     return [text.trim()];
//   }

//   // 2️⃣ Generate embeddings
//   const embeddings = await getEmbeddings(sentences, apiKey);

//   // 3️⃣ Compute cosine similarities
//   const similarities = [];
//   for (let i = 0; i < embeddings.length - 1; i++) {
//     similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
//   }

//   // 4️⃣ Adaptive threshold = median - dynamic margin
//   const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
//   const stdDev =
//     Math.sqrt(similarities.map(s => Math.pow(s - avgSim, 2)).reduce((a, b) => a + b, 0) / similarities.length);
//   const dynamicThreshold = avgSim - stdDev * 0.5; // more adaptive to data

//   console.log(`📊 Avg sim: ${avgSim.toFixed(3)}, StdDev: ${stdDev.toFixed(3)}, Threshold: ${dynamicThreshold.toFixed(3)}`);

//   // 5️⃣ Detect boundaries
//   const boundaries = [];
//   for (let i = 0; i < similarities.length; i++) {
//     if (similarities[i] < dynamicThreshold) boundaries.push(i + 1);
//   }

//   // 6️⃣ Merge into chunks
//   const chunks = [];
//   let start = 0;
//   for (const boundary of boundaries) {
//     const chunkText = sentences.slice(start, boundary).join(" ").trim();
//     if (chunkText) chunks.push(chunkText);
//     start = boundary;
//   }
//   if (start < sentences.length) chunks.push(sentences.slice(start).join(" ").trim());

//   // 7️⃣ Merge small chunks (shorter than 150 words)
//   const finalChunks = [];
//   for (let i = 0; i < chunks.length; i++) {
//     const words = chunks[i].split(/\s+/).length;
//     if (words < 150 && i > 0) {
//       finalChunks[finalChunks.length - 1] += " " + chunks[i];
//     } else {
//       finalChunks.push(chunks[i]);
//     }
//   }

//   console.log(`🧠 Semantic Chunking Complete: ${finalChunks.length} chunks created`);
//   return finalChunks;
// }

// module.exports = { semanticChunkTranscript };


// const axios = require("axios");

// const cosineSimilarity = (a, b) => {
//   const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
//   const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
//   const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
//   return dot / (magA * magB);
// };

// // Add delay helper
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// // Retry wrapper for embedding API
// async function retryEmbedding(fn, maxRetries = 3, baseDelay = 2000) {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`🔄 Embedding attempt ${attempt}/${maxRetries}...`);
//       return await fn();
//     } catch (error) {
//       const isLastAttempt = attempt === maxRetries;
      
//       if (isLastAttempt) {
//         console.error(`❌ All ${maxRetries} embedding attempts failed`);
//         throw error;
//       }

//       // Check for rate limit or timeout errors
//       if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
//         console.warn(`⏳ Request timeout on attempt ${attempt}`);
//       }

//       const waitTime = baseDelay * Math.pow(2, attempt - 1);
//       console.log(`⏳ Waiting ${waitTime}ms before retry...`);
//       await delay(waitTime);
//     }
//   }
// }

// async function getEmbeddings(sentences, apiKey, model = "text-embedding-3-small") {
//   // CRITICAL: Add timeout and batch processing
//   const BATCH_SIZE = 50; // OpenAI recommends max 2048, but smaller is safer
//   const TIMEOUT = 30000; // 30 second timeout
  
//   console.log(`📦 Processing ${sentences.length} sentences for embeddings...`);
  
//   try {
//     const allEmbeddings = [];
    
//     // Process in batches to avoid timeouts and rate limits
//     for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
//       const batch = sentences.slice(i, i + BATCH_SIZE);
//       const batchNum = Math.floor(i / BATCH_SIZE) + 1;
//       const totalBatches = Math.ceil(sentences.length / BATCH_SIZE);
      
//       console.log(`📤 Sending embedding batch ${batchNum}/${totalBatches} (${batch.length} sentences)`);
      
//       const embeddings = await retryEmbedding(async () => {
//         const res = await axios.post(
//           "https://api.openai.com/v1/embeddings",
//           { model, input: batch },
//           {
//             headers: {
//               Authorization: `Bearer ${apiKey}`,
//               "Content-Type": "application/json"
//             },
//             timeout: TIMEOUT,
//             maxContentLength: Infinity,
//             maxBodyLength: Infinity
//           }
//         );
//         return res.data.data.map((d) => d.embedding);
//       });
      
//       allEmbeddings.push(...embeddings);
//       console.log(`✅ Batch ${batchNum}/${totalBatches} completed`);
      
//       // Add small delay between batches to avoid rate limits
//       if (i + BATCH_SIZE < sentences.length) {
//         await delay(500);
//       }
//     }
    
//     console.log(`✅ All embeddings generated: ${allEmbeddings.length} total`);
//     return allEmbeddings;
    
//   } catch (err) {
//     console.error("❌ Error generating embeddings:", err.response?.data || err.message);
//     console.error("Error code:", err.code);
//     console.error("Error stack:", err.stack);
//     throw err;
//   }
// }

// async function semanticChunkTranscript(text, apiKey) {
//   console.log("🧠 Starting semantic chunking...");
//   console.log(`📄 Input text length: ${text.length} chars`);
  
//   if (!apiKey) {
//     console.error("❌ OpenAI API key is missing!");
//     throw new Error("OpenAI API key is required for semantic chunking");
//   }
  
//   // 1️⃣ Better sentence splitting using punctuation + newlines
//   const sentences = text
//     .split(/(?<=[.!?])\s+(?=[A-Z])/)
//     .filter(s => s.trim().length > 0);

//   console.log(`📝 Split into ${sentences.length} sentences`);

//   if (sentences.length <= 3) {
//     console.log("⚠️ Too few sentences, returning single chunk");
//     return [text.trim()];
//   }

//   // 2️⃣ Generate embeddings with error handling
//   let embeddings;
//   try {
//     embeddings = await getEmbeddings(sentences, apiKey);
//   } catch (embeddingError) {
//     console.error("❌ Embedding generation failed, falling back to simple chunking");
//     // Fallback: split by word count
//     const FALLBACK_CHUNK_SIZE = 500;
//     const words = text.split(/\s+/);
//     const fallbackChunks = [];
    
//     for (let i = 0; i < words.length; i += FALLBACK_CHUNK_SIZE) {
//       fallbackChunks.push(words.slice(i, i + FALLBACK_CHUNK_SIZE).join(" "));
//     }
    
//     console.log(`⚠️ Using fallback chunking: ${fallbackChunks.length} chunks`);
//     return fallbackChunks;
//   }

//   // 3️⃣ Compute cosine similarities
//   const similarities = [];
//   for (let i = 0; i < embeddings.length - 1; i++) {
//     similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
//   }

//   // 4️⃣ Adaptive threshold
//   const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
//   const stdDev = Math.sqrt(
//     similarities.map(s => Math.pow(s - avgSim, 2)).reduce((a, b) => a + b, 0) / similarities.length
//   );
//   const dynamicThreshold = avgSim - stdDev * 0.5;

//   console.log(`📊 Similarity stats:`);
//   console.log(`   - Average: ${avgSim.toFixed(3)}`);
//   console.log(`   - StdDev: ${stdDev.toFixed(3)}`);
//   console.log(`   - Threshold: ${dynamicThreshold.toFixed(3)}`);

//   // 5️⃣ Detect boundaries
//   const boundaries = [];
//   for (let i = 0; i < similarities.length; i++) {
//     if (similarities[i] < dynamicThreshold) {
//       boundaries.push(i + 1);
//     }
//   }
//   console.log(`🔍 Found ${boundaries.length} semantic boundaries`);

//   // 6️⃣ Merge into chunks
//   const chunks = [];
//   let start = 0;
//   for (const boundary of boundaries) {
//     const chunkText = sentences.slice(start, boundary).join(" ").trim();
//     if (chunkText) chunks.push(chunkText);
//     start = boundary;
//   }
//   if (start < sentences.length) {
//     chunks.push(sentences.slice(start).join(" ").trim());
//   }

//   console.log(`📦 Initial chunks created: ${chunks.length}`);

//   // 7️⃣ Merge small chunks (shorter than 150 words)
//   const finalChunks = [];
//   for (let i = 0; i < chunks.length; i++) {
//     const words = chunks[i].split(/\s+/).length;
//     if (words < 150 && finalChunks.length > 0) {
//       finalChunks[finalChunks.length - 1] += " " + chunks[i];
//     } else {
//       finalChunks.push(chunks[i]);
//     }
//   }

//   console.log(`✅ Semantic Chunking Complete: ${finalChunks.length} final chunks`);
  
//   // Log chunk sizes for debugging
//   finalChunks.forEach((chunk, idx) => {
//     const wordCount = chunk.split(/\s+/).length;
//     console.log(`   Chunk ${idx + 1}: ${wordCount} words`);
//   });

//   return finalChunks;
// }

// module.exports = { semanticChunkTranscript }; 


// utils/semanticChunker.js
const axios = require("axios");

// =====================
// Cosine Similarity Calculator
// =====================
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
};

// =====================
// Delay Helper
// =====================
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =====================
// Token Counter (Universal for all languages)
// =====================
let tiktoken;
try {
  tiktoken = require("tiktoken");
} catch (err) {
  console.warn("⚠️ tiktoken not installed. Run: npm install tiktoken");
  tiktoken = null;
}

function getTokenCount(text) {
  if (tiktoken) {
    try {
      const encoding = tiktoken.encoding_for_model("text-embedding-3-small");
      const tokens = encoding.encode(text);
      encoding.free();
      return tokens.length;
    } catch (err) {
      console.warn("⚠️ tiktoken error:", err.message);
    }
  }
  
  // Fallback: Conservative estimate for any language
  // Non-ASCII (Hindi, Chinese, etc.) ≈ 2.5 tokens/char
  // ASCII (English) ≈ 0.25 tokens/char
  let estimate = 0;
  for (const char of text) {
    estimate += char.charCodeAt(0) > 127 ? 2.5 : 0.25;
  }
  return Math.ceil(estimate);
}

// =====================
// Retry Wrapper with Exponential Backoff
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

      // Don't retry on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error(`❌ Authentication error - not retrying`);
        throw error;
      }

      const waitTime = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }
}

// =====================
// Universal Sentence Splitter
// =====================
function universalSentenceSplit(text) {
  console.log("📝 Splitting text into sentences...");
  
  // Split on common sentence terminators across languages:
  // Western: . ! ?
  // Hindi/Sanskrit: ।
  // Chinese/Japanese: 。！？
  // Myanmar: ။
  // Khmer: ។
  // Arabic: ؟ ۔
  // Plus double newlines for paragraph breaks
  
  const sentences = text
    .split(/(?<=[.!?।。！？။។؟۔])\s+|\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Remove tiny fragments

  console.log(`   Found ${sentences.length} sentences`);
  
  // If splitting failed (too few sentences), try paragraph splitting
  if (sentences.length < 3) {
    console.log("⚠️ Few sentences found, trying paragraph split...");
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 20);
    
    if (paragraphs.length >= 3) {
      console.log(`   Found ${paragraphs.length} paragraphs`);
      return paragraphs;
    }
    
    // Last resort: fixed character chunks
    console.log("⚠️ Using fixed-size character chunks");
    const CHUNK_SIZE = 800;
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const chunk = text.substring(i, i + CHUNK_SIZE).trim();
      if (chunk) chunks.push(chunk);
    }
    console.log(`   Created ${chunks.length} character-based chunks`);
    return chunks;
  }
  
  return sentences;
}

// =====================
// Get Embeddings with Smart Batching
// =====================
async function getEmbeddings(sentences, apiKey, model = "text-embedding-3-small") {
  const MAX_TOKENS_PER_BATCH = 6000; // Safe buffer under 8192 limit
  const TIMEOUT = 45000; // 45 seconds
  
  console.log(`📦 Generating embeddings for ${sentences.length} segments...`);
  
  const allEmbeddings = [];
  let currentBatch = [];
  let currentTokens = 0;
  let batchNum = 1;
  
  // Process sentences in token-aware batches
  for (let i = 0; i < sentences.length; i++) {
    const segmentTokens = getTokenCount(sentences[i]);
    
    // If single segment exceeds limit, split it
    if (segmentTokens > MAX_TOKENS_PER_BATCH) {
      console.warn(`⚠️ Segment ${i + 1} too large (${segmentTokens} tokens), splitting...`);
      
      const words = sentences[i].split(/\s+/);
      const midpoint = Math.floor(words.length / 2);
      const part1 = words.slice(0, midpoint).join(" ");
      const part2 = words.slice(midpoint).join(" ");
      
      sentences.splice(i, 1, part1, part2);
      console.log(`   Split into: ${getTokenCount(part1)} + ${getTokenCount(part2)} tokens`);
      i--; // Reprocess from current position
      continue;
    }
    
    // If adding this segment exceeds batch limit, process current batch first
    if (currentTokens + segmentTokens > MAX_TOKENS_PER_BATCH && currentBatch.length > 0) {
      console.log(`📤 Processing batch ${batchNum}: ${currentBatch.length} segments (${currentTokens} tokens)`);
      
      try {
        const embeddings = await retryWithBackoff(async () => {
          const res = await axios.post(
            "https://api.openai.com/v1/embeddings",
            { model, input: currentBatch },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              },
              timeout: TIMEOUT,
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            }
          );
          return res.data.data.map((d) => d.embedding);
        });
        
        allEmbeddings.push(...embeddings);
        console.log(`✅ Batch ${batchNum} complete (${embeddings.length} embeddings)`);
      } catch (batchError) {
        console.error(`❌ Batch ${batchNum} failed:`, batchError.message);
        throw batchError;
      }
      
      // Reset for next batch
      currentBatch = [];
      currentTokens = 0;
      batchNum++;
      
      // Rate limit protection
      await delay(800);
    }
    
    // Add segment to current batch
    currentBatch.push(sentences[i]);
    currentTokens += segmentTokens;
  }
  
  // Process final batch
  if (currentBatch.length > 0) {
    console.log(`📤 Processing final batch ${batchNum}: ${currentBatch.length} segments (${currentTokens} tokens)`);
    
    try {
      const embeddings = await retryWithBackoff(async () => {
        const res = await axios.post(
          "https://api.openai.com/v1/embeddings",
          { model, input: currentBatch },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            timeout: TIMEOUT,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );
        return res.data.data.map((d) => d.embedding);
      });
      
      allEmbeddings.push(...embeddings);
      console.log(`✅ Batch ${batchNum} complete (${embeddings.length} embeddings)`);
    } catch (batchError) {
      console.error(`❌ Final batch failed:`, batchError.message);
      throw batchError;
    }
  }
  
  console.log(`✅ Total embeddings generated: ${allEmbeddings.length}`);
  return allEmbeddings;
}

// =====================
// Main Semantic Chunking Function
// =====================
async function semanticChunkTranscript(text, apiKey) {
  console.log("\n🧠 Starting Universal Semantic Chunking");
  console.log("═".repeat(60));
  console.log(`📄 Input: ${text.length} characters`);
  
  const totalTokens = getTokenCount(text);
  console.log(`🎯 Estimated tokens: ${totalTokens}`);
  
  if (!apiKey) {
    throw new Error("OpenAI API key is required for semantic chunking");
  }
  
  // 1️⃣ Split into sentences (universal)
  const sentences = universalSentenceSplit(text);
  
  // Show sample of what we're working with
  console.log(`\n📋 Sample segments (first 3):`);
  sentences.slice(0, 3).forEach((s, i) => {
    const tokens = getTokenCount(s);
    const preview = s.substring(0, 80).replace(/\s+/g, ' ');
    console.log(`   ${i + 1}. [${tokens} tokens] ${preview}...`);
  });

  if (sentences.length <= 2) {
    console.log("\n⚠️ Too few segments for semantic analysis");
    console.log("   Returning original text as single chunk");
    return [text.trim()];
  }

  // 2️⃣ Generate embeddings with retry logic
  let embeddings;
  try {
    embeddings = await getEmbeddings(sentences, apiKey);
  } catch (embeddingError) {
    console.error("\n❌ Embedding generation failed completely");
    console.error("   Falling back to token-based chunking");
    
    // Fallback: Simple token-aware chunking
    const TARGET_TOKENS = 1500;
    const fallbackChunks = [];
    let currentChunk = [];
    let currentTokens = 0;
    
    const words = text.split(/\s+/);
    
    for (const word of words) {
      const wordTokens = getTokenCount(word + " ");
      
      if (currentTokens + wordTokens > TARGET_TOKENS && currentChunk.length > 0) {
        fallbackChunks.push(currentChunk.join(" "));
        currentChunk = [];
        currentTokens = 0;
      }
      
      currentChunk.push(word);
      currentTokens += wordTokens;
    }
    
    if (currentChunk.length > 0) {
      fallbackChunks.push(currentChunk.join(" "));
    }
    
    console.log(`\n⚠️ Created ${fallbackChunks.length} fallback chunks`);
    fallbackChunks.forEach((chunk, idx) => {
      console.log(`   Chunk ${idx + 1}: ${getTokenCount(chunk)} tokens`);
    });
    
    return fallbackChunks;
  }

  // 3️⃣ Compute semantic similarities
  console.log("\n📊 Computing semantic similarities...");
  const similarities = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // 4️⃣ Find semantic boundaries using percentile-based threshold
  console.log("🔍 Detecting semantic boundaries...");
  
  const sortedSims = [...similarities].sort((a, b) => a - b);
  const percentile25 = sortedSims[Math.floor(sortedSims.length * 0.25)];
  const percentile75 = sortedSims[Math.floor(sortedSims.length * 0.75)];
  const iqr = percentile75 - percentile25;
  
  // Boundary = where similarity drops significantly
  const threshold = percentile25 - (iqr * 0.5);

  console.log(`   Similarity range: ${Math.min(...similarities).toFixed(3)} to ${Math.max(...similarities).toFixed(3)}`);
  console.log(`   P25: ${percentile25.toFixed(3)}, P75: ${percentile75.toFixed(3)}`);
  console.log(`   IQR: ${iqr.toFixed(3)}`);
  console.log(`   Boundary threshold: ${threshold.toFixed(3)}`);

  // 5️⃣ Identify boundaries
  const boundaries = [];
  similarities.forEach((sim, i) => {
    if (sim < threshold) {
      boundaries.push(i + 1);
      console.log(`   ✂️ Boundary at position ${i + 1} (similarity: ${sim.toFixed(3)})`);
    }
  });
  
  console.log(`\n✂️ Found ${boundaries.length} semantic boundaries`);

  // 6️⃣ Create chunks from boundaries
  console.log("\n📦 Creating semantic chunks...");
  const chunks = [];
  let start = 0;
  
  for (const boundary of boundaries) {
    const chunk = sentences.slice(start, boundary).join(" ").trim();
    if (chunk) chunks.push(chunk);
    start = boundary;
  }
  
  // Add final chunk
  if (start < sentences.length) {
    const lastChunk = sentences.slice(start).join(" ").trim();
    if (lastChunk) chunks.push(lastChunk);
  }

  console.log(`   Initial chunks: ${chunks.length}`);

  // 7️⃣ Merge small chunks to maintain minimum size
  console.log("\n🔗 Merging small chunks...");
  const MIN_TOKENS = 200; // Universal minimum
  const finalChunks = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkTokens = getTokenCount(chunks[i]);
    
    if (chunkTokens < MIN_TOKENS && finalChunks.length > 0) {
      // Merge with previous chunk
      finalChunks[finalChunks.length - 1] += " " + chunks[i];
      console.log(`   ↔️ Merged chunk ${i + 1} (${chunkTokens} tokens) with previous`);
    } else {
      finalChunks.push(chunks[i]);
    }
  }

  // 8️⃣ Final output
  console.log("\n✅ Semantic Chunking Complete!");
  console.log("═".repeat(60));
  console.log(`📊 Final Result: ${finalChunks.length} semantically coherent chunks\n`);
  
  finalChunks.forEach((chunk, idx) => {
    const tokens = getTokenCount(chunk);
    const preview = chunk.substring(0, 100).replace(/\s+/g, ' ');
    console.log(`Chunk ${idx + 1}:`);
    console.log(`   Tokens: ${tokens}`);
    console.log(`   Preview: "${preview}..."`);
    console.log();
  });

  return finalChunks;
}

module.exports = { semanticChunkTranscript };