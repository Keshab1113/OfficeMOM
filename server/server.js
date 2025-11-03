 
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
const uploadRoutes = require("./routes/uploadRoutes.js");
const locationRoutes = require("./routes/locationRoutes.js");
const botMeetingRoutes = require('./routes/botMeetingRoutes.js');
const botRoutes = require('./routes/botRoutes.js');
const userSubscriptionRoutes = require("./routes/userSubscriptionRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const passport = require("./config/passport");
const session = require("express-session");

 

const app = express();
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
    message: "OfficeMoM App API Server Running Successfully.",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/process-audio", audioRoutes);
app.use("/api/live-meeting", liveRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/process-drive", driveRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/send-meeting-email", emailRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/process", deepseekRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/bot-meetings', botMeetingRoutes);
app.use('/api/bot', botRoutes);
 
app.use('/api/subscription', userSubscriptionRoutes);

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // allow all origins
    methods: ["GET", "POST"],
    credentials: true, // optional — can set to false if not needed
  },
});


// 👇 ADD THIS HERE — before io.on("connection")
io.engine.on("connection_error", (err) => {
  console.log("🚨 Socket.IO connection error:");
  console.log("Origin:", err.req.headers.origin);
  console.log("Code:", err.code);
  console.log("Message:", err.message);
  if (err.context) console.log("Context:", err.context);
});


const rooms = new Map();
const liveStreams = new Map();

