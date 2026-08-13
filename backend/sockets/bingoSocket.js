import {
  createBingoGame,
  joinBingoGame,
  startGame,
  callNumber,
  markNumber,
  getGameState,
  getPlayerCard,
} from "../services/bingo/bingoService.js";

// Store active game timers (intervals) to stop them when a game ends
const gameTimers = new Map();
// Store start countdown timers for games (before automatic start)
const startCountdowns = new Map();

/**
 * Initialize Bingo Socket Handlers
 * @param {SocketIO.Server | SocketIO.Namespace} io - The Socket.IO instance or namespace
 */
export const initBingoSocket = (io) => {
  console.log("🎮 Initializing Bingo Socket Handlers...");
  try {
    globalThis.io = io;
  } catch (e) {
    console.warn("Unable to set global io reference:", e.message || e);
  }

  io.on("connection", (socket) => {
    console.log(`\n🎯 [BINGO CLIENT CONNECTED] ${socket.id}`);
    console.log("📊 [Socket connection details]", {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      transport: socket.conn?.transport?.name || "unknown",
    });

    // ------------------------------------------------------------------
    // 1. CREATE ROOM
    // ------------------------------------------------------------------
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

        const waitingState = {
          gameId: game.gameId,
          roomId: game.roomId,
          players: (game.players || []).map((player) => ({
            telegramId: player.telegramId,
            username: player.username || player.firstName || "Player",
          })),
          playerCount: (game.players || []).length,
          status: game.status,
          maxPlayers: game.maxPlayers,
          selectedNumbers: game.selectedNumbers || [],
        };

        io.to(roomId).emit("gameUpdate", {
          type: "roomCreated",
          ...waitingState,
        });
        io.to(roomId).emit("bingo:roundState", {
          ...waitingState,
          status: "waiting",
        });

        scheduleAutoStart(game.gameId, game.roomId, 30);
      } catch (error) {
        console.error("Create Room Error:", error.message);
        socket.emit("error", {
          success: false,
          message: error.message || "Failed to create room",
        });
      }
    });

    // ------------------------------------------------------------------
    // 2. JOIN ROOM
    // ------------------------------------------------------------------
    socket.on("joinRoom", async (data, callback) => {
      const socketJoinStartTime = new Date();
      console.log("\n" + "=".repeat(70));
      console.log("🚪 [JOINROOM EVENT RECEIVED]", {
        timestamp: socketJoinStartTime.toISOString(),
        socketId: socket.id,
        dataReceived: data,
        hasCallback: typeof callback === "function",
      });
      console.log("=".repeat(70));

      try {
        const { gameId, telegramId, betAmount, luckyNumber = null } = data;

        if (!gameId || !telegramId || !betAmount || betAmount < 1) {
          const response = {
            success: false,
            message:
              "Invalid data. GameId, TelegramId, and a valid bet are required.",
          };
          if (typeof callback === "function") return callback(response);
          return socket.emit("error", response);
        }

        console.log("📞 [CALLING joinBingoGame SERVICE]", {
          gameId,
          telegramId,
          betAmount,
          luckyNumber,
        });
        const result = await joinBingoGame(
          gameId,
          telegramId,
          betAmount,
          luckyNumber,
        );

        console.log("✅ [SERVICE RETURNED]", {
          gameId,
          telegramId,
          playerCount: result?.game?.players?.length,
          selectedNumbers: result?.game?.selectedNumbers,
          ticketId: result?.ticket?.ticketId,
        });

        socket.join(result.game.roomId);
        console.log("✅ [SOCKET JOINED]", {
          socketId: socket.id,
          roomId: result.game.roomId,
        });

        socket.emit("joinedRoom", {
          success: true,
          gameId: result.game.gameId,
          roomId: result.game.roomId,
          card: result.ticket?.card || null,
          ticketId: result.ticket?.ticketId || null,
          balance: result.user.balance,
          currentPlayers: result.game.players.length,
          playerCount: result.game.players.length,
          players: (result.game.players || []).map((player) => ({
            telegramId: player.telegramId,
            username: player.username || player.firstName || "Player",
          })),
          selectedNumbers: result.game.selectedNumbers || [],
        });

        const countdownRemaining = startCountdowns.has(result.game.gameId)
          ? startCountdowns.get(result.game.gameId).remaining
          : gameTimers.has(result.game.gameId)
            ? gameTimers.get(result.game.gameId).remaining
            : undefined;

        const joinedRoomState = {
          gameId: result.game.gameId,
          roomId: result.game.roomId,
          player: { telegramId, username: result.user.firstName || "Player" },
          playerCount: result.game.players.length,
          players: (result.game.players || []).map((player) => ({
            telegramId: player.telegramId,
            username: player.username || player.firstName || "Player",
          })),
          totalPlayers: result.game.maxPlayers,
          selectedNumbers: result.game.selectedNumbers || [],
          countdownRemaining,
          status: result.game.status,
        };

        io.to(result.game.roomId).emit("gameUpdate", {
          type: "playerJoined",
          ...joinedRoomState,
        });
        io.to(result.game.roomId).emit("bingo:roundState", {
          ...joinedRoomState,
          status: "waiting",
        });

        if (typeof callback === "function") {
          callback({
            success: true,
            gameId: result.game.gameId,
            roomId: result.game.roomId,
            selectedNumbers: result.game.selectedNumbers || [],
            playerCount: result.game.players.length,
          });
        }

        const currentGame = await getGameState(result.game.gameId);
        if (currentGame.status === "waiting") {
          if (typeof countdownRemaining === "number") {
            socket.emit("countdownRemaining", countdownRemaining);
          }
          scheduleAutoStart(currentGame.gameId, currentGame.roomId, 30, true);
        }

        console.log("\n✅ [SOCKET JOIN COMPLETE]", {
          socketId: socket.id,
          gameId: result.game.gameId,
          telegramId,
          finalPlayerCount: result.game.players.length,
        });
      } catch (error) {
        console.error("❌ [JOIN ROOM ERROR]", {
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        const response = {
          success: false,
          message: error.message || "Failed to join room",
        };
        if (typeof callback === "function") return callback(response);
        socket.emit("error", response);
      }
    });

    // ------------------------------------------------------------------
    // 3. START GAME
    // ------------------------------------------------------------------
    socket.on("startGame", async (data) => {
      try {
        const { gameId } = data;
        if (!gameId)
          return socket.emit("error", {
            success: false,
            message: "Game ID is required",
          });

        if (startCountdowns.has(gameId)) {
          const s = startCountdowns.get(gameId);
          try {
            clearInterval(s.intervalId);
          } catch (e) {
            try {
              clearTimeout(s);
            } catch (_) {}
          }
          startCountdowns.delete(gameId);
        }

        const game = await startGame(gameId);
        const startedState = {
          gameId: game.gameId,
          roomId: game.roomId,
          playerCount: game.players.length,
          players: (game.players || []).map((player) => ({
            telegramId: player.telegramId,
            username: player.username || player.firstName || "Player",
          })),
          selectedNumbers: game.selectedNumbers || [],
          status: "active",
          message: "🚀 Game started! Numbers will be called every 5 seconds.",
          startTime: game.startTime,
        };

        io.to(game.roomId).emit("gameUpdate", {
          type: "gameStarted",
          ...startedState,
        });
        io.to(game.roomId).emit("bingo:roundState", startedState);

        startNumberCalling(io, game.gameId, game.roomId);
      } catch (error) {
        console.error("Start Game Error:", error.message);
        socket.emit("error", {
          success: false,
          message: error.message || "Failed to start game",
        });
      }
    });

    // ------------------------------------------------------------------
    // 4. MARK A NUMBER
    // ------------------------------------------------------------------
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

        // ✅ IF BINGO IS DETECTED
        if (result.bingo) {
          console.log(`🏆 BINGO DETECTED! Winner: ${result.winner.username}`);

          // 1. Stop the number timer immediately
          stopNumberCalling(gameId);

          // 2. Broadcast the winner to the room
          io.to(game.roomId).emit("gameUpdate", {
            type: "bingo",
            winner: result.winner,
            gameId: game.gameId,
            message: `🎉 ${result.winner.username} got BINGO! Won ${result.winner.winAmount} coins!`,
          });
          io.to(game.roomId).emit("gameUpdate", {
            type: "gameEnded",
            message: "Game has ended. Thanks for playing!",
            winner: result.winner,
          });

          // 3. Wait 5 seconds, then reset and start a new round
          console.log("⏳ [WAITING 5 SECONDS BEFORE RESETTING GAME]");
          setTimeout(async () => {
            try {
              // Create the new game
              const nextGame = await createBingoGame(
                game.roomId,
                game.maxPlayers,
                game.minBet,
                game.maxBet,
              );

              // Broadcast the new round state to all clients so they reset their UI
              io.to(game.roomId).emit("gameUpdate", {
                type: "roomCreated",
                gameId: nextGame.gameId,
                roomId: nextGame.roomId,
                players: [],
                playerCount: 0,
                status: "waiting",
                selectedNumbers: [],
                message: "New round started! Select your lucky numbers.",
              });

              io.to(game.roomId).emit("bingo:roundState", {
                gameId: nextGame.gameId,
                roomId: nextGame.roomId,
                players: [],
                playerCount: 0,
                status: "waiting",
                selectedNumbers: [],
              });

              // Start a new 30-second countdown for the next round
              scheduleAutoStart(nextGame.gameId, nextGame.roomId, 30);
              console.log("✅ [NEW ROUND CREATED AND COUNTDOWN STARTED]");
            } catch (err) {
              console.error("Failed to create next round:", err.message || err);
            }
          }, 5000); // 5-second delay
        }
      } catch (error) {
        console.error("Mark Number Error:", error.message);
        socket.emit("error", {
          success: false,
          message: error.message || "Failed to mark number",
        });
      }
    });

    // ------------------------------------------------------------------
    // 5. GET CURRENT GAME STATE
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // 6. GET PLAYER'S CARD
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // 7. LEAVE ROOM
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // 8. DISCONNECT
    // ------------------------------------------------------------------
    socket.on("disconnect", () => {
      console.log(`🎯 Bingo client disconnected: ${socket.id}`);
    });
  });
};

