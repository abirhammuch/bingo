import mongoose from "mongoose";

const bingoGameSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
    },

    roomId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting",
    },

    players: [
      {
        telegramId: String,
        username: String,
        firstName: String,
        card: [[Number]], // 5x5 bingo card
        markedNumbers: [Number],
        hasBingo: {
          type: Boolean,
          default: false,
        },
        bingoTime: Date,
        betAmount: {
          type: Number,
          default: 0,
        },
        winAmount: {
          type: Number,
          default: 0,
        },
      },
    ],

    calledNumbers: [Number],

    // Numbers reserved by players during selection phase
    selectedNumbers: {
      type: [Number],
      default: [],
    },

    currentNumber: {
      type: Number,
      default: 0,
    },

    lastCalledAt: Date,

    winner: {
      telegramId: String,
      username: String,
      winAmount: Number,
    },

    startTime: Date,
    endTime: Date,

    maxPlayers: {
      type: Number,
      default: 10,
    },

    minBet: {
      type: Number,
      default: 1,
    },

    maxBet: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  },
);

const BingoGame =
  mongoose.model.BingoGame || mongoose.model("BingoGame", bingoGameSchema);

export default BingoGame;
