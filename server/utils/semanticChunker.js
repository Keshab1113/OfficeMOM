// utils/semanticChunker.js
const axios = require("axios");

const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
};

async function getEmbeddings(sentences, apiKey, model = "text-embedding-3-small") {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/embeddings",
      { model, input: sentences },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return res.data.data.map((d) => d.embedding);
  } catch (err) {
    console.error("❌ Error generating embeddings:", err.response?.data || err.message);
    throw err;
  }
}

async function semanticChunkTranscript(text, apiKey) {
  // 1️⃣ Better sentence splitting using punctuation + newlines
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);

  if (sentences.length <= 3) {
    console.log("⚠️ Too few sentences, returning single chunk");
    return [text.trim()];
  }

  // 2️⃣ Generate embeddings
  const embeddings = await getEmbeddings(sentences, apiKey);

  // 3️⃣ Compute cosine similarities
  const similarities = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // 4️⃣ Adaptive threshold = median - dynamic margin
  const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  const stdDev =
    Math.sqrt(similarities.map(s => Math.pow(s - avgSim, 2)).reduce((a, b) => a + b, 0) / similarities.length);
  const dynamicThreshold = avgSim - stdDev * 0.5; // more adaptive to data

  console.log(`📊 Avg sim: ${avgSim.toFixed(3)}, StdDev: ${stdDev.toFixed(3)}, Threshold: ${dynamicThreshold.toFixed(3)}`);

  // 5️⃣ Detect boundaries
  const boundaries = [];
  for (let i = 0; i < similarities.length; i++) {
    if (similarities[i] < dynamicThreshold) boundaries.push(i + 1);
  }

  // 6️⃣ Merge into chunks
  const chunks = [];
  let start = 0;
  for (const boundary of boundaries) {
    const chunkText = sentences.slice(start, boundary).join(" ").trim();
    if (chunkText) chunks.push(chunkText);
    start = boundary;
  }
  if (start < sentences.length) chunks.push(sentences.slice(start).join(" ").trim());

  // 7️⃣ Merge small chunks (shorter than 150 words)
  const finalChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const words = chunks[i].split(/\s+/).length;
    if (words < 150 && i > 0) {
      finalChunks[finalChunks.length - 1] += " " + chunks[i];
    } else {
      finalChunks.push(chunks[i]);
    }
  }

  console.log(`🧠 Semantic Chunking Complete: ${finalChunks.length} chunks created`);
  return finalChunks;
}

module.exports = { semanticChunkTranscript };