// =========================================================================
// HELPER: SCHEDULE AUTO-START
// =========================================================================
const scheduleAutoStart = (gameId, roomId, seconds = 30, force = false) => {
  if (startCountdowns.has(gameId) && !force) {
    const existing = startCountdowns.get(gameId);
    if (
      existing &&
      typeof existing.remaining === "number" &&
      existing.remaining <= seconds
    ) {
      return;
    }
    try {
      clearInterval(existing.intervalId);
    } catch (e) {
      try {
        clearTimeout(existing);
      } catch (_) {}
    }
    startCountdowns.delete(gameId);
  }

  console.log(`⏳ Scheduling auto-start for game ${gameId} in ${seconds}s`);

  if (globalThis.io && typeof globalThis.io.to === "function") {
    globalThis.io.to(roomId).emit("gameUpdate", {
      type: "countdownStarted",
      seconds,
      message: `Game will auto-start in ${seconds} seconds if enough players join.`,
    });
  }

  let remaining = seconds;
  const intervalId = setInterval(async () => {
    try {
      if (globalThis.io && typeof globalThis.io.to === "function") {
        globalThis.io.to(roomId).emit("countdownTick", { remaining });
      }
      remaining -= 1;

      if (remaining < 0) {
        clearInterval(intervalId);
        startCountdowns.delete(gameId);

        const game = await getGameState(gameId);
        if (!game) return;

        if (game.status === "waiting" && game.players.length >= 1) {
          console.log("⏳ [WAITING 500ms FOR DB TO FINISH SAVING SELECTIONS]");
          await new Promise((resolve) => setTimeout(resolve, 500));

          const refreshedGame = await getGameState(gameId);
          console.log("🚀 [AUTO-START CHECK AFTER DELAY]", {
            selectedNumbers: refreshedGame.selectedNumbers,
            count: refreshedGame.selectedNumbers?.length || 0,
            players: refreshedGame.players.length,
          });

          const started = await startGame(refreshedGame.gameId);
          if (globalThis.io && typeof globalThis.io.to === "function") {
            const autoStartedState = {
              gameId: started.gameId,
              roomId: started.roomId,
              playerCount: started.players.length,
              players: (started.players || []).map((player) => ({
                telegramId: player.telegramId,
                username: player.username || player.firstName || "Player",
              })),
              selectedNumbers: started.selectedNumbers || [],
              status: "active",
              message: `🚀 Game auto-started with ${started.players.length} players.`,
              startTime: started.startTime,
            };

            globalThis.io
              .to(roomId)
              .emit("gameUpdate", { type: "gameStarted", ...autoStartedState });
            globalThis.io.to(roomId).emit("bingo:roundState", autoStartedState);
          }
          if (globalThis.io && typeof globalThis.io.to === "function") {
            startNumberCalling(globalThis.io, started.gameId, started.roomId);
          }
        } else {
          if (globalThis.io && typeof globalThis.io.to === "function") {
            globalThis.io.to(roomId).emit("gameUpdate", {
              type: "notEnoughPlayers",
              message:
                "Not enough players to start the game — waiting for more players.",
              playerCount: game.players.length,
            });
          }
        }
      }
    } catch (err) {
      console.error("Countdown tick error:", err.message || err);
      clearInterval(intervalId);
      startCountdowns.delete(gameId);
    }
  }, 1000);

  startCountdowns.set(gameId, { intervalId, remaining });
};

