import mongoose from "mongoose";

const bonusSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    registrationBonus: { type: Number, default: 100, min: 0 },
    firstDepositBonus: { type: Number, default: 50, min: 0 },
    depositBonusPercentage: { type: Number, default: 5, min: 0, max: 100 },
  },
  { timestamps: true },
);

const BonusSettings =
  mongoose.models.BonusSettings ||
  mongoose.model("BonusSettings", bonusSettingsSchema);

export default BonusSettings;
