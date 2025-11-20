// services/socketManager.js
const { Server: SocketIOServer } = require("socket.io");

class SocketManager {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> socketId
        this.socketUsers = new Map(); // socketId -> userId
    }

    initialize(server) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        this.io.engine.on("connection_error", (err) => {
            console.log("🚨 Socket.IO connection error:");
            console.log("Origin:", err.req.headers.origin);
            console.log("Code:", err.code);
            console.log("Message:", err.message);
        });

        this.setupEventHandlers();
        console.log("✅ Socket.IO Manager initialized");
    }

    setupEventHandlers() {
        this.io.on("connection", (socket) => {
            console.log(`✅ Client connected: ${socket.id}`);

            // Register user
            socket.on("register-user", (userId) => {
                if (userId) {
                    const userIdStr = userId.toString();

                    // Remove old socket if exists
                    const oldSocketId = this.userSockets.get(userIdStr);
                    if (oldSocketId) {
                        this.socketUsers.delete(oldSocketId);
                    }

                    // Register new socket
                    this.userSockets.set(userIdStr, socket.id);
                    this.socketUsers.set(socket.id, userIdStr);

                    console.log(`👤 User ${userId} registered with socket ${socket.id}`);

                    // Send confirmation
                    socket.emit("registration-confirmed", { userId, socketId: socket.id });
                }
            });

            // Disconnect handler
            socket.on("disconnect", () => {
                const userId = this.socketUsers.get(socket.id);
                if (userId) {
                    this.userSockets.delete(userId);
                    this.socketUsers.delete(socket.id);
                    console.log(`👋 User ${userId} disconnected`);
                }
            });
        });
    }

    // Emit to specific user
    emitToUser(userId, event, data) {
        const userIdStr = userId.toString();
        const socketId = this.userSockets.get(userIdStr);

        if (socketId) {
            this.io.to(socketId).emit(event, data);
            console.log(`📤 Emitted '${event}' to user ${userId}`);
            return true;
        }

        console.log(`⚠️ User ${userId} not connected`);
        return false;
    }

    // Emit to all users
    emitToAll(event, data) {
        this.io.emit(event, data);
        console.log(`📢 Broadcasted '${event}' to all users`);
    }

    // Get IO instance
    getIO() {
        return this.io;
    }

    // Check if user is connected
    isUserConnected(userId) {
        return this.userSockets.has(userId.toString());
    }

    // Get connected users count
    getConnectedUsersCount() {
        return this.userSockets.size;
    }
}

// Export singleton instance
const socketManager = new SocketManager();
module.exports = socketManager;