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
      enum: ["deposit", "withdraw", "bet", "reward", "refund"],
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const Transaction = mongoose.model.Transaction || mongoose.model("Transaction", transactionSchema);
export default Transaction;
