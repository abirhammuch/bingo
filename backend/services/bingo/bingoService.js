import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";

// Retry helper for handling Mongoose version conflicts
const saveWithRetry = async (document, maxRetries = 3) => {
  let retries = maxRetries;
  while (retries > 0) {
    try {
      return await document.save();
    } catch (error) {
      if (error.name === "VersionError" && retries > 1) {
        retries--;
        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 10));
      } else {
        throw error;
      }
    }
  }
};

export const normalizeTelegramId = (telegramId) => {
  if (telegramId === null || telegramId === undefined) return "";
  return String(telegramId).trim();
};

const normalizeSelectedNumbers = (numbers = []) => {
  const unique = [
    ...new Set((numbers || []).map((value) => Number(value))),
  ].filter((value) => Number.isFinite(value));
  return unique.sort((a, b) => a - b);
};

// Generate a 5x5 bingo card
export const generateBingoCard = () => {
  const card = [];
  const columns = [
    { letter: "B", range: [1, 15] },
    { letter: "I", range: [16, 30] },
    { letter: "N", range: [31, 45] },
    { letter: "G", range: [46, 60] },
    { letter: "O", range: [61, 75] },
  ];

  for (let row = 0; row < 5; row++) {
    const rowData = [];
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        rowData.push(0); // FREE space (0 represents FREE)
      } else {
        const [min, max] = columns[col].range;
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        rowData.push(num);
      }
    }
    card.push(rowData);
  }

  return card;
};

// Get all numbers on a card (flattened)
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

// Check if a number exists on the card
export const checkNumberOnCard = (card, number) => {
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (card[row][col] === number) {
        return { found: true, row, col };
      }
    }
  }
  return { found: false };
};

// Check for bingo (row, column, or diagonal)
export const checkBingo = (card, markedNumbers) => {
  const markedSet = new Set(markedNumbers);

  // Check rows
  for (let row = 0; row < 5; row++) {
    let bingo = true;
    for (let col = 0; col < 5; col++) {
      if (card[row][col] !== 0 && !markedSet.has(card[row][col])) {
        bingo = false;
        break;
      }
    }
    if (bingo) {
      return { bingo: true, type: "row", position: row };
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    let bingo = true;
    for (let row = 0; row < 5; row++) {
      if (card[row][col] !== 0 && !markedSet.has(card[row][col])) {
        bingo = false;
        break;
      }
    }
    if (bingo) {
      return { bingo: true, type: "column", position: col };
    }
  }

  // Check diagonal (top-left to bottom-right)
  let bingo = true;
  for (let i = 0; i < 5; i++) {
    if (card[i][i] !== 0 && !markedSet.has(card[i][i])) {
      bingo = false;
      break;
    }
  }
  if (bingo) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-left to bottom-right",
    };
  }

  // Check diagonal (top-right to bottom-left)
  bingo = true;
  for (let i = 0; i < 5; i++) {
    if (card[i][4 - i] !== 0 && !markedSet.has(card[i][4 - i])) {
      bingo = false;
      break;
    }
  }
  if (bingo) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-right to bottom-left",
    };
  }

  return { bingo: false };
};

