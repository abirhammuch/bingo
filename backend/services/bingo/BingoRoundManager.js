import BingoGame from "../../models/BingoGame.js";
import {
  saveWithRetry,
  normalizeTelegramId,
  getGameState,
  createBingoGame,
} from "./bingoService.js";

const ROUND_SELECTION_SECONDS = 30;
const CALL_INTERVAL_MS = 5000;

// Store active round timers: Map<gameId, { intervalId, startTime, endTime, phase }>
const roundTimers = new Map();

// Status normalization (always use UPPERCASE for consistency)
export const normalizeStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "WAITING") return "WAITING";
  if (value === "READY") return "READY";
  if (value === "ACTIVE" || value === "PLAYING" || value === "LIVE")
    return "PLAYING";
  if (value === "COMPLETED" || value === "FINISHED" || value === "ENDED")
    return "FINISHED";
  return "WAITING";
};

// Calculate remaining seconds from stored endTime
const getRemainingSeconds = (endTime) => {
  if (!endTime) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(endTime).getTime() - Date.now()) / 1000),
  );
};

// Emit round state to all clients in room
const emitRoundState = (io, roomId, game, extra = {}) => {
  if (!io || !game) return;

  const targetRoom = roomId?.startsWith("bingo:")
    ? roomId
    : `bingo:${game.gameId}`;

  const remainingSeconds =
    extra.remainingSeconds ?? getRemainingSeconds(game.selectionEndsAt);

  const state = {
    gameId: game.gameId,
    roomId: game.roomId,
    roundNumber: game.roundNumber,
    status: normalizeStatus(game.status),
    playerCount: game.players?.filter((p) => !p.isSpectator).length ?? 0,
    participants: game.players?.filter((p) => !p.isSpectator).length ?? 0,
    players: (game.players || []).map((p) => ({
      telegramId: p.telegramId,
      username: p.username || p.firstName || "Player",
      firstName: p.firstName || "Player",
    })),
    selectedNumbers: Array.isArray(game.selectedNumbers)
      ? game.selectedNumbers
      : [],
    calledNumbers: Array.isArray(game.calledNumbers) ? game.calledNumbers : [],
    currentNumber: game.currentNumber ?? null,
    winner: game.winner || null,
    selectionEndsAt: game.selectionEndsAt || null,
    remainingSeconds,
    ...extra,
  };

  io.to(targetRoom).emit("bingo:roundState", state);
};

// Stop any active timer for a game
const stopRoundTimer = (gameId) => {
  if (roundTimers.has(gameId)) {
    const entry = roundTimers.get(gameId);
    if (entry?.intervalId) clearInterval(entry.intervalId);
    roundTimers.delete(gameId);
  }
};

/**
 * START SELECTION PHASE (30-second countdown)
 * This is where players select lucky numbers
 */
const startSelectionPhase = async (io, gameId, roomId) => {
  console.log(`⏱️ [SELECTION START] gameId: ${gameId}, roomId: ${roomId}`);

  stopRoundTimer(gameId);

  const game = await getGameState(gameId).catch(() => null);
  if (!game) {
    console.error(`❌ Game not found: ${gameId}`);
    return;
  }

  game.status = "waiting";
  game.selectionEndsAt = new Date(Date.now() + ROUND_SELECTION_SECONDS * 1000);
  game.currentNumber = null;
  game.calledNumbers = [];
  game.winner = null;
  game.playerCount = game.players?.filter((p) => !p.isSpectator).length ?? 0;
  await saveWithRetry(game);

  let lastEmittedSeconds = ROUND_SELECTION_SECONDS;

  emitRoundState(io, roomId, game, {
    remainingSeconds: ROUND_SELECTION_SECONDS,
    status: "WAITING",
  });

  const startTime = Date.now();
  const endTime = game.selectionEndsAt.getTime();

  const intervalId = setInterval(async () => {
    try {
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.ceil((endTime - now) / 1000));

      // Emit only when seconds change
      if (remainingSeconds !== lastEmittedSeconds) {
        lastEmittedSeconds = remainingSeconds;

        const latest = await getGameState(gameId).catch(() => null);
        if (latest) {
          console.log(
            `⏱️ [SELECTION TICK] gameId: ${gameId}, remaining: ${remainingSeconds}s`,
          );

          emitRoundState(io, roomId, latest, {
            remainingSeconds,
            status: "WAITING",
          });
        }
      }

      // Selection phase ended
      if (remainingSeconds <= 0) {
        console.log(`✅ [SELECTION END] gameId: ${gameId}`);
        clearInterval(intervalId);
        stopRoundTimer(gameId);

        const freshGame = await getGameState(gameId).catch(() => null);
        if (!freshGame) {
          console.error(`❌ Game not found during transition: ${gameId}`);
          return;
        }

        // Check if at least one player selected
        const hasSelections = freshGame.players?.some(
          (p) =>
            !p.isSpectator &&
            Array.isArray(p.selectedLuckyNumbers) &&
            p.selectedLuckyNumbers.length > 0,
        );

        if (!hasSelections) {
          console.log(
            `⚠️ [NO SELECTIONS] No players selected. Waiting 30s before retry...`,
          );
          await startNoSelectionsWaitPhase(io, gameId, roomId, freshGame);
          return;
        }

        // At least one player selected, start live game
        await startLivePhase(io, gameId, roomId, freshGame);
      }
    } catch (error) {
      console.error("Selection phase error:", error.message || error);
      clearInterval(intervalId);
      stopRoundTimer(gameId);
    }
  }, 1000);

  roundTimers.set(gameId, {
    intervalId,
    startTime,
    endTime,
    phase: "SELECTION",
  });
  console.log(`✅ [SELECTION TIMER REGISTERED] gameId: ${gameId}`);
};

