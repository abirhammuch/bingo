import BingoGame from "../models/BingoGame.js";
import {
  SELECTION_TIME_SECONDS,
  joinBingoGame,
  joinAsSpectator,
  markNumber,
  getGameState,
  createBingoGame,
  saveWithRetry,
  resetEmptyRound,
} from "../services/bingo/bingoService.js";

import {
  startSelectionTimer,
  startCallingNumbers,
  stopBingoTimers,
} from "./bingoTimer.js";

const getPlayerSummary = (players = []) =>
  players.map((player) => ({
    telegramId: player.telegramId,
    username: player.username || "",
    firstName: player.firstName || "",
    isSpectator: Boolean(player.isSpectator),
    cardsSelected: player.cardsSelected || 1,
  }));

const getRemainingSeconds = (selectionEndsAt) => {
  if (!selectionEndsAt) return 0;

  return Math.max(
    0,
    Math.ceil((new Date(selectionEndsAt).getTime() - Date.now()) / 1000),
  );
};

const buildRoundState = (game) => {
  const realPlayers = (game.players || []).filter(
    (player) => !player.isSpectator,
  );

  const spectators = (game.players || []).filter(
    (player) => player.isSpectator,
  );

  return {
    gameId: game.gameId,
    roomId: game.roomId,

    status:
      game.status === "waiting"
        ? "WAITING"
        : game.status === "active"
          ? "PLAYING"
          : "FINISHED",

    playerCount: realPlayers.length,
    spectatorCount: spectators.length,

    players: getPlayerSummary(game.players),

    selectedNumbers: game.selectedNumbers || [],

    calledNumbers: game.calledNumbers || [],

    currentNumber: game.currentNumber ?? null,

    winner: game.winner || null,

    selectionEndsAt: game.selectionEndsAt || null,

    remainingSeconds:
      game.status === "waiting" ? getRemainingSeconds(game.selectionEndsAt) : 0,

    roundNumber: game.roundNumber,
  };
};

const emitRoundState = (io, game) => {
  io.to(`bingo:${game.gameId}`).emit("bingo:roundState", buildRoundState(game));
};

const normalizeIncomingSelectionValues = (value) => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(value?.selectedNumbers)
      ? value.selectedNumbers
      : Array.isArray(value?.luckyNumbers)
        ? value.luckyNumbers
        : value === null || value === undefined || value === ""
          ? []
          : [value];

  return [
    ...new Set(
      source
        .flatMap((item) => (Array.isArray(item) ? item : [item]))
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 1 && item <= 300),
    ),
  ].sort((a, b) => a - b);
};

