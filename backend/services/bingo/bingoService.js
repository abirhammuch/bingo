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

  const game = new BingoGame({
    gameId,
    roomId,
    status: "waiting",
    maxPlayers,
    minBet,
    maxBet,
    players: [],
    calledNumbers: [],
  });

  await game.save();
  return game;
};

// Join a bingo game
export const joinBingoGame = async (gameId, telegramId, betAmount) => {
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

  // Generate bingo card
  const card = generateBingoCard();
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
    throw new Error("All numbers have been called");
  }

  const randomIndex = Math.floor(Math.random() * availableNumbers.length);
  const number = availableNumbers[randomIndex];

  game.calledNumbers.push(number);
  game.currentNumber = number;
  game.lastCalledAt = new Date();

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
    game.winner = {
      telegramId: player.telegramId,
      username: player.username,
      winAmount: player.betAmount * 5, // 5x payout
    };

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

  if (game.players.length < 2) {
    throw new Error("Need at least 2 players to start");
  }

  game.status = "active";
  game.startTime = new Date();
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
