import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(URL, {
  autoConnect: false, // Connect only after login or joining a game
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
