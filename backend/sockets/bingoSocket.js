import BingoGame from "../models/BingoGame.js";

import {
  createBingoGame,
  joinBingoGame,
  joinAsSpectator,
  markNumber,
  getGameState,
  getPlayerCard,
  normalizeTelegramId,
} from "../services/bingo/bingoService.js";

import {
  startSelectionTimer,
  startCallingNumbers,
  stopBingoTimers,
  emitRoundState,
  buildRoundState,
  getBingoRoom,
} from "./bingoTimer.js";

// ============================================================
// HELPER
// ============================================================

const getPlayerSummary = (players = []) => {
  return players.map((player) => ({
    telegramId: player.telegramId,

    username: player.username || player.firstName || "Player",

    firstName: player.firstName || "Player",

    isSpectator: player.isSpectator === true,

    hasBingo: player.hasBingo === true,

    cardsSelected: player.cardsSelected || 0,
  }));
};

// ============================================================
// FIND CURRENT GAME FOR ROOM
// ============================================================

const getCurrentGameForRoom = async (roomId) => {
  return BingoGame.findOne({
    roomId,

    status: {
      $in: ["waiting", "active"],
    },
  }).sort({
    roundNumber: -1,
  });
};

// ============================================================
// JOIN SOCKET TO BINGO GAME
// ============================================================

const joinGameSocket = (socket, gameId) => {
  socket.join(getBingoRoom(gameId));
};

// ============================================================
// INIT
// ============================================================

