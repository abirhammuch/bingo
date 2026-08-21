import mongoose from "mongoose";

// ============================================================
// PLAYER SCHEMA
// ============================================================

const playerSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      default: "",
    },

    firstName: {
      type: String,
      default: "",
    },

    lastName: {
      type: String,
      default: "",
    },

    // ========================================================
    // PLAYER / SPECTATOR
    // ========================================================
    //
    // false = real player
    // true  = spectator
    //
    isSpectator: {
      type: Boolean,
      default: false,
    },

    // ========================================================
    // BINGO CARD
    // ========================================================

    card: {
      type: [[Number]],
      default: [],
    },

    cards: {
      type: [[[Number]]],
      default: [],
    },

    // ========================================================
    // MARKED NUMBERS
    // ========================================================
    //
    // Numbers automatically marked after they are called.
    //

    markedNumbers: {
      type: [Number],
      default: [],
    },

    // ========================================================
    // SELECTED NUMBERS
    // ========================================================
    //
    // Numbers selected during the 30-second selection phase.
    //

    selectedLuckyNumbers: {
      type: [Number],
      default: [],
    },

    // Number of cards selected by this player.
    //
    // 0 = spectator / no card
    // 1 = one card
    // 2 = two cards
    // 3 = three cards
    //

    cardsSelected: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },

    // ========================================================
    // BINGO RESULT
    // ========================================================

    hasBingo: {
      type: Boolean,
      default: false,
    },

    bingoTime: {
      type: Date,
      default: null,
    },

    // ========================================================
    // MONEY
    // ========================================================

    betAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    winAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // JOIN TIME
    // ========================================================

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

// ============================================================
// BINGO GAME SCHEMA
// ============================================================

const bingoGameSchema = new mongoose.Schema(
  {
    // ========================================================
    // GAME INFORMATION
    // ========================================================

    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    roomId: {
      type: String,
      required: true,
      index: true,
    },

    // ========================================================
    // GAME STATUS
    // ========================================================

    status: {
      type: String,
      enum: ["waiting", "ready", "active", "completed"],
      default: "waiting",
      index: true,
    },

    // ========================================================
    // PLAYERS + SPECTATORS
    // ========================================================
    //
    // Both players and spectators are stored here.
    //
    // Real player:
    // isSpectator = false
    //
    // Spectator:
    // isSpectator = true
    //

    players: {
      type: [playerSchema],
      default: [],
    },

    // ========================================================
    // CALLED NUMBERS
    // ========================================================
    //
    // Numbers called during LIVE.
    //

    calledNumbers: {
      type: [Number],
      default: [],
    },

    // ========================================================
    // SELECTED NUMBERS
    // ========================================================
    //
    // Global selected numbers for the current round.
    //

    selectedNumbers: {
      type: [Number],
      default: [],
    },

    // ========================================================
    // CURRENT NUMBER
    // ========================================================

    currentNumber: {
      type: Number,
      default: null,
    },

    // ========================================================
    // GLOBAL 30 SECOND TIMER
    // ========================================================
    //
    // IMPORTANT:
    //
    // This belongs to the GAME/ROUND.
    //
    // It is NOT created separately for every user.
    //
    // Every connected user sees the same countdown.
    //

    selectionEndsAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // NUMBER CALLING
    // ========================================================

    lastCalledAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // ROUND
    // ========================================================

    roundNumber: {
      type: Number,
      default: 1,
    },

    // Number of REAL players only.
    //
    // Spectators are not counted.
    //

    playerCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // ROUND TIME
    // ========================================================

    roundStartedAt: {
      type: Date,
      default: null,
    },

    roundEndedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // WINNER
    // ========================================================
    //
    // This information remains available after the round ends
    // so it can be sent to all participants and spectators.
    //

    winner: {
      telegramId: {
        type: String,
        default: null,
      },

      username: {
        type: String,
        default: null,
      },

      firstName: {
        type: String,
        default: null,
      },

      winAmount: {
        type: Number,
        default: 0,
      },

      // Winner's complete 5x5 card.
      card: {
        type: [[Number]],
        default: [],
      },

      // Information about the Bingo pattern/result.
      bingoResult: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    // ========================================================
    // ROUND SUMMARY
    // ========================================================

    roundSummary: {
      playerCount: {
        type: Number,
        default: 0,
      },

      maxPlayers: {
        type: Number,
        default: 10,
      },

      totalBetAmount: {
        type: Number,
        default: 0,
      },

      commissionPercentage: { type: Number, default: 0 },

      commissionAmount: { type: Number, default: 0 },

      playerPayoutTotal: { type: Number, default: 0 },

      calledNumbersCount: {
        type: Number,
        default: 0,
      },

      selectedNumbersCount: {
        type: Number,
        default: 0,
      },

      winnerTelegramId: {
        type: String,
        default: null,
      },

      winnerUsername: {
        type: String,
        default: null,
      },

      winnerAmount: {
        type: Number,
        default: 0,
      },

      endedReason: {
        type: String,
        default: "waiting",
      },
    },

    // ========================================================
    // GENERAL GAME TIMES
    // ========================================================

    startTime: {
      type: Date,
      default: null,
    },

    endTime: {
      type: Date,
      default: null,
    },

    // ========================================================
    // GAME SETTINGS
    // ========================================================

    maxPlayers: {
      type: Number,
      default: 10,
      min: 1,
    },

    minBet: {
      type: Number,
      default: 1,
      min: 0,
    },

    maxBet: {
      type: Number,
      default: 100,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// INDEXES
// ============================================================

bingoGameSchema.index({
  roomId: 1,
  status: 1,
});

bingoGameSchema.index({
  status: 1,
  selectionEndsAt: 1,
});

// ============================================================
// EXPORT
// ============================================================

const BingoGame =
  mongoose.models.BingoGame || mongoose.model("BingoGame", bingoGameSchema);

export default BingoGame;
