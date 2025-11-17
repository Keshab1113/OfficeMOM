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
const botMeetingRoutes = require("./routes/botMeetingRoutes.js");
const botRoutes = require("./routes/botRoutes.js");
const userSubscriptionRoutes = require("./routes/userSubscriptionRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const passport = require("./config/passport");
const session = require("express-session");
const audioBackup = require("./services/audioBackup");
const stripeController = require("./controllers/stripeController.js");
const processRoutes = require("./routes/processRoutes.js");

const app = express();
// ⚠️ ADD THIS RIGHT AFTER app = express()
app.use((req, res, next) => {
  req.setTimeout(7200000); // 2 hours
  res.setTimeout(7200000);
  next();
});
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeController.handleStripeWebhook
);

app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "2000mb" })); // 2 GB
app.use(express.urlencoded({ extended: true, limit: "2000mb" })); // 2 GB

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());

console.log("✅ Stripe webhook route registered before express.json()");

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
app.use("/api/process", processRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/bot-meetings", botMeetingRoutes);
app.use("/api/bot", botRoutes);

app.use("/api/subscription", userSubscriptionRoutes);

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
 


 

io.on("connection", (socket) => {
  console.log(`✅ [SOCKET CONNECTED] Client: ${socket.id}`);
  console.log(
    `📡 Connected from: ${socket.handshake.headers.origin || "Unknown Origin"}`
  );

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
      approvedPeers: rooms.get(roomId)?.approvedPeers || new Map(),
      pendingRequests: rooms.get(roomId)?.pendingRequests || new Map(),
    });

    socket.join(roomId);
    socket.data.roomId = roomId;

    // 🔥 NEW: Initialize backup
    audioBackup.initMeeting(roomId, socket.id);
    audioBackup.addParticipant(roomId, socket.id, "Host");

    io.to(socket.id).emit("room:count", {
      count: rooms.get(roomId).approvedPeers.size,
    });

    // 🔥 NEW: Send meeting status
    const status = audioBackup.getMeetingStatus(roomId);
    if (status) {
      socket.emit("meeting:status", status);
    }
  });

  // --- Guest requests to join ---
  // socket.on("guest:request-join", ({ roomId, deviceName, deviceLabel }) => {
  //   const room = rooms.get(roomId);
  //   if (!room) return socket.emit("guest:denied", { reason: "Room not found" });

  //   socket.data.roomId = roomId;
  //   socket.data.deviceName = deviceName;
  //   socket.data.deviceLabel = deviceLabel;

  //   room.pendingRequests.set(socket.id, { deviceName, deviceLabel });

  //   socket.emit("host:socket-id", { hostId: room.hostSocketId });

  //   io.to(room.hostSocketId).emit("host:join-request", {
  //     socketId: socket.id,
  //     deviceName,
  //     deviceLabel,
  //   });
  // });

  socket.on("guest:request-join", ({ roomId, deviceName, deviceLabel }) => {
    let room = rooms.get(roomId);

    // 🔹 If room ended but exists, allow rejoin
    if (!room) return socket.emit("guest:denied", { reason: "Room not found" });

    if (room.ended) {
      // Reset approvedPeers for rejoin
      room.approvedPeers = new Map();
      room.pendingRequests = new Map();
      room.ended = false; // mark active again
      console.log(`🔄 Guest rejoining ended room: ${roomId}`);
    }

    socket.data.roomId = roomId;
    socket.data.deviceName = deviceName;
    socket.data.deviceLabel = deviceLabel;

    room.pendingRequests.set(socket.id, { deviceName, deviceLabel });

    socket.emit("host:socket-id", { hostId: room.hostSocketId });

    io.to(room.hostSocketId).emit("host:join-request", {
      socketId: socket.id,
      deviceName,
      deviceLabel,
    });
  });

  // --- Host approves guest ---
  socket.on("host:approve", ({ guestSocketId }) => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room) return;

    const guest = io.sockets.sockets.get(guestSocketId);
    if (!guest) return;

    const guestInfo = room.pendingRequests.get(guestSocketId);
    if (guestInfo) {
      room.pendingRequests.delete(guestSocketId);
      room.approvedPeers.set(guestSocketId, guestInfo);

      guest.join(roomId);

      // 🔥 NEW: Add guest to backup
      audioBackup.addParticipant(
        roomId,
        guestSocketId,
        guestInfo.deviceName || "Guest"
      );

      guest.emit("guest:approved");

      io.to(room.hostSocketId).emit("room:count", {
        count: room.approvedPeers.size,
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
 socket.on("audio-chunk", (chunkData) => {
  // Live transcript disabled
});


  // 🔥 NEW: Backup audio chunks
  socket.on("audio-chunk-backup", (chunkData) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const buffer = Buffer.isBuffer(chunkData)
      ? chunkData
      : Buffer.from(chunkData);

    console.log(
      `🎯 BACKUP: Received audio chunk from ${socket.id} in room ${roomId}, size: ${buffer.length} bytes`
    );
    audioBackup.storeChunk(roomId, socket.id, buffer);
  });

  // 🔥 NEW: Start backup recording
  // 🔥 NEW: Start backup recording (with safety check)
  socket.on("start-backup-recording", ({ roomId }) => {
    // Ensure meeting exists first
    if (!audioBackup.getMeetingStatus(roomId)) {
      // Meeting not initialized yet, wait a bit
      setTimeout(() => {
        audioBackup.startRecording(roomId);
        console.log(`🎙️ Started backup recording for ${roomId} (delayed)`);
      }, 200);
    } else {
      audioBackup.startRecording(roomId);
      console.log(`🎙️ Started backup recording for ${roomId}`);
    }
  });

  // 🔥 NEW: Stop backup recording
  // Update this in your backend socket handlers

  socket.on("stop-backup-recording", async ({ roomId, token }) => {
    console.log(`📥 Received stop-backup-recording for ${roomId}`);

    try {
      const backupUrl = await audioBackup.stopRecording(
        roomId,
        process.env.BACKEND_URL || "http://localhost:3000",
        token
      );

      const room = rooms.get(roomId);
      if (room?.hostSocketId && backupUrl) {
        io.to(room.hostSocketId).emit("backup-recording-saved", {
          backupUrl,
          roomId,
        });
        console.log(`✅ Backup saved and sent to host: ${backupUrl}`);
      }

      // 🔥 INCREASED: Cleanup after longer delay (3 seconds)
      setTimeout(() => {
        audioBackup.cleanup(roomId);
        console.log(`🗑️ Delayed cleanup completed for ${roomId}`);
      }, 3000); // Increased from 1000ms to 3000ms
    } catch (error) {
      console.error("❌ Error stopping backup:", error);
      // Cleanup anyway on error after delay
      setTimeout(() => {
        audioBackup.cleanup(roomId);
      }, 2000);
    }
  });

  // --- Guest explicitly disconnects ---
  socket.on("guest:disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // 🔥 NEW: Remove from backup
    audioBackup.removeParticipant(roomId, socket.id);

    if (room.approvedPeers.has(socket.id)) {
      room.approvedPeers.delete(socket.id);

      io.to(room.hostSocketId).emit("guest:disconnected", {
        socketId: socket.id,
      });

      io.to(room.hostSocketId).emit("room:count", {
        count: room.approvedPeers.size,
      });
    }

    room.pendingRequests.delete(socket.id);
  });

  // --- Host ends meeting ---
  //   socket.on("host:end-meeting", ({ roomId }) => {
  //   const room = rooms.get(roomId);
  //   if (!room || room.hostSocketId !== socket.id) return;

  //   console.log(`🛑 Host ending meeting: ${roomId}`);

  //   room.approvedPeers.forEach((_, guestSocketId) => {
  //     const guest = io.sockets.sockets.get(guestSocketId);
  //     if (guest) {
  //       guest.emit("room:ended");
  //       guest.emit("host:end-meeting");
  //       guest.leave(roomId);
  //     }
  //   });

  //   room.pendingRequests.forEach((_, guestSocketId) => {
  //     const guest = io.sockets.sockets.get(guestSocketId);
  //     if (guest) {
  //       guest.emit("guest:denied", { reason: "Meeting ended by host" });
  //       guest.disconnect();
  //     }
  //   });

  //   // 🔥 CHANGED: Don't cleanup immediately - wait for backup to save
  //   // audioBackup.cleanup(roomId); // ❌ REMOVE THIS LINE

  //   rooms.delete(roomId);
  //   closeAssemblyAIWS(roomId);
  // });

  // --- Host ends meeting ---
  socket.on("host:end-meeting", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;

    console.log(`🛑 Host ending meeting: ${roomId}`);

    room.approvedPeers.forEach((_, guestSocketId) => {
      const guest = io.sockets.sockets.get(guestSocketId);
      if (guest) {
        guest.emit("room:ended");
        guest.emit("host:end-meeting");
        guest.leave(roomId);
      }
    });

    room.pendingRequests.forEach((_, guestSocketId) => {
      const guest = io.sockets.sockets.get(guestSocketId);
      if (guest) {
        guest.emit("guest:denied", { reason: "Meeting ended by host" });
        guest.disconnect();
      }
    });

    // 🔹 DO NOT delete room immediately
    // rooms.delete(roomId);
     

    // Mark room as ended
    room.ended = true;
  });

  // --- Handle disconnection ---
  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const room = rooms.get(roomId);
      if (!room) continue;

      // 🔥 NEW: Remove from backup
      audioBackup.removeParticipant(roomId, socket.id);

      if (room.approvedPeers.has(socket.id)) {
        room.approvedPeers.delete(socket.id);
        io.to(room.hostSocketId).emit("guest:disconnected", {
          socketId: socket.id,
        });
        io.to(room.hostSocketId).emit("room:count", {
          count: room.approvedPeers.size,
        });
      }

      room.pendingRequests.delete(socket.id);

      if (room.hostSocketId === socket.id) {
        // 🔥 NEW: Auto-save backup on disconnect
        audioBackup
          .stopRecording(
            roomId,
            process.env.BACKEND_URL || "http://localhost:3000",
            null
          )
          .then((url) => {
            if (url) {
              console.log(`💾 Auto-saved backup on disconnect: ${url}`);
            }
          });

        audioBackup.cleanup(roomId);

        room.approvedPeers.forEach((_, guestId) => {
          io.to(guestId).emit("room:ended");
          io.to(guestId).emit("host:end-meeting");
        });

        room.pendingRequests.forEach((_, guestId) => {
          io.to(guestId).emit("guest:denied", {
            reason: "Host disconnected",
          });
        });

        rooms.delete(roomId);
         
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const PORT = process.env.PORT || 3001;
const httpServer = server.listen(PORT, () => {
  console.log(`\n🚀 Server started successfully`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`⏱️ Timeout: 7200s (2 hours)`);
  console.log(`📦 Max upload: 2500 MB\n`);
});

// ⚠️ ADD THESE CRITICAL TIMEOUT SETTINGS
httpServer.timeout = 7200000; // 2 hours
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;
