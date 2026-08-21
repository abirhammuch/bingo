import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    telegramId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "deposit",
        "withdraw",
        "bet",
        "reward",
        "refund",
        "COUPON",
        "BET",
        "WIN",
        "REFUND",
        "COMMISSION",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    reference: {
      type: String,
      default: "",
    },
    balanceBefore: { type: Number, default: null },
    balanceAfter: { type: Number, default: null },
    description: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const Transaction =
  mongoose.model.Transaction ||
  mongoose.model("Transaction", transactionSchema);
export default Transaction;
