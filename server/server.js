const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const { Server: SocketIOServer } = require("socket.io");
const authRoutes = require("./routes/authRoutes.js");
const audioRoutes = require("./routes/audioRoutes.js");
const liveRoutes = require("./routes/liveRoutes.js");
const driveRoutes = require("./routes/driveRoutes.js");
const historyRoutes = require("./routes/historyRoutes.js");
const emailRoutes = require("./routes/emailRoutes.js");
const contactRoutes = require("./routes/contactRoutes.js");
const stripeRoutes = require("./routes/stripeRoutes.js");
const deepseekRoutes = require("./routes/deepseekRoutes.js");
const planRoutes = require("./routes/planRoutes.js");
const faqRoutes = require("./routes/faqRoutes.js");
const locationRoutes = require("./routes/locationRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const passport = require("./config/passport");
const session = require("express-session");

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.json({
    message: "OfficeMoM App API Server",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", audioRoutes);
app.use("/api", liveRoutes);
app.use("/api", driveRoutes);
app.use("/api/history", historyRoutes);
app.use("/api", emailRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api", deepseekRoutes);
app.use("/api", planRoutes);
app.use("/api", faqRoutes);
app.use("/api/location", locationRoutes);
app.use('/api/chat', chatRoutes);

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const rooms = new Map();
const liveStreams = new Map();

function openDeepgramWS(roomId) {
  const DG_URL =
    process.env.DEEPGRAM_URL ||
    "wss://api.deepgram.com/v1/listen?model=nova-3&encoding=linear16&sample_rate=16000&interim_results=true&punctuate=true&smart_format=true";

  const ws = new WebSocket(DG_URL, {
    headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
  });

  const state = { ws, queue: [], open: false };
  liveStreams.set(roomId, state);

  ws.on("open", () => {
    state.open = true;
    for (const chunk of state.queue) ws.send(chunk);
    state.queue.length = 0;
  });

  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message.toString());
      const alt = msg?.channel?.alternatives?.[0];
      if (!alt) return;
      const text = alt.transcript || "";
      if (!text) return;

      const isFinal =
        msg.is_final === true ||
        msg.speech_final === true ||
        msg.type === "UtteranceEnd";

      io.to(roomId).emit("caption", { text, isFinal });
    } catch (e) {
      console.error("Deepgram parse error:", e);
    }
  });

  ws.on("error", (err) => {
    console.error(`Deepgram WS error (room ${roomId}):`, err);
  });

  ws.on("close", () => {
    liveStreams.delete(roomId);
  });

  return state;
}

function closeDeepgramWS(roomId) {
  const s = liveStreams.get(roomId);
  if (!s) return;
  try {
    if (s.open) s.ws.send(Buffer.from([]));
    s.ws.close();
  } catch (e) {
    console.error("Error closing Deepgram WS:", e);
  } finally {
    liveStreams.delete(roomId);
  }
}

io.on("connection", (socket) => {
  socket.on("host:join-room", ({ roomId }) => {
    if (rooms.has(roomId)) {
      const existingRoom = rooms.get(roomId);
      if (existingRoom.hostSocketId !== socket.id) {
        const previousHost = io.sockets.sockets.get(existingRoom.hostSocketId);
        if (previousHost) {
          previousHost.emit("host:replaced");
          previousHost.leave(roomId);
        }
      }
    }

    rooms.set(roomId, {
      hostSocketId: socket.id,
      peers: rooms.get(roomId)?.peers || new Map(),
    });

    socket.join(roomId);
    socket.data.roomId = roomId;
    io.to(socket.id).emit("room:count", {
      count: rooms.get(roomId).peers.size,
    });
  });

  socket.on("guest:request-join", ({ roomId, deviceName, deviceLabel }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit("guest:denied", { reason: "Room not found" });

    socket.join(roomId);
    socket.data.roomId = roomId;
    room.peers.set(socket.id, { deviceName, deviceLabel });

    socket.emit("host:socket-id", { hostId: room.hostSocketId });
    io.to(room.hostSocketId).emit("host:join-request", {
      socketId: socket.id,
      deviceName,
      deviceLabel,
    });
    io.to(room.hostSocketId).emit("room:count", { count: room.peers.size });
  });

  socket.on("host:approve", ({ guestSocketId }) => {
    const guest = io.sockets.sockets.get(guestSocketId);
    if (guest) guest.emit("guest:approved");
  });

  socket.on("host:reject", ({ guestSocketId }) => {
    const guest = io.sockets.sockets.get(guestSocketId);
    if (guest) {
      guest.emit("guest:denied", { reason: "Rejected by host" });
      guest.leave();
    }
  });

  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  socket.on("audio-chunk", (chunkData) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    let state = liveStreams.get(roomId);
    if (!state) state = openDeepgramWS(roomId);

    const chunk = Buffer.isBuffer(chunkData)
      ? chunkData
      : Buffer.from(chunkData);

    if (state.open) {
      state.ws.send(chunk);
    } else {
      state.queue.push(chunk);
    }
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const room = rooms.get(roomId);
      if (!room) continue;

      if (room.peers.has(socket.id)) {
        room.peers.delete(socket.id);
        io.to(room.hostSocketId).emit("room:count", { count: room.peers.size });
      }

      if (room.hostSocketId === socket.id) {
        io.to(roomId).emit("room:ended");
        rooms.delete(roomId);
        closeDeepgramWS(roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
