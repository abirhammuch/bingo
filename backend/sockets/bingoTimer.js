import BingoGame from "../models/BingoGame.js";

import {
  SELECTION_TIME_SECONDS,
  CALL_INTERVAL_MS,
  startGame,
  resetEmptyRound,
  createBingoGame,
  callNumber,
} from "../services/bingo/bingoService.js";

const selectionTimers = new Map();
const callingTimers = new Map();

const nextRoundTimers = new Map();

// ============================================================
// ROOM NAME
// ============================================================

export const getBingoRoom = (gameId) => {
  return `bingo:${gameId}`;
};

// ============================================================
// GET REMAINING TIME
// ============================================================

export const getRemainingSeconds = (selectionEndsAt) => {
  if (!selectionEndsAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((new Date(selectionEndsAt).getTime() - Date.now()) / 1000),
  );
};

// ============================================================
// GET REAL PLAYERS
// ============================================================

const getRealPlayers = (game) => {
  return (game.players || []).filter((player) => player.isSpectator !== true);
};

// ============================================================
// GET SPECTATORS
// ============================================================

const getSpectators = (game) => {
  return (game.players || []).filter((player) => player.isSpectator === true);
};

// ============================================================
// CHECK SELECTED CARD
// ============================================================

const hasSelectedCard = (game) => {
  return getRealPlayers(game).some(
    (player) =>
      Array.isArray(player.selectedLuckyNumbers) &&
      player.selectedLuckyNumbers.length > 0,
  );
};

// ============================================================
// PLAYER SUMMARY
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
// BUILD ROUND STATE
// ============================================================

export const buildRoundState = (game) => {
  const realPlayers = getRealPlayers(game);

  const spectators = getSpectators(game);

  const remainingSeconds =
    game.status === "waiting" ? getRemainingSeconds(game.selectionEndsAt) : 0;

  return {
    gameId: game.gameId,

    roomId: game.roomId,

    roundNumber: game.roundNumber,

    status:
      game.status === "waiting"
        ? "WAITING"
        : game.status === "active"
          ? "PLAYING"
          : "FINISHED",

    playerCount: realPlayers.length,

    spectatorCount: spectators.length,

    participants: realPlayers.length,

    players: getPlayerSummary(game.players),

    selectedNumbers: game.selectedNumbers || [],

    calledNumbers: game.calledNumbers || [],

    currentNumber: game.currentNumber ?? null,

    winner: game.winner || null,

    remainingSeconds,

    selectionEndsAt: game.selectionEndsAt || null,
  };
};

// ============================================================
// EMIT STATE
// ============================================================

export const emitRoundState = (io, game) => {
  if (!io || !game) {
    return;
  }

  const room = getBingoRoom(game.gameId);

  const state = buildRoundState(game);

  // Everyone in current game
  io.to(room).emit("bingo:roundState", state);

  // Separate timer event
  if (game.status === "waiting") {
    io.to(room).emit("bingo:selectionTick", {
      gameId: game.gameId,

      remainingSeconds: state.remainingSeconds,

      selectionEndsAt: game.selectionEndsAt,
    });
  }

  io.to(room).emit("bingo:participantCount", {
    gameId: game.gameId,

    playerCount: state.playerCount,

    spectatorCount: state.spectatorCount,

    participants: state.playerCount,

    selectedNumbers: state.selectedNumbers,

    status: state.status,
  });
};

// ============================================================
// STOP SELECTION TIMER
// ============================================================

export const stopSelectionTimer = (gameId) => {
  const timer = selectionTimers.get(gameId);

  if (timer) {
    clearInterval(timer);

    selectionTimers.delete(gameId);
  }
};

// ============================================================
// STOP CALLING TIMER
// ============================================================

export const stopCallingTimer = (gameId) => {
  const timer = callingTimers.get(gameId);

  if (timer) {
    clearInterval(timer);

    callingTimers.delete(gameId);
  }
};

// ============================================================
// STOP NEXT ROUND TIMER
// ============================================================

const stopNextRoundTimer = (gameId) => {
  const timer = nextRoundTimers.get(gameId);

  if (timer) {
    clearTimeout(timer);

    nextRoundTimers.delete(gameId);
  }
};

// ============================================================
// START GLOBAL 30 SECOND TIMER
// ============================================================

