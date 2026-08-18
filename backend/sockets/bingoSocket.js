import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";
import BingoRoundManager from "../../services/bingo/BingoRoundManager.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_BINGO_NUMBER = 75;

/* ============================================================
   SAVE WITH RETRY
============================================================ */

export const saveWithRetry = async (document, maxRetries = 3) => {
  let retries = maxRetries;

  while (retries > 0) {
    try {
      return await document.save();
    } catch (error) {
      if (error.name === "VersionError" && retries > 1) {
        retries--;

        await new Promise((resolve) => setTimeout(resolve, 20));
      } else {
        throw error;
      }
    }
  }
};

/* ============================================================
   TELEGRAM ID
============================================================ */

export const normalizeTelegramId = (telegramId) => {
  if (telegramId === null || telegramId === undefined) {
    return "";
  }

  return String(telegramId).trim();
};

/* ============================================================
   NORMALIZE NUMBERS
============================================================ */

const normalizeSelectedNumbers = (numbers = []) => {
  return [
    ...new Set(
      numbers
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 75),
    ),
  ].sort((a, b) => a - b);
};

/* ============================================================
   SHUFFLE
============================================================ */

const shuffle = (array) => {
  const values = [...array];

  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [values[i], values[j]] = [values[j], values[i]];
  }

  return values;
};

/* ============================================================
   GENERATE BINGO CARD
============================================================ */

export const generateBingoCard = (luckyNumber = null) => {
  const columns = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  const card = Array.from({ length: 5 }, () => Array(5).fill(0));

  let luckyColumn = null;

  if (luckyNumber !== null && Number.isFinite(Number(luckyNumber))) {
    const value = Number(luckyNumber);

    if (value >= 1 && value <= 15) {
      luckyColumn = 0;
    } else if (value >= 16 && value <= 30) {
      luckyColumn = 1;
    } else if (value >= 31 && value <= 45) {
      luckyColumn = 2;
    } else if (value >= 46 && value <= 60) {
      luckyColumn = 3;
    } else if (value >= 61 && value <= 75) {
      luckyColumn = 4;
    }
  }

  for (let col = 0; col < 5; col++) {
    const [min, max] = columns[col];

    let values = Array.from(
      {
        length: max - min + 1,
      },
      (_, index) => min + index,
    );

    // Remove lucky number first
    if (col === luckyColumn) {
      values = values.filter((value) => value !== Number(luckyNumber));
    }

    values = shuffle(values);

    let selected = values.slice(0, 5);

    // If lucky number belongs to this column,
    // put it into one of the 4 non-center positions.
    if (col === luckyColumn) {
      const rowOptions = [0, 1, 3, 4];

      const luckyRow =
        rowOptions[Math.floor(Math.random() * rowOptions.length)];

      selected[luckyRow] = Number(luckyNumber);
    }

    for (let row = 0; row < 5; row++) {
      card[row][col] = selected[row];
    }
  }

  // FREE CENTER
  card[2][2] = 0;

  return card;
};

/* ============================================================
   CARD NUMBERS
============================================================ */

export const getCardNumbers = (card) => {
  const numbers = [];

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (card[row][col] !== 0) {
        numbers.push(card[row][col]);
      }
    }
  }

  return numbers;
};

/* ============================================================
   CHECK NUMBER
============================================================ */

export const checkNumberOnCard = (card, number) => {
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (Number(card[row][col]) === Number(number)) {
        return {
          found: true,
          row,
          col,
        };
      }
    }
  }

  return {
    found: false,
  };
};

/* ============================================================
   CHECK BINGO
============================================================ */

export const checkBingo = (card, markedNumbers = []) => {
  if (!Array.isArray(card) || card.length !== 5) {
    return {
      bingo: false,
    };
  }

  const markedSet = new Set(markedNumbers.map(Number));

  const isMarked = (value) => value === 0 || markedSet.has(Number(value));

  // ROWS
  for (let row = 0; row < 5; row++) {
    if (card[row].every(isMarked)) {
      return {
        bingo: true,
        type: "row",
        position: row,
      };
    }
  }

  // COLUMNS
  for (let col = 0; col < 5; col++) {
    const column = card.map((row) => row[col]);

    if (column.every(isMarked)) {
      return {
        bingo: true,
        type: "column",
        position: col,
      };
    }
  }

  // DIAGONAL 1
  const diagonalOne = card.map((row, index) => row[index]);

  if (diagonalOne.every(isMarked)) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-left to bottom-right",
    };
  }

  // DIAGONAL 2
  const diagonalTwo = card.map((row, index) => row[4 - index]);

  if (diagonalTwo.every(isMarked)) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-right to bottom-left",
    };
  }

  return {
    bingo: false,
  };
};

