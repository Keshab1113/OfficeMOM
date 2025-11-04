 

import axios from 'axios';
import { DateTime } from "luxon";

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

     // 🕒 Get user's local time
    const formattedUTCDate = DateTime.utc().toFormat("yyyy-LL-dd HH:mm:ss");

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/process`, {
      transcript,
      headers,
      audio_id: audioId,
      userId,
      transcript_audio_id: transcriptAudioId,
      language, 
      history_id: historyId,
       date: formattedUTCDate, // send local time to backend
    });
    return response.data;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to process transcript");
  }
};
