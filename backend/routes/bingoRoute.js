import express from "express";
import {
  createGame,
  joinGame,
  startGame,
  callNumber,
  markNumber,
  getGameState,
  getPlayerCard,
} from "../controller/bingoController.js";

const router = express.Router();

router.post("/create", createGame);
router.post("/join", joinGame);
router.post("/start", startGame);
router.post("/call-number", callNumber);
router.post("/mark-number", markNumber);
router.get("/state/:gameId", getGameState);
router.get("/card/:gameId/:telegramId", getPlayerCard);

export default router;
