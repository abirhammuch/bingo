import mongoose from "mongoose";

const referralSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    depositPercentage: { type: Number, default: 5, min: 0, max: 100 },
    wagerPercentage: { type: Number, default: 1, min: 0, max: 100 },
  },
  { timestamps: true },
);

const ReferralSettings =
  mongoose.models.ReferralSettings ||
  mongoose.model("ReferralSettings", referralSettingsSchema);

export default ReferralSettings;
