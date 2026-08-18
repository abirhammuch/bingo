import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";

/* =========================================================
   CONSTANTS
========================================================= */

const COLUMN_RANGES = [
  { min: 1, max: 15 },
  { min: 16, max: 30 },
  { min: 31, max: 45 },
  { min: 46, max: 60 },
  { min: 61, max: 75 },
];

/* =========================================================
   HELPERS
========================================================= */

export const normalizeTelegramId = (telegramId) => {
  if (telegramId === null || telegramId === undefined) {
    return "";
  }

  return String(telegramId).trim();
};

export const saveWithRetry = async (document, maxRetries = 3) => {
  let retries = maxRetries;

  while (retries > 0) {
    try {
      return await document.save();
    } catch (error) {
      if (error.name === "VersionError" && retries > 1) {
        retries -= 1;

        await new Promise((resolve) => setTimeout(resolve, 20));
      } else {
        throw error;
      }
    }
  }
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

const normalizeSelectedNumbers = (numbers = []) => {
  return [
    ...new Set(
      numbers
        .map((number) => normalizeNumber(number))
        .filter((number) => number !== null),
    ),
  ].sort((a, b) => a - b);
};

/* =========================================================
   BINGO CARD
========================================================= */

export const generateBingoCard = (forcedNumber = null) => {
  const card = Array.from({ length: 5 }, () => Array(5).fill(null));

  for (let column = 0; column < 5; column += 1) {
    const { min, max } = COLUMN_RANGES[column];

    const numbers = [];

    for (let number = min; number <= max; number += 1) {
      numbers.push(number);
    }

    // Shuffle
    for (let i = numbers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));

      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    for (let row = 0; row < 5; row += 1) {
      card[row][column] = numbers[row];
    }
  }

  // FREE
  card[2][2] = 0;

  /*
   * Put selected/lucky number on card if supplied.
   */
  if (forcedNumber !== null) {
    const number = normalizeNumber(forcedNumber);

    if (number !== null) {
      const column = COLUMN_RANGES.findIndex(
        (range) => number >= range.min && number <= range.max,
      );

      if (column !== -1) {
        const possibleRows = [0, 1, 3, 4];

        const row =
          possibleRows[Math.floor(Math.random() * possibleRows.length)];

        card[row][column] = number;
      }
    }
  }

  return card;
};

/* =========================================================
   CARD HELPERS
========================================================= */

export const getCardNumbers = (card) => {
  const numbers = [];

  if (!Array.isArray(card)) {
    return numbers;
  }

  for (const row of card) {
    for (const cell of row) {
      if (cell !== 0 && cell !== null) {
        numbers.push(Number(cell));
      }
    }
  }

  return numbers;
};