// Create a new bingo game
export const createBingoGame = async (
  roomId,
  maxPlayers = 10,
  minBet = 1,
  maxBet = 100,
) => {
  const gameId = uuidv4();
  const roundNumber = (await BingoGame.countDocuments({ roomId })) + 1;

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

// Join a bingo game (optionally reserving a lucky number)
export const joinBingoGame = async (
  gameId,
  telegramId,
  betAmount,
  luckyNumber = null,
) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);
  const joinStartTime = new Date();

  if (!normalizedTelegramId) {
    throw new Error("Telegram ID is required");
  }

  const game = await BingoGame.findOne({ gameId });
  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "waiting") {
    throw new Error(
      "This round is no longer accepting new players. Please wait for the next round.",
    );
  }

  if (game.players.length >= game.maxPlayers) {
    throw new Error("Game is full");
  }

  const user = await User.findOne({ telegramId: normalizedTelegramId });
  if (!user) {
    throw new Error("User not found");
  }

  const existingPlayerIndex = game.players.findIndex(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  const normalizedLuckyNumber =
    luckyNumber === null || luckyNumber === undefined || luckyNumber === ""
      ? null
      : Number(luckyNumber);

  const selectedNumbers = normalizeSelectedNumbers(game.selectedNumbers || []);

  if (
    normalizedLuckyNumber !== null &&
    Number.isFinite(normalizedLuckyNumber) &&
    selectedNumbers.includes(normalizedLuckyNumber)
  ) {
    if (existingPlayerIndex === -1) {
      throw new Error("Lucky number already selected by another player");
    }

    const existingPlayer = game.players[existingPlayerIndex];
    const existingLucky = Array.isArray(existingPlayer.selectedLuckyNumbers)
      ? existingPlayer.selectedLuckyNumbers.map(Number)
      : [];

    if (!existingLucky.includes(normalizedLuckyNumber)) {
      existingPlayer.selectedLuckyNumbers = normalizeSelectedNumbers([
        ...existingLucky,
        normalizedLuckyNumber,
      ]);
      game.players[existingPlayerIndex] = existingPlayer;
      game.selectedNumbers = normalizeSelectedNumbers([
        ...selectedNumbers,
        normalizedLuckyNumber,
      ]);
      await saveWithRetry(game);

      return {
        game,
        ticket: null,
        user: { balance: user.balance, firstName: user.firstName },
      };
    }

    await saveWithRetry(game);
    return {
      game,
      ticket: null,
      user: { balance: user.balance, firstName: user.firstName },
    };
  }

  if (existingPlayerIndex !== -1) {
    const existingPlayer = game.players[existingPlayerIndex];
    if (
      normalizedLuckyNumber !== null &&
      Number.isFinite(normalizedLuckyNumber)
    ) {
      const existingLucky = Array.isArray(existingPlayer.selectedLuckyNumbers)
        ? existingPlayer.selectedLuckyNumbers.map(Number)
        : [];

      if (!existingLucky.includes(normalizedLuckyNumber)) {
        existingPlayer.selectedLuckyNumbers = normalizeSelectedNumbers([
          ...existingLucky,
          normalizedLuckyNumber,
        ]);
        game.players[existingPlayerIndex] = existingPlayer;
      }
    }

    game.selectedNumbers = normalizeSelectedNumbers(
      Array.from(
        new Set([
          ...selectedNumbers,
          ...(normalizedLuckyNumber !== null &&
          Number.isFinite(normalizedLuckyNumber)
            ? [normalizedLuckyNumber]
            : []),
        ]),
      ),
    );
    await saveWithRetry(game);

    return {
      game,
      ticket: null,
      user: { balance: user.balance, firstName: user.firstName },
    };
  }

  if (user.balance < betAmount) {
    throw new Error("Insufficient balance");
  }

  user.balance -= betAmount;
  await user.save();

  if (
    normalizedLuckyNumber !== null &&
    Number.isFinite(normalizedLuckyNumber)
  ) {
    game.selectedNumbers = normalizeSelectedNumbers([
      ...selectedNumbers,
      normalizedLuckyNumber,
    ]);
  }

  const card = (() => {
    if (
      normalizedLuckyNumber === null ||
      !Number.isFinite(normalizedLuckyNumber)
    ) {
      return generateBingoCard();
    }

    const columns = [
      { min: 1, max: 15 },
      { min: 16, max: 30 },
      { min: 31, max: 45 },
      { min: 46, max: 60 },
      { min: 61, max: 75 },
    ];

    const colIndex = columns.findIndex(
      (column) =>
        normalizedLuckyNumber >= column.min &&
        normalizedLuckyNumber <= column.max,
    );

    const cardCols = [];
    for (let col = 0; col < 5; col++) {
      const available = [];
      for (let value = columns[col].min; value <= columns[col].max; value++) {
        available.push(value);
      }

      if (col === colIndex) {
        const index = available.indexOf(normalizedLuckyNumber);
        if (index !== -1) available.splice(index, 1);
      }

      const columnValues = [];
      while (columnValues.length < 5) {
        const randomIndex = Math.floor(Math.random() * available.length);
        columnValues.push(available.splice(randomIndex, 1)[0]);
      }
      cardCols.push(columnValues);
    }

    const rowCard = Array.from({ length: 5 }, () => Array(5).fill(0));
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        rowCard[row][col] = cardCols[col][row];
      }
    }

    rowCard[2][2] = 0;

    if (colIndex >= 0) {
      const possibleRows = [0, 1, 3, 4];
      const row = possibleRows[Math.floor(Math.random() * possibleRows.length)];
      rowCard[row][colIndex] = normalizedLuckyNumber;
    }

    return rowCard;
  })();

  const ticketId = uuidv4();
  const ticket = new BingoTicket({
    ticketId,
    gameId,
    telegramId: normalizedTelegramId,
    card,
    numbers: getCardNumbers(card),
    markedNumbers: [],
    betAmount,
  });
  await ticket.save();

  game.players.push({
    telegramId: normalizedTelegramId,
    username: user.username || user.firstName,
    firstName: user.firstName,
    card,
    markedNumbers: [],
    selectedLuckyNumbers:
      normalizedLuckyNumber !== null && Number.isFinite(normalizedLuckyNumber)
        ? [normalizedLuckyNumber]
        : [],
    betAmount,
  });

  game.playerCount = game.players.length;
  game.roundSummary.playerCount = game.players.length;
  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;
  game.roundSummary.totalBetAmount = game.players.reduce(
    (sum, player) => sum + (player.betAmount || 0),
    0,
  );

  let savedGame;
  let retries = 3;
  while (retries > 0) {
    try {
      savedGame = await game.save();
      break;
    } catch (error) {
      if (error.name === "VersionError" && retries > 1) {
        // Re-fetch the game and retry
        const freshGame = await BingoGame.findOne({ gameId });
        if (!freshGame) throw new Error("Game not found during retry");

        // Reapply the changes to the fresh document
        freshGame.players.push({
          telegramId: normalizedTelegramId,
          username: user.username || user.firstName,
          firstName: user.firstName,
          card,
          markedNumbers: [],
          selectedLuckyNumbers:
            normalizedLuckyNumber !== null &&
            Number.isFinite(normalizedLuckyNumber)
              ? [normalizedLuckyNumber]
              : [],
          betAmount,
        });
        freshGame.playerCount = freshGame.players.length;
        freshGame.roundSummary.playerCount = freshGame.players.length;
        freshGame.roundSummary.selectedNumbersCount =
          freshGame.selectedNumbers.length;
        freshGame.roundSummary.totalBetAmount = freshGame.players.reduce(
          (sum, player) => sum + (player.betAmount || 0),
          0,
        );

        game = freshGame;
        retries--;
      } else {
        throw error;
      }
    }
  }

  return {
    game: savedGame,
    ticket,
    user: { balance: user.balance, firstName: user.firstName },
  };
};

