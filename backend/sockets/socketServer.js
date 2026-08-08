import { Server } from "socket.io";
import { initBingoSocket } from "./bingoSocket.js";
//import { initLudoSocket } from "./ludoSocket.js";

/**
 * Main Socket.IO Server Initializer
 * @param {http.Server} server - The HTTP server instance from Express
 * @returns {Server} The configured Socket.IO instance
 */
export const initSocketServer = (server) => {
  // 1. Create the main Socket.IO instance
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, restrict this to your frontend domain
      methods: ["GET", "POST"],
    },
    // Optional: Add connection timeout settings
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // 2. Middleware: Authenticate socket connections (Optional but recommended)
  io.use((socket, next) => {
    // You can extract token from socket.handshake.auth.token
    // For now, we allow all connections
    console.log(`🔌 New connection attempt from ${socket.id}`);
    next();
  });

  // 3. Log connection events globally
  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} | Reason: ${reason}`);
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`⚠️ Socket error from ${socket.id}:`, error.message);
    });
  });

  // 4. Initialize specific game sockets (Bingo and Ludo)
  // Pass 'io' and specific namespaces if you want to separate rooms by game type
  console.log("🎮 Initializing Bingo Socket...");
  initBingoSocket(io);

  // console.log("🎲 Initializing Ludo Socket...");
  // initLudoSocket(io);

  // 5. Return the main instance for external use
  return io;
};