export const checkNumberOnCard = (card, number) => {
  if (!Array.isArray(card)) {
    return {
      found: false,
    };
  }

  const normalizedNumber = normalizeNumber(number);

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 5; column += 1) {
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
   BINGO CHECK
========================================================= */

export const checkBingo = (card, markedNumbers = []) => {
  if (!Array.isArray(card) || card.length !== 5) {
    return {
      bingo: false,
    };
  }

  const markedSet = new Set(markedNumbers.map(Number));

  const isMarked = (number) => {
    return number === 0 || markedSet.has(Number(number));
  };

  // ROWS
  for (let row = 0; row < 5; row += 1) {
    if (card[row].every((number) => isMarked(number))) {
      return {
        bingo: true,
        type: "row",
        position: row,
      };
    }
  }

  // COLUMNS
  for (let column = 0; column < 5; column += 1) {
    const columnValues = card.map((row) => row[column]);

    if (columnValues.every((number) => isMarked(number))) {
      return {
        bingo: true,
        type: "column",
        position: column,
      };
    }
  }

  // DIAGONAL 1
  const diagonalOne = [];

  for (let i = 0; i < 5; i += 1) {
    diagonalOne.push(card[i][i]);
  }

  if (diagonalOne.every((number) => isMarked(number))) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-left-to-bottom-right",
    };
  }

  // DIAGONAL 2
  const diagonalTwo = [];

  for (let i = 0; i < 5; i += 1) {
    diagonalTwo.push(card[i][4 - i]);
  }

  if (diagonalTwo.every((number) => isMarked(number))) {
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
  const gameId = uuidv4();

  const previousRounds = await BingoGame.countDocuments({
    roomId,
  });

  const roundNumber = previousRounds + 1;

  const selectionEndsAt = new Date(Date.now() + 30 * 1000);

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

    winner: null,

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
   JOIN PLAYER
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

  /*
   * IMPORTANT:
   * Players can ONLY join while WAITING.
   */
  if (game.status !== "waiting") {
    throw new Error(
      "Selection time has ended. You can only spectate this round.",
    );
  }

  if (
    game.selectionEndsAt &&
    new Date(game.selectionEndsAt).getTime() <= Date.now()
  ) {
    throw new Error(
      "Selection time has ended. You can only spectate this round.",
    );
  }

  if (
    game.players.filter((player) => !player.isSpectator).length >=
    game.maxPlayers
  ) {
    throw new Error("Game is full");
  }

  const user = await User.findOne({
    telegramId: normalizedTelegramId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const amount = Number(betAmount);

  if (!Number.isFinite(amount)) {
    throw new Error("Invalid bet amount");
  }

  if (amount < game.minBet) {
    throw new Error(`Minimum bet is ${game.minBet}`);
  }

  if (amount > game.maxBet) {
    throw new Error(`Maximum bet is ${game.maxBet}`);
  }

  /*
   * Prevent duplicate player.
   */
  const existingPlayer = game.players.find(
    (player) =>
      normalizeTelegramId(player.telegramId) === normalizedTelegramId &&
      !player.isSpectator,
  );

  if (existingPlayer) {
    return {
      game,
      ticket: await BingoTicket.findOne({
        gameId,
        telegramId: normalizedTelegramId,
      }),
      user: {
        balance: user.balance,
        firstName: user.firstName,
      },
      isExistingPlayer: true,
    };
  }

  /*
   * Remove spectator record if this user was
   * previously spectating before selecting.
   */
  game.players = game.players.filter(
    (player) =>
      !(
        normalizeTelegramId(player.telegramId) === normalizedTelegramId &&
        player.isSpectator
      ),
  );

  if (user.balance < amount) {
    throw new Error("Insufficient balance");
  }

  /*
   * Selected/lucky number.
   */
  let selectedNumber = null;

  if (luckyNumber !== null && luckyNumber !== undefined && luckyNumber !== "") {
    selectedNumber = normalizeNumber(luckyNumber);

    if (selectedNumber === null) {
      throw new Error("Lucky number must be between 1 and 75");
    }

    /*
     * A lucky number can only be selected once
     * globally in this round.
     */
    if (game.selectedNumbers.includes(selectedNumber)) {
      throw new Error(
        "This number has already been selected by another player",
      );
    }
  }

  /*
   * Deduct balance.
   */
  user.balance -= amount;

  await user.save();

  /*
   * Generate card.
   */
  const card = generateBingoCard(selectedNumber);

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

  /*
   * Add selected number globally.
   */
  if (selectedNumber !== null) {
    game.selectedNumbers = normalizeSelectedNumbers([
      ...(game.selectedNumbers || []),
      selectedNumber,
    ]);
  }

  /*
   * Add player.
   */
  game.players.push({
    telegramId: normalizedTelegramId,

    username: user.username || user.firstName || "Player",

    firstName: user.firstName || "Player",

    card,

    markedNumbers: [],

    selectedLuckyNumbers: selectedNumber !== null ? [selectedNumber] : [],

    betAmount: amount,

    isSpectator: false,

    hasBingo: false,
  });

  game.playerCount = game.players.filter(
    (player) => !player.isSpectator,
  ).length;

  game.roundSummary.playerCount = game.playerCount;

  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

  game.roundSummary.totalBetAmount = game.players.reduce(
    (sum, player) =>
      sum + (player.isSpectator ? 0 : Number(player.betAmount || 0)),
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
    isExistingPlayer: false,
  };
};

/* =========================================================
   SPECTATOR
========================================================= */

export const joinAsSpectator = async (gameId, telegramId) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "active" && game.status !== "waiting") {
    throw new Error("This round has already finished.");
  }

  const user = await User.findOne({
    telegramId: normalizedTelegramId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existingPlayer = game.players.find(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  /*
   * Already a real player.
   */
  if (existingPlayer && !existingPlayer.isSpectator) {
    return {
      game,
      user: {
        balance: user.balance,
        firstName: user.firstName,
      },
      isSpectator: false,
    };
  }

  /*
   * Already spectator.
   */
  if (existingPlayer?.isSpectator) {
    return {
      game,
      user: {
        balance: user.balance,
        firstName: user.firstName,
      },
      isSpectator: true,
    };
  }

  /*
   * Add spectator.
   */
  game.players.push({
    telegramId: normalizedTelegramId,

    username: user.username || user.firstName || "Spectator",

    firstName: user.firstName || "Spectator",

    lastName: user.lastName || "",

    card: [],

    markedNumbers: [],

    selectedLuckyNumbers: [],

    betAmount: 0,

    isSpectator: true,

    hasBingo: false,
  });

  await saveWithRetry(game);

  return {
    game,
    user: {
      balance: user.balance,
      firstName: user.firstName,
    },
    isSpectator: true,
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
    throw new Error("Game is not waiting for players");
  }

  /*
   * At least ONE player must exist.
   */
  const realPlayers = game.players.filter((player) => !player.isSpectator);

  if (realPlayers.length === 0) {
    throw new Error("No players selected a card");
  }

  game.status = "active";

  game.selectionEndsAt = null;

  game.startTime = new Date();

  game.roundStartedAt = new Date();

  game.playerCount = realPlayers.length;

  game.roundSummary.playerCount = realPlayers.length;

  await saveWithRetry(game);

  return game;
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

  const availableNumbers = [];

  for (let number = 1; number <= 75; number += 1) {
    if (!game.calledNumbers.includes(number)) {
      availableNumbers.push(number);
    }
  }

  if (availableNumbers.length === 0) {
    game.status = "completed";
    game.roundEndedAt = new Date();
    game.endTime = new Date();

    game.roundSummary.endedReason = "all_numbers_called";

    await saveWithRetry(game);

    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableNumbers.length);

  const number = availableNumbers[randomIndex];

  game.calledNumbers.push(number);

  game.currentNumber = number;

  game.lastCalledAt = new Date();

  game.roundSummary.calledNumbersCount = game.calledNumbers.length;

  /*
   * Automatically mark the called number
   * on every player's card.
   *
   * Spectators are ignored.
   */
  const winners = [];

  for (let index = 0; index < game.players.length; index += 1) {
    const player = game.players[index];

    if (player.isSpectator) {
      continue;
    }

    const found = checkNumberOnCard(player.card, number);

    if (!found.found) {
      continue;
    }

    if (!player.markedNumbers.includes(number)) {
      player.markedNumbers.push(number);
    }

    const bingoResult = checkBingo(player.card, player.markedNumbers);

    if (bingoResult.bingo && !player.hasBingo) {
      player.hasBingo = true;

      player.bingoTime = new Date();

      winners.push({
        player,
        bingoResult,
      });
    }
  }

  await saveWithRetry(game);

  /*
   * WINNER DETECTED
   */
  if (winners.length > 0) {
    game.status = "completed";

    game.roundEndedAt = new Date();

    game.endTime = new Date();

    game.roundSummary.endedReason = "bingo";

    /*
     * First winner.
     */
    const winnerData = winners[0];

    const winner = winnerData.player;

    const winAmount = Number(winner.betAmount || 0) * 5;

    game.winner = {
      telegramId: winner.telegramId,

      username: winner.username,

      firstName: winner.firstName,

      winAmount,

      card: winner.card,

      markedNumbers: winner.markedNumbers,

      bingoResult: winnerData.bingoResult,
    };

    game.roundSummary.winnerTelegramId = winner.telegramId;

    game.roundSummary.winnerUsername = winner.username;

    game.roundSummary.winnerAmount = winAmount;

    /*
     * Pay all winners.
     */
    for (const winnerData of winners) {
      const player = winnerData.player;

      const amount = Number(player.betAmount || 0) * 5;

      const user = await User.findOne({
        telegramId: normalizeTelegramId(player.telegramId),
      });

      if (user) {
        user.balance += amount;

        user.bingoGames = Number(user.bingoGames || 0) + 1;

        user.bingoWins = Number(user.bingoWins || 0) + 1;

        user.gamesPlayed = Number(user.gamesPlayed || 0) + 1;

        user.gamesWon = Number(user.gamesWon || 0) + 1;

        await user.save();
      }

      const ticket = await BingoTicket.findOne({
        gameId,
        telegramId: normalizeTelegramId(player.telegramId),
      });

      if (ticket) {
        ticket.isWinner = true;

        ticket.winAmount = amount;

        ticket.markedNumbers = player.markedNumbers;

        await ticket.save();
      }
    }

    await saveWithRetry(game);

    return {
      number,

      calledNumbers: game.calledNumbers,

      gameEnded: true,

      winner: game.winner,

      winners: winners.map((winnerData) => ({
        telegramId: winnerData.player.telegramId,

        username: winnerData.player.username,

        firstName: winnerData.player.firstName,

        winAmount: Number(winnerData.player.betAmount || 0) * 5,

        card: winnerData.player.card,

        markedNumbers: winnerData.player.markedNumbers,

        bingoResult: winnerData.bingoResult,
      })),
    };
  }

  return {
    number,

    calledNumbers: game.calledNumbers,

    gameEnded: false,

    winners: [],
  };
};

/* =========================================================
   MANUAL MARK
========================================================= */

export const markNumber = async (gameId, telegramId, number) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "active") {
    throw new Error("Game is not active");
  }

  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const player = game.players.find(
    (item) =>
      normalizeTelegramId(item.telegramId) === normalizedTelegramId &&
      !item.isSpectator,
  );

  if (!player) {
    throw new Error("Player not found");
  }

  const normalizedNumber = normalizeNumber(number);

  if (normalizedNumber === null) {
    throw new Error("Invalid number");
  }

  if (!game.calledNumbers.includes(normalizedNumber)) {
    throw new Error("Number has not been called");
  }

  if (!checkNumberOnCard(player.card, normalizedNumber).found) {
    throw new Error("Number not on card");
  }

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

  /*
   * Winner.
   */
  const winAmount = Number(player.betAmount || 0) * 5;

  game.status = "completed";

  game.roundEndedAt = new Date();

  game.endTime = new Date();

  game.winner = {
    telegramId: player.telegramId,

    username: player.username,

    firstName: player.firstName,

    winAmount,

    card: player.card,

    markedNumbers: player.markedNumbers,

    bingoResult,
  };

  game.roundSummary.endedReason = "bingo";

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

    ticket.markedNumbers = player.markedNumbers;

    await ticket.save();
  }

  await saveWithRetry(game);

  return {
    marked: true,

    bingo: true,

    number: normalizedNumber,

    markedNumbers: player.markedNumbers,

    bingoResult,

    winner: game.winner,

    game,
  };
};

/* =========================================================
   GAME STATE
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
   PLAYER CARD
========================================================= */

export const getPlayerCard = async (gameId, telegramId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const player = game.players.find(
    (item) =>
      normalizeTelegramId(item.telegramId) === normalizedTelegramId &&
      !item.isSpectator,
  );

  if (!player) {
    throw new Error("Player not found");
  }

  return {
    card: player.card,

    markedNumbers: player.markedNumbers,

    isSpectator: false,
  };
};
