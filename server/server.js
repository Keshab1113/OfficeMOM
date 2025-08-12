import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import liveRoutes from "./routes/liveRoutes.js";
import driveRoutes from "./routes/driveRoutes.js";
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

const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

const deepgramUrl = process.env.DEEPGRAM_URL;

wss.on("connection", (ws) => {
  console.log("Frontend connected to transcription relay");

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
    ws.send(msg.toString());
  });

  dgWs.on("error", (err) => {
    console.error("Deepgram WS error:", err);
  });

  ws.on("message", (message) => {
    if (ready) {
      dgWs.send(message);
    } else {
      queue.push(message);
    }
  });

  ws.on("close", () => {
    dgWs.close();
    console.log("Frontend disconnected");
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