// Spectate a game (join as spectator during playing phase)
export const joinAsSpectator = async (gameId, telegramId) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);

  if (!normalizedTelegramId) {
    throw new Error("Telegram ID is required");
  }

  const game = await BingoGame.findOne({ gameId });
  if (!game) {
    throw new Error("Game not found");
  }

  // Allow spectating during READY or ACTIVE phases
  if (game.status !== "ready" && game.status !== "active") {
    throw new Error("Cannot spectate this round. Game is not in progress.");
  }

  const user = await User.findOne({ telegramId: normalizedTelegramId });
  if (!user) {
    throw new Error("User not found");
  }

  // Check if already a spectator or player
  const existingPlayerIndex = game.players.findIndex(
    (player) => normalizeTelegramId(player.telegramId) === normalizedTelegramId,
  );

  if (existingPlayerIndex === -1) {
    // Add as spectator (no bet, no lucky number)
    game.players.push({
      telegramId: normalizedTelegramId,
      username: user.username || "",
      firstName: user.firstName || "Spectator",
      lastName: user.lastName || "",
      betAmount: 0,
      selectedLuckyNumbers: [],
      isSpectator: true,
    });
    game.playerCount = game.players.length;
    await saveWithRetry(game);
  }

  return {
    game,
    user: { balance: user.balance, firstName: user.firstName },
    isSpectator: true,
  };
};