export const startSelectionTimer = async (io, gameId) => {
  stopSelectionTimer(gameId);

  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    console.error("Selection timer: game not found", gameId);

    return;
  }

  // Always make sure the game is waiting
  game.status = "waiting";

  game.selectionEndsAt = new Date(Date.now() + SELECTION_TIME_SECONDS * 1000);

  await game.save();

  const room = getBingoRoom(gameId);

  // Send initial 30 seconds
  emitRoundState(io, game);

  io.to(room).emit("bingo:selectionStarted", {
    gameId,

    status: "WAITING",

    remainingSeconds: SELECTION_TIME_SECONDS,

    selectionEndsAt: game.selectionEndsAt,
  });

  let lastSeconds = SELECTION_TIME_SECONDS;

  const timer = setInterval(async () => {
    try {
      const latest = await BingoGame.findOne({
        gameId,
      });

      if (!latest) {
        stopSelectionTimer(gameId);

        return;
      }

      // If game became active/finished,
      // this timer must stop.
      if (latest.status !== "waiting") {
        stopSelectionTimer(gameId);

        return;
      }

      const remaining = getRemainingSeconds(latest.selectionEndsAt);

      // Send every changed second
      if (remaining !== lastSeconds) {
        lastSeconds = remaining;

        io.to(room).emit("bingo:selectionTick", {
          gameId,

          remainingSeconds: remaining,

          selectionEndsAt: latest.selectionEndsAt,
        });

        emitRoundState(io, latest);
      }

      // ==================================================
      // TIMER FINISHED
      // ==================================================

      if (remaining <= 0) {
        stopSelectionTimer(gameId);

        const freshGame = await BingoGame.findOne({
          gameId,
        });

        if (!freshGame) {
          return;
        }

        // Make sure it is still waiting
        if (freshGame.status !== "waiting") {
          return;
        }

        // ==================================================
        // CRITICAL:
        // Check whether REAL PLAYER selected a card.
        // Spectators are ignored.
        // ==================================================

        const selected = hasSelectedCard(freshGame);

        if (!selected) {
          // ==============================================
          // NO CARD SELECTED
          // ==============================================

          const resetGame = await resetEmptyRound(gameId);

          io.to(room).emit("bingo:roundReset", {
            gameId,

            roomId: resetGame.roomId,

            message:
              "No player selected a card. Starting a new 30-second selection period.",

            status: "WAITING",

            remainingSeconds: SELECTION_TIME_SECONDS,

            selectionEndsAt: resetGame.selectionEndsAt,

            playerCount: 0,

            spectatorCount: 0,

            selectedNumbers: [],

            calledNumbers: [],

            currentNumber: null,

            winner: null,

            roundNumber: resetGame.roundNumber,
          });

          // ==============================================
          // START NEW GLOBAL 30 SECOND TIMER
          // ==============================================

          await startSelectionTimer(io, gameId);

          return;
        }

        // ==============================================
        // AT LEAST ONE PLAYER SELECTED
        // ==============================================

        const result = await startGame(gameId);

        if (result.noPlayers) {
          await startSelectionTimer(io, gameId);

          return;
        }

        const liveGame = result.game;

        emitRoundState(io, liveGame);

        io.to(room).emit("bingo:gameStarted", {
          gameId,

          roomId: liveGame.roomId,

          status: "PLAYING",

          playerCount: getRealPlayers(liveGame).length,

          spectatorCount: getSpectators(liveGame).length,

          calledNumbers: liveGame.calledNumbers,

          currentNumber: null,

          remainingSeconds: 0,
        });

        // ==============================================
        // START CALLING
        // ==============================================

        startCallingNumbers(io, gameId);
      }
    } catch (error) {
      console.error("Selection timer error:", error);
    }
  }, 1000);

  selectionTimers.set(gameId, timer);
};

// ============================================================
// AUTOMATIC NUMBER CALLING
// ============================================================