/* ============================================================
   CREATE GAME
============================================================ */

export const createBingoGame = async (
  roomId,
  maxPlayers = 100,
  minBet = 1,
  maxBet = 100,
) => {
  const gameId = uuidv4();

  const previousGames = await BingoGame.countDocuments({ roomId });

  const game = new BingoGame({
    gameId,
    roomId,

    status: "waiting",

    roundNumber: previousGames + 1,

    maxPlayers,

    minBet,

    maxBet,

    players: [],

    playerCount: 0,

    selectedNumbers: [],

    calledNumbers: [],

    currentNumber: null,

    winner: null,

    selectionEndsAt: null,

    roundSummary: {
      playerCount: 0,
      maxPlayers,
      totalBetAmount: 0,
      calledNumbersCount: 0,
      selectedNumbersCount: 0,
      endedReason: "waiting",
    },
  });

  await game.save();

  return game;
};

/* ============================================================
   JOIN BINGO
============================================================ */

export const joinBingoGame = async (
  gameId,
  telegramId,
  betAmount,
  luckyNumber = null,
) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);

  if (!normalizedTelegramId) {
    throw new Error("Telegram ID is required");
  }

  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "waiting") {
    throw new Error(
      "Selection phase has ended. You can spectate the live game.",
    );
  }

  const user = await User.findOne({
    telegramId: normalizedTelegramId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const amount = Number(betAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid bet amount");
  }

  if (amount < Number(game.minBet) || amount > Number(game.maxBet)) {
    throw new Error(`Bet must be between ${game.minBet} and ${game.maxBet}`);
  }

  if (user.balance < amount) {
    throw new Error("Insufficient balance");
  }

  const existingIndex = game.players.findIndex(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  const lucky =
    luckyNumber === null || luckyNumber === undefined || luckyNumber === ""
      ? null
      : Number(luckyNumber);

  if (lucky !== null && (!Number.isInteger(lucky) || lucky < 1 || lucky > 75)) {
    throw new Error("Lucky number must be between 1 and 75");
  }

  /* ========================================================
       EXISTING PLAYER
    ======================================================== */

  if (existingIndex !== -1) {
    const player = game.players[existingIndex];

    if (player.isSpectator) {
      throw new Error(
        "Spectator cannot become a player after the game has started.",
      );
    }

    const existingLucky = Array.isArray(player.selectedLuckyNumbers)
      ? player.selectedLuckyNumbers
      : [];

    if (lucky !== null && !existingLucky.includes(lucky)) {
      if (existingLucky.length >= 2) {
        throw new Error("You can select maximum 2 lucky numbers");
      }

      // Make sure another player hasn't selected it
      const alreadyUsed = game.selectedNumbers.includes(lucky);

      if (alreadyUsed) {
        throw new Error("Lucky number already selected");
      }

      player.selectedLuckyNumbers = [...existingLucky, lucky];

      game.selectedNumbers = normalizeSelectedNumbers([
        ...game.selectedNumbers,
        lucky,
      ]);
    }

    game.players[existingIndex] = player;

    await saveWithRetry(game);

    return {
      game,
      ticket: null,
      user: {
        balance: user.balance,
        firstName: user.firstName,
      },
    };
  }

  /* ========================================================
       NEW PLAYER
    ======================================================== */

  const selectedLuckyNumbers = lucky !== null ? [lucky] : [];

  if (lucky !== null && game.selectedNumbers.includes(lucky)) {
    throw new Error("Lucky number already selected");
  }

  // Deduct bet
  user.balance -= amount;

  await user.save();

  // Generate card with lucky number
  const card = generateBingoCard(lucky);

  const ticketId = uuidv4();

  const ticket = new BingoTicket({
    ticketId,
    gameId,
    telegramId: normalizedTelegramId,
    card,
    numbers: getCardNumbers(card),
    markedNumbers: [],
    betAmount: amount,
    isWinner: false,
  });

  await ticket.save();

  game.players.push({
    telegramId: normalizedTelegramId,

    username: user.username || user.firstName || "Player",

    firstName: user.firstName || "Player",

    card,

    markedNumbers: [],

    selectedLuckyNumbers,

    betAmount: amount,

    isSpectator: false,

    hasBingo: false,

    bingoTime: null,
  });

  if (lucky !== null) {
    game.selectedNumbers = normalizeSelectedNumbers([
      ...game.selectedNumbers,
      lucky,
    ]);
  }

  game.playerCount = game.players.filter(
    (player) => !player.isSpectator,
  ).length;

  if (!game.roundSummary) {
    game.roundSummary = {};
  }

  game.roundSummary.playerCount = game.playerCount;

  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

  game.roundSummary.totalBetAmount = game.players.reduce(
    (sum, player) => sum + Number(player.betAmount || 0),
    0,
  );

  await saveWithRetry(game);

  return {
    game,
    ticket,
    user: {
      balance: user.balance,
      firstName: user.firstName,
    },
  };
};

/* ============================================================
   SPECTATOR
============================================================ */

export const joinAsSpectator = async (gameId, telegramId) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "active") {
    throw new Error("Spectators can only join during the live game.");
  }

  const user = await User.findOne({
    telegramId: normalizedTelegramId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existing = game.players.find(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  if (!existing) {
    game.players.push({
      telegramId: normalizedTelegramId,

      username: user.username || user.firstName || "Spectator",

      firstName: user.firstName || "Spectator",

      card: [],

      markedNumbers: [],

      selectedLuckyNumbers: [],

      betAmount: 0,

      isSpectator: true,

      hasBingo: false,
    });

    await saveWithRetry(game);
  }

  return {
    game,
    user: {
      balance: user.balance,
      firstName: user.firstName,
    },

    isSpectator: true,
  };
};

/* ============================================================
   CALL NUMBER
============================================================ */

export const callNumber = async (gameId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "active") {
    throw new Error("Game is not active");
  }

  // NEVER exceed 75
  if (game.calledNumbers.length >= MAX_BINGO_NUMBER) {
    return null;
  }

  const availableNumbers = [];

  for (let number = 1; number <= 75; number++) {
    if (!game.calledNumbers.includes(number)) {
      availableNumbers.push(number);
    }
  }

  if (availableNumbers.length === 0) {
    return null;
  }

  const number =
    availableNumbers[Math.floor(Math.random() * availableNumbers.length)];

  game.calledNumbers.push(number);

  game.currentNumber = number;

  game.lastCalledAt = new Date();

  /* ========================================================
       AUTOMATICALLY MARK ALL PLAYERS
    ======================================================== */

  const winners = [];

  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];

    // Spectators have no card
    if (player.isSpectator) {
      continue;
    }

    if (!Array.isArray(player.card) || player.card.length !== 5) {
      continue;
    }

    const exists = checkNumberOnCard(player.card, number);

    if (exists.found) {
      if (!player.markedNumbers.includes(number)) {
        player.markedNumbers.push(number);
      }
    }

    const bingoResult = checkBingo(player.card, player.markedNumbers);

    if (bingoResult.bingo && !player.hasBingo) {
      player.hasBingo = true;

      player.bingoTime = new Date();

      const winAmount = Number(player.betAmount || 0) * 5;

      winners.push({
        telegramId: player.telegramId,

        username: player.username,

        firstName: player.firstName,

        winAmount,

        bingoResult,

        // ⭐ WINNER CARD
        card: player.card,

        markedNumbers: player.markedNumbers,
      });
    }
  }

  /* ========================================================
       WINNER
    ======================================================== */

  if (winners.length > 0) {
    const firstWinner = winners[0];

    game.status = "completed";

    game.roundEndedAt = new Date();

    game.endTime = new Date();

    game.winner = {
      telegramId: firstWinner.telegramId,

      username: firstWinner.username,

      firstName: firstWinner.firstName,

      winAmount: firstWinner.winAmount,

      card: firstWinner.card,

      markedNumbers: firstWinner.markedNumbers,
    };

    if (!game.roundSummary) {
      game.roundSummary = {};
    }

    game.roundSummary.endedReason = "bingo";

    game.roundSummary.calledNumbersCount = game.calledNumbers.length;

    game.roundSummary.winnerTelegramId = firstWinner.telegramId;

    game.roundSummary.winnerUsername = firstWinner.username;

    game.roundSummary.winnerAmount = firstWinner.winAmount;

    // Pay all winners
    for (const winner of winners) {
      const user = await User.findOne({
        telegramId: normalizeTelegramId(winner.telegramId),
      });

      if (user) {
        user.balance += winner.winAmount;

        user.bingoGames = Number(user.bingoGames || 0) + 1;

        user.bingoWins = Number(user.bingoWins || 0) + 1;

        user.gamesPlayed = Number(user.gamesPlayed || 0) + 1;

        user.gamesWon = Number(user.gamesWon || 0) + 1;

        await user.save();
      }

      const ticket = await BingoTicket.findOne({
        gameId,
        telegramId: normalizeTelegramId(winner.telegramId),
      });

      if (ticket) {
        ticket.isWinner = true;

        ticket.winAmount = winner.winAmount;

        await ticket.save();
      }
    }
  }

  if (!game.roundSummary) {
    game.roundSummary = {};
  }

  game.roundSummary.calledNumbersCount = game.calledNumbers.length;

  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

  await saveWithRetry(game);

  return {
    number,

    calledNumbers: game.calledNumbers,

    currentNumber: number,

    winners,

    gameEnded: winners.length > 0,
  };
};

