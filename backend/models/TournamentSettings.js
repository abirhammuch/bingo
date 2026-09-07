import mongoose from "mongoose";

const prizeSchema = new mongoose.Schema(
  {
    place: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const tournamentSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    startDate: { type: Date, default: "2026-09-01T00:00:00.000Z" },
    endDate: { type: Date, default: "2026-09-30T23:59:59.000Z" },
    pointsPerReferral: { type: Number, default: 20, min: 0 },
    prizes: {
      type: [prizeSchema],
      default: [
        { place: 1, amount: 10000 },
        { place: 2, amount: 5000 },
        { place: 3, amount: 2500 },
      ],
    },
  },
  { timestamps: true },
);

const TournamentSettings =
  mongoose.models.TournamentSettings ||
  mongoose.model("TournamentSettings", tournamentSettingsSchema);

export default TournamentSettings;
