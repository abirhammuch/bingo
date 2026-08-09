import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";

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
  // Find game
  const game = await BingoGame.findOne({ gameId });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "waiting") {
    throw new Error("Game already in progress");
  }

  if (game.players.length >= game.maxPlayers) {
    throw new Error("Game is full");
  }

  // Find user
  const user = await User.findOne({ telegramId });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.balance < betAmount) {
    throw new Error("Insufficient balance");
  }

  // Deduct bet amount
  user.balance -= betAmount;
  await user.save();

  // If a luckyNumber is provided, ensure it's not already taken
  if (luckyNumber != null) {
    if (game.selectedNumbers && game.selectedNumbers.includes(luckyNumber)) {
      throw new Error("Lucky number already selected by another player");
    }
    game.selectedNumbers = game.selectedNumbers || [];
    game.selectedNumbers.push(luckyNumber);
  }

  // Generate bingo card, placing luckyNumber on the card if provided
  const card = (() => {
    if (luckyNumber == null) return generateBingoCard();

    // create card ensuring luckyNumber is present in the correct column
    const columns = [
      { min: 1, max: 15 },
      { min: 16, max: 30 },
      { min: 31, max: 45 },
      { min: 46, max: 60 },
      { min: 61, max: 75 },
    ];

    // Determine column index
    const colIndex = columns.findIndex(
      (c) => luckyNumber >= c.min && luckyNumber <= c.max,
    );
    // Build column-based numbers and ensure luckyNumber placed in that column
    const cardCols = [];
    for (let col = 0; col < 5; col++) {
      const available = [];
      for (let n = columns[col].min; n <= columns[col].max; n++)
        available.push(n);

      // If this is the lucky number column, remove luckyNumber from available and we'll insert it
      if (col === colIndex) {
        const idx = available.indexOf(luckyNumber);
        if (idx !== -1) available.splice(idx, 1);
      }

      // pick 5 numbers for the column
      const colNums = [];
      while (colNums.length < 5) {
        const idx = Math.floor(Math.random() * available.length);
        colNums.push(available.splice(idx, 1)[0]);
      }
      cardCols.push(colNums);
    }

    // convert to row-based
    const rowCard = Array.from({ length: 5 }, () => Array(5).fill(0));
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 5; r++) {
        rowCard[r][c] = cardCols[c][r];
      }
    }

    // free center
    rowCard[2][2] = 0;

    // ensure luckyNumber is placed in a non-center row for its column
    if (colIndex >= 0) {
      // choose a random row index that is not 2 (center)
      const possibleRows = [0, 1, 3, 4];
      const r = possibleRows[Math.floor(Math.random() * possibleRows.length)];
      rowCard[r][colIndex] = luckyNumber;
    }

    return rowCard;
  })();

  const numbers = getCardNumbers(card);

  // Create ticket
  const ticketId = uuidv4();
  const ticket = new BingoTicket({
    ticketId,
    gameId,
    telegramId,
    card,
    numbers,
    markedNumbers: [],
    betAmount,
  });
  await ticket.save();

  // Add player to game
  game.players.push({
    telegramId,
    username: user.username || user.firstName,
    firstName: user.firstName,
    card,
    markedNumbers: [],
    betAmount,
  });

  game.playerCount = game.players.length;
  game.roundSummary.playerCount = game.players.length;
  game.roundSummary.totalBetAmount = game.players.reduce(
    (sum, player) => sum + (player.betAmount || 0),
    0,
  );

  await game.save();

  return {
    game,
    ticket,
    user: {
      balance: user.balance,
      firstName: user.firstName,
    },
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

  await game.save();

  return { number, calledNumbers: game.calledNumbers };
};

// Mark a number on player's card
export const markNumber = async (gameId, telegramId, number) => {
  const game = await BingoGame.findOne({ gameId });

  if (!game) {
    throw new Error("Game not found");
  }

  // Find player
  const playerIndex = game.players.findIndex(
    (p) => p.telegramId === telegramId,
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
    game.winner = {
      telegramId: player.telegramId,
      username: player.username,
      winAmount: player.betAmount * 5, // 5x payout
    };
    game.roundSummary.winnerTelegramId = game.winner.telegramId;
    game.roundSummary.winnerUsername = game.winner.username;
    game.roundSummary.winnerAmount = game.winner.winAmount;
    game.roundSummary.endedReason = "bingo";

    // Update user balance
    const user = await User.findOne({ telegramId });
    if (user) {
      user.balance += game.winner.winAmount;
      user.bingoGames += 1;
      user.bingoWins += 1;
      user.gamesPlayed += 1;
      user.gamesWon += 1;
      await user.save();
    }

    // Update ticket
    const ticket = await BingoTicket.findOne({ gameId, telegramId });
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

  if (game.players.length < 1) {
    throw new Error("Need at least 1 player to start");
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

  const player = game.players.find((p) => p.telegramId === telegramId);

  if (!player) {
    throw new Error("Player not in game");
  }

  return {
    card: player.card,
    markedNumbers: player.markedNumbers,
  };
};
