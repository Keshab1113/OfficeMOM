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

wss.on("connection", (ws, req) => {
  console.log("Frontend connected to transcription relay");
  let meetingId = null;
  let participantId = uuidv4();

  const dgWs = new WebSocket(deepgramUrl, {
    headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
  });

  let ready = false;
  let queue = [];

  dgWs.on("open", () => {
    ready = true;
    queue.forEach((msg) => dgWs.send(msg));
    queue = [];
    console.log("Connected to Deepgram");
  });

  dgWs.on("message", (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.type === "Results" && meetingId && meetingRooms.has(meetingId)) {
      const meeting = meetingRooms.get(meetingId);
      meeting.participants.forEach((participant) => {
        if (participant.ws.readyState === WebSocket.OPEN) {
          participant.ws.send(msg.toString());
        }
      });
    }
  });

  dgWs.on("error", (err) => {
    console.error("Deepgram WS error:", err);
  });

  ws.on("message", (message) => {
    try {
      if (message instanceof Buffer || message instanceof ArrayBuffer) {
        if (ready) {
          dgWs.send(message);
        } else {
          queue.push(message);
        }
      } else {
        const data = JSON.parse(message.toString());

        if (data.type === "join_meeting") {
          meetingId = data.meetingId;
          if (!meetingRooms.has(meetingId)) {
            meetingRooms.set(meetingId, {
              participants: [],
              createdAt: Date.now(),
            });
          }
          const meeting = meetingRooms.get(meetingId);
          meeting.participants.push({
            id: participantId,
            ws: ws,
            joinedAt: Date.now(),
          });
          meeting.participants.forEach((participant) => {
            if (participant.ws.readyState === WebSocket.OPEN) {
              participant.ws.send(
                JSON.stringify({
                  type: "participants_update",
                  participants: meeting.participants.map((p) => p.id),
                })
              );
            }
          });

          console.log(
            `Participant ${participantId} joined meeting ${meetingId}`
          );
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    if (meetingId && meetingRooms.has(meetingId)) {
      const meeting = meetingRooms.get(meetingId);
      meeting.participants = meeting.participants.filter(
        (p) => p.id !== participantId
      );
      meeting.participants.forEach((participant) => {
        if (participant.ws.readyState === WebSocket.OPEN) {
          participant.ws.send(
            JSON.stringify({
              type: "participants_update",
              participants: meeting.participants.map((p) => p.id),
            })
          );
        }
      });
      if (meeting.participants.length === 0) {
        meetingRooms.delete(meetingId);
      }
    }

    dgWs.close();
    console.log("Client disconnected");
  });
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
