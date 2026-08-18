import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";

export const MAX_BINGO_NUMBERS = 75;
export const SELECTION_DURATION_SECONDS = 30;

/* =========================================================
   HELPERS
========================================================= */

export const normalizeTelegramId = (telegramId) => {
  if (telegramId === null || telegramId === undefined) {
    return "";
  }

  return String(telegramId).trim();
};

const normalizeNumber = (number) => {
  const value = Number(number);

  if (!Number.isInteger(value)) {
    return null;
  }

  if (value < 1 || value > 75) {
    return null;
  }

  return value;
};

const shuffle = (array) => {
  const values = [...array];

  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [values[i], values[j]] = [values[j], values[i]];
  }

  return values;
};

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

  throw new Error("Failed to save document");
};

/* =========================================================
   CARD GENERATION
========================================================= */

export const generateBingoCard = () => {
  const columns = [
    { min: 1, max: 15 },
    { min: 16, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 75 },
  ];

  const card = Array.from({ length: 5 }, () => Array(5).fill(0));

  for (let column = 0; column < 5; column++) {
    const numbers = [];

    for (
      let number = columns[column].min;
      number <= columns[column].max;
      number++
    ) {
      numbers.push(number);
    }

    const selected = shuffle(numbers).slice(0, 5);

    for (let row = 0; row < 5; row++) {
      card[row][column] = selected[row];
    }
  }

  // FREE center
  card[2][2] = 0;

  return card;
};

/* =========================================================
   CARD NUMBERS
========================================================= */

export const getCardNumbers = (card) => {
  if (!Array.isArray(card)) {
    return [];
  }

  return card.flat().filter((number) => number !== 0);
};

/* =========================================================
   CHECK NUMBER
========================================================= */

export const checkNumberOnCard = (card, number) => {
  const normalizedNumber = normalizeNumber(number);

  if (!Array.isArray(card) || normalizedNumber === null) {
    return {
      found: false,
    };
  }

  for (let row = 0; row < 5; row++) {
    for (let column = 0; column < 5; column++) {
      if (Number(card[row][column]) === normalizedNumber) {
        return {
          found: true,
          row,
          column,
        };
      }
    }
  }

  return {
    found: false,
  };
};

/* =========================================================
   CHECK BINGO
========================================================= */

export const checkBingo = (card, markedNumbers = []) => {
  if (!Array.isArray(card) || card.length !== 5) {
    return {
      bingo: false,
    };
  }

  const markedSet = new Set(markedNumbers.map(Number));

  const isMarked = (number) => {
    // FREE center
    if (number === 0 || number === "FREE") {
      return true;
    }

    return markedSet.has(Number(number));
  };

  // Rows
  for (let row = 0; row < 5; row++) {
    if (card[row].every(isMarked)) {
      return {
        bingo: true,
        type: "row",
        position: row,
      };
    }
  }

  // Columns
  for (let column = 0; column < 5; column++) {
    const columnValues = card.map((row) => row[column]);

    if (columnValues.every(isMarked)) {
      return {
        bingo: true,
        type: "column",
        position: column,
      };
    }
  }

  // Diagonal \
  const diagonalOne = [];

  for (let i = 0; i < 5; i++) {
    diagonalOne.push(card[i][i]);
  }

  if (diagonalOne.every(isMarked)) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-left-to-bottom-right",
    };
  }

  // Diagonal /
  const diagonalTwo = [];

  for (let i = 0; i < 5; i++) {
    diagonalTwo.push(card[i][4 - i]);
  }

  if (diagonalTwo.every(isMarked)) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-right-to-bottom-left",
    };
  }

  return {
    bingo: false,
  };
};

/* =========================================================
   CREATE GAME
========================================================= */

