
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
  autoConnect: false, // Connect only after login or joining a game
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  credentials: true,
  withCredentials: true,
  extraHeaders: {
    "Content-Type": "application/json",
  },
});

socket.on("connect", () => {
  console.log("Socket connected to", URL);
});

socket.on("connect_error", (err) => {
  console.error("Socket connect error:", err);
});

socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", reason);
});

export default socket;