// =========================================================================
// HELPER: START NUMBER CALLING
// =========================================================================
const startNumberCalling = (io, gameId, roomId) => {
  stopNumberCalling(gameId);
  console.log(`⏰ Starting number calling for game: ${gameId}`);

  let remaining = 5;
  const interval = setInterval(async () => {
    try {
      if (io && typeof io.to === "function") {
        io.to(roomId).emit("countdownTick", { remaining });
        io.to(roomId).emit("bingo:countdownTick", { remaining });
      }

      if (gameTimers.has(gameId)) {
        const entry = gameTimers.get(gameId);
        if (entry && typeof entry === "object") entry.remaining = remaining;
      }

      if (remaining > 0) {
        remaining -= 1;
        return;
      }

      const result = await callNumber(gameId);

      if (!result) {
        clearInterval(interval);
        gameTimers.delete(gameId);
        io.to(roomId).emit("gameUpdate", {
          type: "gameEnded",
          message: "All numbers called! Game ended.",
        });

        setTimeout(async () => {
          const nextGame = await createBingoGame(roomId);
          io.to(roomId).emit("gameUpdate", {
            type: "roomCreated",
            gameId: nextGame.gameId,
            roomId: nextGame.roomId,
            players: [],
            status: nextGame.status,
            maxPlayers: nextGame.maxPlayers,
            selectedNumbers: nextGame.selectedNumbers || [],
          });
          scheduleAutoStart(nextGame.gameId, nextGame.roomId, 30);
        }, 5000);
        return;
      }

      io.to(roomId).emit("numberCalled", {
        number: result.number,
        calledNumbers: result.calledNumbers,
        remaining: 75 - result.calledNumbers.length,
      });
      io.to(roomId).emit("bingo:numberCalled", {
        number: result.number,
        calledNumbers: result.calledNumbers,
        remaining: 75 - result.calledNumbers.length,
      });

      remaining = 5;
      if (gameTimers.has(gameId)) {
        const entry = gameTimers.get(gameId);
        if (entry && typeof entry === "object") entry.remaining = remaining;
      }
    } catch (error) {
      console.error("Number Calling Interval Error:", error.message);
      clearInterval(interval);
      gameTimers.delete(gameId);
      io.to(roomId).emit("error", {
        success: false,
        message: "Error calling numbers. Game stopping.",
      });
    }
  }, 1000);

  gameTimers.set(gameId, { intervalId: interval, remaining });
};

// =========================================================================
// HELPER: STOP NUMBER CALLING
// =========================================================================
const stopNumberCalling = (gameId) => {
  if (gameTimers.has(gameId)) {
    const entry = gameTimers.get(gameId);
    try {
      if (entry && entry.intervalId) clearInterval(entry.intervalId);
      else clearInterval(entry);
    } catch (e) {
      try {
        clearTimeout(entry.intervalId || entry);
      } catch (_) {}
    }
    gameTimers.delete(gameId);
    console.log(`⏹️ Stopped number calling for game: ${gameId}`);
  }
};

// Export the timer map for potential external use
export { gameTimers };