export const createBingoGame = async (
  roomId,
  maxPlayers = 100,
  minBet = 1,
  maxBet = 100,
) => {
  if (!roomId) {
    throw new Error("roomId is required");
  }

  const gameId = uuidv4();

  const previousGames = await BingoGame.countDocuments({
    roomId,
  });

  const roundNumber = previousGames + 1;

  const selectionEndsAt = new Date(
    Date.now() + SELECTION_DURATION_SECONDS * 1000,
  );

  const game = new BingoGame({
    gameId,
    roomId,

    status: "waiting",

    roundNumber,

    maxPlayers,
    minBet,
    maxBet,

    players: [],

    playerCount: 0,

    selectedNumbers: [],

    calledNumbers: [],

    currentNumber: null,

    selectionEndsAt,

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

/* =========================================================
   JOIN GAME
========================================================= */

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
    throw new Error("Game already started");
  }

  const existingPlayerIndex = game.players.findIndex(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  const normalizedLuckyNumber = normalizeNumber(luckyNumber);

  /*
   * Existing player selecting another lucky number.
   */
  if (existingPlayerIndex !== -1) {
    const player = game.players[existingPlayerIndex];

    player.selectedLuckyNumbers = player.selectedLuckyNumbers || [];

    if (
      normalizedLuckyNumber !== null &&
      !game.selectedNumbers.includes(normalizedLuckyNumber)
    ) {
      player.selectedLuckyNumbers.push(normalizedLuckyNumber);

      game.selectedNumbers.push(normalizedLuckyNumber);

      game.selectedNumbers = [...new Set(game.selectedNumbers)].sort(
        (a, b) => a - b,
      );

      await saveWithRetry(game);
    }

    return {
      game,
      ticket: null,
      user: {
        balance: 0,
        firstName: player.firstName,
      },
    };
  }

  if (game.players.length >= game.maxPlayers) {
    throw new Error("Game is full");
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

  if (amount < game.minBet || amount > game.maxBet) {
    throw new Error(`Bet must be between ${game.minBet} and ${game.maxBet}`);
  }

  if (Number(user.balance) < amount) {
    throw new Error("Insufficient balance");
  }

  /*
   * Lucky number cannot be duplicated.
   */
  if (
    normalizedLuckyNumber !== null &&
    game.selectedNumbers.includes(normalizedLuckyNumber)
  ) {
    throw new Error("Lucky number already selected");
  }

  /*
   * Deduct stake.
   */
  user.balance -= amount;

  await user.save();

  /*
   * Generate card.
   */
  const card = generateBingoCard();

  /*
   * Put lucky number into card.
   */
  if (normalizedLuckyNumber !== null) {
    const columnIndex = Math.floor((normalizedLuckyNumber - 1) / 15);

    const possibleRows = [0, 1, 2, 3, 4].filter(
      (row) => !(row === 2 && columnIndex === 2),
    );

    const row = possibleRows[Math.floor(Math.random() * possibleRows.length)];

    card[row][columnIndex] = normalizedLuckyNumber;
  }

  /*
   * Create ticket.
   */
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

    winAmount: 0,
  });

  await ticket.save();

  /*
   * Add player.
   */
  game.players.push({
    telegramId: normalizedTelegramId,

    username: user.username || user.firstName || "Player",

    firstName: user.firstName || "Player",

    card,

    markedNumbers: [],

    selectedLuckyNumbers:
      normalizedLuckyNumber !== null ? [normalizedLuckyNumber] : [],

    betAmount: amount,

    hasBingo: false,
  });

  game.playerCount = game.players.length;

  if (normalizedLuckyNumber !== null) {
    game.selectedNumbers.push(normalizedLuckyNumber);

    game.selectedNumbers = [...new Set(game.selectedNumbers)].sort(
      (a, b) => a - b,
    );
  }

  if (game.roundSummary) {
    game.roundSummary.playerCount = game.players.length;

    game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

    game.roundSummary.totalBetAmount = game.players.reduce(
      (sum, player) => sum + Number(player.betAmount || 0),
      0,
    );
  }

  await saveWithRetry(game);

  return {
    game,

    ticket,

    user: {
      balance: user.balance,
      firstName: user.firstName,
      telegramId: normalizedTelegramId,
    },
  };
};

/* =========================================================
   START GAME
========================================================= */

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

  if (game.players.length < 1) {
    throw new Error("At least one player is required");
  }

  game.status = "active";

  game.startTime = new Date();

  game.roundStartedAt = game.roundStartedAt || new Date();

  game.calledNumbers = [];

  game.currentNumber = null;

  await saveWithRetry(game);

  return game;
};

