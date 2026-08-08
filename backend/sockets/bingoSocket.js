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

/**
 * Initialize Bingo Socket Handlers
 * @param {SocketIO.Server | SocketIO.Namespace} io - The Socket.IO instance or namespace
 */
export const initBingoSocket = (io) => {
  console.log("🎮 Initializing Bingo Socket Handlers...");

  io.on("connection", (socket) => {
    console.log(`🎯 Bingo client connected: ${socket.id}`);

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
        io.to(roomId).emit("gameUpdate", {
          type: "roomCreated",
          gameId: game.gameId,
          roomId: game.roomId,
          players: game.players,
          status: game.status,
          maxPlayers: game.maxPlayers,
        });
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
    socket.on("joinRoom", async (data) => {
      try {
        const { gameId, telegramId, betAmount } = data;

        // Validate inputs
        if (!gameId || !telegramId || !betAmount || betAmount < 1) {
          return socket.emit("error", {
            success: false,
            message:
              "Invalid data. GameId, TelegramId, and a valid bet are required.",
          });
        }

        // Join the game logic (deducts balance, creates ticket, generates card)
        const result = await joinBingoGame(gameId, telegramId, betAmount);

        // Join the Socket.IO room
        socket.join(result.game.roomId);

        // Send success to the player with their card
        socket.emit("joinedRoom", {
          success: true,
          gameId: result.game.gameId,
          roomId: result.game.roomId,
          card: result.ticket.card,
          ticketId: result.ticket.ticketId,
          balance: result.user.balance,
          currentPlayers: result.game.players.length,
        });

        // Notify ALL players in the room that someone joined
        io.to(result.game.roomId).emit("gameUpdate", {
          type: "playerJoined",
          player: {
            telegramId,
            username: result.user.firstName || "Player",
          },
          playerCount: result.game.players.length,
          totalPlayers: result.game.maxPlayers,
        });
      } catch (error) {
        console.error("Join Room Error:", error.message);
        socket.emit("error", {
          success: false,
          message: error.message || "Failed to join room",
        });
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

        // Update game status to 'active' in DB
        const game = await startGame(gameId);

        // Notify all players in the room
        io.to(game.roomId).emit("gameUpdate", {
          type: "gameStarted",
          gameId: game.gameId,
          message: "🚀 Game started! Numbers will be called every 5 seconds.",
          startTime: game.startTime,
        });

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
// HELPER: START NUMBER CALLING (Interval)
// =========================================================================
const startNumberCalling = (io, gameId, roomId) => {
  // Stop any existing timer for this game
  stopNumberCalling(gameId);

  console.log(`⏰ Starting number calling for game: ${gameId}`);

  const interval = setInterval(async () => {
    try {
      // Call the next number via Service
      const result = await callNumber(gameId);

      if (!result) {
        // If no more numbers available, end the game
        clearInterval(interval);
        gameTimers.delete(gameId);

        io.to(roomId).emit("gameUpdate", {
          type: "gameEnded",
          message: "All numbers called! Game ended.",
        });
        return;
      }

      // Broadcast the new number to everyone in the room
      io.to(roomId).emit("numberCalled", {
        number: result.number,
        calledNumbers: result.calledNumbers,
        remaining: 75 - result.calledNumbers.length,
      });
    } catch (error) {
      console.error("Number Calling Interval Error:", error.message);
      clearInterval(interval);
      gameTimers.delete(gameId);

      io.to(roomId).emit("error", {
        success: false,
        message: "Error calling numbers. Game stopping.",
      });
    }
  }, 5000); // Call a number every 5 seconds

  // Store the interval so we can clear it later
  gameTimers.set(gameId, interval);
};

// =========================================================================
// HELPER: STOP NUMBER CALLING
// =========================================================================
const stopNumberCalling = (gameId) => {
  if (gameTimers.has(gameId)) {
    clearInterval(gameTimers.get(gameId));
    gameTimers.delete(gameId);
    console.log(`⏹️ Stopped number calling for game: ${gameId}`);
  }
};

// Export the timer map for potential external use
export { gameTimers };
