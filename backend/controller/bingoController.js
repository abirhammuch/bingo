import {
  createBingoGame,
  joinBingoGame,
  startGame as startBingoGame,
  callNumber as callNumberService,
  markNumber as markNumberService,
  getGameState as getBingoGameState,
  getPlayerCard as getBingoPlayerCard,
} from "../services/bingo/bingoService.js";

export const createGame = async (req, res) => {
  try {
    const { roomId, maxPlayers = 100, minBet = 1, maxBet = 100 } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "roomId is required",
      });
    }

    const game = await createBingoGame(roomId, maxPlayers, minBet, maxBet);

    return res.status(201).json({
      success: true,
      message: "Bingo game created successfully",
      game,
    });
  } catch (error) {
    console.error("Create Bingo Game Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create bingo game",
      error: error.message,
    });
  }
};

export const joinGame = async (req, res) => {
  try {
    const { gameId, telegramId, betAmount, luckyNumber } = req.body;

    if (!gameId || !telegramId || !betAmount) {
      return res.status(400).json({
        success: false,
        message: "gameId, telegramId, and betAmount are required",
      });
    }

    const result = await joinBingoGame(
      gameId,
      telegramId,
      betAmount,
      luckyNumber,
    );

    return res.json({
      success: true,
      message: "Joined bingo game successfully",

      ticket: result.ticket,

      game: result.game,

      balance: result.user.balance,
    });
  } catch (error) {
    console.error("Join Bingo Game Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to join bingo game",

      error: error.message,
    });
  }
};

export const startGame = async (req, res) => {
  try {
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "gameId is required",
      });
    }

    const game = await startBingoGame(gameId);

    return res.json({
      success: true,
      message: "Bingo game started successfully",
      game,
    });
  } catch (error) {
    console.error("Start Bingo Game Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start bingo game",
      error: error.message,
    });
  }
};

export const callNumber = async (req, res) => {
  try {
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "gameId is required",
      });
    }

    const result = await callNumberService(gameId);

    return res.json({
      success: true,

      message: result?.gameEnded
        ? "Bingo round finished"
        : "Number called successfully",

      call: result,

      /*
       * Useful for frontend.
       */
      calledCount: result?.calledNumbers?.length || 0,

      maxCalls: 75,
    });
  } catch (error) {
    console.error("Call Bingo Number Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to call number",

      error: error.message,
    });
  }
};

export const markNumber = async (req, res) => {
  try {
    const { gameId, telegramId, number } = req.body;

    if (!gameId || !telegramId || number === undefined) {
      return res.status(400).json({
        success: false,
        message: "gameId, telegramId, and number are required",
      });
    }

    const result = await markNumberService(gameId, telegramId, number);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Mark Bingo Number Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark number",

      error: error.message,
    });
  }
};

export const getGameState = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "gameId is required",
      });
    }

    const game = await getBingoGameState(gameId);

    return res.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("Get Bingo Game State Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load game state",

      error: error.message,
    });
  }
};

export const getPlayerCard = async (req, res) => {
  try {
    const { gameId, telegramId } = req.params;

    if (!gameId || !telegramId) {
      return res.status(400).json({
        success: false,
        message: "gameId and telegramId are required",
      });
    }

    const card = await getBingoPlayerCard(gameId, telegramId);

    return res.json({
      success: true,
      ...card,
    });
  } catch (error) {
    console.error("Get Player Card Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load player card",

      error: error.message,
    });
  }
};
