import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.DEESEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

router.post("/convert-transcript", async (req, res) => {
  const { transcript, headers, detectLanguage } = req.body;

  if (!transcript || !Array.isArray(headers) || headers.length === 0) {
    return res.status(400).json({ error: "Transcript and headers are required" });
  }

  try {
    const prompt = `
You are an information extraction system. 
Your ONLY task is to extract structured data from the given text and return it as a STRICT JSON array. 
Do not add explanations, comments, or any extra text outside the JSON.

Rules:
1. Output must be a valid JSON array of objects.
2. Use these keys exactly (case-sensitive): ${headers.join(", ")}.
3. For each object:
   - Extract the value from the text if available.
   - If a field is missing or unclear, set its value to an empty string "".
   - Do not generate extra fields.
4. Keep values as plain text only — do not infer, summarize, or transform unnecessarily.
5. If multiple entities are found in the text, return multiple objects in the array.
6. Ensure the final JSON passes validation (no trailing commas, no comments, no formatting errors).

Text to extract from:
${transcript}
`;

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const raw = response.choices[0].message.content.trim();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[.*\]/s);
      data = match ? JSON.parse(match[0]) : [];
    }

    if (!Array.isArray(data)) data = [data];

    return res.json(data);
  } catch (err) {
    console.error("DeepSeek error:", err);
    res.status(500).json({ error: "Failed to convert transcript via DeepSeek" });
  }
});

export default router;
