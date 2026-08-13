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
  // Expose io globally so helper functions outside this scope can emit events
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

        // Create the game in MongoDB
        const game = await createBingoGame(roomId, maxPlayers, minBet, maxBet);

        // Join the socket room
        socket.join(roomId);

        socket.emit("roomCreated", {
          success: true,
          gameId: game.gameId,
          roomId: game.roomId,
          message: `Room "${roomId}" created successfully!`,
        });

        // Broadcast to the room that the game is waiting
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

        // Schedule a 30-second join window for this newly created room.
        // When it ends, the server will auto-start the game for everyone in the room.
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

        // Validate inputs
        if (!gameId || !telegramId || !betAmount || betAmount < 1) {
          const response = {
            success: false,
            message:
              "Invalid data. GameId, TelegramId, and a valid bet are required.",
          };
          console.log("❌ [INVALID PAYLOAD]", { response, data });
          if (typeof callback === "function") return callback(response);
          return socket.emit("error", response);
        }

        console.log("📞 [CALLING joinBingoGame SERVICE]", {
          gameId,
          telegramId,
          betAmount,
          luckyNumber,
        });

        // Join the game logic (deducts balance, creates ticket, generates card)
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
          playerCountField: result?.game?.playerCount,
          selectedNumbers: result?.game?.selectedNumbers,
          ticketId: result?.ticket?.ticketId,
        });

        // Join the Socket.IO room
        console.log("🔗 [SOCKET JOIN ROOM]", {
          socketId: socket.id,
          roomId: result.game.roomId,
        });
        socket.join(result.game.roomId);
        console.log("✅ [SOCKET JOINED]", {
          socketId: socket.id,
          roomId: result.game.roomId,
        });

        // Send success to the player with their card
        console.log("📤 [EMIT joinedRoom]", {
          socketId: socket.id,
          telegramId,
          playerCount: result.game.players.length,
        });
        socket.emit("joinedRoom", {
          success: true,
          gameId: result.game.gameId,
          roomId: result.game.roomId,
          card: result.ticket.card,
          ticketId: result.ticket.ticketId,
          balance: result.user.balance,
          currentPlayers: result.game.players.length,
          playerCount: result.game.players.length,
          players: (result.game.players || []).map((player) => ({
            telegramId: player.telegramId,
            username: player.username || player.firstName || "Player",
          })),
          selectedNumbers: result.game.selectedNumbers || [],
        });

        // Notify ALL players in the room that someone joined
        // Include any current countdown remaining if present so late joiners sync
        const countdownRemaining = startCountdowns.has(result.game.gameId)
          ? startCountdowns.get(result.game.gameId).remaining
          : gameTimers.has(result.game.gameId)
            ? gameTimers.get(result.game.gameId).remaining
            : undefined;

        const joinedRoomState = {
          gameId: result.game.gameId,
          roomId: result.game.roomId,
          player: {
            telegramId,
            username: result.user.firstName || "Player",
          },
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

        console.log("📢 [BROADCAST playerJoined TO ROOM]", {
          roomId: result.game.roomId,
          newPlayerCount: result.game.players.length,
          playerTelegramIds: joinedRoomState.players.map((p) => p.telegramId),
        });
        io.to(result.game.roomId).emit("gameUpdate", {
          type: "playerJoined",
          ...joinedRoomState,
        });
        io.to(result.game.roomId).emit("bingo:roundState", {
          ...joinedRoomState,
          status: "waiting",
        });
        console.log("✅ [BROADCAST COMPLETE]");

        if (typeof callback === "function") {
          console.log("📞 [EMIT CALLBACK]", {
            gameId: result.game.gameId,
            playerCount: result.game.players.length,
          });
          callback({
            success: true,
            gameId: result.game.gameId,
            roomId: result.game.roomId,
            selectedNumbers: result.game.selectedNumbers || [],
            playerCount: result.game.players.length,
          });
        }

        // Keep the shared 30-second join window active for the room.
        const currentGame = await getGameState(result.game.gameId);
        if (currentGame.status === "waiting") {
          if (typeof countdownRemaining === "number") {
            socket.emit("countdownRemaining", countdownRemaining);
          }
          // Re-anchor the countdown to the full 30-second window for the room.
          scheduleAutoStart(currentGame.gameId, currentGame.roomId, 30, true);
        }

        const socketJoinEndTime = new Date();
        const socketJoinDurationMs = socketJoinEndTime - socketJoinStartTime;
        console.log("\n✅ [SOCKET JOIN COMPLETE]", {
          timestamp: socketJoinEndTime.toISOString(),
          durationMs: socketJoinDurationMs,
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
    // 3. START GAME (Host/Admin only)
    // ------------------------------------------------------------------
    socket.on("startGame", async (data) => {
      try {
        const { gameId } = data;

        if (!gameId) {
          return socket.emit("error", {
            success: false,
            message: "Game ID is required",
          });
        }

        // If an auto-start countdown exists for this game, cancel it
        if (startCountdowns.has(gameId)) {
          const s = startCountdowns.get(gameId);
          try {
            clearInterval(s.intervalId);
          } catch (e) {
            // fallback if stored value was a timeout
            try {
              clearTimeout(s);
            } catch (_) {}
          }
          startCountdowns.delete(gameId);
        }

        // Update game status to 'active' in DB
        const game = await startGame(gameId);

        // Notify all players in the room
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

        // Start the automatic number calling loop
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
    // 4. MARK A NUMBER (Player marks a number on their card)
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

        // Attempt to mark the number in the DB
        const result = await markNumber(gameId, telegramId, number);

        // Fetch the game state to get the roomId
        const game = await getGameState(gameId);

        // Send confirmation to the specific player
        socket.emit("numberMarked", {
          success: true,
          number,
          marked: result.marked,
          bingo: result.bingo,
          bingoResult: result.bingoResult,
          markedNumbers: result.markedNumbers,
        });

        // IF BINGO IS DETECTED
        if (result.bingo) {
          // Stop the number timer
          stopNumberCalling(gameId);

          // Notify ALL players in the room
          io.to(game.roomId).emit("gameUpdate", {
            type: "bingo",
            winner: result.winner,
            gameId: game.gameId,
            message: `🎉 ${result.winner.username} got BINGO! Won ${result.winner.winAmount} coins!`,
          });

          // Tell everyone the game is over
          io.to(game.roomId).emit("gameUpdate", {
            type: "gameEnded",
            message: "Game has ended. Thanks for playing!",
            winner: result.winner,
          });

          // After a short delay, create a new waiting game for the same room
          setTimeout(async () => {
            try {
              const newGame = await createBingoGame(
                game.roomId,
                game.maxPlayers,
                game.minBet,
                game.maxBet,
              );
              // Broadcast new room created state
              io.to(game.roomId).emit("gameUpdate", {
                type: "roomCreated",
                gameId: newGame.gameId,
                roomId: newGame.roomId,
                players: newGame.players,
                status: newGame.status,
                maxPlayers: newGame.maxPlayers,
                selectedNumbers: newGame.selectedNumbers || [],
              });

              // Schedule auto-start for the new game
              scheduleAutoStart(newGame.gameId, newGame.roomId, 20);
            } catch (err) {
              console.error("Failed to create new round:", err.message || err);
            }
          }, 5000);
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

        // Notify others
        socket.to(roomId).emit("gameUpdate", {
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
// HELPER: SCHEDULE AUTO-START (synchronized countdown)
// =========================================================================
const scheduleAutoStart = (gameId, roomId, seconds = 20, force = false) => {
  // If already scheduled and not forced, keep existing if it has less or equal remaining
  if (startCountdowns.has(gameId) && !force) {
    const existing = startCountdowns.get(gameId);
    if (
      existing &&
      typeof existing.remaining === "number" &&
      existing.remaining <= seconds
    ) {
      return;
    }
    // otherwise cancel existing and reschedule
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

  // Broadcast countdown started
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
      // Broadcast remaining seconds each second so all clients stay synced
      if (globalThis.io && typeof globalThis.io.to === "function") {
        globalThis.io.to(roomId).emit("countdownTick", { remaining });
      }

      remaining -= 1;

      if (remaining < 0) {
        // finished countdown
        clearInterval(intervalId);
        startCountdowns.delete(gameId);

        const game = await getGameState(gameId);
        if (!game) return;

        // ✅ FIX: Check if the game is waiting AND has at least 1 player
        // The "selectedCount" check is already handled inside startGame()
        if (game.status === "waiting" && game.players.length >= 1) {
          const started = await startGame(gameId);
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

            globalThis.io.to(roomId).emit("gameUpdate", {
              type: "gameStarted",
              ...autoStartedState,
            });
            globalThis.io.to(roomId).emit("bingo:roundState", autoStartedState);
          }
          // start number calling
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
// HELPER: START NUMBER CALLING (Interval)
// =========================================================================
const startNumberCalling = (io, gameId, roomId) => {
  // Stop any existing timer for this game
  stopNumberCalling(gameId);

  console.log(`⏰ Starting number calling for game: ${gameId}`);

  // We'll emit a per-second countdown so clients stay perfectly synchronized.
  // After the countdown reaches 0 we call the next number and reset the countdown.
  let remaining = 5; // seconds until next number

  const interval = setInterval(async () => {
    try {
      // Emit per-second tick for this game/room
      if (io && typeof io.to === "function") {
        io.to(roomId).emit("countdownTick", { remaining });
        // Also emit bingo:* style event for clients listening to standardized names
        io.to(roomId).emit("bingo:countdownTick", { remaining });
      }

      // update stored remaining in gameTimers entry so join handlers can read it
      if (gameTimers.has(gameId)) {
        const entry = gameTimers.get(gameId);
        if (entry && typeof entry === "object") entry.remaining = remaining;
      }

      if (remaining > 0) {
        remaining -= 1;
        return;
      }

      // Time to call the next number
      const result = await callNumber(gameId);

      if (!result) {
        // No more numbers: stop interval and finish the game
        clearInterval(interval);
        gameTimers.delete(gameId);

        io.to(roomId).emit("gameUpdate", {
          type: "gameEnded",
          message: "All numbers called! Game ended.",
        });

        // create a new waiting round after a short delay
        setTimeout(async () => {
          try {
            const newGame = await createBingoGame(roomId);
            io.to(roomId).emit("gameUpdate", {
              type: "roomCreated",
              gameId: newGame.gameId,
              roomId: newGame.roomId,
              players: newGame.players,
              status: newGame.status,
              maxPlayers: newGame.maxPlayers,
              selectedNumbers: newGame.selectedNumbers || [],
            });
            scheduleAutoStart(newGame.gameId, newGame.roomId, 20);
          } catch (err) {
            console.error("Failed to create next round:", err.message || err);
          }
        }, 5000);

        return;
      }

      // Broadcast the new number to everyone in the room
      io.to(roomId).emit("numberCalled", {
        number: result.number,
        calledNumbers: result.calledNumbers,
        remaining: 75 - result.calledNumbers.length,
      });
      // Also emit bingo names for compatibility
      io.to(roomId).emit("bingo:numberCalled", {
        number: result.number,
        calledNumbers: result.calledNumbers,
        remaining: 75 - result.calledNumbers.length,
      });

      // reset countdown for next number
      remaining = 5;

      // update stored remaining in gameTimers entry if present
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
  }, 1000); // tick every second for synchronized countdowns

  // Store the interval and remaining so other handlers (join) can read the countdown
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
