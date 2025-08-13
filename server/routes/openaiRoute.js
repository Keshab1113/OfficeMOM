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
  const { transcript, headers } = req.body;

  if (!transcript || !Array.isArray(headers) || headers.length === 0) {
    return res.status(400).json({ error: "Transcript and headers are required" });
  }

  try {
    const prompt = `
Extract information from the text and return ONLY a valid JSON array. 
The JSON objects must use these keys exactly: ${headers.join(", ")}.
Ensure the output is strictly in JSON format with no explanation text.

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