// Call a number
export const callNumber = async (gameId) => {
  const game = await BingoGame.findOne({ gameId });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "active") {
    throw new Error("Game is not active");
  }

  // Generate a random number between 1-75 that hasn't been called
  const availableNumbers = [];
  for (let i = 1; i <= 75; i++) {
    if (!game.calledNumbers.includes(i)) {
      availableNumbers.push(i);
    }
  }

  if (availableNumbers.length === 0) {
    game.status = "completed";
    game.roundEndedAt = new Date();
    game.endTime = new Date();
    game.playerCount = game.players.length;
    game.roundSummary.playerCount = game.players.length;
    game.roundSummary.calledNumbersCount = game.calledNumbers.length;
    game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;
    game.roundSummary.endedReason = "all_numbers_called";
    await game.save();
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableNumbers.length);
  const number = availableNumbers[randomIndex];

  game.calledNumbers.push(number);
  game.currentNumber = number;
  game.lastCalledAt = new Date();
  game.roundSummary.calledNumbersCount = game.calledNumbers.length;
  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;

  // Check ALL players for bingo after calling the number
  const winners = [];
  for (let playerIndex = 0; playerIndex < game.players.length; playerIndex++) {
    const player = game.players[playerIndex];
    // Check if this number is on the card
    const numberOnCard = checkNumberOnCard(player.card, number).found;
    if (numberOnCard) {
      // Automatically mark this number for the player
      if (!player.markedNumbers.includes(number)) {
        player.markedNumbers.push(number);
      }
      // Check for bingo
      const bingoResult = checkBingo(player.card, player.markedNumbers);
      if (bingoResult.bingo && !player.hasBingo) {
        player.hasBingo = true;
        player.bingoTime = new Date();
        winners.push({
          playerIndex,
          player,
          bingoResult,
        });
      }
    }
  }

  await game.save();

  // If winners detected, game ends immediately
  if (winners.length > 0) {
    game.status = "completed";
    game.roundEndedAt = new Date();
    game.endTime = new Date();
    game.playerCount = game.players.length;
    game.roundSummary.playerCount = game.players.length;
    game.roundSummary.calledNumbersCount = game.calledNumbers.length;
    game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;
    game.roundSummary.endedReason = "bingo";

    // Store first winner for backwards compatibility
    const firstWinner = winners[0].player;
    const winAmount = Number(firstWinner.betAmount || 0) * 5;
    game.winner = {
      telegramId: firstWinner.telegramId,
      username: firstWinner.username,
      winAmount,
    };
    game.roundSummary.winnerTelegramId = game.winner.telegramId;
    game.roundSummary.winnerUsername = game.winner.username;
    game.roundSummary.winnerAmount = game.winner.winAmount;

    // Update user balances for all winners
    for (const winnerData of winners) {
      const player = winnerData.player;
      const user = await User.findOne({
        telegramId: normalizeTelegramId(player.telegramId),
      });
      if (user) {
        const winAmount = Number(player.betAmount || 0) * 5;
        user.balance += winAmount;
        user.bingoGames += 1;
        user.bingoWins += 1;
        user.gamesPlayed += 1;
        user.gamesWon += 1;
        await user.save();
      }

      // Update ticket
      const ticket = await BingoTicket.findOne({
        gameId,
        telegramId: normalizeTelegramId(player.telegramId),
      });
      if (ticket) {
        ticket.isWinner = true;
        ticket.winAmount = Number(player.betAmount || 0) * 5;
        await ticket.save();
      }
    }

    await game.save();

    return {
      number,
      calledNumbers: game.calledNumbers,
      winners: winners.map((w) => ({
        telegramId: w.player.telegramId,
        username: w.player.username,
        winAmount: Number(w.player.betAmount || 0) * 5,
        bingoResult: w.bingoResult,
      })),
      gameEnded: true,
    };
  }

  return {
    number,
    calledNumbers: game.calledNumbers,
    winners: [],
    gameEnded: false,
  };
};

