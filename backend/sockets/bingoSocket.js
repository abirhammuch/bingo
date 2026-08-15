import {
  createBingoGame,
  joinBingoGame,
  joinAsSpectator,
  startGame,
  callNumber,
  markNumber,
  getGameState,
  getPlayerCard,
} from "../services/bingo/bingoService.js";
import BingoGame from "../models/BingoGame.js";

const ROUND_SELECTION_SECONDS = 30;
const CALL_INTERVAL_MS = 5000;
const selectionTimers = new Map();
const gameTimers = new Map();

const normalizeStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "WAITING") return "WAITING";
  if (value === "READY") return "READY";
  if (value === "ACTIVE" || value === "PLAYING" || value === "LIVE")
    return "PLAYING";
  if (value === "COMPLETED" || value === "FINISHED" || value === "ENDED")
    return "FINISHED";
  return "WAITING";
};

const getPlayerSummary = (players = []) =>
  (players || []).map((player) => ({
    telegramId: player.telegramId,
    username: player.username || player.firstName || "Player",
    firstName: player.firstName || "Player",
  }));

const getRemainingSelectionSeconds = (selectionEndsAt) => {
  if (!selectionEndsAt) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(selectionEndsAt).getTime() - Date.now()) / 1000),
  );
};

const buildRoundState = (game, extra = {}) => {
  if (!game) return { status: "WAITING", remainingSeconds: 0 };

  const playerCount = Number(game.playerCount ?? game.players?.length ?? 0);
  const selectedNumbers = Array.isArray(game.selectedNumbers)
    ? game.selectedNumbers
    : [];
  const calledNumbers = Array.isArray(game.calledNumbers)
    ? game.calledNumbers
    : [];
  const remainingSeconds =
    typeof extra.remainingSeconds === "number"
      ? extra.remainingSeconds
      : game.status === "waiting"
        ? getRemainingSelectionSeconds(game.selectionEndsAt)
        : 0;

  return {
    gameId: game.gameId,
    roomId: game.roomId,
    roundNumber: game.roundNumber,
    status: normalizeStatus(game.status),
    playerCount,
    participants: playerCount,
    players: getPlayerSummary(game.players),
    selectedNumbers,
    calledNumbers,
    currentNumber: game.currentNumber ?? null,
    winner: game.winner || null,
    selectionEndsAt: game.selectionEndsAt || null,
    remainingSeconds,
    ...extra,
  };
};

const emitRoundState = (io, roomId, game, extra = {}) => {
  if (!io || typeof io.to !== "function" || !roomId || !game) return;

  const state = buildRoundState(game, extra);
  io.to(roomId).emit("bingo:roundState", state);
  io.to(roomId).emit("bingo:participantCount", {
    playerCount: state.playerCount,
    participants: state.playerCount,
    selectedNumbers: state.selectedNumbers,
    status: state.status,
  });
};

const stopSelectionTimer = (gameId) => {
  if (selectionTimers.has(gameId)) {
    const entry = selectionTimers.get(gameId);
    if (entry && entry.intervalId) clearInterval(entry.intervalId);
    selectionTimers.delete(gameId);
  }
};

const stopCallerTimer = (gameId) => {
  if (gameTimers.has(gameId)) {
    const entry = gameTimers.get(gameId);
    if (entry && entry.intervalId) clearInterval(entry.intervalId);
    gameTimers.delete(gameId);
  }
};

const startSelectionCountdown = async (io, gameId, roomId) => {
  stopSelectionTimer(gameId);
  stopCallerTimer(gameId);

  const game = await getGameState(gameId).catch(() => null);
  if (!game) return;

  game.status = "waiting";
  game.selectionEndsAt = new Date(Date.now() + ROUND_SELECTION_SECONDS * 1000);
  game.currentNumber = null;
  game.calledNumbers = [];
  game.winner = null;
  game.playerCount = game.players.length;
  await game.save();

  emitRoundState(io, roomId, game, {
    remainingSeconds: ROUND_SELECTION_SECONDS,
    status: "WAITING",
  });

  const intervalId = setInterval(async () => {
    try {
      const latest = await getGameState(gameId).catch(() => null);
      if (!latest) {
        stopSelectionTimer(gameId);
        return;
      }

      const remainingSeconds = getRemainingSelectionSeconds(
        latest.selectionEndsAt,
      );
      emitRoundState(io, roomId, latest, {
        remainingSeconds,
        status: "WAITING",
      });

      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        stopSelectionTimer(gameId);

        latest.status = "ready";
        latest.selectionEndsAt = null;
        latest.roundStartedAt = new Date();
        latest.playerCount = latest.players.length;
        await latest.save();

        emitRoundState(io, roomId, latest, {
          remainingSeconds: 0,
          status: "READY",
        });
      }
    } catch (error) {
      console.error("Selection countdown error:", error.message || error);
      clearInterval(intervalId);
      stopSelectionTimer(gameId);
    }
  }, 1000);

  selectionTimers.set(gameId, { intervalId });
};

