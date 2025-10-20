 

import axios from 'axios';

export const processTranscriptWithDeepSeek = async (
  transcript,
  headers,
  audioId,           // <-- add this
  userId,            // <-- add this
  transcriptAudioId , // <-- add this
 language,
 historyId 
) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/process`, {
      transcript,
      headers,
      audio_id: audioId,
      userId,
      transcript_audio_id: transcriptAudioId,
      language, 
      history_id: historyId,
    });
    return response.data;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to process transcript");
  }
};
