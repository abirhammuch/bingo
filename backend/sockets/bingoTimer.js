import BingoGame from "../models/BingoGame.js";
import {
  SELECTION_TIME_SECONDS,
  startGame,
  resetEmptyRound,
  createBingoGame,
  callNumber,
} from "../services/bingo/bingoService.js";

const selectionTimers = new Map();
const callingTimers = new Map();

const emitSelectionTick = (io, game) => {
  const remaining = game.selectionEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(game.selectionEndsAt).getTime() - Date.now()) / 1000,
        ),
      )
    : 0;

  io.to(`bingo:${game.gameId}`).emit("bingo:selectionTick", {
    gameId: game.gameId,
    remainingSeconds: remaining,
    selectionEndsAt: game.selectionEndsAt,
    playerCount: game.players.filter((p) => !p.isSpectator).length,
    status: "WAITING",
  });

  return remaining;
};

// ============================================================
// START GLOBAL 30 SECOND TIMER
// ============================================================

export const startSelectionTimer = async (io, gameId) => {
  if (selectionTimers.has(gameId)) {
    clearInterval(selectionTimers.get(gameId));
  }

  let game = await BingoGame.findOne({
    gameId,
  });

  if (!game) return;

  // If no timer exists, create one
  if (
    !game.selectionEndsAt ||
    new Date(game.selectionEndsAt).getTime() <= Date.now()
  ) {
    game.status = "waiting";

    game.selectionEndsAt = new Date(Date.now() + SELECTION_TIME_SECONDS * 1000);

    game.calledNumbers = [];
    game.currentNumber = null;
    game.selectedNumbers = [];
    game.winner = null;

    await game.save();
  }

  const timer = setInterval(async () => {
    try {
      const currentGame = await BingoGame.findOne({
        gameId,
      });

      if (!currentGame) {
        clearInterval(timer);
        selectionTimers.delete(gameId);
        return;
      }

      if (currentGame.status !== "waiting") {
        clearInterval(timer);
        selectionTimers.delete(gameId);
        return;
      }

      const remaining = emitSelectionTick(io, currentGame);

      if (remaining > 0) return;

      // ======================================================
      // TIMER FINISHED
      // ======================================================

      clearInterval(timer);
      selectionTimers.delete(gameId);

      const players = currentGame.players.filter(
        (player) =>
          !player.isSpectator &&
          Array.isArray(player.selectedLuckyNumbers) &&
          player.selectedLuckyNumbers.length > 0,
      );

      // ======================================================
      // NOBODY SELECTED
      // ======================================================

      if (players.length === 0) {
        console.log(`⚠️ No players in ${gameId}. Restarting timer.`);

        currentGame.selectionEndsAt = new Date(
          Date.now() + SELECTION_TIME_SECONDS * 1000,
        );

        currentGame.selectedNumbers = [];
        currentGame.calledNumbers = [];
        currentGame.currentNumber = null;
        currentGame.players = [];
        currentGame.playerCount = 0;
        currentGame.roundSummary.playerCount = 0;
        currentGame.roundSummary.selectedNumbersCount = 0;

        await currentGame.save();

        io.to(`bingo:${gameId}`).emit("bingo:roundReset", {
          gameId,
          status: "WAITING",
          message: "No players selected. Starting a new selection period.",
          remainingSeconds: SELECTION_TIME_SECONDS,
          selectionEndsAt: currentGame.selectionEndsAt,
          playerCount: 0,
          selectedNumbers: [],
          calledNumbers: [],
          currentNumber: null,
        });

        await startSelectionTimer(io, gameId);

        return;
      }

      // ======================================================
      // AT LEAST ONE PLAYER
      // START LIVE
      // ======================================================

      const result = await startGame(gameId);

      if (result.noPlayers) return;

      const liveGame = result.game;

      liveGame.selectionEndsAt = null;
      liveGame.status = "active";
      liveGame.roundStartedAt = new Date();

      await liveGame.save();

      io.to(`bingo:${gameId}`).emit("bingo:gameStarted", {
        gameId,

        status: "PLAYING",

        playerCount: liveGame.players.filter((p) => !p.isSpectator).length,

        spectatorCount: liveGame.players.filter((p) => p.isSpectator).length,

        calledNumbers: liveGame.calledNumbers,

        currentNumber: null,

        remainingSeconds: 0,
      });

      io.to(`bingo:${gameId}`).emit("bingo:playerCards", {
        gameId,
        playerCards: liveGame.players
          .filter(
            (player) =>
              !player.isSpectator &&
              (player.cards?.length || player.card?.length),
          )
          .map((player) => ({
            telegramId: player.telegramId,
            cards: player.cards?.length ? player.cards : [player.card],
          })),
      });

      startCallingNumbers(io, gameId);
    } catch (error) {
      console.error("❌ Selection timer error:", error);
    }
  }, 1000);

  selectionTimers.set(gameId, timer);

  // Send immediately
  emitSelectionTick(io, game);
};

