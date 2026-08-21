import mongoose from "mongoose";

const withdrawalSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    feeType: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    feeAmount: { type: Number, default: 0, min: 0 },
    minAmount: { type: Number, default: 50, min: 0 },
    maxAmount: { type: Number, default: 100000, min: 0 },
  },
  { timestamps: true },
);

const WithdrawalSettings =
  mongoose.models.WithdrawalSettings ||
  mongoose.model("WithdrawalSettings", withdrawalSettingsSchema);

export default WithdrawalSettings;
