import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    username: {
      type: String,
      default: "",
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      default: "",
      trim: true,
    },

    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },

    isRegistered: {
      type: Boolean,
      default: false,
    },

    loginCode: {
      type: String,
      default: null,
      select: false,
    },

    loginCodeExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    referredBy: {
      type: String,
      default: null,
      index: true,
    },

    referralCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    referralEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonusWagerRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonusBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    gamesPlayed: {
      type: Number,
      default: 0,
    },

    gamesWon: {
      type: Number,
      default: 0,
    },

    bingoGames: {
      type: Number,
      default: 0,
    },

    bingoWins: {
      type: Number,
      default: 0,
    },

    ludoGames: {
      type: Number,
      default: 0,
    },

    ludoWins: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.model.User || mongoose.model("User", userSchema);

export default UserModel;
