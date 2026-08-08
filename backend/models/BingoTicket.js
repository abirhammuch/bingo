import mongoose from "mongoose";

const bingoTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },

    gameId: {
      type: String,
      required: true,
    },

    telegramId: {
      type: String,
      required: true,
    },

    card: [[Number]], // 5x5 bingo card

    numbers: [Number], // All numbers on the card (flattened)

    markedNumbers: [Number],

    isWinner: {
      type: Boolean,
      default: false,
    },

    winAmount: {
      type: Number,
      default: 0,
    },

    betAmount: {
      type: Number,
      default: 0,
    },

    purchaseTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

bingoTicketSchema.index({ gameId: 1, telegramId: 1 });

const BingoTicket = mongoose.model.BingoTicket || mongoose.model("BingoTicket", bingoTicketSchema);

export default BingoTicket;