async function openAssemblyAIWS(roomId) {
  // STEP 1: Get temporary token from AssemblyAI
  // Multi-language detection enabled
const AAI_URL = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&format_text=true`;


  const ws = new WebSocket(AAI_URL, {
    headers: { Authorization: process.env.ASSEMBLYAI_API_KEY },
  });

  const state = { ws, queue: [], open: false };
  liveStreams.set(roomId, state);

  ws.on("open", () => {
    console.log(`✅ [${roomId}] AssemblyAI connection opened`);
    state.open = true;
    for (const chunk of state.queue) ws.send(chunk);
    state.queue.length = 0;
  });

  ws.on("message", (message) => {
  try {
    const msg = JSON.parse(message.toString());

    // Extract transcript text
    let transcriptText = "";

    // Handle all transcript types including multi-language
if (msg.type === "PartialTranscript") {
  transcriptText = msg.words?.map(w => w.text).join(" ") || msg.transcript || "";
} else if (msg.type === "FinalTranscript" || msg.type === "Turn") {
  // Turn events contain finalized transcripts; includes language info
  transcriptText = msg.transcript || msg.utterance || "";
  if (msg.language) {
    transcriptText = `[${msg.language}] ${transcriptText}`; // optional: show detected language
  }
}


    if (transcriptText) {
  console.log("🗣️ Transcript:", transcriptText); // clean log
  io.to(roomId).emit("caption", {
    text: transcriptText,
    isFinal: msg.type === "FinalTranscript" || msg.end_of_turn === true
  });
}


  } catch (err) {
    console.error("❌ AssemblyAI parse error:", err);
  }
});


  ws.on("error", (err) => {
    console.error(`🚨 [${roomId}] AssemblyAI WS error:`, err);
  });

  ws.on("close", () => {
    console.log(`⚠️ [${roomId}] AssemblyAI connection closed`);
    liveStreams.delete(roomId);
  });

  return state;
}

function closeAssemblyAIWS(roomId) {
  const s = liveStreams.get(roomId);
  if (!s) return;
  try {
    if (s.open) s.ws.close();
  } catch (e) {
    console.error("Error closing Deepgram WS:", e);
  } finally {
    liveStreams.delete(roomId);
  }
}

// io.on("connection", (socket) => {

//    console.log(`✅ [SOCKET CONNECTED] Client: ${socket.id}`);
//   console.log(`📡 Connected from: ${socket.handshake.headers.origin || "Unknown Origin"}`);

//   // --- Host joins room ---
//   socket.on("host:join-room", ({ roomId }) => {
//     if (rooms.has(roomId)) {
//       const existingRoom = rooms.get(roomId);
//       if (existingRoom.hostSocketId !== socket.id) {
//         const previousHost = io.sockets.sockets.get(existingRoom.hostSocketId);
//         if (previousHost) {
//           previousHost.emit("host:replaced");
//           previousHost.leave(roomId);
//         }
//       }
//     }

//     rooms.set(roomId, {
//       hostSocketId: socket.id,
//       peers: rooms.get(roomId)?.peers || new Map(),
//     });

//     socket.join(roomId);
//     socket.data.roomId = roomId;
//     io.to(socket.id).emit("room:count", {
//       count: rooms.get(roomId).peers.size,
//     });
//   });

//   socket.on("guest:request-join", ({ roomId, deviceName, deviceLabel }) => {
//     const room = rooms.get(roomId);
//     if (!room) return socket.emit("guest:denied", { reason: "Room not found" });

//     socket.join(roomId);
//     socket.data.roomId = roomId;
//     room.peers.set(socket.id, { deviceName, deviceLabel });

//     socket.emit("host:socket-id", { hostId: room.hostSocketId });
//     io.to(room.hostSocketId).emit("host:join-request", {
//       socketId: socket.id,
//       deviceName,
//       deviceLabel,
//     });
//     io.to(room.hostSocketId).emit("room:count", { count: room.peers.size });
//   });

//   socket.on("host:approve", ({ guestSocketId }) => {
//     const guest = io.sockets.sockets.get(guestSocketId);
//     if (guest) guest.emit("guest:approved");
//   });

//   socket.on("host:reject", ({ guestSocketId }) => {
//     const guest = io.sockets.sockets.get(guestSocketId);
//     if (guest) {
//       guest.emit("guest:denied", { reason: "Rejected by host" });
//       guest.leave();
//     }
//   });

//   socket.on("signal", ({ to, data }) => {
//     io.to(to).emit("signal", { from: socket.id, data });
//   });

//   socket.on("audio-chunk", async (chunkData) => {
//     const roomId = socket.data.roomId;
//     if (!roomId) return;

//     let state = liveStreams.get(roomId);
//     if (!state) {
//       state = await openAssemblyAIWS(roomId);
//     }

//     const buffer = Buffer.isBuffer(chunkData)
//       ? chunkData
//       : Buffer.from(chunkData);

//     const base64 = buffer.toString("base64");
//     const payload = Buffer.from(chunkData);

//     if (state.open) {
//       // console.log(
//       //   `🎤 [${roomId}] Sending audio chunk to AssemblyAI (${buffer.length} bytes)`
//       // );
//       state.ws.send(payload);
//     } else {
//       console.log(
//         `⏳ [${roomId}] Queueing audio chunk (connection not open yet)`
//       );
//       state.queue.push(payload);
//     }
//   });

//   socket.on("disconnecting", () => {
//     for (const roomId of socket.rooms) {
//       if (roomId === socket.id) continue;
//       const room = rooms.get(roomId);
//       if (!room) continue;

//       if (room.peers.has(socket.id)) {
//         room.peers.delete(socket.id);
//         io.to(room.hostSocketId).emit("room:count", { count: room.peers.size });
//       }

//       if (room.hostSocketId === socket.id) {
//         io.to(roomId).emit("room:ended");
//         rooms.delete(roomId);
//         closeAssemblyAIWS(roomId);
//       }
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log(`Client disconnected: ${socket.id}`);
//   });
// });


io.on("connection", (socket) => {
  console.log(`✅ [SOCKET CONNECTED] Client: ${socket.id}`);
  console.log(`📡 Connected from: ${socket.handshake.headers.origin || "Unknown Origin"}`);

  // --- Host joins room ---
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
      approvedPeers: rooms.get(roomId)?.approvedPeers || new Map(), // Only approved guests
      pendingRequests: rooms.get(roomId)?.pendingRequests || new Map(), // Pending approval
    });

    socket.join(roomId);
    socket.data.roomId = roomId;
    
    // Send count of only approved peers
    io.to(socket.id).emit("room:count", {
      count: rooms.get(roomId).approvedPeers.size,
    });
  });

  // --- Guest requests to join ---
  socket.on("guest:request-join", ({ roomId, deviceName, deviceLabel }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit("guest:denied", { reason: "Room not found" });

    // Don't join the room yet - wait for approval
    socket.data.roomId = roomId;
    socket.data.deviceName = deviceName;
    socket.data.deviceLabel = deviceLabel;
    
    // Add to pending requests, NOT to approved peers
    room.pendingRequests.set(socket.id, { deviceName, deviceLabel });

    // Send host socket ID to guest
    socket.emit("host:socket-id", { hostId: room.hostSocketId });
    
    // Notify host of join request
    io.to(room.hostSocketId).emit("host:join-request", {
      socketId: socket.id,
      deviceName,
      deviceLabel,
    });
    
    // Don't send updated count yet - guest not approved
  });

  // --- Host approves guest ---
  socket.on("host:approve", ({ guestSocketId }) => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room) return;

    const guest = io.sockets.sockets.get(guestSocketId);
    if (!guest) return;

    // Move from pending to approved
    const guestInfo = room.pendingRequests.get(guestSocketId);
    if (guestInfo) {
      room.pendingRequests.delete(guestSocketId);
      room.approvedPeers.set(guestSocketId, guestInfo);
      
      // Now join the room
      guest.join(roomId);
      
      // Notify guest they're approved
      guest.emit("guest:approved");
      
      // Update participant count for host (only approved guests)
      io.to(room.hostSocketId).emit("room:count", { 
        count: room.approvedPeers.size 
      });
    }
  });

  // --- Host rejects guest ---
  socket.on("host:reject", ({ guestSocketId }) => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room) return;

    const guest = io.sockets.sockets.get(guestSocketId);
    if (guest) {
      // Remove from pending requests
      room.pendingRequests.delete(guestSocketId);
      
      guest.emit("guest:denied", { reason: "Rejected by host" });
      guest.disconnect();
    }
  });

  // --- Signal for WebRTC ---
  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  // --- Audio chunk streaming ---
  socket.on("audio-chunk", async (chunkData) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    let state = liveStreams.get(roomId);
    if (!state) {
      state = await openAssemblyAIWS(roomId);
    }

    const buffer = Buffer.isBuffer(chunkData)
      ? chunkData
      : Buffer.from(chunkData);

    const payload = Buffer.from(chunkData);

    if (state.open) {
      state.ws.send(payload);
    } else {
      state.queue.push(payload);
    }
  });

  // --- Guest explicitly disconnects ---
  socket.on("guest:disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // Remove from approved peers
    if (room.approvedPeers.has(socket.id)) {
      room.approvedPeers.delete(socket.id);
      
      // Notify host about guest disconnection
      io.to(room.hostSocketId).emit("guest:disconnected", { 
        socketId: socket.id 
      });
      
      // Update participant count
      io.to(room.hostSocketId).emit("room:count", { 
        count: room.approvedPeers.size 
      });
    }
    
    // Also remove from pending if they were waiting
    room.pendingRequests.delete(socket.id);
  });

  // --- Host ends meeting ---
  socket.on("host:end-meeting", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;

    console.log(`🛑 Host ending meeting: ${roomId}`);
    
    // Notify all approved guests
    room.approvedPeers.forEach((_, guestSocketId) => {
      const guest = io.sockets.sockets.get(guestSocketId);
      if (guest) {
        guest.emit("room:ended");
        guest.emit("host:end-meeting");
        guest.leave(roomId);
      }
    });
    
    // Notify all pending guests
    room.pendingRequests.forEach((_, guestSocketId) => {
      const guest = io.sockets.sockets.get(guestSocketId);
      if (guest) {
        guest.emit("guest:denied", { reason: "Meeting ended by host" });
        guest.disconnect();
      }
    });
    
    // Clean up room
    rooms.delete(roomId);
    closeAssemblyAIWS(roomId);
  });

  // --- Handle disconnection ---
  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const room = rooms.get(roomId);
      if (!room) continue;

      // If guest disconnects
      if (room.approvedPeers.has(socket.id)) {
        room.approvedPeers.delete(socket.id);
        io.to(room.hostSocketId).emit("guest:disconnected", { 
          socketId: socket.id 
        });
        io.to(room.hostSocketId).emit("room:count", { 
          count: room.approvedPeers.size 
        });
      }
      
      // Remove from pending requests
      room.pendingRequests.delete(socket.id);

      // If host disconnects
      if (room.hostSocketId === socket.id) {
        // Notify all approved guests
        room.approvedPeers.forEach((_, guestId) => {
          io.to(guestId).emit("room:ended");
          io.to(guestId).emit("host:end-meeting");
        });
        
        // Notify all pending guests
        room.pendingRequests.forEach((_, guestId) => {
          io.to(guestId).emit("guest:denied", { 
            reason: "Host disconnected" 
          });
        });
        
        rooms.delete(roomId);
        closeAssemblyAIWS(roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
}); 
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