// ============================================================
// CALL NUMBERS DURING LIVE
// ============================================================

export const startCallingNumbers = (io, gameId) => {
  if (callingTimers.has(gameId)) return;

  const timer = setInterval(async () => {
    try {
      const game = await BingoGame.findOne({
        gameId,
      });

      if (!game) {
        stopBingoTimers(gameId);
        return;
      }

      if (game.status !== "active") {
        stopBingoTimers(gameId);
        return;
      }

      if (game.calledNumbers.length >= 75) {
        stopBingoTimers(gameId);
        return;
      }

      const result = await callNumber(gameId);

      io.to(`bingo:${gameId}`).emit("bingo:numberCalled", {
        gameId,
        number: result.number,
        calledNumbers: result.calledNumbers,
        currentNumber: result.number,
        gameEnded: result.gameEnded,
      });

      // ====================================================
      // WINNER
      // ====================================================

      if (result.gameEnded && result.winner) {
        stopBingoTimers(gameId);

        const winnerGame = await BingoGame.findOne({
          gameId,
        });

        if (!winnerGame) return;

        winnerGame.status = "completed";

        winnerGame.roundEndedAt = new Date();

        winnerGame.endTime = new Date();

        await winnerGame.save();

        const winner = winnerGame.winner;

        // SEND TO EVERY PARTICIPANT
        // INCLUDING SPECTATORS

        io.to(`bingo:${gameId}`).emit("bingo:winner", {
          gameId,

          winner,

          winnerName: winner?.firstName || winner?.username || "Winner",

          winnerCard: winner?.card || [],

          winAmount: winner?.winAmount || 0,

          bingoResult: winner?.bingoResult || null,

          calledNumbers: winnerGame.calledNumbers,

          status: "FINISHED",
        });

        io.to(`bingo:${gameId}`).emit("bingo:roundFinished", {
          gameId,
          status: "FINISHED",

          winner,

          winnerCard: winner?.card || [],
        });

        // ==================================================
        // NEXT ROUND
        // ==================================================

        setTimeout(async () => {
          await createNextRound(io, winnerGame);
        }, 8000);
      }
    } catch (error) {
      console.error("❌ Calling number error:", error);
    }
  }, 3000);

  callingTimers.set(gameId, timer);
};

// ============================================================
// NEXT ROUND
// ============================================================

const createNextRound = async (io, oldGame) => {
  try {
    const newGame = await createBingoGame(
      oldGame.roomId,
      oldGame.maxPlayers,
      oldGame.minBet,
      oldGame.maxBet,
    );

    io.to(`bingo:${oldGame.gameId}`).emit("bingo:nextRound", {
      gameId: newGame.gameId,

      roomId: newGame.roomId,

      status: "WAITING",

      selectionEndsAt: newGame.selectionEndsAt,

      remainingSeconds: SELECTION_TIME_SECONDS,

      playerCount: 0,

      selectedNumbers: [],

      calledNumbers: [],

      currentNumber: null,

      winner: null,

      roundNumber: newGame.roundNumber,
    });

    await startSelectionTimer(io, newGame.gameId);
  } catch (error) {
    console.error("❌ Next round error:", error);
  }
};

// ============================================================
// STOP
// ============================================================

export const stopBingoTimers = (gameId) => {
  if (selectionTimers.has(gameId)) {
    clearInterval(selectionTimers.get(gameId));

    selectionTimers.delete(gameId);
  }

  if (callingTimers.has(gameId)) {
    clearInterval(callingTimers.get(gameId));

    callingTimers.delete(gameId);
  }
};