/* ============================================================
   MARK NUMBER
============================================================ */

export const markNumber = async (gameId, telegramId, number) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const player = game.players.find(
    (p) => normalizeTelegramId(p.telegramId) === normalizedTelegramId,
  );

  if (!player) {
    throw new Error("Player not in game");
  }

  if (player.isSpectator) {
    throw new Error("Spectators cannot mark numbers");
  }

  if (!game.calledNumbers.includes(Number(number))) {
    throw new Error("Number has not been called");
  }

  const result = checkNumberOnCard(player.card, Number(number));

  if (!result.found) {
    throw new Error("Number not on card");
  }

  if (player.markedNumbers.includes(Number(number))) {
    throw new Error("Number already marked");
  }

  player.markedNumbers.push(Number(number));

  const bingoResult = checkBingo(player.card, player.markedNumbers);

  if (bingoResult.bingo) {
    const winAmount = Number(player.betAmount || 0) * 5;

    game.status = "completed";

    game.endTime = new Date();

    game.roundEndedAt = new Date();

    game.winner = {
      telegramId: player.telegramId,

      username: player.username,

      firstName: player.firstName,

      winAmount,

      card: player.card,

      markedNumbers: player.markedNumbers,
    };

    await saveWithRetry(game);

    const user = await User.findOne({
      telegramId: normalizedTelegramId,
    });

    if (user) {
      user.balance += winAmount;

      user.bingoGames = Number(user.bingoGames || 0) + 1;

      user.bingoWins = Number(user.bingoWins || 0) + 1;

      user.gamesPlayed = Number(user.gamesPlayed || 0) + 1;

      user.gamesWon = Number(user.gamesWon || 0) + 1;

      await user.save();
    }

    const ticket = await BingoTicket.findOne({
      gameId,
      telegramId: normalizedTelegramId,
    });

    if (ticket) {
      ticket.isWinner = true;

      ticket.winAmount = winAmount;

      await ticket.save();
    }

    return {
      marked: true,

      bingo: true,

      bingoResult,

      winner: game.winner,

      markedNumbers: player.markedNumbers,

      game,
    };
  }

  await saveWithRetry(game);

  return {
    marked: true,

    bingo: false,

    number,

    markedNumbers: player.markedNumbers,
  };
};

