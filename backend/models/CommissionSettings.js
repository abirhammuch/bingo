import mongoose from "mongoose";

const commissionSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "bingo", unique: true },
    percentage: { type: Number, default: 5, min: 0, max: 100 },
    tierOnePercentage: { type: Number, default: 4, min: 0, max: 100 },
    tierTwoPercentage: { type: Number, default: 6, min: 0, max: 100 },
  },
  { timestamps: true },
);

const CommissionSettings =
  mongoose.model.CommissionSettings ||
  mongoose.model("CommissionSettings", commissionSettingsSchema);
export default CommissionSettings;
