import axios from 'axios';

// Function to process transcript using DeepSeek API
export const processTranscriptWithDeepSeek = async (apiKey, transcript, headers) => {
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

    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      // If direct parsing fails, try to extract JSON from the response
      const match = raw.match(/\[.*\]/s);
      data = match ? JSON.parse(match[0]) : [];
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    return data;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to process transcript");
  }
};

// Get API key from environment variables or user input
export const getDeepSeekApiKey = () => {
  return import.meta.env.VITE_DEEPSEEK_API_KEY || localStorage.getItem('deepseek_api_key');
};

// Save API key to localStorage
export const saveDeepSeekApiKey = (apiKey) => {
  localStorage.setItem('deepseek_api_key', apiKey);
};