import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import Transaction from "../../models/Transaction.js";
import mongoose from "mongoose";
import CommissionSettings from "../../models/CommissionSettings.js";
import {
  chargeBingoCard,
  refundBingoPlayer,
} from "../wallet/bingoWalletService.js";
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

        const latestDocument = await document.constructor.findById(
          document._id,
        );

        if (!latestDocument) {
          throw new Error(
            `Bingo round ${document._id} no longer exists while saving updates`,
          );
        }

        // Reapply only this request's changes onto the newest document version.
        for (const path of document.modifiedPaths()) {
          latestDocument.set(path, document.get(path));
        }

        document = latestDocument;
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

export const calculateBingoPrizePool = async (totalPool) => {
  const commissionSettings =
    (await CommissionSettings.findOne({ key: "bingo" }).lean()) || {};
  const commissionPercentage =
    totalPool < 100
      ? Number(commissionSettings.below100Percentage ?? 20)
      : totalPool <= 1000
        ? Number(commissionSettings.between100And1000Percentage ?? 25)
        : Number(commissionSettings.above1000Percentage ?? 30);
  return Math.max(
    0,
    Number((totalPool - (totalPool * commissionPercentage) / 100).toFixed(2)),
  );
};

const toCents = (amount) => Math.round(Number(amount || 0) * 100);
const fromCents = (amount) => Number((amount / 100).toFixed(2));