/* =========================================================
   PAY WINNER
========================================================= */

const processWinner = async (game, player, bingoResult) => {
  const winAmount = Number(player.betAmount || 0) * 5;

  player.hasBingo = true;

  player.bingoTime = new Date();

  game.status = "completed";

  game.roundEndedAt = new Date();

  game.endTime = new Date();

  game.winner = {
    telegramId: player.telegramId,

    username: player.username,

    winAmount,
  };

  if (game.roundSummary) {
    game.roundSummary.playerCount = game.players.length;

    game.roundSummary.calledNumbersCount = game.calledNumbers.length;

    game.roundSummary.selectedNumbersCount = game.selectedNumbers?.length || 0;

    game.roundSummary.totalBetAmount = game.players.reduce(
      (sum, item) => sum + Number(item.betAmount || 0),
      0,
    );

    game.roundSummary.winnerTelegramId = player.telegramId;

    game.roundSummary.winnerUsername = player.username;

    game.roundSummary.winnerAmount = winAmount;

    game.roundSummary.endedReason = "bingo";
  }

  const user = await User.findOne({
    telegramId: normalizeTelegramId(player.telegramId),
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
    gameId: game.gameId,

    telegramId: normalizeTelegramId(player.telegramId),
  });

  if (ticket) {
    ticket.isWinner = true;

    ticket.winAmount = winAmount;

    ticket.markedNumbers = player.markedNumbers || [];

    await ticket.save();
  }

  await saveWithRetry(game);

  return {
    telegramId: player.telegramId,

    username: player.username,

    winAmount,

    bingoResult,
  };
};

