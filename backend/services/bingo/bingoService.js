import BingoGame from "../../models/BingoGame.js";
import BingoTicket from "../../models/BingoTicket.js";
import User from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

export const SELECTION_TIME_SECONDS = 30;
export const MAX_BINGO_NUMBER = 75;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

export const normalizeTelegramId = (telegramId) => {
  if (telegramId === null || telegramId === undefined) {
    return "";
  }

  return String(telegramId).trim();
};

const shuffle = (array) => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| Generate Bingo Card
|--------------------------------------------------------------------------
*/

export const generateBingoCard = () => {
  const ranges = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  const card = Array.from(
    { length: 5 },
    () => Array(5).fill(0),
  );

  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];

    const numbers = [];

    for (let number = min; number <= max; number++) {
      numbers.push(number);
    }

    const shuffled = shuffle(numbers).slice(0, 5);

    for (let row = 0; row < 5; row++) {
      card[row][col] = shuffled[row];
    }
  }

  // FREE center
  card[2][2] = 0;

  return card;
};

/*
|--------------------------------------------------------------------------
| Card Numbers
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Check Number
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Check Bingo
|--------------------------------------------------------------------------
*/

export const checkBingo = (card, markedNumbers = []) => {
  if (!Array.isArray(card) || card.length !== 5) {
    return {
      bingo: false,
    };
  }

  const markedSet = new Set(
    markedNumbers.map(Number),
  );

  const isMarked = (value) => {
    return value === 0 || markedSet.has(Number(value));
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
  for (let col = 0; col < 5; col++) {
    let complete = true;

    for (let row = 0; row < 5; row++) {
      if (!isMarked(card[row][col])) {
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

  // Diagonal 1
  if (
    isMarked(card[0][0]) &&
    isMarked(card[1][1]) &&
    isMarked(card[2][2]) &&
    isMarked(card[3][3]) &&
    isMarked(card[4][4])
  ) {
    return {
      bingo: true,
      type: "diagonal",
      direction: "top-left-to-bottom-right",
    };
  }

  // Diagonal 2
  if (
    isMarked(card[0][4]) &&
    isMarked(card[1][3]) &&
    isMarked(card[2][2]) &&
    isMarked(card[3][1]) &&
    isMarked(card[4][0])
  ) {
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

/*
|--------------------------------------------------------------------------
| Create Game
|--------------------------------------------------------------------------
*/

export const createBingoGame = async (
  roomId,
  maxPlayers = 100,
  minBet = 1,
  maxBet = 100,
) => {
  const gameId = uuidv4();

  const existingRounds = await BingoGame.countDocuments({
    roomId,
  });

  const roundNumber = existingRounds + 1;

  const selectionEndsAt = new Date(
    Date.now() + SELECTION_TIME_SECONDS * 1000,
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

    startTime: null,

    endTime: null,

    roundStartedAt: null,

    roundEndedAt: null,

    winner: null,

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

/*
|--------------------------------------------------------------------------
| Join Game
|--------------------------------------------------------------------------
*/

export const joinBingoGame = async (
  gameId,
  telegramId,
  betAmount,
  luckyNumber = null,
) => {
  const normalizedTelegramId =
    normalizeTelegramId(telegramId);

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
      "Selection time has ended. Please wait for the next round.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Check global timer
  |--------------------------------------------------------------------------
  */

  if (
    game.selectionEndsAt &&
    new Date() >= new Date(game.selectionEndsAt)
  ) {
    throw new Error(
      "Selection time has ended. Please wait for the next round.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Check player limit
  |--------------------------------------------------------------------------
  */

  if (game.players.length >= game.maxPlayers) {
    throw new Error("Game is full");
  }

  /*
  |--------------------------------------------------------------------------
  | Find user
  |--------------------------------------------------------------------------
  */

  const user = await User.findOne({
    telegramId: normalizedTelegramId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  /*
  |--------------------------------------------------------------------------
  | Validate lucky number
  |--------------------------------------------------------------------------
  */

  const selectedLuckyNumber =
    luckyNumber === null ||
    luckyNumber === undefined ||
    luckyNumber === ""
      ? null
      : Number(luckyNumber);

  if (
    selectedLuckyNumber !== null &&
    (!Number.isInteger(selectedLuckyNumber) ||
      selectedLuckyNumber < 1 ||
      selectedLuckyNumber > 75)
  ) {
    throw new Error("Lucky number must be between 1 and 75");
  }

  /*
  |--------------------------------------------------------------------------
  | Existing player
  |--------------------------------------------------------------------------
  */

  const existingPlayerIndex =
    game.players.findIndex(
      (player) =>
        normalizeTelegramId(player.telegramId) ===
        normalizedTelegramId,
    );

  if (existingPlayerIndex !== -1) {
    const player =
      game.players[existingPlayerIndex];

    if (
      selectedLuckyNumber !== null &&
      !player.selectedLuckyNumbers?.includes(
        selectedLuckyNumber,
      )
    ) {
      player.selectedLuckyNumbers = [
        ...(player.selectedLuckyNumbers || []),
        selectedLuckyNumber,
      ];

      game.selectedNumbers = [
        ...new Set([
          ...(game.selectedNumbers || []),
          selectedLuckyNumber,
        ]),
      ];

      await game.save();
    }

    return {
      game,
      ticket: null,
      user: {
        balance: user.balance,
        firstName: user.firstName,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Validate balance
  |--------------------------------------------------------------------------
  */

  const numericBet = Number(betAmount);

  if (!Number.isFinite(numericBet) || numericBet <= 0) {
    throw new Error("Invalid bet amount");
  }

  if (numericBet < game.minBet || numericBet > game.maxBet) {
    throw new Error(
      `Bet must be between ${game.minBet} and ${game.maxBet}`,
    );
  }

  if (user.balance < numericBet) {
    throw new Error("Insufficient balance");
  }

  /*
  |--------------------------------------------------------------------------
  | Deduct balance
  |--------------------------------------------------------------------------
  */

  user.balance -= numericBet;

  await user.save();

  /*
  |--------------------------------------------------------------------------
  | Generate card
  |--------------------------------------------------------------------------
  */

  const card = generateBingoCard();

  /*
  |--------------------------------------------------------------------------
  | Put lucky number on card
  |--------------------------------------------------------------------------
  */

  if (selectedLuckyNumber !== null) {
    const ranges = [
      [1, 15],
      [16, 30],
      [31, 45],
      [46, 60],
      [61, 75],
    ];

    const columnIndex = ranges.findIndex(
      ([min, max]) =>
        selectedLuckyNumber >= min &&
        selectedLuckyNumber <= max,
    );

    if (columnIndex !== -1) {
      const rows = [0, 1, 2, 3, 4].filter(
        (row) =>
          !(row === 2 && columnIndex === 2),
      );

      const randomRow =
        rows[Math.floor(Math.random() * rows.length)];

      card[randomRow][columnIndex] =
        selectedLuckyNumber;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Ticket
  |--------------------------------------------------------------------------
  */

  const ticketId = uuidv4();

  const ticket = new BingoTicket({
    ticketId,
    gameId,
    telegramId: normalizedTelegramId,
    card,
    numbers: getCardNumbers(card),
    markedNumbers: [],
    betAmount: numericBet,
    isWinner: false,
  });

  await ticket.save();

  /*
  |--------------------------------------------------------------------------
  | Add player
  |--------------------------------------------------------------------------
  */

  game.players.push({
    telegramId: normalizedTelegramId,

    username:
      user.username ||
      user.firstName ||
      "Player",

    firstName:
      user.firstName ||
      "Player",

    card,

    markedNumbers: [],

    selectedLuckyNumbers:
      selectedLuckyNumber !== null
        ? [selectedLuckyNumber]
        : [],

    betAmount: numericBet,

    isSpectator: false,

    hasBingo: false,
  });

  game.playerCount =
    game.players.length;

  game.selectedNumbers = [
    ...new Set([
      ...(game.selectedNumbers || []),
      ...(selectedLuckyNumber !== null
        ? [selectedLuckyNumber]
        : []),
    ]),
  ];

  game.roundSummary.playerCount =
    game.playerCount;

  game.roundSummary.selectedNumbersCount =
    game.selectedNumbers.length;

  game.roundSummary.totalBetAmount =
    game.players.reduce(
      (sum, player) =>
        sum + Number(player.betAmount || 0),
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

/*
|--------------------------------------------------------------------------
| Start Game
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | If nobody joined, DO NOT start the live game.
  |--------------------------------------------------------------------------
  */

  if (game.players.length === 0) {
    return {
      noPlayers: true,
      game,
    };
  }

  game.status = "active";

  game.startTime = new Date();

  game.roundStartedAt =
    game.roundStartedAt || new Date();

  game.playerCount =
    game.players.length;

  game.roundSummary.playerCount =
    game.players.length;

  game.roundSummary.selectedNumbersCount =
    game.selectedNumbers.length;

  game.roundSummary.totalBetAmount =
    game.players.reduce(
      (sum, player) =>
        sum + Number(player.betAmount || 0),
      0,
    );

  await game.save();

  return {
    noPlayers: false,
    game,
  };
};

/*
|--------------------------------------------------------------------------
| Reset Round
|--------------------------------------------------------------------------
|
| Called when 30 seconds expire and nobody joined.
|--------------------------------------------------------------------------
*/

export const resetEmptyRound = async (gameId) => {
  const oldGame = await BingoGame.findOne({
    gameId,
  });

  if (!oldGame) {
    throw new Error("Game not found");
  }

  if (oldGame.status !== "waiting") {
    return oldGame;
  }

  if (oldGame.players.length > 0) {
    return oldGame;
  }

  oldGame.selectionEndsAt = new Date(
    Date.now() + SELECTION_TIME_SECONDS * 1000,
  );

  oldGame.selectedNumbers = [];

  oldGame.calledNumbers = [];

  oldGame.currentNumber = null;

  oldGame.playerCount = 0;

  oldGame.roundStartedAt = null;

  oldGame.startTime = null;

  oldGame.winner = null;

  oldGame.roundSummary = {
    playerCount: 0,
    maxPlayers: oldGame.maxPlayers,
    totalBetAmount: 0,
    calledNumbersCount: 0,
    selectedNumbersCount: 0,
    endedReason: "waiting",
  };

  await oldGame.save();

  return oldGame;
};

/*
|--------------------------------------------------------------------------
| Call Number
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | MAX = 75
  |--------------------------------------------------------------------------
  */

  if (
    game.calledNumbers.length >=
    MAX_BINGO_NUMBER
  ) {
    game.status = "completed";

    game.endTime = new Date();

    game.roundEndedAt = new Date();

    game.roundSummary.endedReason =
      "all_numbers_called";

    await game.save();

    return {
      number: null,
      calledNumbers: game.calledNumbers,
      winners: [],
      gameEnded: true,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Find remaining numbers
  |--------------------------------------------------------------------------
  */

  const remainingNumbers = [];

  for (
    let number = 1;
    number <= MAX_BINGO_NUMBER;
    number++
  ) {
    if (!game.calledNumbers.includes(number)) {
      remainingNumbers.push(number);
    }
  }

  if (remainingNumbers.length === 0) {
    game.status = "completed";

    game.endTime = new Date();

    game.roundEndedAt = new Date();

    await game.save();

    return {
      number: null,
      calledNumbers: game.calledNumbers,
      winners: [],
      gameEnded: true,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Random number
  |--------------------------------------------------------------------------
  */

  const randomIndex =
    Math.floor(
      Math.random() *
        remainingNumbers.length,
    );

  const number =
    remainingNumbers[randomIndex];

  game.calledNumbers.push(number);

  game.currentNumber = number;

  game.lastCalledAt = new Date();

  /*
  |--------------------------------------------------------------------------
  | Check all players
  |--------------------------------------------------------------------------
  */

  const winners = [];

  for (
    let index = 0;
    index < game.players.length;
    index++
  ) {
    const player =
      game.players[index];

    if (player.isSpectator) {
      continue;
    }

    const exists =
      checkNumberOnCard(
        player.card,
        number,
      ).found;

    if (exists) {
      if (
        !player.markedNumbers.includes(
          number,
        )
      ) {
        player.markedNumbers.push(number);
      }
    }

    const bingoResult =
      checkBingo(
        player.card,
        player.markedNumbers,
      );

    if (
      bingoResult.bingo &&
      !player.hasBingo
    ) {
      player.hasBingo = true;

      player.bingoTime = new Date();

      winners.push({
        player,
        bingoResult,
      });
    }
  }

  game.roundSummary.calledNumbersCount =
    game.calledNumbers.length;

  await game.save();

  /*
  |--------------------------------------------------------------------------
  | Winner found
  |--------------------------------------------------------------------------
  */

  if (winners.length > 0) {
    const firstWinner =
      winners[0].player;

    const winAmount =
      Number(firstWinner.betAmount || 0) *
      5;

    game.status = "completed";

    game.endTime = new Date();

    game.roundEndedAt = new Date();

    game.winner = {
      telegramId:
        firstWinner.telegramId,

      username:
        firstWinner.username,

      firstName:
        firstWinner.firstName,

      card:
        firstWinner.card,

      winAmount,

      bingoResult:
        winners[0].bingoResult,
    };

    game.roundSummary.endedReason =
      "bingo";

    game.roundSummary.winnerTelegramId =
      firstWinner.telegramId;

    game.roundSummary.winnerUsername =
      firstWinner.username;

    game.roundSummary.winnerAmount =
      winAmount;

    /*
    |--------------------------------------------------------------------------
    | Pay winners
    |--------------------------------------------------------------------------
    */

    for (const winnerData of winners) {
      const player =
        winnerData.player;

      const amount =
        Number(player.betAmount || 0) *
        5;

      const user =
        await User.findOne({
          telegramId:
            normalizeTelegramId(
              player.telegramId,
            ),
        });

      if (user) {
        user.balance += amount;

        user.bingoGames =
          Number(user.bingoGames || 0) +
          1;

        user.bingoWins =
          Number(user.bingoWins || 0) +
          1;

        user.gamesPlayed =
          Number(user.gamesPlayed || 0) +
          1;

        user.gamesWon =
          Number(user.gamesWon || 0) +
          1;

        await user.save();
      }

      const ticket =
        await BingoTicket.findOne({
          gameId,
          telegramId:
            normalizeTelegramId(
              player.telegramId,
            ),
        });

      if (ticket) {
        ticket.isWinner = true;

        ticket.winAmount = amount;

        await ticket.save();
      }
    }

    await game.save();

    return {
      number,

      calledNumbers:
        game.calledNumbers,

      winners:
        winners.map(
          (winnerData) => ({
            telegramId:
              winnerData.player
                .telegramId,

            username:
              winnerData.player
                .username,

            firstName:
              winnerData.player
                .firstName,

            card:
              winnerData.player.card,

            winAmount:
              Number(
                winnerData.player
                  .betAmount || 0,
              ) * 5,

            bingoResult:
              winnerData.bingoResult,
          }),
        ),

      gameEnded: true,

      winner:
        game.winner,
    };
  }

  return {
    number,

    calledNumbers:
      game.calledNumbers,

    winners: [],

    gameEnded: false,
  };
};

/*
|--------------------------------------------------------------------------
| Mark Number
|--------------------------------------------------------------------------
*/

export const markNumber = async (
  gameId,
  telegramId,
  number,
) => {
  const game =
    await BingoGame.findOne({
      gameId,
    });

  if (!game) {
    throw new Error("Game not found");
  }

  const normalizedTelegramId =
    normalizeTelegramId(
      telegramId,
    );

  const player =
    game.players.find(
      (p) =>
        normalizeTelegramId(
          p.telegramId,
        ) === normalizedTelegramId,
    );

  if (!player) {
    throw new Error(
      "Player not in game",
    );
  }

  if (player.isSpectator) {
    throw new Error(
      "Spectators cannot mark numbers",
    );
  }

  if (
    !game.calledNumbers.includes(
      Number(number),
    )
  ) {
    throw new Error(
      "Number has not been called",
    );
  }

  const cardResult =
    checkNumberOnCard(
      player.card,
      Number(number),
    );

  if (!cardResult.found) {
    throw new Error(
      "Number not on card",
    );
  }

  if (
    player.markedNumbers.includes(
      Number(number),
    )
  ) {
    throw new Error(
      "Number already marked",
    );
  }

  player.markedNumbers.push(
    Number(number),
  );

  await game.save();

  const bingoResult =
    checkBingo(
      player.card,
      player.markedNumbers,
    );

  if (!bingoResult.bingo) {
    return {
      bingo: false,

      markedNumbers:
        player.markedNumbers,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Winner
  |--------------------------------------------------------------------------
  */

  const winAmount =
    Number(player.betAmount || 0) *
    5;

  game.status = "completed";

  game.endTime = new Date();

  game.roundEndedAt = new Date();

  game.winner = {
    telegramId:
      player.telegramId,

    username:
      player.username,

    firstName:
      player.firstName,

    card:
      player.card,

    winAmount,

    bingoResult,
  };

  game.roundSummary.endedReason =
    "bingo";

  game.roundSummary.winnerTelegramId =
    player.telegramId;

  game.roundSummary.winnerUsername =
    player.username;

  game.roundSummary.winnerAmount =
    winAmount;

  const user =
    await User.findOne({
      telegramId:
        normalizedTelegramId,
    });

  if (user) {
    user.balance += winAmount;

    user.bingoGames =
      Number(user.bingoGames || 0) +
      1;

    user.bingoWins =
      Number(user.bingoWins || 0) +
      1;

    user.gamesPlayed =
      Number(user.gamesPlayed || 0) +
      1;

    user.gamesWon =
      Number(user.gamesWon || 0) +
      1;

    await user.save();
  }

  const ticket =
    await BingoTicket.findOne({
      gameId,
      telegramId:
        normalizedTelegramId,
    });

  if (ticket) {
    ticket.isWinner = true;

    ticket.winAmount = winAmount;

    await ticket.save();
  }

  await game.save();

  return {
    bingo: true,

    winner:
      game.winner,

    game,
  };
};

/*
|--------------------------------------------------------------------------
| Get Game
|--------------------------------------------------------------------------
*/

export const getGameState = async (
  gameId,
) => {
  const game =
    await BingoGame.findOne({
      gameId,
    });

  if (!game) {
    throw new Error(
      "Game not found",
    );
  }

  return game;
};

/*
|--------------------------------------------------------------------------
| Get Player Card
|--------------------------------------------------------------------------
*/

export const getPlayerCard = async (
  gameId,
  telegramId,
) => {
  const game =
    await BingoGame.findOne({
      gameId,
    });

  if (!game) {
    throw new Error(
      "Game not found",
    );
  }

  const normalizedTelegramId =
    normalizeTelegramId(
      telegramId,
    );

  const player =
    game.players.find(
      (p) =>
        normalizeTelegramId(
          p.telegramId,
        ) === normalizedTelegramId,
    );

  if (!player) {
    throw new Error(
      "Player not in game",
    );
  }

  return {
    card: player.card,

    markedNumbers:
      player.markedNumbers,

    isSpectator:
      player.isSpectator || false,
  };
};

/*
|--------------------------------------------------------------------------
| Spectator
|--------------------------------------------------------------------------
*/

export const joinAsSpectator = async (
  gameId,
  telegramId,
) => {
  const game =
    await BingoGame.findOne({
      gameId,
    });

  if (!game) {
    throw new Error(
      "Game not found",
    );
  }

  if (game.status !== "active") {
    throw new Error(
      "Game is not currently live",
    );
  }

  const normalizedTelegramId =
    normalizeTelegramId(
      telegramId,
    );

  const user =
    await User.findOne({
      telegramId:
        normalizedTelegramId,
    });

  if (!user) {
    throw new Error(
      "User not found",
    );
  }

  const existing =
    game.players.find(
      (player) =>
        normalizeTelegramId(
          player.telegramId,
        ) === normalizedTelegramId,
    );

  /*
  |--------------------------------------------------------------------------
  | Already player
  |--------------------------------------------------------------------------
  */

  if (existing) {
    return {
      game,

      isSpectator:
        existing.isSpectator || false,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Add spectator
  |--------------------------------------------------------------------------
  */

  game.players.push({
    telegramId:
      normalizedTelegramId,

    username:
      user.username ||
      user.firstName ||
      "Spectator",

    firstName:
      user.firstName ||
      "Spectator",

    card: [],

    markedNumbers: [],

    selectedLuckyNumbers: [],

    betAmount: 0,

    isSpectator: true,

    hasBingo: false,
  });

  await game.save();

  return {
    game,

    isSpectator: true,
  };
};