const settleBingoWinners = async ({ game, gameId, winners }) => {
  const totalPotCents = getRealPlayers(game).reduce(
    (sum, player) => sum + toCents(player.betAmount),
    0,
  );
  const commissionSettings =
    (await CommissionSettings.findOne({ key: "bingo" }).lean()) || {};
  const commissionPercentage =
    totalPotCents < 10000
      ? Number(commissionSettings.below100Percentage ?? 20)
      : totalPotCents <= 100000
        ? Number(commissionSettings.between100And1000Percentage ?? 25)
        : Number(commissionSettings.above1000Percentage ?? 30);
  const commissionCents = Math.round(
    (totalPotCents * commissionPercentage) / 100,
  );
  const prizePoolCents = Math.max(0, totalPotCents - commissionCents);
  const basePrizeCents = Math.floor(prizePoolCents / winners.length);
  const remainderCents = prizePoolCents % winners.length;

  const session = await mongoose.startSession();
  try {
    let settlement;
    await session.withTransaction(async () => {
      const settledGame = await BingoGame.findOne({
        _id: game._id,
        status: "active",
      }).session(session);
      if (!settledGame) throw new Error("Bingo round was already settled");

      const settledWinners = [];
      for (const [index, winner] of winners.entries()) {
        const user = await User.findOne({
          telegramId: winner.telegramId,
        }).session(session);
        if (!user)
          throw new Error(`Winner user not found: ${winner.telegramId}`);

        const winAmount = fromCents(
          basePrizeCents + (index < remainderCents ? 1 : 0),
        );
        const balanceBefore = Number(user.balance || 0);
        const balanceAfter = fromCents(
          toCents(balanceBefore) + toCents(winAmount),
        );
        const reference = `bingo-win:${gameId}:${winner.telegramId}`;
        await User.updateOne(
          { _id: user._id },
          {
            $set: { balance: balanceAfter },
            $inc: { bingoGames: 1, bingoWins: 1, gamesPlayed: 1, gamesWon: 1 },
          },
          { session },
        );
        await Transaction.create(
          [
            {
              transactionId: reference,
              telegramId: winner.telegramId,
              userId: user._id,
              type: "WIN",
              amount: winAmount,
              status: "completed",
              reference,
              balanceBefore,
              balanceAfter,
              description: "Bingo winning prize",
              metadata: { gameId },
            },
          ],
          { session },
        );

        const gamePlayer = settledGame.players.find(
          (entry) =>
            normalizeTelegramId(entry.telegramId) ===
            normalizeTelegramId(winner.telegramId),
        );
        if (gamePlayer) gamePlayer.winAmount = winAmount;
        settledWinners.push({
          userId: user._id,
          telegramId: winner.telegramId,
          username: winner.username,
          firstName: winner.firstName,
          winAmount,
          card: winner.card,
          bingoResult: winner.bingoResult,
        });
      }

      const commissionAmount = fromCents(commissionCents);
      await Transaction.create(
        [
          {
            transactionId: `bingo-commission:${gameId}`,
            telegramId: "SYSTEM",
            type: "COMMISSION",
            amount: commissionAmount,
            status: "completed",
            reference: `bingo-commission:${gameId}`,
            description: "Bingo round commission",
            metadata: { gameId, commission: true },
          },
        ],
        { session },
      );

      const firstWinner = settledWinners[0];
      settledGame.players.forEach((player) => {
        const winner = settledWinners.find(
          (entry) => entry.telegramId === player.telegramId,
        );
        if (winner) player.hasBingo = true;
      });
      settledGame.status = "completed";
      settledGame.calledNumbers = game.calledNumbers;
      settledGame.currentNumber = game.currentNumber;
      settledGame.lastCalledAt = game.lastCalledAt;
      settledGame.players.forEach((player) => {
        const sourcePlayer = game.players.find(
          (entry) => entry.telegramId === player.telegramId,
        );
        if (sourcePlayer) player.markedNumbers = sourcePlayer.markedNumbers;
      });
      settledGame.roundEndedAt = new Date();
      settledGame.endTime = new Date();
      settledGame.winner = firstWinner;
      settledGame.winners = settledWinners;
      settledGame.totalPot = fromCents(totalPotCents);
      settledGame.commissionAmount = commissionAmount;
      settledGame.prizePool = fromCents(prizePoolCents);
      settledGame.roundSummary.totalBetAmount = fromCents(totalPotCents);
      settledGame.roundSummary.commissionPercentage = commissionPercentage;
      settledGame.roundSummary.commissionAmount = commissionAmount;
      settledGame.roundSummary.playerPayoutTotal = fromCents(prizePoolCents);
      settledGame.roundSummary.winnerTelegramId = firstWinner.telegramId;
      settledGame.roundSummary.winnerUsername = firstWinner.username;
      settledGame.roundSummary.winnerAmount = firstWinner.winAmount;
      settledGame.roundSummary.endedReason = "bingo";
      await settledGame.save({ session });
      for (const winner of settledWinners) {
        await BingoTicket.updateOne(
          { gameId, telegramId: winner.telegramId },
          {
            $set: {
              isWinner: true,
              winAmount: winner.winAmount,
              markedNumbers:
                game.players.find(
                  (player) => player.telegramId === winner.telegramId,
                )?.markedNumbers || [],
            },
          },
          { session },
        );
      }
      settlement = { game: settledGame, winners: settledWinners };
    });
    return settlement;
  } finally {
    await session.endSession();
  }
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

  const stakePerCard = Number(game.minBet || betAmount || 0);
  if (!Number.isFinite(stakePerCard) || stakePerCard <= 0) {
    throw new Error("Invalid stake amount");
  }

  const existingPlayerIndex = game.players.findIndex(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  // ========================================================
  // EXISTING PLAYER
  // ========================================================

  if (existingPlayerIndex !== -1) {
    const existingPlayer = game.players[existingPlayerIndex];
    const currentSelectedBefore = existingPlayer.selectedLuckyNumbers || [];
    const newCardNumbers = normalizedLuckyNumbers.filter(
      (number) => !currentSelectedBefore.includes(number),
    );

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

    let latestBalance = user.balance;
    for (const cardNumber of newCardNumbers) {
      const charge = await chargeBingoCard({
        telegramId: normalizedTelegramId,
        gameId,
        cardReference: cardNumber,
        stakePerCard,
      });
      latestBalance = charge.balance;
    }
    existingPlayer.betAmount =
      Number(existingPlayer.betAmount || 0) +
      newCardNumbers.length * stakePerCard;

    game.playerCount = getRealPlayers(game).length;

    game.roundSummary.playerCount = game.playerCount;

    game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

    await saveWithRetry(game);

    return {
      game,
      ticket: null,
      user: {
        balance: latestBalance,
        firstName: user.firstName,
      },
      stakePerCard,
    };
  }

  // ========================================================
  // NEW PLAYER
  // ========================================================

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

  const cardsToCharge = normalizedLuckyNumbers.length || 1;
  let latestBalance = user.balance;
  for (let index = 0; index < cardsToCharge; index += 1) {
    const charge = await chargeBingoCard({
      telegramId: normalizedTelegramId,
      gameId,
      cardReference: normalizedLuckyNumbers[index] ?? `card-${index + 1}`,
      stakePerCard,
    });
    latestBalance = charge.balance;
  }
  const totalUserStake = cardsToCharge * stakePerCard;

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

    betAmount: totalUserStake,

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

    betAmount: totalUserStake,

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
      balance: latestBalance,
      firstName: user.firstName,
    },
    stakePerCard,
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
        balance: latestBalance,
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

  const settlement = await settleBingoWinners({ game, gameId, winners });

  return {
    number,

    calledNumbers: game.calledNumbers,

    gameEnded: true,

    winner: settlement.winners[0],

    winners: settlement.winners,

    game: settlement.game,
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

  if (game.status !== "completed" && !game.winner) {
    const stakePerCard = Number(game.minBet || 0);
    for (const player of getRealPlayers(game)) {
      const cardCount = Number(
        player.cardsSelected || player.selectedLuckyNumbers?.length || 0,
      );
      if (cardCount > 0 && stakePerCard > 0) {
        await refundBingoPlayer({
          telegramId: normalizeTelegramId(player.telegramId),
          gameId,
          amount: cardCount * stakePerCard,
        });
      }
    }
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
