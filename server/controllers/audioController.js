const axios = require("axios");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const ExcelJS = require("exceljs");
const uploadToFTP = require("../config/uploadToFTP");
const db = require("../config/db.js");

const ASSEMBLY_KEY = process.env.ASSEMBLYAI_API_KEY;
const UPLOAD_URL = process.env.ASSEMBLYAI_API_UPLOAD_URL;
const TRANSCRIPT_URL = process.env.ASSEMBLYAI_API_TRANSCRIPT_URL;

async function uploadFileToAssemblyAI(buffer) {
  const res = await axios.post(UPLOAD_URL, buffer, {
    headers: {
      Authorization: ASSEMBLY_KEY,
      "Transfer-Encoding": "chunked",
      "Content-Type": "application/octet-stream",
      "Content-Length": buffer.length,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return res.data.upload_url;
}

async function createTranscription(audioUrl) {
  const res = await axios.post(
    TRANSCRIPT_URL,
    { audio_url: audioUrl, language_detection: true,speaker_labels: true, },
    {
      headers: {
        Authorization: ASSEMBLY_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

async function pollTranscription(id, interval = 3000, timeout = 5 * 60 * 1000) {
  const start = Date.now();
  while (true) {
    const res = await axios.get(`${TRANSCRIPT_URL}/${id}`, {
      headers: { Authorization: ASSEMBLY_KEY },
    });
    const data = res.data;
    if (data.status === "completed") return data;
    if (data.status === "error")
      throw new Error(data.error || "Transcription error");
    if (Date.now() - start > timeout) throw new Error("Transcription timeout");
    await new Promise((r) => setTimeout(r, interval));
  }
}

async function makeDocxBuffer(text) {
  const doc = new Document({
    sections: [
      {
        children: text
          .split("\n")
          .map((line) => new Paragraph({ children: [new TextRun(line)] })),
      },
    ],
  });
  return Packer.toBuffer(doc);
}

async function makeExcelBuffer(text) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Transcript");
  ws.columns = [{ header: "Line", key: "line", width: 100 }];
  text.split("\n").forEach((line) => ws.addRow({ line }));
  return wb.xlsx.writeBuffer();
}

const processAudio = async (req, res) => {
  const file = req.file;
  const userId = 43;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const buffer = file.buffer;
    const originalName = file.originalname;
    const ftpUrl = await uploadToFTP(buffer, originalName, "audio_files");
    const audioUrl = await uploadFileToAssemblyAI(file.buffer);
    const created = await createTranscription(audioUrl);
    const result = await pollTranscription(created.id);
    const docxBuffer = await makeDocxBuffer(result.text || "");
    const excelBuffer = await makeExcelBuffer(result.text || "");

    const curDate = new Date();
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, "0");
    const day = String(curDate.getDate()).padStart(2, "0");
    const hours = String(curDate.getHours()).padStart(2, "0");
    const minutes = String(curDate.getMinutes()).padStart(2, "0");
    const seconds = String(curDate.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const [uploadAudio] = await db.query(
      "INSERT INTO user_audios (userId, title, audioUrl, uploadedAt, source) VALUES (?, ?, ?, ?, ?)",
      [userId, originalName, ftpUrl, formattedDate, "Generate Notes Conversion"]
    );

    res.json({
      text: result.text,
      language: result.language_code,
      wordBase64: docxBuffer.toString("base64"),
      excelBase64: Buffer.from(excelBuffer).toString("base64"),
      audioUrl: ftpUrl,
      audio_id: uploadAudio.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

module.exports = {
  processAudio,
};
