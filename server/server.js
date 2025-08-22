import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import liveRoutes from "./routes/liveRoutes.js";
import driveRoutes from "./routes/driveRoutes.js";
import openaiRoute from "./routes/openaiRoute.js";
import historyRoutes from "./routes/historyRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { transcribeAudio } from "./controllers/liveController.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api", audioRoutes);
app.use("/api", liveRoutes);
app.use("/api", driveRoutes);
app.use("/api/openai", openaiRoute);
app.use("/api/history", historyRoutes);
app.use("/api", emailRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const deepgramUrl = process.env.DEEPGRAM_URL;
const meetingRooms = new Map();

// Ensure uploads directory exists
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

wss.on("connection", (ws, req) => {
  console.log("Frontend connected to transcription relay");
  let meetingId = null;
  let participantId = uuidv4();
  let isHost = false;
  let dgWs = null;

  // Function to connect to Deepgram
  const connectToDeepgram = () => {
    dgWs = new WebSocket(deepgramUrl, {
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
    });

    let ready = false;
    let queue = [];

    dgWs.on("open", () => {
      ready = true;
      console.log("Connected to Deepgram for meeting:", meetingId);
      
      // Configure Deepgram for real-time transcription
      dgWs.send(JSON.stringify({
        type: "StartRequest",
        transcription: {
          punctuate: true,
          diarize: true,
          smart_format: true,
        },
      }));
      
      queue.forEach((msg) => dgWs.send(msg));
      queue = [];
    });

    dgWs.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        
        // Send transcription results to all meeting participants
        if (data.type === "Results" && meetingId && meetingRooms.has(meetingId)) {
          const meeting = meetingRooms.get(meetingId);
          meeting.participants.forEach((participant) => {
            if (participant.ws.readyState === WebSocket.OPEN) {
              participant.ws.send(JSON.stringify({
                type: "transcription",
                text: data.channel?.alternatives[0]?.transcript || "",
                isFinal: data.is_final || false
              }));
            }
          });
        }
        
        // Handle Deepgram connection messages
        if (data.type === "Connected") {
          console.log("Deepgram connection established for meeting:", meetingId);
        }
      } catch (error) {
        console.error("Error parsing Deepgram message:", error);
      }
    });

    dgWs.on("error", (err) => {
      console.error("Deepgram WS error:", err);
    });

    dgWs.on("close", () => {
      console.log("Deepgram connection closed for meeting:", meetingId);
    });

    return { dgWs, ready, queue };
  };

  let deepgramConnection = null;

  ws.on("message", (message) => {
    try {
      // Handle binary audio data
      if (message instanceof Buffer || message instanceof ArrayBuffer) {
        if (deepgramConnection && deepgramConnection.ready && meetingId && meetingRooms.has(meetingId)) {
          // Send audio to Deepgram for real-time transcription
          deepgramConnection.dgWs.send(message);
          
          // Also store audio data for later processing if needed
          const meeting = meetingRooms.get(meetingId);
          if (meeting.isRecording) {
            meeting.audioData.push({
              participantId,
              audioData: Buffer.from(message),
              timestamp: Date.now()
            });
          }
        }
      } else {
        // Handle JSON control messages
        const data = JSON.parse(message.toString());

        if (data.type === "join_meeting") {
          meetingId = data.meetingId;
          isHost = data.isHost || false;
          
          // Create meeting room if it doesn't exist
          if (!meetingRooms.has(meetingId)) {
            meetingRooms.set(meetingId, {
              participants: [],
              audioData: [],
              createdAt: Date.now(),
              isRecording: false,
              deepgramConnection: null
            });
            
            // Set up Deepgram connection for the meeting room
            const meeting = meetingRooms.get(meetingId);
            deepgramConnection = connectToDeepgram();
            meeting.deepgramConnection = deepgramConnection;
          } else {
            // Use existing Deepgram connection
            const meeting = meetingRooms.get(meetingId);
            deepgramConnection = meeting.deepgramConnection;
          }
          
          const meeting = meetingRooms.get(meetingId);
          
          // Add participant to meeting room
          meeting.participants.push({
            id: participantId,
            ws: ws,
            joinedAt: Date.now(),
            isHost: isHost
          });
          
          // Send participant list update to all participants
          meeting.participants.forEach((participant) => {
            if (participant.ws.readyState === WebSocket.OPEN) {
              participant.ws.send(JSON.stringify({
                type: "participants_update",
                participants: meeting.participants.map((p) => ({
                  id: p.id,
                  isHost: p.isHost
                }))
              }));
            }
          });

          console.log(`Participant ${participantId} joined meeting ${meetingId}`);
        } 
        else if (data.type === "recording_started" && meetingId && meetingRooms.has(meetingId)) {
          const meeting = meetingRooms.get(meetingId);
          meeting.isRecording = true;
          meeting.audioData = [];
          
          console.log(`Recording started for meeting ${meetingId}`);
        }
        else if (data.type === "recording_stopped" && meetingId && meetingRooms.has(meetingId)) {
          const meeting = meetingRooms.get(meetingId);
          meeting.isRecording = false;
          
          // Combine and save audio data
          combineAndSaveAudio(meetingId)
            .then(filePath => {
              console.log(`Audio saved for meeting ${meetingId}: ${filePath}`);
              
              // Notify host that audio is ready for processing
              meeting.participants.forEach(participant => {
                if (participant.isHost && participant.ws.readyState === WebSocket.OPEN) {
                  participant.ws.send(JSON.stringify({
                    type: "audio_ready",
                    meetingId: meetingId
                  }));
                }
              });
            })
            .catch(error => {
              console.error("Error combining audio:", error);
            });
          
          console.log(`Recording stopped for meeting ${meetingId}`);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
    }
  });

  ws.on("close", () => {
    if (meetingId && meetingRooms.has(meetingId)) {
      const meeting = meetingRooms.get(meetingId);
      meeting.participants = meeting.participants.filter(
        (p) => p.id !== participantId
      );
      
      // Send updated participant list
      meeting.participants.forEach((participant) => {
        if (participant.ws.readyState === WebSocket.OPEN) {
          participant.ws.send(JSON.stringify({
            type: "participants_update",
            participants: meeting.participants.map((p) => ({
              id: p.id,
              isHost: p.isHost
            }))
          }));
        }
      });
      
      // Clean up meeting room if empty
      if (meeting.participants.length === 0) {
        // Close Deepgram connection
        if (meeting.deepgramConnection && meeting.deepgramConnection.dgWs) {
          meeting.deepgramConnection.dgWs.close();
        }
        meetingRooms.delete(meetingId);
        console.log(`Meeting ${meetingId} deleted (no participants)`);
      }
    }

    if (dgWs) {
      dgWs.close();
    }
    
    console.log("Client disconnected:", participantId);
  });
});

