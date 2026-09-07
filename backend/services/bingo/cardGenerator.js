import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";

// Generate a 5x5 bingo card with free center
export const generateBingoCard = () => {
  const columns = [
    { min: 1, max: 15 },
    { min: 16, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 75 },
  ];

  const card = [];
  for (let col = 0; col < 5; col += 1) {
    const availableNumbers = [];
    for (let n = columns[col].min; n <= columns[col].max; n += 1) {
      availableNumbers.push(n);
    }
    const columnNumbers = [];
    while (columnNumbers.length < 5) {
      const index = Math.floor(Math.random() * availableNumbers.length);
      columnNumbers.push(availableNumbers.splice(index, 1)[0]);
    }
    card.push(columnNumbers);
  }

  const rowBasedCard = Array.from({ length: 5 }, () => Array(5).fill(0));
  for (let col = 0; col < 5; col += 1) {
    for (let row = 0; row < 5; row += 1) {
      rowBasedCard[row][col] = card[col][row];
    }
  }

  rowBasedCard[2][2] = 0; // free space
  return rowBasedCard;
};

export const getCardNumbers = (card) => {
  const numbers = [];
  card.forEach((row) => {
    row.forEach((cell) => {
      if (cell !== 0) numbers.push(cell);
    });
  });
  return numbers;
};

export const checkNumberOnCard = (card, number) => {
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if (card[row][col] === number) {
        return true;
      }
    }
  }
  return false;
};

export const checkBingo = (card, markedNumbers) => {
  const markedSet = new Set(markedNumbers);
  const checkLine = (cells) => cells.every((n) => n === 0 || markedSet.has(n));

  // rows
  for (let row = 0; row < 5; row += 1) {
    const rowCells = card[row];
    if (checkLine(rowCells)) return true;
  }
  // columns
  for (let col = 0; col < 5; col += 1) {
    const colCells = card.map((row) => row[col]);
    if (checkLine(colCells)) return true;
  }
  // diagonals
  const diag1 = [0, 1, 2, 3, 4].map((i) => card[i][i]);
  if (checkLine(diag1)) return true;
  const diag2 = [0, 1, 2, 3, 4].map((i) => card[i][4 - i]);
  if (checkLine(diag2)) return true;

  return false;
};

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

export const joinBingoGame = async (gameId, telegramId, betAmount) => {
  const game = await BingoGame.findOne({ gameId });
  if (!game) throw new Error("Game not found");
  if (game.status !== "waiting") throw new Error("Game already started");
  if (game.players.length >= game.maxPlayers) throw new Error("Game is full");

  const user = await User.findOne({ telegramId });
  if (!user) throw new Error("User not found");
  if (user.balance < betAmount) throw new Error("Insufficient balance");

  user.balance -= betAmount;
  await user.save();

  const card = generateBingoCard();
  const ticketId = uuidv4();
  const ticket = new BingoTicket({
    ticketId,
    gameId,
    telegramId,
    card,
    markedNumbers: [],
    betAmount,
    isWinner: false,
  });
  await ticket.save();

  game.players.push({
    telegramId,
    username: user.username || user.firstName,
    firstName: user.firstName,
    card,
    markedNumbers: [],
    betAmount,
  });
  await game.save();

  return { game, ticket, user };
};

export const startGame = async (gameId) => {
  const game = await BingoGame.findOne({ gameId });
  if (!game) throw new Error("Game not found");
  if (game.players.length < 2)
    throw new Error("At least 2 players required to start");
  if (game.status !== "waiting") throw new Error("Game already started");

  game.status = "active";
  game.startTime = new Date();
  await game.save();
  return game;
};

export const callNumber = async (gameId) => {
  const game = await BingoGame.findOne({ gameId });
  if (!game) throw new Error("Game not found");
  if (game.status !== "active") throw new Error("Game not active");

  const remainingNumbers = Array.from({ length: 75 }, (_, i) => i + 1).filter(
    (n) => !game.calledNumbers.includes(n),
  );
  if (remainingNumbers.length === 0) throw new Error("No remaining numbers");

  const number =
    remainingNumbers[Math.floor(Math.random() * remainingNumbers.length)];
  game.calledNumbers.push(number);
  game.currentNumber = number;
  game.lastCalledAt = new Date();
  await game.save();

  return { number, calledNumbers: game.calledNumbers };
};

export const markNumber = async (gameId, telegramId, number) => {
  const game = await BingoGame.findOne({ gameId });
  if (!game) throw new Error("Game not found");
  const player = game.players.find((p) => p.telegramId === telegramId);
  if (!player) throw new Error("Player not in game");
  if (!game.calledNumbers.includes(number))
    throw new Error("Number has not been called");
  if (!checkNumberOnCard(player.card, number))
    throw new Error("Number not on card");
  if (player.markedNumbers.includes(number))
    throw new Error("Number already marked");

  player.markedNumbers.push(number);
  await game.save();

  const hasBingo = checkBingo(player.card, player.markedNumbers);
  if (hasBingo) {
    game.status = "completed";
    game.winner = { telegramId, winAmount: player.betAmount * 5 };
    game.endTime = new Date();
    await game.save();

    const user = await User.findOne({ telegramId });
    if (user) {
      const winnings = player.betAmount * 5;
      user.balance += winnings;
      user.winningsBalance = Number(user.winningsBalance || 0) + winnings;
      user.bingoGames += 1;
      user.bingoWins += 1;
      user.gamesPlayed += 1;
      user.gamesWon += 1;
      await user.save();
    }

    const ticket = await BingoTicket.findOne({ gameId, telegramId });
    if (ticket) {
      ticket.isWinner = true;
      ticket.winAmount = player.betAmount * 5;
      await ticket.save();
    }

    return { bingo: true, winner: game.winner, game };
  }

  return { bingo: false, markedNumbers: player.markedNumbers };
};

export const getGameState = async (gameId) => {
  const game = await BingoGame.findOne({ gameId });
  if (!game) throw new Error("Game not found");
  return game;
};

export const getPlayerCard = async (gameId, telegramId) => {
  const game = await BingoGame.findOne({ gameId });
  if (!game) throw new Error("Game not found");
  const player = game.players.find((p) => p.telegramId === telegramId);
  if (!player) throw new Error("Player not in game");

  return { card: player.card, markedNumbers: player.markedNumbers };
};
