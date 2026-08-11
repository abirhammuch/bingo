import { io } from "socket.io-client";

const normalizeUrl = (rawUrl) =>
  rawUrl
    .replace(/(^['"]|['"]$)/g, "")
    .replace(/\/+$/g, "")
    .trim();

const rawUrl = import.meta.env.VITE_API_URL;
const URL = rawUrl ? normalizeUrl(rawUrl) : "http://localhost:5000";

const socket = io(URL, {
  autoConnect: false, // Connect only after login or joining a game
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  path: "/socket.io",
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
