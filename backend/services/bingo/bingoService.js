import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import CommissionSettings from "../../models/CommissionSettings.js";
import { v4 as uuidv4 } from "uuid";

export const SELECTION_TIME_SECONDS = 30;
export const CALL_INTERVAL_MS = 3000;

// ============================================================
// RETRY MONGOOSE VERSION CONFLICT
// ============================================================

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

// ============================================================
// TELEGRAM ID
// ============================================================

export const normalizeTelegramId = (telegramId) => {
  if (telegramId === null || telegramId === undefined) {
    return "";
  }

  return String(telegramId).trim();
};

// ============================================================
// NORMALIZE NUMBERS
// ============================================================

const normalizeSelectedNumbers = (numbers = []) => {
  const unique = [
    ...new Set(
      (numbers || [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value)),
    ),
  ];

  return unique.sort((a, b) => a - b);
};

// ============================================================
// REAL PLAYERS
// ============================================================

export const getRealPlayers = (game) => {
  return (game?.players || []).filter((player) => player.isSpectator !== true);
};

export const getSpectators = (game) => {
  return (game?.players || []).filter((player) => player.isSpectator === true);
};

// ============================================================
// CHECK IF SOMEONE SELECTED A CARD
// ============================================================

export const hasPlayerSelectedCard = (game) => {
  return getRealPlayers(game).some(
    (player) =>
      Array.isArray(player.selectedLuckyNumbers) &&
      player.selectedLuckyNumbers.length > 0,
  );
};

// ============================================================
// GENERATE BINGO CARD
// ============================================================

export const generateBingoCard = () => {
  const columns = [
    { min: 1, max: 15 },
    { min: 16, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 75 },
  ];

  const card = Array.from({ length: 5 }, () => Array(5).fill(0));

  for (let col = 0; col < 5; col++) {
    const availableNumbers = [];

    for (let number = columns[col].min; number <= columns[col].max; number++) {
      availableNumbers.push(number);
    }

    for (let row = 0; row < 5; row++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);

      card[row][col] = availableNumbers.splice(randomIndex, 1)[0];
    }
  }

  // FREE center
  card[2][2] = 0;

  return card;
};

// ============================================================
// GENERATE CARD WITH LUCKY NUMBER
// ============================================================

export const generateCardWithLuckyNumber = (luckyNumber) => {
  const number = Number(luckyNumber);

  if (!Number.isFinite(number) || number < 1 || number > 75) {
    return generateBingoCard();
  }

  const columns = [
    { min: 1, max: 15 },
    { min: 16, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 75 },
  ];

  const columnIndex = columns.findIndex(
    (column) => number >= column.min && number <= column.max,
  );

  if (columnIndex === -1) {
    return generateBingoCard();
  }

  const card = Array.from({ length: 5 }, () => Array(5).fill(0));

  for (let col = 0; col < 5; col++) {
    const availableNumbers = [];

    for (let n = columns[col].min; n <= columns[col].max; n++) {
      availableNumbers.push(n);
    }

    if (col === columnIndex) {
      const index = availableNumbers.indexOf(number);

      if (index !== -1) {
        availableNumbers.splice(index, 1);
      }
    }

    for (let row = 0; row < 5; row++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);

      card[row][col] = availableNumbers.splice(randomIndex, 1)[0];
    }
  }

  // FREE center
  card[2][2] = 0;

  // Put lucky number somewhere in its column.
  const possibleRows = [0, 1, 3, 4];

  const randomRow =
    possibleRows[Math.floor(Math.random() * possibleRows.length)];

  card[randomRow][columnIndex] = number;

  return card;
};

// ============================================================
// CARD NUMBERS
// ============================================================

export const getCardNumbers = (card) => {
  const numbers = [];

  if (!Array.isArray(card)) {
    return numbers;
  }

  for (const row of card) {
    for (const number of row) {
      if (number !== 0) {
        numbers.push(number);
      }
    }
  }

  return numbers;
};