export const initBingoSocket = (io) => {
  console.log("🎮 Bingo Socket Initialized");

  io.on("connection", async (socket) => {
    console.log("🟢 Bingo socket connected:", socket.id);

    // ============================================================
    // JOIN BINGO GAME
    // ============================================================

    const handleJoinRequest = async (data, callback) => {
      try {
        const {
          gameId,
          telegramId,
          betAmount,
          luckyNumber,
          luckyNumbers,
          selectedNumbers,
          spectator = false,
        } = data;

        const normalizedSelectionNumbers = normalizeIncomingSelectionValues({
          luckyNumbers,
          selectedNumbers,
          value: luckyNumber,
        });

        if (!gameId || !telegramId) {
          const response = {
            success: false,
            message: "gameId and telegramId are required",
          };

          if (callback) callback(response);
          return;
        }

        const game = await BingoGame.findOne({ gameId });

        if (!game) {
          const response = {
            success: false,
            message: "Game not found",
          };

          if (callback) callback(response);
          return;
        }

        // ========================================================
        // IMPORTANT
        // EVERYONE joins bingo:${gameId}
        // ========================================================

        socket.join(`bingo:${gameId}`);

        console.log(`👤 ${telegramId} joined Socket.IO room bingo:${gameId}`);

        let result;
        let isSpectator = false;
        const existingPlayer = game.players.find(
          (player) =>
            String(player.telegramId) === String(telegramId) &&
            !player.isSpectator,
        );

        // ========================================================
        // SPECTATOR
        // ========================================================

        if (game.status === "active" && existingPlayer) {
          result = {
            ticket: {
              card: existingPlayer.card || [],
              ticketId: null,
            },
            user: { balance: null },
          };
        } else if (spectator || game.status === "active") {
          result = await joinAsSpectator(gameId, telegramId);
          isSpectator = true;
        }

        // ========================================================
        // PLAYER
        // ========================================================
        else {
          if (!betAmount || Number(betAmount) <= 0) {
            const response = {
              success: false,
              message: "Valid bet amount is required",
            };

            if (callback) callback(response);
            return;
          }

          result = await joinBingoGame(
            gameId,
            telegramId,
            Number(betAmount),
            normalizedSelectionNumbers,
          );
        }

        const updatedGame = await getGameState(gameId);

        // ========================================================
        // SEND JOIN RESPONSE
        // ========================================================

        const joinPayload = {
          success: true,

          gameId: updatedGame.gameId,

          roomId: updatedGame.roomId,

          isSpectator,

          card: isSpectator ? null : result?.ticket?.card || null,

          ticketId: result?.ticket?.ticketId || null,

          balance: result?.user?.balance ?? null,

          playerCount: updatedGame.players.filter((p) => !p.isSpectator).length,

          spectatorCount: updatedGame.players.filter((p) => p.isSpectator)
            .length,

          selectionEndsAt: updatedGame.selectionEndsAt,

          selectedNumbers: updatedGame.selectedNumbers || [],

          remainingSeconds:
            updatedGame.status === "waiting"
              ? getRemainingSeconds(updatedGame.selectionEndsAt)
              : 0,
        };

        socket.emit("bingo:joined", joinPayload);
        socket.emit("joinedRoom", joinPayload);

        // ========================================================
        // SEND CURRENT GLOBAL STATE
        // ========================================================

        emitRoundState(io, updatedGame);

        if (callback) {
          callback({
            success: true,
            gameId: updatedGame.gameId,
            roomId: updatedGame.roomId,
            isSpectator,
            card: result?.ticket?.card || null,
            selectedNumbers: updatedGame.selectedNumbers || [],
            playerCount: updatedGame.players.filter((p) => !p.isSpectator)
              .length,
            remainingSeconds:
              updatedGame.status === "waiting"
                ? getRemainingSeconds(updatedGame.selectionEndsAt)
                : 0,
          });
        }
      } catch (error) {
        console.error("❌ joinBingo error:", error);

        if (callback) {
          callback({
            success: false,
            message: error.message,
          });
        }

        socket.emit("bingo:error", {
          message: error.message,
        });
      }
    };

    socket.on("joinBingo", handleJoinRequest);
    socket.on("joinRoom", handleJoinRequest);

    // ============================================================
    // SELECT CARD / LUCKY NUMBERS
    // ============================================================

    const saveSelectionUpdate = async (
      data,
      callback,
      { isDeselect = false } = {},
    ) => {
      try {
        const { gameId, telegramId, number, numbers, selectedNumbers } = data;

        const incomingNumbers = normalizeIncomingSelectionValues({
          selectedNumbers: Array.isArray(selectedNumbers)
            ? selectedNumbers
            : Array.isArray(numbers)
              ? numbers
              : number !== undefined && number !== null
                ? [number]
                : [],
        });

        if (!gameId || !telegramId) {
          throw new Error("gameId and telegramId are required");
        }

        if (incomingNumbers.length === 0) {
          throw new Error("Select at least one number");
        }

        const game = await BingoGame.findOne({ gameId });

        if (!game) {
          throw new Error("Game not found");
        }

        if (game.status !== "waiting") {
          throw new Error("Card selection time has ended");
        }

        if (
          game.selectionEndsAt &&
          new Date(game.selectionEndsAt).getTime() <= Date.now()
        ) {
          throw new Error("Selection time has ended");
        }

        let player = game.players.find(
          (entry) =>
            String(entry.telegramId) === String(telegramId) &&
            !entry.isSpectator,
        );

        if (!player) {
          const fallbackBetAmount = Number(data.betAmount ?? 1) || 1;

          await joinBingoGame(
            gameId,
            telegramId,
            fallbackBetAmount,
            incomingNumbers,
          );

          const refreshedGame = await BingoGame.findOne({ gameId });
          if (!refreshedGame) {
            throw new Error("Game not found after join");
          }

          game.players = refreshedGame.players;
          game.selectedNumbers = refreshedGame.selectedNumbers;
          player = refreshedGame.players.find(
            (entry) =>
              String(entry.telegramId) === String(telegramId) &&
              !entry.isSpectator,
          );

          if (!player) {
            throw new Error("You are not a player in this round");
          }
        }

        const currentSelected = Array.isArray(player.selectedLuckyNumbers)
          ? player.selectedLuckyNumbers
          : [];

        const finalSelected = isDeselect
          ? currentSelected.filter(
              (value) => !incomingNumbers.includes(Number(value)),
            )
          : [...new Set([...currentSelected, ...incomingNumbers])].sort(
              (a, b) => a - b,
            );

        if (finalSelected.length > 3) {
          throw new Error("You can select maximum 3 numbers");
        }

        player.selectedLuckyNumbers = finalSelected;
        player.cardsSelected = finalSelected.length;

        const allSelected = [
          ...new Set(
            game.players
              .filter((entry) => !entry.isSpectator)
              .flatMap((entry) =>
                Array.isArray(entry.selectedLuckyNumbers)
                  ? entry.selectedLuckyNumbers
                  : [],
              ),
          ),
        ].sort((a, b) => a - b);

        game.selectedNumbers = allSelected;
        game.playerCount = game.players.filter((p) => !p.isSpectator).length;

        await saveWithRetry(game);

        const response = {
          success: true,
          selectedNumbers: finalSelected,
          selectedNumbersGlobal: game.selectedNumbers,
          playerCount: game.playerCount,
          gameId,
        };

        io.to(`bingo:${gameId}`).emit("bingo:cardSelected", {
          gameId,
          telegramId,
          selectedNumbers: finalSelected,
          selectedNumbersGlobal: game.selectedNumbers,
          playerCount: game.playerCount,
          status: "WAITING",
        });

        emitRoundState(io, game);

        socket.emit("bingo:cardSelectionSuccess", response);

        if (callback) callback(response);
      } catch (error) {
        console.error("❌ Card selection error:", error);

        const response = {
          success: false,
          message: error.message || "Failed to select card",
        };

        socket.emit("bingo:cardSelectionError", response);

        if (callback) callback(response);
      }
    };

    socket.on("selectLuckyNumber", (data, callback) =>
      saveSelectionUpdate(data, callback, { isDeselect: false }),
    );

    socket.on("deselectLuckyNumber", (data, callback) =>
      saveSelectionUpdate(data, callback, { isDeselect: true }),
    );

    socket.on("bingo:selectCard", async (data, callback) => {
      try {
        const { gameId, telegramId, selectedNumbers } = data;

        if (!gameId || !telegramId) {
          throw new Error("gameId and telegramId are required");
        }

        if (!Array.isArray(selectedNumbers)) {
          throw new Error("selectedNumbers must be an array");
        }

        const game = await BingoGame.findOne({ gameId });

        if (!game) {
          throw new Error("Game not found");
        }

        // Cannot select after selection phase
        if (game.status !== "waiting") {
          throw new Error("Card selection time has ended");
        }

        // Verify timer has not expired
        if (
          game.selectionEndsAt &&
          new Date(game.selectionEndsAt).getTime() <= Date.now()
        ) {
          throw new Error("Selection time has ended");
        }

        const player = game.players.find(
          (p) => String(p.telegramId) === String(telegramId) && !p.isSpectator,
        );

        if (!player) {
          throw new Error("You are not a player in this round");
        }

        // ========================================================
        // LIMIT
        // Change this to whatever your game requires.
        // ========================================================

        if (selectedNumbers.length === 0) {
          throw new Error("Select at least one number");
        }

        if (selectedNumbers.length > 3) {
          throw new Error("You can select maximum 3 numbers");
        }

        // Remove duplicates
        const uniqueNumbers = [...new Set(selectedNumbers.map(Number))];

        // ========================================================
        // SAVE TO PLAYER
        // ========================================================

        player.selectedLuckyNumbers = uniqueNumbers;

        player.cardsSelected = uniqueNumbers.length;

        // ========================================================
        // GLOBAL SELECTED NUMBERS
        // ========================================================

        const allSelected = [];

        game.players
          .filter((p) => !p.isSpectator)
          .forEach((p) => {
            if (Array.isArray(p.selectedLuckyNumbers)) {
              allSelected.push(...p.selectedLuckyNumbers);
            }
          });

        game.selectedNumbers = [...new Set(allSelected)];

        game.playerCount = game.players.filter((p) => !p.isSpectator).length;

        await saveWithRetry(game);

        // ========================================================
        // BROADCAST TO EVERYONE
        // ========================================================

        io.to(`bingo:${gameId}`).emit("bingo:cardSelected", {
          gameId,

          telegramId,

          selectedNumbers: uniqueNumbers,

          selectedNumbersGlobal: game.selectedNumbers,

          playerCount: game.playerCount,

          status: "WAITING",
        });

        emitRoundState(io, game);

        const response = {
          success: true,
          selectedNumbers: uniqueNumbers,
          selectedNumbersGlobal: game.selectedNumbers,
          playerCount: game.playerCount,
        };

        socket.emit("bingo:cardSelectionSuccess", response);

        if (callback) callback(response);
      } catch (error) {
        console.error("❌ Card selection error:", error);

        const response = {
          success: false,
          message: error.message || "Failed to select card",
        };

        socket.emit("bingo:cardSelectionError", response);

        if (callback) callback(response);
      }
    });

    // ============================================================
    // GET CURRENT GAME
    // ============================================================

    socket.on("bingo:getState", async (data) => {
      try {
        const { gameId } = data;

        const game = await getGameState(gameId);

        // Make sure socket is in the correct room
        socket.join(`bingo:${gameId}`);

        socket.emit("bingo:roundState", buildRoundState(game));
      } catch (error) {
        socket.emit("bingo:error", {
          message: error.message,
        });
      }
    });

    // ============================================================
    // MARK NUMBER
    // ============================================================

    socket.on("bingo:markNumber", async (data) => {
      try {
        const { gameId, telegramId, number } = data;

        const result = await markNumber(gameId, telegramId, Number(number));

        const game = await getGameState(gameId);

        socket.emit("bingo:numberMarked", {
          success: true,
          number,
          ...result,
        });

        // ========================================================
        // WINNER
        // ========================================================

        if (result.bingo) {
          stopBingoTimers(gameId);

          const winner = game.winner;

          io.to(`bingo:${gameId}`).emit("bingo:winner", {
            gameId,

            winner,

            winnerName: winner?.firstName || winner?.username || "Winner",

            winnerCard: winner?.card || [],

            winAmount: winner?.winAmount || 0,

            bingoResult: winner?.bingoResult || null,

            calledNumbers: game.calledNumbers,

            status: "FINISHED",
          });

          io.to(`bingo:${gameId}`).emit("bingo:roundFinished", {
            gameId,
            status: "FINISHED",
            winner,
            winnerCard: winner?.card || [],
          });
        }
      } catch (error) {
        console.error("❌ markNumber error:", error);

        socket.emit("bingo:error", {
          message: error.message,
        });
      }
    });

    // ============================================================
    // DISCONNECT
    // ============================================================

    socket.on("disconnect", () => {
      console.log("🔴 Bingo socket disconnected:", socket.id);
    });
  });
};