/* ============================================================
   START GAME
============================================================ */

export const startGame = async (gameId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "waiting") {
    throw new Error("Game already started");
  }

  const realPlayers = game.players.filter((player) => !player.isSpectator);

  if (realPlayers.length === 0) {
    throw new Error("At least one player must select a card");
  }

  game.status = "active";

  game.selectionEndsAt = null;

  game.startTime = new Date();

  game.roundStartedAt = new Date();

  game.playerCount = realPlayers.length;

  await saveWithRetry(game);

  return game;
};

/* ============================================================
   GET GAME STATE
============================================================ */

export const getGameState = async (gameId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  return game;
};

/* ============================================================
   GET PLAYER CARD
============================================================ */

export const getPlayerCard = async (gameId, telegramId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const player = game.players.find(
    (p) => normalizeTelegramId(p.telegramId) === normalizedTelegramId,
  );

  if (!player) {
    throw new Error("Player not in game");
  }

  return {
    card: player.card,

    markedNumbers: player.markedNumbers,

    isSpectator: Boolean(player.isSpectator),
  };
};

/* ============================================================
   SOCKET HANDLERS
============================================================ */

export const initBingoSocket = (io) => {
  console.log("🎮 Initializing Bingo Socket Handlers...");

  io.on("connection", async (socket) => {
    console.log(`\n🎯 [BINGO CLIENT CONNECTED] ${socket.id}`);

    // Emit current round state if one exists
    try {
      const currentGame = await BingoGame.findOne({
        status: { $in: ["waiting", "active"] },
      })
        .sort({ updatedAt: -1 })
        .lean();

      if (currentGame) {
        const remainingSeconds = BingoRoundManager.getRemainingSeconds(
          currentGame.selectionEndsAt,
        );
        socket.emit("bingo:roundState", {
          gameId: currentGame.gameId,
          roomId: currentGame.roomId,
          status: BingoRoundManager.normalizeStatus(currentGame.status),
          remainingSeconds,
          playerCount: currentGame.playerCount ?? 0,
          selectedNumbers: currentGame.selectedNumbers ?? [],
          calledNumbers: currentGame.calledNumbers ?? [],
          currentNumber: currentGame.currentNumber ?? null,
        });
      }
    } catch (error) {
      console.warn("Unable to fetch current round state:", error.message);
    }

    // ============================================================
    // CREATE ROOM (First player starts a new game)
    // ============================================================
    socket.on("createRoom", async (data, callback) => {
      try {
        console.log(`📢 [CREATE ROOM] roomId: ${data?.roomId || "Main"}`);

        const { roomId = "Main Room" } = data;

        socket.join(roomId);

        // Initialize new round
        const game = await BingoRoundManager.initializeNewRound(io, roomId);

        socket.emit("roomCreated", {
          success: true,
          gameId: game.gameId,
          roomId: game.roomId,
          message: `Room created successfully!`,
        });

        if (typeof callback === "function") {
          callback({
            success: true,
            gameId: game.gameId,
            roomId: game.roomId,
          });
        }
      } catch (error) {
        console.error("Create Room Error:", error.message);
        const response = {
          success: false,
          message: error.message || "Failed to create room",
        };

        if (typeof callback === "function") return callback(response);
        socket.emit("error", response);
      }
    });

    // ============================================================
    // JOIN ROOM (Player joins and selects a lucky number)
    // ============================================================
    socket.on("joinRoom", async (data, callback) => {
      try {
        const { gameId, telegramId, betAmount, luckyNumber = null } = data;

        if (!gameId || !telegramId) {
          throw new Error("GameId and TelegramId are required");
        }

        const result = await joinBingoGame(
          gameId,
          telegramId,
          betAmount,
          luckyNumber,
        );

        socket.join(result.game.roomId);

        socket.emit("joinedRoom", {
          success: true,
          gameId: result.game.gameId,
          roomId: result.game.roomId,
          card: result.ticket?.card || null,
          ticketId: result.ticket?.ticketId || null,
          balance: result.user.balance,
          currentPlayers: result.game.playerCount,
          selectedNumbers: result.game.selectedNumbers || [],
        });

        // Broadcast updated state to all players in room
        const currentGame = await getGameState(result.game.gameId);
        BingoRoundManager.emitRoundState(io, result.game.roomId, currentGame, {
          status: "WAITING",
        });

        if (typeof callback === "function") {
          callback({
            success: true,
            gameId: result.game.gameId,
            roomId: result.game.roomId,
            selectedNumbers: currentGame.selectedNumbers || [],
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

    // ============================================================
    // MARK NUMBER (Player marks a number on their card)
    // ============================================================
    socket.on("markNumber", async (data, callback) => {
      try {
        const { gameId, telegramId, number } = data;

        if (!gameId || !telegramId || !number) {
          throw new Error("GameId, TelegramId, and Number are required");
        }

        const result = await markNumber(gameId, telegramId, number);

        socket.emit("numberMarked", {
          success: true,
          number,
          marked: result.marked,
          bingo: result.bingo,
          markedNumbers: result.markedNumbers,
        });

        if (result.bingo) {
          // Game won! Finish the round
          await BingoRoundManager.finishRound(io, gameId, result.game.roomId);
        }

        if (typeof callback === "function") {
          callback({
            success: true,
            marked: result.marked,
            bingo: result.bingo,
          });
        }
      } catch (error) {
        console.error("MARK NUMBER ERROR:", error.message);
        const response = {
          success: false,
          message: error.message || "Failed to mark number",
        };

        if (typeof callback === "function") return callback(response);
        socket.emit("error", response);
      }
    });

    // ============================================================
    // DISCONNECT
    // ============================================================
    socket.on("disconnect", (reason) => {
      console.log(
        `❌ [BINGO CLIENT DISCONNECTED] ${socket.id} | Reason: ${reason}`,
      );
    });
  });
};
