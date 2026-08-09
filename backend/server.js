import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import connectDB from "./config/db.js";
import bot from "./services/telegram/bot.js";
import { setupCommands } from "./services/telegram/commands.js";
import userRouter from "./routes/userRoute.js";
import bingoRouter from "./routes/bingoRoute.js";
import roomRouter from "./routes/roomRoute.js";

// ✅ Import the MAIN socket server (not bingo directly)
import { initSocketServer } from "./sockets/socketServer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
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

// Start the server
const startServer = async () => {
  try {
    await connectDB();

    await bot.launch();
    console.log(
      "🤖 Telegram bot is running",
      bot.botInfo?.username || "Telegram bot",
    );

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
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

const shutdown = () => {
  console.log("Shutting down server...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