// Function to combine and save audio from all participants
async function combineAndSaveAudio(meetingId) {
  if (!meetingRooms.has(meetingId)) {
    throw new Error("Meeting not found");
  }
  
  const meeting = meetingRooms.get(meetingId);
  if (meeting.audioData.length === 0) {
    throw new Error("No audio data to combine");
  }
  
  // Sort audio data by timestamp
  meeting.audioData.sort((a, b) => a.timestamp - b.timestamp);
  
  // Combine all audio data into a single buffer
  // Note: This is a simplified approach. In a production system, you would
  // need to properly decode, mix, and re-encode the audio streams
  const combinedBuffers = meeting.audioData.map(data => data.audioData);
  const combinedAudio = Buffer.concat(combinedBuffers);
  
  // Save to file
  const fileName = `${meetingId}_combined_audio.webm`;
  const filePath = path.join(uploadsDir, fileName);
  
  fs.writeFileSync(filePath, combinedAudio);
  
  return filePath;
}

// Add API endpoint to process meeting audio
app.post("/api/process-meeting-audio", async (req, res) => {
  try {
    const { meetingId } = req.body;
    
    if (!meetingId) {
      return res.status(400).json({ error: "Meeting ID is required" });
    }
    
    const fileName = `${meetingId}_combined_audio.webm`;
    const filePath = path.join(uploadsDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Audio file not found" });
    }
    
    // Create a mock request object for the transcribeAudio function
    const mockReq = {
      file: {
        path: filePath,
        originalname: fileName
      }
    };
    
    const mockRes = {
      json: (data) => {
        // Clean up the file after processing
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
        
        return res.json(data);
      },
      status: (code) => {
        return {
          json: (data) => {
            return res.status(code).json(data);
          }
        };
      }
    };
    
    // Use the existing transcribeAudio function
    await transcribeAudio(mockReq, mockRes);
    
  } catch (error) {
    console.error("Error processing meeting audio:", error);
    res.status(500).json({ error: "Failed to process meeting audio" });
  }
});

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/transcribe") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));