import Room from "../models/Room.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import { getIO } from "../sockets/socketServer.js"; // ✅ Import the Socket.IO instance

// Helper to broadcast room updates to all players in the room
const broadcastRoomUpdate = async (roomId, io) => {
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    // Emit the updated room state to everyone in the Socket.IO room
    io.to(roomId).emit("roomUpdate", {
      type: "roomStateChanged",
      roomId: room.roomId,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      players: room.players,
      status: room.status,
    });

    // Also emit to the global namespace for lobby updates
    io.emit("lobbyUpdate", {
      type: "roomUpdated",
      roomId: room.roomId,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      status: room.status,
    });
  } catch (error) {
    console.error("Broadcast Room Update Error:", error);
  }
};

// ==========================================
// 1. CREATE ROOM
// ==========================================
export const createRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      maxPlayers = 10,
      minBet = 1,
      maxBet = 100,
    } = req.body;
    const roomId = `room-${uuidv4()}`;

    const room = new Room({
      roomId,
      name: name || "Bingo Room",
      description: description || "",
      maxPlayers,
      minBet,
      maxBet,
      status: "open",
      players: [],
    });

    await room.save();

    // ✅ Emit to all connected clients that a new room was created
    const io = getIO();
    if (io) {
      io.emit("lobbyUpdate", {
        type: "roomCreated",
        roomId: room.roomId,
        name: room.name,
        playerCount: 0,
        maxPlayers: room.maxPlayers,
        status: room.status,
      });
    }

    res.status(201).json({ success: true, message: "Room created", room });
  } catch (error) {
    console.error("Create Room Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create room",
        error: error.message,
      });
  }
};

// ==========================================
// 2. GET ALL OPEN ROOMS
// ==========================================
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: { $ne: "closed" } }).sort({
      createdAt: -1,
    });
    res.json({ success: true, rooms });
  } catch (error) {
    console.error("Get Rooms Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch rooms",
        error: error.message,
      });
  }
};

// ==========================================
// 3. GET ROOM BY ID
// ==========================================
export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    res.json({ success: true, room });
  } catch (error) {
    console.error("Get Room Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch room",
        error: error.message,
      });
  }
};

// ==========================================
// 4. JOIN ROOM (FIXED WITH SOCKET EMIT)
// ==========================================
export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { telegramId } = req.user || req.body;
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    if (room.status !== "open") {
      return res
        .status(400)
        .json({ success: false, message: "Room is not open" });
    }
    if (room.players.some((player) => player.telegramId === telegramId)) {
      return res
        .status(400)
        .json({ success: false, message: "Already joined" });
    }
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ success: false, message: "Room is full" });
    }

    room.players.push({
      telegramId,
      username: user.username || user.firstName,
    });
    await room.save();

    // ✅ BROADCAST the updated player count to everyone in the room
    const io = getIO();
    if (io) {
      await broadcastRoomUpdate(roomId, io);
    }

    res.json({ success: true, message: "Joined room", room });
  } catch (error) {
    console.error("Join Room Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to join room",
        error: error.message,
      });
  }
};

// ==========================================
// 5. LEAVE ROOM (FIXED WITH SOCKET EMIT)
// ==========================================
export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { telegramId } = req.user || req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    room.players = room.players.filter(
      (player) => player.telegramId !== telegramId,
    );
    await room.save();

    // ✅ BROADCAST the updated player count to everyone in the room
    const io = getIO();
    if (io) {
      await broadcastRoomUpdate(roomId, io);
    }

    res.json({ success: true, message: "Left room", room });
  } catch (error) {
    console.error("Leave Room Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to leave room",
        error: error.message,
      });
  }
};

// ==========================================
// 6. CLOSE ROOM
// ==========================================
export const closeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    room.status = "closed";
    await room.save();

    // ✅ BROADCAST that the room is closed
    const io = getIO();
    if (io) {
      io.to(roomId).emit("roomUpdate", {
        type: "roomClosed",
        roomId: room.roomId,
        message: "Room has been closed by the host.",
      });
      io.emit("lobbyUpdate", {
        type: "roomClosed",
        roomId: room.roomId,
      });
    }

    res.json({ success: true, message: "Room closed", room });
  } catch (error) {
    console.error("Close Room Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to close room",
        error: error.message,
      });
  }
};