export const startCallingNumbers = (io, gameId) => {
  // Already calling
  if (callingTimers.has(gameId)) {
    return;
  }

  const room = getBingoRoom(gameId);

  const timer = setInterval(async () => {
    try {
      const game = await BingoGame.findOne({
        gameId,
      });

      if (!game) {
        stopCallingTimer(gameId);

        return;
      }

      // Stop when completed
      if (game.status !== "active") {
        stopCallingTimer(gameId);

        return;
      }

      // Maximum 75 numbers
      if (game.calledNumbers.length >= 75) {
        stopCallingTimer(gameId);

        game.status = "completed";

        game.roundEndedAt = new Date();

        game.endTime = new Date();

        game.roundSummary.endedReason = "all_numbers_called";

        await game.save();

        io.to(room).emit("bingo:roundFinished", {
          gameId,

          roomId: game.roomId,

          status: "FINISHED",

          winner: null,

          message: "All numbers have been called.",
        });

        scheduleNextRound(io, game);

        return;
      }

      // ==================================================
      // CALL ONE NUMBER
      // ==================================================

      const result = await callNumber(gameId);

      if (!result) {
        return;
      }

      // ==================================================
      // SEND NUMBER TO EVERYONE
      // ==================================================

      io.to(room).emit("bingo:numberCalled", {
        gameId,

        number: result.number,

        currentNumber: result.number,

        calledNumbers: result.calledNumbers,

        gameEnded: result.gameEnded,

        remaining: Math.max(0, 75 - result.calledNumbers.length),
      });

      // ==================================================
      // WINNER
      // ==================================================

      if (result.gameEnded && result.winner) {
        stopCallingTimer(gameId);

        const winner = result.winner;

        const winnerGame = await BingoGame.findOne({
          gameId,
        });

        if (!winnerGame) {
          return;
        }

        // ==================================================
        // WINNER EVENT TO EVERYONE
        // ==================================================

        io.to(room).emit("bingo:winner", {
          gameId,

          roomId: winnerGame.roomId,

          status: "FINISHED",

          winner: {
            telegramId: winner.telegramId,

            username: winner.username,

            firstName: winner.firstName,

            name: winner.firstName || winner.username || "Winner",

            card: winner.card,

            markedNumbers: winner.markedNumbers,

            betAmount: winner.betAmount,

            winAmount: winner.winAmount,

            bingoResult: winner.bingoResult,
          },

          winnerName: winner.firstName || winner.username || "Winner",

          winnerCard: winner.card,

          winAmount: winner.winAmount,

          bingoResult: winner.bingoResult,

          calledNumbers: result.calledNumbers,
        });

        // ==================================================
        // ROUND FINISHED
        // ==================================================

        io.to(room).emit("bingo:roundFinished", {
          gameId,

          roomId: winnerGame.roomId,

          status: "FINISHED",

          winner: {
            telegramId: winner.telegramId,

            username: winner.username,

            firstName: winner.firstName,

            name: winner.firstName || winner.username || "Winner",

            card: winner.card,

            winAmount: winner.winAmount,

            bingoResult: winner.bingoResult,
          },

          calledNumbers: result.calledNumbers,
        });

        // ==================================================
        // CREATE NEXT ROUND
        // ==================================================

        scheduleNextRound(io, winnerGame);
      }
    } catch (error) {
      console.error("Calling number error:", error);
    }
  }, CALL_INTERVAL_MS);

  callingTimers.set(gameId, timer);
};

// ============================================================
// NEXT ROUND
// ============================================================

const scheduleNextRound = (io, oldGame) => {
  stopNextRoundTimer(oldGame.gameId);

  const timer = setTimeout(async () => {
    nextRoundTimers.delete(oldGame.gameId);

    try {
      const newGame = await createBingoGame(
        oldGame.roomId,
        oldGame.maxPlayers,
        oldGame.minBet,
        oldGame.maxBet,
      );

      // ====================================================
      // IMPORTANT:
      // Tell everyone to switch to NEW GAME ID
      // ====================================================

      io.to(getBingoRoom(oldGame.gameId)).emit("bingo:nextRound", {
        oldGameId: oldGame.gameId,

        gameId: newGame.gameId,

        roomId: newGame.roomId,

        status: "WAITING",

        remainingSeconds: SELECTION_TIME_SECONDS,

        selectionEndsAt: newGame.selectionEndsAt,

        playerCount: 0,

        spectatorCount: 0,

        selectedNumbers: [],

        calledNumbers: [],

        currentNumber: null,

        winner: null,

        players: [],

        roundNumber: newGame.roundNumber,
      });

      // ====================================================
      // START NEW GLOBAL TIMER
      // ====================================================

      await startSelectionTimer(io, newGame.gameId);
    } catch (error) {
      console.error("Create next round error:", error);
    }
  }, 8000);

  nextRoundTimers.set(oldGame.gameId, timer);
};

// ============================================================
// STOP ALL TIMERS
// ============================================================

export const stopBingoTimers = (gameId) => {
  stopSelectionTimer(gameId);

  stopCallingTimer(gameId);

  stopNextRoundTimer(gameId);
};

// ============================================================
// EXPORT MAPS
// ============================================================

export { selectionTimers, callingTimers };
