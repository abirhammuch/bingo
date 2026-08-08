import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const Wallet = mongoose.model.Wallet || mongoose.model("Wallet", walletSchema);
export default Wallet;
