import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import connectDB from "./config/db.js";
import bot, { launchBot } from "./services/telegram/bot.js";
import { setupCommands } from "./services/telegram/commands.js";
import userRouter from "./routes/userRoute.js";
import bingoRouter from "./routes/bingoRoute.js";
import roomRouter from "./routes/roomRoute.js";

// ✅ Import the MAIN socket server (not bingo directly)
import { initSocketServer } from "./sockets/socketServer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Frontend URL (used to redirect SPA routes on refresh)
// Default to the Render frontend URL per deployment request
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://bingo-e9bw.onrender.com";

// Configure CORS for Express
const corsOptions = {
  origin: [
    
    "https://bingo-e9bw.onrender.com",
    "https://marshal-bingo.onrender.com",
    
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/favicon.ico", (req, res) => {
  console.log("favicon request received");
  res.status(204).end();
});

app.get("/", (req, res) => {
  res.send("Marshal Game backend API is running!");
});

app.use("/api/users", userRouter);
app.use("/api/bingo", bingoRouter);
app.use("/api/rooms", roomRouter);

// Handle client-side SPA routes and direct-refreshes.
// Use `app.use` so the router doesn't try to parse '*' as a path param.
app.use((req, res, next) => {
  const path = req.path || "";
  // Ignore API and socket endpoints
  if (
    path.startsWith("/api") ||
    path.startsWith("/socket.io") ||
    path.startsWith("/favicon.ico")
  ) {
    return next();
  }

  // Preserve the path so frontend router can handle nested routes
  const target = `${FRONTEND_URL}${req.originalUrl}`;
  console.log(`Redirecting ${req.originalUrl} -> ${target}`);
  return res.redirect(302, target);
});

// Generic 404 for anything that fell through
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 1. Create HTTP server
const server = http.createServer(app);

// 2. Initialize the Socket Server (this triggers Bingo)
const io = initSocketServer(server);

// 3. Start listening immediately so frontend socket clients can connect
server.once("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please stop the existing server and try again.`,
    );
  } else {
    console.error("Server error:", error.message);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO is ready for Bingo!`);
});

const startServer = async () => {
  try {
    await connectDB();

    await setupCommands(bot);
    await launchBot();
  } catch (error) {
    console.error("Failed to start services:", error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("Shutting down server...");

  try {
    if (bot && typeof bot.stop === "function") {
      await bot.stop("SIGTERM");
      console.log("Telegram bot stopped cleanly.");
    }
  } catch (error) {
    console.warn("Telegram bot stop warning:", error.message);
  }

  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