/**
 * WAIT PHASE (30 seconds with no selections detected)
 * If someone selects during this wait, immediately go live
 * If wait expires, reset and return to selection
 */
const startNoSelectionsWaitPhase = async (io, gameId, roomId, game) => {
  console.log(
    `⚠️ [NO SELECTIONS WAIT] gameId: ${gameId}, waiting 30s before retry...`,
  );

  stopRoundTimer(gameId);

  game.status = "waiting";
  game.selectionEndsAt = new Date(Date.now() + 30 * 1000);
  await saveWithRetry(game);

  let lastEmittedSeconds = 30;

  io.to(`bingo:${gameId}`).emit("bingo:noSelections", {
    message:
      "No players selected cards. Waiting 30 seconds before restarting selection...",
    remainingSeconds: 30,
  });

  const startTime = Date.now();
  const endTime = game.selectionEndsAt.getTime();

  const intervalId = setInterval(async () => {
    try {
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.ceil((endTime - now) / 1000));

      if (remainingSeconds !== lastEmittedSeconds) {
        lastEmittedSeconds = remainingSeconds;

        const latest = await getGameState(gameId).catch(() => null);
        if (!latest) return;

        // Check if someone made a selection during the wait
        const hasSelectionsDuringWait = latest.players?.some(
          (p) =>
            !p.isSpectator &&
            Array.isArray(p.selectedLuckyNumbers) &&
            p.selectedLuckyNumbers.length > 0,
        );

        if (hasSelectionsDuringWait) {
          console.log(
            `✅ [SELECTION OVERRIDE] Player selected during wait! Starting live game...`,
          );
          clearInterval(intervalId);
          stopRoundTimer(gameId);

          await startLivePhase(io, gameId, roomId, latest);
          return;
        }

        emitRoundState(io, roomId, latest, {
          remainingSeconds,
          status: "WAITING",
        });

        io.to(`bingo:${gameId}`).emit("bingo:noSelections", {
          message: "Restarting selection phase...",
          remainingSeconds,
        });
      }

      // Wait expired, return to selection
      if (remainingSeconds <= 0) {
        console.log(
          `✅ [NO SELECTIONS WAIT END] Restarting selection phase...`,
        );
        clearInterval(intervalId);
        stopRoundTimer(gameId);

        const freshGame = await getGameState(gameId).catch(() => null);
        if (freshGame) {
          // Reset player selections
          freshGame.status = "waiting";
          freshGame.players = freshGame.players.map((p) => ({
            ...p,
            selectedLuckyNumbers: [],
            markedNumbers: [],
          }));
          freshGame.selectedNumbers = [];
          freshGame.calledNumbers = [];
          freshGame.currentNumber = null;
          await saveWithRetry(freshGame);

          // Restart selection phase
          await startSelectionPhase(io, gameId, roomId);
        }
      }
    } catch (error) {
      console.error("No selections wait error:", error.message || error);
      clearInterval(intervalId);
      stopRoundTimer(gameId);
    }
  }, 1000);

  roundTimers.set(gameId, {
    intervalId,
    startTime,
    endTime,
    phase: "NO_SELECTIONS_WAIT",
  });
};

