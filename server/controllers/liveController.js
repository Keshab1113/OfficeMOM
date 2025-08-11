import fs from "fs";
import axios from "axios";

const ASSEMBLY_KEY = process.env.ASSEMBLYAI_API_KEY;
const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";

// Upload file to AssemblyAI
async function uploadFileToAssemblyAI(filePath) {
  const stat = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

  const res = await axios.post(UPLOAD_URL, fileStream, {
    headers: {
      Authorization: ASSEMBLY_KEY,
      "Transfer-Encoding": "chunked",
      "Content-Type": "application/octet-stream",
      "Content-Length": stat.size,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return res.data.upload_url;
}

// Create transcription job
async function createTranscription(audioUrl) {
  const res = await axios.post(
    TRANSCRIPT_URL,
    { audio_url: audioUrl },
    {
      headers: { Authorization: ASSEMBLY_KEY, "Content-Type": "application/json" },
    }
  );
  return res.data;
}

// Poll transcription result
async function pollTranscription(id, interval = 3000, timeout = 5 * 60 * 1000) {
  const start = Date.now();
  while (true) {
    const res = await axios.get(`${TRANSCRIPT_URL}/${id}`, {
      headers: { Authorization: ASSEMBLY_KEY },
    });
    const data = res.data;
    if (data.status === "completed") return data;
    if (data.status === "error") throw new Error(data.error || "Transcription error");
    if (Date.now() - start > timeout) throw new Error("Transcription timeout");
    await new Promise((r) => setTimeout(r, interval));
  }
}

// Controller: handles /transcribe
export const transcribeAudio = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const audioUrl = await uploadFileToAssemblyAI(file.path);
    const created = await createTranscription(audioUrl);
    const result = await pollTranscription(created.id);

    // Remove the file from local uploads
    fs.unlink(file.path, () => {});

    res.json({ text: result.text, full: result });
  } catch (err) {
    console.error(err);
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: err.message || "Server error" });
  }
};
