import axios from 'axios';

export const processTranscriptWithDeepSeek = async ( transcript, headers) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/process`, { transcript, headers });
    return response.data.data;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to process transcript");
  }
};
