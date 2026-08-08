import Room from "../models/Room.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

export const createRoom = async (req, res) => {
  try {
    const { name, description, maxPlayers = 10, minBet = 1, maxBet = 100 } = req.body;
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

    res.status(201).json({ success: true, message: "Room created", room });
  } catch (error) {
    console.error("Create Room Error:", error);
    res.status(500).json({ success: false, message: "Failed to create room", error: error.message });
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: { $ne: "closed" } }).sort({ createdAt: -1 });
    res.json({ success: true, rooms });
  } catch (error) {
    console.error("Get Rooms Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rooms", error: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    res.json({ success: true, room });
  } catch (error) {
    console.error("Get Room Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch room", error: error.message });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { telegramId } = req.user || req.body;
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    if (room.status !== "open") {
      return res.status(400).json({ success: false, message: "Room is not open" });
    }
    if (room.players.some((player) => player.telegramId === telegramId)) {
      return res.status(400).json({ success: false, message: "Already joined" });
    }
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ success: false, message: "Room is full" });
    }

    room.players.push({ telegramId, username: user.username || user.firstName });
    await room.save();

    res.json({ success: true, message: "Joined room", room });
  } catch (error) {
    console.error("Join Room Error:", error);
    res.status(500).json({ success: false, message: "Failed to join room", error: error.message });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { telegramId } = req.user || req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    room.players = room.players.filter((player) => player.telegramId !== telegramId);
    await room.save();

    res.json({ success: true, message: "Left room", room });
  } catch (error) {
    console.error("Leave Room Error:", error);
    res.status(500).json({ success: false, message: "Failed to leave room", error: error.message });
  }
};

export const closeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    room.status = "closed";
    await room.save();

    res.json({ success: true, message: "Room closed", room });
  } catch (error) {
    console.error("Close Room Error:", error);
    res.status(500).json({ success: false, message: "Failed to close room", error: error.message });
  }
};