// Mark a number on player's card
export const markNumber = async (gameId, telegramId, number) => {
  const game = await BingoGame.findOne({ gameId });

  if (!game) {
    throw new Error("Game not found");
  }

  // Find player
  const normalizedTelegramId = normalizeTelegramId(telegramId);
  const playerIndex = game.players.findIndex(
    (p) => normalizeTelegramId(p.telegramId) === normalizedTelegramId,
  );

  if (playerIndex === -1) {
    throw new Error("Player not in game");
  }

  // Check if number has been called
  if (!game.calledNumbers.includes(number)) {
    throw new Error("Number has not been called yet");
  }

  const player = game.players[playerIndex];

  // Check if number is on card
  const result = checkNumberOnCard(player.card, number);

  if (!result.found) {
    throw new Error("Number not on card");
  }

  // Check if already marked
  if (player.markedNumbers.includes(number)) {
    throw new Error("Number already marked");
  }

  // Mark the number
  player.markedNumbers.push(number);
  game.players[playerIndex] = player;

  await game.save();

  // Check for bingo
  const bingoResult = checkBingo(player.card, player.markedNumbers);

  if (bingoResult.bingo) {
    game.status = "completed";
    game.endTime = new Date();
    game.roundEndedAt = new Date();
    game.playerCount = game.players.length;
    game.roundSummary.playerCount = game.players.length;
    game.roundSummary.calledNumbersCount = game.calledNumbers.length;
    game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;
    game.roundSummary.totalBetAmount = game.players.reduce(
      (sum, playerItem) => sum + (playerItem.betAmount || 0),
      0,
    );
    const winAmount = Number(player.betAmount || 0) * 5;
    game.winner = {
      telegramId: player.telegramId,
      username: player.username,
      winAmount,
    };
    game.roundSummary.winnerTelegramId = game.winner.telegramId;
    game.roundSummary.winnerUsername = game.winner.username;
    game.roundSummary.winnerAmount = game.winner.winAmount;
    game.roundSummary.endedReason = "bingo";

    // Update user balance
    const user = await User.findOne({ telegramId: normalizedTelegramId });
    if (user) {
      user.balance += game.winner.winAmount;
      user.bingoGames += 1;
      user.bingoWins += 1;
      user.gamesPlayed += 1;
      user.gamesWon += 1;
      await user.save();
    }

    // Update ticket
    const ticket = await BingoTicket.findOne({
      gameId,
      telegramId: normalizedTelegramId,
    });
    if (ticket) {
      ticket.isWinner = true;
      ticket.winAmount = game.winner.winAmount;
      await ticket.save();
    }

    await game.save();

    return {
      marked: true,
      bingo: true,
      bingoResult,
      winner: game.winner,
      game,
    };
  }

  return {
    marked: true,
    bingo: false,
    number,
    markedNumbers: player.markedNumbers,
  };
};

// Start game
export const startGame = async (gameId) => {
  const game = await BingoGame.findOne({ gameId });

  if (!game) {
    throw new Error("Game not found");
  }

  // Only require more than 1 selected card (2+), regardless of players
  const selectedCount = Array.isArray(game.selectedNumbers)
    ? game.selectedNumbers.length
    : 0;

  if (selectedCount <= 1) {
    throw new Error(
      `Need more than 1 selected card to start. Currently have ${selectedCount} card(s).`,
    );
  }

  game.status = "active";
  game.startTime = new Date();
  game.roundStartedAt = game.roundStartedAt || new Date();
  game.playerCount = game.players.length;
  game.roundSummary.playerCount = game.players.length;
  game.roundSummary.maxPlayers = game.maxPlayers;
  game.roundSummary.calledNumbersCount = game.calledNumbers.length;
  game.roundSummary.selectedNumbersCount = game.selectedNumbers.length;
  game.roundSummary.totalBetAmount = game.players.reduce(
    (sum, player) => sum + (player.betAmount || 0),
    0,
  );
  await game.save();

  return game;
};

// Get game state
export const getGameState = async (gameId) => {
  const game = await BingoGame.findOne({ gameId });

  if (!game) {
    throw new Error("Game not found");
  }

  return game;
};

// Get player's card
export const getPlayerCard = async (gameId, telegramId) => {
  const game = await BingoGame.findOne({ gameId });

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
  };
};