/**
 * LIVE PHASE (Numbers being called)
 */
const startLivePhase = async (io, gameId, roomId, game) => {
  console.log(`🎮 [LIVE PHASE START] gameId: ${gameId}`);

  stopRoundTimer(gameId);

  game.status = "active";
  game.selectionEndsAt = null;
  game.roundStartedAt = new Date();
  game.playerCount = game.players?.filter((p) => !p.isSpectator).length ?? 0;
  await saveWithRetry(game);

  emitRoundState(io, roomId, game, {
    remainingSeconds: 0,
    status: "PLAYING",
  });

  // Start calling numbers
  await startNumberCalling(io, gameId, roomId);
};

/**
 * START CALLING NUMBERS
 */
const startNumberCalling = async (io, gameId, roomId) => {
  console.log(`📢 [NUMBER CALLING] Starting for gameId: ${gameId}`);

  stopRoundTimer(gameId);

  const intervalId = setInterval(async () => {
    try {
      const currentGame = await getGameState(gameId).catch(() => null);
      if (!currentGame || currentGame.status !== "active") {
        clearInterval(intervalId);
        stopRoundTimer(gameId);
        return;
      }

      // Simulate calling a number (this would call your actual number calling logic)
      // For now, just emit current state
      emitRoundState(io, roomId, currentGame, {
        remainingSeconds: 0,
        status: "PLAYING",
      });

      // TODO: Implement actual number calling and win detection here
    } catch (error) {
      console.error("Number calling error:", error.message || error);
      clearInterval(intervalId);
      stopRoundTimer(gameId);
    }
  }, CALL_INTERVAL_MS);

  roundTimers.set(gameId, { intervalId, phase: "CALLING" });
};

/**
 * CLEANUP AND START NEXT ROUND
 */
export const finishRound = async (io, gameId, roomId) => {
  console.log(`🏁 [ROUND FINISH] gameId: ${gameId}`);

  stopRoundTimer(gameId);

  const game = await getGameState(gameId).catch(() => null);
  if (!game) return;

  game.status = "completed";
  game.roundEndedAt = new Date();
  await saveWithRetry(game);

  emitRoundState(io, roomId, game, {
    remainingSeconds: 0,
    status: "FINISHED",
  });

  // After 8 seconds, start next round
  setTimeout(async () => {
    try {
      const nextGame = await createBingoGame(roomId);
      io.to(`bingo:${nextGame.gameId}`).emit("bingo:nextRound", {
        gameId: nextGame.gameId,
        roomId: nextGame.roomId,
        status: "WAITING",
        remainingSeconds: ROUND_SELECTION_SECONDS,
      });

      await startSelectionPhase(io, nextGame.gameId, nextGame.roomId);
    } catch (error) {
      console.error("Next round setup error:", error.message || error);
    }
  }, 8000);
};

/**
 * INITIALIZE NEW ROUND
 */
export const initializeNewRound = async (io, roomId) => {
  console.log(`🎯 [NEW ROUND INIT] roomId: ${roomId}`);

  const game = await createBingoGame(roomId);

  io.to(`bingo:${game.gameId}`).emit("bingo:roundState", {
    gameId: game.gameId,
    roomId: game.roomId,
    status: "WAITING",
    remainingSeconds: ROUND_SELECTION_SECONDS,
  });

  await startSelectionPhase(io, game.gameId, roomId);

  return game;
};

/**
 * STOP ALL TIMERS FOR A GAME
 */
export const stopAllTimers = (gameId) => {
  stopRoundTimer(gameId);
};

/**
 * GET ACTIVE TIMERS (for debugging)
 */
export const getActiveTimers = () => {
  return Array.from(roundTimers.entries()).map(([gameId, { phase }]) => ({
    gameId,
    phase,
  }));
};

export default {
  startSelectionPhase,
  startNoSelectionsWaitPhase,
  startLivePhase,
  startNumberCalling,
  finishRound,
  initializeNewRound,
  stopAllTimers,
  getActiveTimers,
  normalizeStatus,
  getRemainingSeconds,
  emitRoundState,
};