/* =========================================================
   CALL NUMBER
========================================================= */

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

  const calledNumbers = Array.isArray(game.calledNumbers)
    ? game.calledNumbers
    : [];

  /*
   * CRITICAL:
   *
   * Maximum is 75.
   * NOT 30.
   */

  if (calledNumbers.length >= MAX_BINGO_NUMBERS) {
    game.status = "completed";

    game.endTime = new Date();

    game.roundEndedAt = new Date();

    if (game.roundSummary) {
      game.roundSummary.calledNumbersCount = calledNumbers.length;

      game.roundSummary.endedReason = "all_75_numbers_called";
    }

    await saveWithRetry(game);

    return {
      number: null,

      calledNumbers,

      winners: [],

      gameEnded: true,

      endedReason: "all_75_numbers_called",
    };
  }

  /*
   * Create remaining pool.
   */
  const remainingNumbers = [];

  for (let number = 1; number <= 75; number++) {
    if (!calledNumbers.includes(number)) {
      remainingNumbers.push(number);
    }
  }

  if (remainingNumbers.length === 0) {
    throw new Error("No remaining numbers");
  }

  /*
   * Random number.
   */
  const randomIndex = Math.floor(Math.random() * remainingNumbers.length);

  const number = remainingNumbers[randomIndex];

  /*
   * Add called number.
   */
  game.calledNumbers.push(number);

  game.currentNumber = number;

  game.lastCalledAt = new Date();

  /*
   * Check all players.
   */
  const winners = [];

  for (let index = 0; index < game.players.length; index++) {
    const player = game.players[index];

    if (!Array.isArray(player.markedNumbers)) {
      player.markedNumbers = [];
    }

    const exists = checkNumberOnCard(player.card, number);

    /*
     * Automatically mark called number.
     */
    if (exists.found) {
      if (!player.markedNumbers.includes(number)) {
        player.markedNumbers.push(number);
      }

      const bingoResult = checkBingo(player.card, player.markedNumbers);

      if (bingoResult.bingo && !player.hasBingo) {
        const winner = await processWinner(game, player, bingoResult);

        winners.push(winner);

        break;
      }
    }
  }

  /*
   * Winner found.
   */
  if (winners.length > 0) {
    return {
      number,

      currentNumber: number,

      calledNumbers: game.calledNumbers,

      winners,

      gameEnded: true,

      endedReason: "bingo",

      calledCount: game.calledNumbers.length,

      maxCalls: 75,
    };
  }

  /*
   * Save current state.
   */
  if (game.roundSummary) {
    game.roundSummary.calledNumbersCount = game.calledNumbers.length;
  }

  await saveWithRetry(game);

  /*
   * Number 75 reached without winner.
   */
  if (game.calledNumbers.length >= 75) {
    game.status = "completed";

    game.endTime = new Date();

    game.roundEndedAt = new Date();

    if (game.roundSummary) {
      game.roundSummary.calledNumbersCount = 75;

      game.roundSummary.endedReason = "all_75_numbers_called";
    }

    await saveWithRetry(game);

    return {
      number,

      currentNumber: number,

      calledNumbers: game.calledNumbers,

      winners: [],

      gameEnded: true,

      endedReason: "all_75_numbers_called",

      calledCount: 75,

      maxCalls: 75,
    };
  }

  /*
   * Continue game.
   */
  return {
    number,

    currentNumber: number,

    calledNumbers: game.calledNumbers,

    winners: [],

    gameEnded: false,

    endedReason: null,

    calledCount: game.calledNumbers.length,

    maxCalls: 75,
  };
};

/* =========================================================
   MARK NUMBER MANUALLY
========================================================= */

export const markNumber = async (gameId, telegramId, number) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const normalizedNumber = normalizeNumber(number);

  if (normalizedNumber === null) {
    throw new Error("Number must be between 1 and 75");
  }

  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const player = game.players.find(
    (item) => normalizeTelegramId(item.telegramId) === normalizedTelegramId,
  );

  if (!player) {
    throw new Error("Player not in game");
  }

  if (!game.calledNumbers.includes(normalizedNumber)) {
    throw new Error("Number has not been called");
  }

  const exists = checkNumberOnCard(player.card, normalizedNumber);

  if (!exists.found) {
    throw new Error("Number not on card");
  }

  player.markedNumbers = player.markedNumbers || [];

  if (player.markedNumbers.includes(normalizedNumber)) {
    throw new Error("Number already marked");
  }

  player.markedNumbers.push(normalizedNumber);

  await saveWithRetry(game);

  const bingoResult = checkBingo(player.card, player.markedNumbers);

  if (!bingoResult.bingo) {
    return {
      marked: true,

      bingo: false,

      number: normalizedNumber,

      markedNumbers: player.markedNumbers,
    };
  }

  const winner = await processWinner(game, player, bingoResult);

  return {
    marked: true,

    bingo: true,

    winner,

    game,

    calledNumbers: game.calledNumbers,
  };
};

/* =========================================================
   GET GAME STATE
========================================================= */

export const getGameState = async (gameId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  return game;
};

/* =========================================================
   GET PLAYER CARD
========================================================= */

export const getPlayerCard = async (gameId, telegramId) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const player = game.players.find(
    (item) => normalizeTelegramId(item.telegramId) === normalizedTelegramId,
  );

  if (!player) {
    throw new Error("Player not in game");
  }

  return {
    card: player.card,

    markedNumbers: player.markedNumbers || [],

    selectedLuckyNumbers: player.selectedLuckyNumbers || [],
  };
};
