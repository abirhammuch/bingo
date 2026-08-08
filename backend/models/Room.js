import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: "Bingo Room",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    maxPlayers: {
      type: Number,
      default: 10,
    },
    minBet: {
      type: Number,
      default: 1,
    },
    maxBet: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ["open", "closed", "in-game"],
      default: "open",
    },
    players: [
      {
        telegramId: String,
        username: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Room = mongoose.model.Room || mongoose.model("Room", roomSchema);
export default Room;
