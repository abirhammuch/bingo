import { Server } from "socket.io";
import { initBingoSocket } from "./bingoSocket.js";
import User from "../models/User.js";
import { verifyTelegramInitData } from "../utils/telegramAuth.js";
//import { initLudoSocket } from "./ludoSocket.js";

// ✅ 1. Create a global variable to store the Socket.IO instance
let ioInstance = null;

/**
 * Main Socket.IO Server Initializer
 * @param {http.Server} server - The HTTP server instance from Express
 * @returns {Server} The configured Socket.IO instance
 */
export const initSocketServer = (server) => {
  // 1. Create the main Socket.IO instance
  const io = new Server(server, {
    cors: {
      origin: [
        "https://bingo-e9bw.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowEIO3: true,
    },
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // ✅ 2. Store the instance in the global variable so other files can access it
  ioInstance = io;

  // 3. Middleware: Authenticate socket connections (Optional but recommended)
  io.use(async (socket, next) => {
    console.log(`🔌 New connection attempt from ${socket.id}`);
    try {
      const initData = socket.handshake.auth?.initData;
      if (!initData) return next();

      const params = verifyTelegramInitData(initData);
      const telegramUser =
        typeof params.user === "string" ? JSON.parse(params.user) : params.user;
      const telegramId = String(telegramUser?.id || params.id || "");
      const user = await User.findOne({ telegramId }).select(
        "isBlocked isActive",
      );

      if (user?.isBlocked || user?.isActive === false) {
        const error = new Error("CHEATING_IS_BAD");
        error.data = { code: "ACCOUNT_BLOCKED" };
        return next(error);
      }

      socket.telegramId = telegramId;
      next();
    } catch (error) {
      next(error);
    }
  });

  // 4. Log connection events globally
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

  // 5. Initialize specific game sockets (Bingo and Ludo)
  console.log("🎮 Initializing Bingo Socket...");
  initBingoSocket(io);

  // console.log("🎲 Initializing Ludo Socket...");
  // initLudoSocket(io);

  // 6. Return the main instance for external use
  return io;
};

// ✅ 7. EXPORT THIS FUNCTION so controllers can access the Socket.IO instance
export const getIO = () => {
  if (!ioInstance) {
    throw new Error(
      "Socket.IO has not been initialized yet! Did you call initSocketServer() first?",
    );
  }
  return ioInstance;
};