// ============================================================
// CHECK NUMBER
// ============================================================

export const checkNumberOnCard = (card, number) => {
  if (!Array.isArray(card)) {
    return {
      found: false,
    };
  }

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

// ============================================================
// CHECK BINGO
// ROW / COLUMN / DIAGONAL
// ============================================================

export const checkBingo = (card, markedNumbers) => {
  if (!Array.isArray(card)) {
    return {
      bingo: false,
    };
  }

  const markedSet = new Set((markedNumbers || []).map(Number));

  // ----------------------------
  // ROWS
  // ----------------------------

  for (let row = 0; row < 5; row++) {
    const complete = card[row].every(
      (number) => number === 0 || markedSet.has(Number(number)),
    );

    if (complete) {
      return {
        bingo: true,
        type: "row",
        position: row,
      };
    }
  }

  // ----------------------------
  // COLUMNS
  // ----------------------------

  for (let col = 0; col < 5; col++) {
    let complete = true;

    for (let row = 0; row < 5; row++) {
      const number = card[row][col];

      if (number !== 0 && !markedSet.has(Number(number))) {
        complete = false;
        break;
      }
    }

    if (complete) {
      return {
        bingo: true,
        type: "column",
        position: col,
      };
    }
  }

  // ----------------------------
  // DIAGONAL 1
  // ----------------------------

  let diagonal1 = true;

  for (let i = 0; i < 5; i++) {
    const number = card[i][i];

    if (number !== 0 && !markedSet.has(Number(number))) {
      diagonal1 = false;
      break;
    }
  }

  if (diagonal1) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-left-to-bottom-right",
    };
  }

  // ----------------------------
  // DIAGONAL 2
  // ----------------------------

  let diagonal2 = true;

  for (let i = 0; i < 5; i++) {
    const number = card[i][4 - i];

    if (number !== 0 && !markedSet.has(Number(number))) {
      diagonal2 = false;
      break;
    }
  }

  if (diagonal2) {
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

// ============================================================
// CREATE GAME
// ============================================================

export const createBingoGame = async (
  roomId,
  maxPlayers = 10,
  minBet = 1,
  maxBet = 100,
) => {
  const lastGame = await BingoGame.findOne({
    roomId,
  }).sort({
    roundNumber: -1,
  });

  const roundNumber = lastGame ? Number(lastGame.roundNumber || 0) + 1 : 1;

  const gameId = uuidv4();

  const selectionEndsAt = new Date(Date.now() + SELECTION_TIME_SECONDS * 1000);

  const game = new BingoGame({
    gameId,
    roomId,

    status: "waiting",

    roundNumber,

    maxPlayers,
    minBet,
    maxBet,

    players: [],

    calledNumbers: [],

    selectedNumbers: [],

    currentNumber: null,

    selectionEndsAt,

    playerCount: 0,

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

// ============================================================
// JOIN BINGO GAME AS PLAYER
// ============================================================

export const joinBingoGame = async (
  gameId,
  telegramId,
  betAmount,
  luckyNumber = null,
) => {
  const incomingSelections = Array.isArray(luckyNumber)
    ? luckyNumber
    : luckyNumber === null || luckyNumber === undefined || luckyNumber === ""
      ? []
      : [luckyNumber];

  const normalizedLuckyNumbers = [
    ...new Set(
      incomingSelections
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => Number(value))
        .filter(
          (value) => Number.isInteger(value) && value >= 1 && value <= 300,
        ),
    ),
  ].sort((a, b) => a - b);

  if (normalizedLuckyNumbers.length > 3) {
    throw new Error("You can select maximum 3 numbers");
  }

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

  // Player can only join during selection
  if (game.status !== "waiting") {
    throw new Error("Selection time has ended. You can join as a spectator.");
  }

  // Check timer
  if (
    game.selectionEndsAt &&
    new Date(game.selectionEndsAt).getTime() <= Date.now()
  ) {
    throw new Error(
      "Selection time has ended. Please wait for the next round.",
    );
  }

  const realPlayers = getRealPlayers(game);

  if (realPlayers.length >= game.maxPlayers) {
    throw new Error("Game is full");
  }

  const user = await User.findOne({
    telegramId: normalizedTelegramId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existingPlayerIndex = game.players.findIndex(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  // ========================================================
  // EXISTING PLAYER
  // ========================================================

  if (existingPlayerIndex !== -1) {
    const existingPlayer = game.players[existingPlayerIndex];

    // If spectator wants to become player during selection
    if (existingPlayer.isSpectator === true) {
      existingPlayer.isSpectator = false;
      existingPlayer.betAmount = 0;
      existingPlayer.selectedLuckyNumbers = [];

      game.players[existingPlayerIndex] = existingPlayer;
    }

    if (normalizedLuckyNumbers.length > 0) {
      const alreadyTakenNumbers = normalizedLuckyNumbers.filter((number) =>
        (game.selectedNumbers || []).includes(number),
      );

      const numbersAlreadyOwnedByPlayer = (
        existingPlayer.selectedLuckyNumbers || []
      ).filter((number) => normalizedLuckyNumbers.includes(number));

      if (alreadyTakenNumbers.length > 0) {
        const duplicateNumbers = alreadyTakenNumbers.filter(
          (number) => !numbersAlreadyOwnedByPlayer.includes(number),
        );

        if (duplicateNumbers.length > 0) {
          throw new Error("This card number has already been selected.");
        }
      }

      existingPlayer.selectedLuckyNumbers = normalizeSelectedNumbers([
        ...(existingPlayer.selectedLuckyNumbers || []),
        ...normalizedLuckyNumbers,
      ]);

      game.selectedNumbers = normalizeSelectedNumbers([
        ...(game.selectedNumbers || []),
        ...normalizedLuckyNumbers,
      ]);

      game.players[existingPlayerIndex] = existingPlayer;
    }

    game.playerCount = getRealPlayers(game).length;

    game.roundSummary.playerCount = game.playerCount;

    game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

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

  // ========================================================
  // NEW PLAYER
  // ========================================================

  if (!betAmount || Number(betAmount) < game.minBet) {
    throw new Error(`Minimum bet is ${game.minBet}`);
  }

  if (Number(betAmount) > game.maxBet) {
    throw new Error(`Maximum bet is ${game.maxBet}`);
  }

  if (user.balance < Number(betAmount)) {
    throw new Error("Insufficient balance");
  }

  // ========================================================
  // LUCKY NUMBER
  // ========================================================

  if (normalizedLuckyNumbers.length > 0) {
    const alreadySelectedNumbers = normalizedLuckyNumbers.filter((number) =>
      (game.selectedNumbers || []).includes(number),
    );

    if (alreadySelectedNumbers.length > 0) {
      throw new Error("This card number has already been selected.");
    }
  }

  // ========================================================
  // DEDUCT BALANCE
  // ========================================================

  user.balance -= Number(betAmount);

  await user.save();

  // ========================================================
  // CREATE CARD
  // ========================================================

  const primaryLuckyNumber =
    normalizedLuckyNumbers.length > 0 ? normalizedLuckyNumbers[0] : null;

  const card =
    primaryLuckyNumber !== null
      ? generateCardWithLuckyNumber(primaryLuckyNumber)
      : generateBingoCard();

  // ========================================================
  // CREATE TICKET
  // ========================================================

  const ticketId = uuidv4();

  const ticket = new BingoTicket({
    ticketId,
    gameId,
    telegramId: normalizedTelegramId,

    card,

    numbers: getCardNumbers(card),

    markedNumbers: [],

    betAmount: Number(betAmount),

    isWinner: false,

    winAmount: 0,
  });

  await ticket.save();

  // ========================================================
  // ADD PLAYER
  // ========================================================

  game.players.push({
    telegramId: normalizedTelegramId,

    username: user.username || user.firstName || "Player",

    firstName: user.firstName || "Player",

    lastName: user.lastName || "",

    isSpectator: false,

    card,

    cards: [card],

    markedNumbers: [],

    selectedLuckyNumbers: normalizedLuckyNumbers,

    cardsSelected: normalizedLuckyNumbers.length || 0,

    hasBingo: false,

    betAmount: Number(betAmount),

    winAmount: 0,
  });

  // ========================================================
  // GLOBAL SELECTED NUMBER
  // ========================================================

  if (normalizedLuckyNumbers.length > 0) {
    game.selectedNumbers = normalizeSelectedNumbers([
      ...(game.selectedNumbers || []),
      ...normalizedLuckyNumbers,
    ]);
  }

  game.playerCount = getRealPlayers(game).length;

  game.roundSummary.playerCount = game.playerCount;

  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

  game.roundSummary.totalBetAmount = getRealPlayers(game).reduce(
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

// ============================================================
// JOIN AS SPECTATOR
// ============================================================

export const joinAsSpectator = async (gameId, telegramId) => {
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

  if (game.status !== "active") {
    throw new Error("Spectators can only join during the live game.");
  }

  const user = await User.findOne({
    telegramId: normalizedTelegramId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existingIndex = game.players.findIndex(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  // Already connected
  if (existingIndex !== -1) {
    return {
      game,
      user: {
        balance: user.balance,
        firstName: user.firstName,
      },
      isSpectator: game.players[existingIndex].isSpectator === true,
    };
  }

  // Add spectator
  game.players.push({
    telegramId: normalizedTelegramId,

    username: user.username || user.firstName || "Spectator",

    firstName: user.firstName || "Spectator",

    isSpectator: true,

    card: [],

    markedNumbers: [],

    selectedLuckyNumbers: [],

    cardsSelected: 0,

    hasBingo: false,

    betAmount: 0,

    winAmount: 0,
  });

  // IMPORTANT:
  // Spectators do NOT increase playerCount.
  game.playerCount = getRealPlayers(game).length;

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

// ============================================================
// START GAME
// ============================================================

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

  const realPlayers = getRealPlayers(game);

  // IMPORTANT:
  // Need at least one player who selected a card.
  const selectedPlayers = realPlayers.filter(
    (player) =>
      Array.isArray(player.selectedLuckyNumbers) &&
      player.selectedLuckyNumbers.length > 0,
  );

  if (selectedPlayers.length === 0) {
    return {
      noPlayers: true,
      game,
    };
  }

  game.status = "active";

  game.selectionEndsAt = null;

  game.startTime = new Date();

  game.roundStartedAt = new Date();

  game.playerCount = realPlayers.length;

  game.roundSummary.playerCount = realPlayers.length;

  game.roundSummary.calledNumbersCount = game.calledNumbers.length;

  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

  game.roundSummary.totalBetAmount = realPlayers.reduce(
    (sum, player) => sum + Number(player.betAmount || 0),
    0,
  );

  await saveWithRetry(game);

  return {
    noPlayers: false,
    game,
  };
};

// ============================================================
// CALL NUMBER
// ============================================================

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

  // ========================================================
  // REMAINING NUMBERS
  // ========================================================

  const remainingNumbers = [];

  for (let number = 1; number <= 75; number++) {
    if (!game.calledNumbers.includes(number)) {
      remainingNumbers.push(number);
    }
  }

  if (remainingNumbers.length === 0) {
    game.status = "completed";

    game.roundEndedAt = new Date();

    game.endTime = new Date();

    game.roundSummary.endedReason = "all_numbers_called";

    await saveWithRetry(game);

    return {
      number: null,
      calledNumbers: game.calledNumbers,
      gameEnded: true,
      winners: [],
      winner: null,
    };
  }

  // ========================================================
  // RANDOM NUMBER
  // ========================================================

  const randomIndex = Math.floor(Math.random() * remainingNumbers.length);

  const number = remainingNumbers[randomIndex];

  game.calledNumbers.push(number);

  game.currentNumber = number;

  game.lastCalledAt = new Date();

  // ========================================================
  // CHECK ALL REAL PLAYERS
  // ========================================================

  const winners = [];

  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];

    // Spectators cannot win
    if (player.isSpectator === true) {
      continue;
    }

    const playerCards =
      Array.isArray(player.cards) && player.cards.length > 0
        ? player.cards
        : player.card?.length
          ? [player.card]
          : [];

    if (playerCards.length === 0) {
      continue;
    }

    const matchingCard = playerCards.find(
      (card) => checkNumberOnCard(card, number).found,
    );

    if (!matchingCard) {
      continue;
    }

    // Automatically mark called number
    if (!player.markedNumbers.includes(number)) {
      player.markedNumbers.push(number);
    }

    // Check bingo
    const winningCard = playerCards.find(
      (card) => checkBingo(card, player.markedNumbers).bingo,
    );
    const bingoResult = winningCard
      ? checkBingo(winningCard, player.markedNumbers)
      : { bingo: false };

    if (bingoResult.bingo && !player.hasBingo) {
      player.hasBingo = true;

      player.bingoTime = new Date();

      const winAmount = Number(player.betAmount || 0) * 5;

      player.winAmount = winAmount;

      winners.push({
        telegramId: player.telegramId,

        username: player.username || player.firstName || "Player",

        firstName: player.firstName || "Player",

        card: winningCard,

        markedNumbers: player.markedNumbers,

        betAmount: Number(player.betAmount || 0),

        winAmount,

        bingoResult,
      });
    }
  }

  // ========================================================
  // NO WINNER
  // ========================================================

  if (winners.length === 0) {
    game.roundSummary.calledNumbersCount = game.calledNumbers.length;

    game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

    await saveWithRetry(game);

    return {
      number,

      calledNumbers: game.calledNumbers,

      gameEnded: false,

      winners: [],

      winner: null,
    };
  }

  // ========================================================
  // WINNER FOUND
  // ========================================================

  game.status = "completed";

  game.roundEndedAt = new Date();

  game.endTime = new Date();

  game.roundSummary.endedReason = "bingo";

  game.roundSummary.playerCount = getRealPlayers(game).length;

  game.roundSummary.calledNumbersCount = game.calledNumbers.length;

  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

  game.roundSummary.totalBetAmount = getRealPlayers(game).reduce(
    (sum, player) => sum + Number(player.betAmount || 0),
    0,
  );

  const commissionSettings = (await CommissionSettings.findOne({
    key: "bingo",
  }).lean()) || {
    below100Percentage: 20,
    between100And1000Percentage: 25,
    above1000Percentage: 30,
  };
  const totalBalance = Number(game.roundSummary.totalBetAmount);
  const commissionPercentage =
    totalBalance < 100
      ? Number(commissionSettings.below100Percentage ?? 20)
      : totalBalance <= 1000
        ? Number(commissionSettings.between100And1000Percentage ?? 25)
        : Number(commissionSettings.above1000Percentage ?? 30);
  const commissionAmount = Number(
    ((totalBalance * commissionPercentage) / 100).toFixed(2),
  );
  game.roundSummary.commissionPercentage = commissionPercentage;
  game.roundSummary.commissionAmount = commissionAmount;
  game.roundSummary.playerPayoutTotal = winners.reduce(
    (sum, winner) => sum + Number(winner.winAmount || 0),
    0,
  );

  const firstWinner = winners[0];

  // ========================================================
  // STORE WINNER
  // ========================================================

  game.winner = {
    telegramId: firstWinner.telegramId,

    username: firstWinner.username,

    firstName: firstWinner.firstName,

    winAmount: firstWinner.winAmount,

    card: firstWinner.card,

    bingoResult: firstWinner.bingoResult,
  };

  game.roundSummary.winnerTelegramId = firstWinner.telegramId;

  game.roundSummary.winnerUsername = firstWinner.username;

  game.roundSummary.winnerAmount = firstWinner.winAmount;

  // ========================================================
  // PAY WINNERS
  // ========================================================

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

      ticket.markedNumbers = winner.markedNumbers;

      await ticket.save();
    }
  }

  await saveWithRetry(game);

  return {
    number,

    calledNumbers: game.calledNumbers,

    gameEnded: true,

    winner: firstWinner,

    winners,

    game,
  };
};

// ============================================================
// MANUAL MARK NUMBER
// ============================================================

export const markNumber = async (gameId, telegramId, number) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const player = game.players.find(
    (p) =>
      normalizeTelegramId(p.telegramId) === normalizedTelegramId &&
      p.isSpectator !== true,
  );

  if (!player) {
    throw new Error("Player not found");
  }

  const numericNumber = Number(number);

  if (!game.calledNumbers.includes(numericNumber)) {
    throw new Error("Number has not been called");
  }

  const playerCards =
    Array.isArray(player.cards) && player.cards.length > 0
      ? player.cards
      : player.card?.length
        ? [player.card]
        : [];

  const result = playerCards.some(
    (card) => checkNumberOnCard(card, numericNumber).found,
  );

  if (!result) {
    throw new Error("Number is not on your card");
  }

  if (!player.markedNumbers.includes(numericNumber)) {
    player.markedNumbers.push(numericNumber);
  }

  await saveWithRetry(game);

  const winningCard = playerCards.find(
    (card) => checkBingo(card, player.markedNumbers).bingo,
  );
  const bingoResult = winningCard
    ? checkBingo(winningCard, player.markedNumbers)
    : { bingo: false };

  const winner = bingoResult.bingo
    ? {
        telegramId: player.telegramId,
        username: player.username || player.firstName || "Player",
        firstName: player.firstName || "Player",
        winAmount: Number(player.betAmount || 0) * 5,
        card: winningCard,
        bingoResult,
      }
    : null;

  return {
    marked: true,

    bingo: bingoResult.bingo,

    bingoResult,

    winner,

    markedNumbers: player.markedNumbers,

    game,
  };
};

// ============================================================
// GET GAME
// ============================================================

export const getGameState = async (gameId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  return game;
};

// ============================================================
// GET PLAYER CARD
// ============================================================

export const getPlayerCard = async (gameId, telegramId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const normalizedTelegramId = normalizeTelegramId(telegramId);

  const player = game.players.find(
    (p) =>
      normalizeTelegramId(p.telegramId) === normalizedTelegramId &&
      p.isSpectator !== true,
  );

  if (!player) {
    throw new Error("Player not found");
  }

  return {
    cards: player.cards?.length ? player.cards : [player.card],

    markedNumbers: player.markedNumbers,

    selectedLuckyNumbers: player.selectedLuckyNumbers,

    isSpectator: false,
  };
};

// ============================================================
// RESET EMPTY ROUND
// ============================================================

export const resetEmptyRound = async (gameId) => {
  const game = await BingoGame.findOne({
    gameId,
  });

  if (!game) {
    throw new Error("Game not found");
  }

  game.status = "waiting";

  game.players = [];

  game.calledNumbers = [];

  game.selectedNumbers = [];

  game.currentNumber = null;

  game.winner = null;

  game.roundStartedAt = null;

  game.roundEndedAt = null;

  game.startTime = null;

  game.endTime = null;

  game.lastCalledAt = null;

  game.playerCount = 0;

  game.selectionEndsAt = new Date(Date.now() + SELECTION_TIME_SECONDS * 1000);

  game.roundSummary = {
    playerCount: 0,

    maxPlayers: game.maxPlayers,

    totalBetAmount: 0,

    calledNumbersCount: 0,

    selectedNumbersCount: 0,

    winnerTelegramId: null,

    winnerUsername: null,

    winnerAmount: 0,

    endedReason: "waiting",
  };

  await saveWithRetry(game);

  return game;
};
