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
import adminRouter from "./routes/adminRoute.js";

// ✅ Import the MAIN socket server (not bingo directly)
import { initSocketServer } from "./sockets/socketServer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

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

// API Routes
app.use("/api/users", userRouter);
app.use("/api/bingo", bingoRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/admin", adminRouter);

// ✅ REMOVED: The redirect middleware is gone.

// Generic 404 for API routes that don't exist
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