const startNumberCalling = (io, gameId, roomId) => {
  stopCallerTimer(gameId);

  const intervalId = setInterval(async () => {
    try {
      const currentGame = await getGameState(gameId).catch(() => null);
      if (!currentGame || currentGame.status !== "active") {
        stopCallerTimer(gameId);
        return;
      }

      const result = await callNumber(gameId);
      if (!result || !result.number) {
        stopCallerTimer(gameId);
        const finishedGame = await getGameState(gameId).catch(() => null);
        if (finishedGame) {
          finishedGame.status = "completed";
          finishedGame.selectionEndsAt = null;
          finishedGame.roundEndedAt = new Date();
          await finishedGame.save();

          emitRoundState(io, roomId, finishedGame, {
            remainingSeconds: 0,
            status: "FINISHED",
          });
          io.to(roomId).emit("bingo:roundFinished", {
            gameId: finishedGame.gameId,
            roomId: finishedGame.roomId,
            status: "FINISHED",
            winner: finishedGame.winner || null,
          });
        }
        return;
      }

      const refreshedGame = await getGameState(gameId).catch(() => null);
      if (refreshedGame) {
        emitRoundState(io, roomId, refreshedGame, {
          remainingSeconds: 0,
          status: "PLAYING",
          currentNumber: result.number,
          calledNumbers: result.calledNumbers || refreshedGame.calledNumbers,
        });
      }

      io.to(roomId).emit("bingo:numberCalled", {
        number: result.number,
        currentNumber: result.number,
        calledNumbers: result.calledNumbers,
        remaining: Math.max(0, 75 - result.calledNumbers.length),
      });

      if (
        result.gameEnded &&
        Array.isArray(result.winners) &&
        result.winners.length > 0
      ) {
        stopCallerTimer(gameId);
        const winnerGame = await getGameState(gameId).catch(() => null);

        if (winnerGame) {
          winnerGame.status = "completed";
          winnerGame.selectionEndsAt = null;
          winnerGame.roundEndedAt = new Date();
          await winnerGame.save();

          emitRoundState(io, roomId, winnerGame, {
            remainingSeconds: 0,
            status: "FINISHED",
            winner: winnerGame.winner,
            winners: result.winners,
          });

          io.to(roomId).emit("bingo:winner", {
            gameId: winnerGame.gameId,
            roomId: winnerGame.roomId,
            winner: winnerGame.winner,
            winners: result.winners,
            status: "FINISHED",
          });
          io.to(roomId).emit("bingo:roundFinished", {
            gameId: winnerGame.gameId,
            roomId: winnerGame.roomId,
            winner: winnerGame.winner,
            winners: result.winners,
            status: "FINISHED",
          });

          setTimeout(async () => {
            try {
              const nextGame = await createBingoGame(
                roomId,
                winnerGame.maxPlayers,
                winnerGame.minBet,
                winnerGame.maxBet,
              );

              io.to(roomId).emit("bingo:nextRound", {
                gameId: nextGame.gameId,
                roomId: nextGame.roomId,
                status: "WAITING",
                selectedNumbers: [],
                calledNumbers: [],
                currentNumber: null,
                players: [],
                playerCount: 0,
                remainingSeconds: ROUND_SELECTION_SECONDS,
              });

              await startSelectionCountdown(
                io,
                nextGame.gameId,
                nextGame.roomId,
              );
            } catch (error) {
              console.error("Next round setup error:", error.message || error);
            }
          }, 4000);
        }
      }
    } catch (error) {
      console.error("Number calling interval error:", error.message || error);
      stopCallerTimer(gameId);
    }
  }, CALL_INTERVAL_MS);

  gameTimers.set(gameId, { intervalId });
};

