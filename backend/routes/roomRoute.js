import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  closeRoom,
} from "../controller/roomController.js";
import { userAuth } from "../middleware/userAuth.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", getRooms);
router.get("/:roomId", getRoomById);
router.post("/", userAuth, createRoom);
router.post("/:roomId/join", userAuth, joinRoom);
router.post("/:roomId/leave", userAuth, leaveRoom);
router.patch("/:roomId/close", adminAuth, closeRoom);

export default router;