export const initBingoSocket = (io) => {
  console.log("🎮 Bingo Socket initialized");

  io.on("connection", async (socket) => {
    console.log(`🎯 Bingo client connected: ${socket.id}`);

    // ======================================================
    // GET CURRENT GAME
    // ======================================================

    try {
      const game = await BingoGame.findOne({
        status: {
          $in: ["waiting", "active"],
        },
      }).sort({
        updatedAt: -1,
      });

      if (game) {
        joinGameSocket(socket, game.gameId);

        socket.emit("bingo:roundState", buildRoundState(game));
      }
    } catch (error) {
      console.error("Initial Bingo state error:", error);
    }

    // ======================================================
    // CREATE ROOM / GAME
    // ======================================================

    socket.on("createRoom", async (data, callback) => {
      try {
        const {
          roomId,
          maxPlayers = 10,
          minBet = 1,
          maxBet = 100,
        } = data || {};

        if (!roomId) {
          throw new Error("Room ID is required");
        }

        const game = await createBingoGame(roomId, maxPlayers, minBet, maxBet);

        // Join normal room
        socket.join(roomId);

        // Join Bingo game room
        joinGameSocket(socket, game.gameId);

        socket.emit("roomCreated", {
          success: true,

          gameId: game.gameId,

          roomId: game.roomId,

          roundNumber: game.roundNumber,

          selectionEndsAt: game.selectionEndsAt,

          message: "Bingo room created.",
        });

        // Start GLOBAL timer
        await startSelectionTimer(io, game.gameId);

        if (typeof callback === "function") {
          callback({
            success: true,

            gameId: game.gameId,

            roomId: game.roomId,
          });
        }
      } catch (error) {
        console.error("Create room error:", error);

        const response = {
          success: false,

          message: error.message || "Failed to create room",
        };

        if (typeof callback === "function") {
          callback(response);
        } else {
          socket.emit("error", response);
        }
      }
    });

    // ======================================================
    // JOIN GAME
    // ======================================================

    socket.on("joinRoom", async (data, callback) => {
      try {
        const {
          gameId,
          telegramId,
          betAmount,
          luckyNumber = null,
        } = data || {};

        if (!gameId || !telegramId) {
          throw new Error("Game ID and Telegram ID are required.");
        }

        let result;

        let isSpectator = false;

        // =================================================
        // CHECK GAME
        // =================================================

        const game = await getGameState(gameId);

        // =================================================
        // WAITING = PLAYER JOIN
        // =================================================

        if (game.status === "waiting") {
          if (!betAmount || Number(betAmount) <= 0) {
            throw new Error("Bet amount is required during selection.");
          }

          result = await joinBingoGame(
            gameId,
            telegramId,
            Number(betAmount),
            luckyNumber,
          );

          isSpectator = false;
        }

        // =================================================
        // ACTIVE = SPECTATOR
        // =================================================
        else if (game.status === "active") {
          result = await joinAsSpectator(gameId, telegramId);

          isSpectator = true;
        }

        // =================================================
        // COMPLETED
        // =================================================
        else {
          throw new Error(
            "This round has finished. Please wait for the next round.",
          );
        }

        // =================================================
        // JOIN SOCKET ROOMS
        // =================================================

        socket.join(result.game.roomId);

        joinGameSocket(socket, result.game.gameId);

        // =================================================
        // RESPONSE
        // =================================================

        socket.emit("joinedRoom", {
          success: true,

          gameId: result.game.gameId,

          roomId: result.game.roomId,

          card: result.ticket?.card || null,

          ticketId: result.ticket?.ticketId || null,

          balance: result.user.balance,

          currentPlayers: result.game.players.filter(
            (p) => p.isSpectator !== true,
          ).length,

          playerCount: result.game.players.filter((p) => p.isSpectator !== true)
            .length,

          spectatorCount: result.game.players.filter(
            (p) => p.isSpectator === true,
          ).length,

          players: getPlayerSummary(result.game.players),

          selectedNumbers: result.game.selectedNumbers || [],

          isSpectator,
        });

        // =================================================
        // SEND CURRENT GLOBAL STATE
        // =================================================

        const currentGame = await getGameState(result.game.gameId);

        emitRoundState(io, currentGame);

        if (typeof callback === "function") {
          callback({
            success: true,

            gameId: currentGame.gameId,

            roomId: currentGame.roomId,

            selectedNumbers: currentGame.selectedNumbers || [],

            playerCount: currentGame.players.filter(
              (p) => p.isSpectator !== true,
            ).length,

            spectatorCount: currentGame.players.filter(
              (p) => p.isSpectator === true,
            ).length,

            isSpectator,
          });
        }
      } catch (error) {
        console.error("Join Bingo error:", error);

        const response = {
          success: false,

          message: error.message || "Failed to join game",
        };

        if (typeof callback === "function") {
          callback(response);
        } else {
          socket.emit("error", response);
        }
      }
    });

    // ======================================================
    // SELECT CARD / LUCKY NUMBER
    // ======================================================

    socket.on("selectCard", async (data, callback) => {
      try {
        const { gameId, telegramId, luckyNumber } = data || {};

        if (
          !gameId ||
          !telegramId ||
          luckyNumber === undefined ||
          luckyNumber === null
        ) {
          throw new Error(
            "Game ID, Telegram ID and lucky number are required.",
          );
        }

        const game = await getGameState(gameId);

        // Only during selection
        if (game.status !== "waiting") {
          throw new Error("Card selection has ended.");
        }

        // =================================================
        // FIND PLAYER
        // =================================================

        const normalizedId = normalizeTelegramId(telegramId);

        const player = game.players.find(
          (p) => normalizeTelegramId(p.telegramId) === normalizedId,
        );

        if (!player) {
          throw new Error("You have not joined this round.");
        }

        if (player.isSpectator === true) {
          throw new Error("Spectators cannot select a card.");
        }

        // =================================================
        // CHECK TIMER
        // =================================================

        if (
          game.selectionEndsAt &&
          new Date(game.selectionEndsAt).getTime() <= Date.now()
        ) {
          throw new Error("Selection time has ended.");
        }

        const number = Number(luckyNumber);

        if (!Number.isInteger(number) || number < 1 || number > 75) {
          throw new Error("Lucky number must be between 1 and 75.");
        }

        // =================================================
        // CHECK DUPLICATE
        // =================================================

        const alreadySelected = (game.selectedNumbers || []).includes(number);

        const playerAlreadySelected = (
          player.selectedLuckyNumbers || []
        ).includes(number);

        if (alreadySelected && !playerAlreadySelected) {
          throw new Error("This number has already been selected.");
        }

        if (!playerAlreadySelected) {
          player.selectedLuckyNumbers.push(number);

          game.selectedNumbers.push(number);

          game.selectedNumbers = [...new Set(game.selectedNumbers)].sort(
            (a, b) => a - b,
          );
        }

        game.playerCount = game.players.filter(
          (p) => p.isSpectator !== true,
        ).length;

        game.roundSummary.playerCount = game.playerCount;

        game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

        await game.save();

        // =================================================
        // BROADCAST TO EVERYONE
        // =================================================

        emitRoundState(io, game);

        io.to(getBingoRoom(gameId)).emit("bingo:cardSelected", {
          gameId,

          telegramId: normalizedId,

          luckyNumber: number,

          selectedNumbers: game.selectedNumbers,

          playerCount: game.playerCount,
        });

        if (typeof callback === "function") {
          callback({
            success: true,

            selectedNumbers: game.selectedNumbers,

            luckyNumber: number,
          });
        }
      } catch (error) {
        console.error("Select card error:", error);

        const response = {
          success: false,

          message: error.message || "Failed to select card",
        };

        if (typeof callback === "function") {
          callback(response);
        } else {
          socket.emit("error", response);
        }
      }
    });

    // ======================================================
    // MARK NUMBER
    // ======================================================

    socket.on("markNumber", async (data) => {
      try {
        const { gameId, telegramId, number } = data || {};

        if (!gameId || !telegramId || number === undefined) {
          throw new Error("Game ID, Telegram ID and number are required.");
        }

        const result = await markNumber(gameId, telegramId, Number(number));

        socket.emit("numberMarked", {
          success: true,

          number: Number(number),

          marked: result.marked,

          bingo: result.bingo,

          bingoResult: result.bingoResult,

          markedNumbers: result.markedNumbers,
        });
      } catch (error) {
        console.error("Mark number error:", error);

        socket.emit("error", {
          success: false,

          message: error.message || "Failed to mark number",
        });
      }
    });

    // ======================================================
    // GET GAME STATE
    // ======================================================

    socket.on("getGameState", async (data, callback) => {
      try {
        const { gameId } = data || {};

        if (!gameId) {
          throw new Error("Game ID is required.");
        }

        const game = await getGameState(gameId);

        joinGameSocket(socket, gameId);

        const state = buildRoundState(game);

        socket.emit("bingo:roundState", state);

        if (typeof callback === "function") {
          callback({
            success: true,

            state,
          });
        }
      } catch (error) {
        console.error("Get state error:", error);

        socket.emit("error", {
          success: false,

          message: error.message,
        });
      }
    });

    // ======================================================
    // GET PLAYER CARD
    // ======================================================

    socket.on("getCard", async (data, callback) => {
      try {
        const { gameId, telegramId } = data || {};

        const result = await getPlayerCard(gameId, telegramId);

        const response = {
          success: true,

          card: result.card,

          markedNumbers: result.markedNumbers,

          selectedLuckyNumbers: result.selectedLuckyNumbers,
        };

        socket.emit("playerCard", response);

        if (typeof callback === "function") {
          callback(response);
        }
      } catch (error) {
        console.error("Get card error:", error);

        socket.emit("error", {
          success: false,

          message: error.message,
        });
      }
    });

    // ======================================================
    // LEAVE
    // ======================================================

    socket.on("leaveRoom", (data) => {
      const { roomId, gameId } = data || {};

      if (roomId) {
        socket.leave(roomId);
      }

      if (gameId) {
        socket.leave(getBingoRoom(gameId));
      }

      socket.emit("leftRoom", {
        success: true,

        message: "Left Bingo room.",
      });
    });

    // ======================================================
    // DISCONNECT
    // ======================================================

    socket.on("disconnect", () => {
      console.log(`🎯 Bingo client disconnected: ${socket.id}`);
    });
  });
};