const emitCurrentRoundState = async (socket) => {
  try {
    const game = await BingoGame.findOne({
      status: { $in: ["waiting", "active"] },
    })
      .sort({ updatedAt: -1 })
      .lean();
    if (game) {
      socket.emit("bingo:roundState", buildRoundState(game));
    }
  } catch (error) {
    console.warn(
      "Unable to fetch current round state:",
      error.message || error,
    );
  }
};

export const initBingoSocket = (io) => {
  console.log("🎮 Initializing Bingo Socket Handlers...");
  try {
    globalThis.io = io;
  } catch (e) {
    console.warn("Unable to set global io reference:", e.message || e);
  }

  io.on("connection", async (socket) => {
    console.log(`\n🎯 [BINGO CLIENT CONNECTED] ${socket.id}`);
    await emitCurrentRoundState(socket);

    socket.on("createRoom", async (data) => {
      try {
        const { roomId, maxPlayers = 10, minBet = 1, maxBet = 100 } = data;
        const game = await createBingoGame(roomId, maxPlayers, minBet, maxBet);
        socket.join(roomId);

        socket.emit("roomCreated", {
          success: true,
          gameId: game.gameId,
          roomId: game.roomId,
          message: `Room "${roomId}" created successfully!`,
        });

        await startSelectionCountdown(io, game.gameId, game.roomId);
      } catch (error) {
        console.error("Create Room Error:", error.message);
        socket.emit("error", {
          success: false,
          message: error.message || "Failed to create room",
        });
      }
    });

    socket.on("joinRoom", async (data, callback) => {
      try {
        const { gameId, telegramId, betAmount, luckyNumber = null } = data;

        if (!gameId || !telegramId) {
          const response = {
            success: false,
            message: "GameId and TelegramId are required.",
          };
          if (typeof callback === "function") return callback(response);
          return socket.emit("error", response);
        }

        let result;
        let isSpectator = false;

        // Try to join as a player first (during WAITING phase)
        if (betAmount && betAmount >= 1) {
          try {
            result = await joinBingoGame(
              gameId,
              telegramId,
              betAmount,
              luckyNumber,
            );
          } catch (playerJoinError) {
            // If player join fails, try to spectate instead
            try {
              result = await joinAsSpectator(gameId, telegramId);
              isSpectator = true;
            } catch (spectateError) {
              throw playerJoinError;
            }
          }
        } else {
          // No bet provided, try to spectate
          try {
            result = await joinAsSpectator(gameId, telegramId);
            isSpectator = true;
          } catch (spectateError) {
            // If spectate fails, try normal join anyway
            if (!betAmount || betAmount < 1) {
              throw new Error(
                "Invalid data. GameId, TelegramId, and a valid bet are required.",
              );
            }
            result = await joinBingoGame(
              gameId,
              telegramId,
              betAmount,
              luckyNumber,
            );
          }
        }

        socket.join(result.game.roomId);

        socket.emit("joinedRoom", {
          success: true,
          gameId: result.game.gameId,
          roomId: result.game.roomId,
          card: result.ticket?.card || null,
          ticketId: result.ticket?.ticketId || null,
          balance: result.user.balance,
          currentPlayers: result.game.players.length,
          playerCount: result.game.players.length,
          players: getPlayerSummary(result.game.players),
          selectedNumbers: result.game.selectedNumbers || [],
          isSpectator: isSpectator,
        });

        const currentGame = await getGameState(result.game.gameId);
        emitRoundState(io, result.game.roomId, currentGame);

        if (typeof callback === "function") {
          callback({
            success: true,
            gameId: result.game.gameId,
            roomId: result.game.roomId,
            selectedNumbers: currentGame.selectedNumbers || [],
            playerCount: currentGame.players.length,
            isSpectator: isSpectator,
          });
        }
      } catch (error) {
        console.error("JOIN ROOM ERROR:", error.message);
        const response = {
          success: false,
          message: error.message || "Failed to join room",
        };
        if (typeof callback === "function") return callback(response);
        socket.emit("error", response);
      }
    });

    socket.on("startGame", async (data) => {
      try {
        const { gameId } = data;
        if (!gameId)
          return socket.emit("error", {
            success: false,
            message: "Game ID is required",
          });

        const game = await startGame(gameId);
        game.status = "active";
        game.selectionEndsAt = null;
        game.roundStartedAt = new Date();
        await game.save();

        emitRoundState(io, game.roomId, game, {
          remainingSeconds: 0,
          status: "PLAYING",
        });

        startNumberCalling(io, game.gameId, game.roomId);
      } catch (error) {
        console.error("Start Game Error:", error.message);
        socket.emit("error", {
          success: false,
          message: error.message || "Failed to start game",
        });
      }
    });

    socket.on("markNumber", async (data) => {
      try {
        const { gameId, telegramId, number } = data;
        if (!gameId || !telegramId || !number) {
          return socket.emit("error", {
            success: false,
            message: "GameId, TelegramId, and Number are required",
          });
        }

        const result = await markNumber(gameId, telegramId, number);
        const game = await getGameState(gameId);

        socket.emit("numberMarked", {
          success: true,
          number,
          marked: result.marked,
          bingo: result.bingo,
          bingoResult: result.bingoResult,
          markedNumbers: result.markedNumbers,
        });

        if (result.bingo) {
          stopCallerTimer(gameId);
          emitRoundState(io, game.roomId, game, {
            status: "FINISHED",
            remainingSeconds: 0,
            winner: result.winner,
          });

          io.to(game.roomId).emit("bingo:winner", {
            gameId: game.gameId,
            roomId: game.roomId,
            winner: result.winner,
            status: "FINISHED",
          });
          io.to(game.roomId).emit("bingo:roundFinished", {
            gameId: game.gameId,
            roomId: game.roomId,
            winner: result.winner,
            status: "FINISHED",
          });

          setTimeout(async () => {
            try {
              const nextGame = await createBingoGame(
                game.roomId,
                game.maxPlayers,
                game.minBet,
                game.maxBet,
              );

              io.to(game.roomId).emit("bingo:nextRound", {
                gameId: nextGame.gameId,
                roomId: nextGame.roomId,
                status: "WAITING",
                selectedNumbers: [],
                calledNumbers: [],
                currentNumber: null,
                players: [],
                playerCount: 0,
                remainingSeconds: ROUND_SELECTION_SECONDS,
              });

              await startSelectionCountdown(
                io,
                nextGame.gameId,
                nextGame.roomId,
              );
            } catch (err) {
              console.error("Failed to create next round:", err.message || err);
            }
          }, 4000);
        }
      } catch (error) {
        console.error("Mark Number Error:", error.message);
        socket.emit("error", {
          success: false,
          message: "Failed to mark number",
        });
      }
    });

    socket.on("getGameState", async (data) => {
      try {
        const { gameId } = data;
        const game = await getGameState(gameId);
        socket.emit("gameState", {
          success: true,
          game: {
            status: game.status,
            players: game.players.map((p) => ({
              telegramId: p.telegramId,
              username: p.username,
              markedCount: p.markedNumbers.length,
              hasBingo: p.hasBingo,
            })),
            calledNumbers: game.calledNumbers,
            currentNumber: game.currentNumber,
            lastCalledAt: game.lastCalledAt,
          },
        });
      } catch (error) {
        console.error("Get Game State Error:", error.message);
        socket.emit("error", { success: false, message: error.message });
      }
    });

    socket.on("getCard", async (data) => {
      try {
        const { gameId, telegramId } = data;
        const card = await getPlayerCard(gameId, telegramId);
        socket.emit("playerCard", {
          success: true,
          card: card.card,
          markedNumbers: card.markedNumbers,
        });
      } catch (error) {
        console.error("Get Card Error:", error.message);
        socket.emit("error", { success: false, message: error.message });
      }
    });

    socket.on("leaveRoom", (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.leave(roomId);
        socket.emit("leftRoom", {
          success: true,
          message: `Left room ${roomId}`,
        });
        socket
          .to(roomId)
          .emit("gameUpdate", {
            type: "playerLeft",
            message: "A player has left the room.",
          });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🎯 Bingo client disconnected: ${socket.id}`);
    });
  });
};

export { gameTimers };
