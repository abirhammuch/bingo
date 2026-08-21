import mongoose from "mongoose";

const commissionSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "bingo", unique: true },
    below100Percentage: { type: Number, default: 20, min: 0, max: 100 },
    between100And1000Percentage: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    above1000Percentage: { type: Number, default: 30, min: 0, max: 100 },
  },
  { timestamps: true },
);

const CommissionSettings =
  mongoose.model.CommissionSettings ||
  mongoose.model("CommissionSettings", commissionSettingsSchema);
export default CommissionSettings;
