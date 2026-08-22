import { io } from "socket.io-client";

const normalizeUrl = (rawUrl) =>
  rawUrl
    .replace(/(^['"]|['"]$)/g, "")
    .replace(/\/+$/g, "")
    .trim();

const rawUrl = import.meta.env.VITE_API_URL;

const URL = rawUrl
  ? normalizeUrl(rawUrl)
  : typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5000";

const socket = io(URL, {
  autoConnect: false,

  auth: {},

  transports: ["websocket", "polling"],

  reconnection: true,

  reconnectionAttempts: 10,

  reconnectionDelay: 1000,

  reconnectionDelayMax: 5000,

  withCredentials: true,
});

socket.on("connect", () => {
  console.log("✅ Bingo socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("❌ Bingo socket error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Bingo socket disconnected:", reason);
});

export const authenticateTelegram = (initData) => {
  if (!initData) return;

  socket.auth = { initData: decodeURIComponent(initData) };
  if (socket.connected) socket.disconnect().connect();
};

export default socket;
