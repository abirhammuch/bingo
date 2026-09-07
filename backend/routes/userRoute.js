import express from "express";
import {
  telegramLogin,
  telegramLoginWithCode,
  telegramWebAppLogin,
  getUserProfile,
  updateUserProfile,
  getUserBalance,
  getUserStats,
  adminAddCoins,
  adminDeductCoins,
  adminSetBalance,
  getAllUsers,
  toggleUserBlock,
  toggleUserActive,
} from "../controller/userController.js";
import userHistory from "../controller/userHistoryController.js";
import submitDeposit from "../controller/userDepositController.js";
import submitWithdrawal from "../controller/userWithdrawalController.js";
import redeemCoupon from "../controller/userCouponController.js";
import { userAuth } from "../middleware/userAuth.js";
import WithdrawalSettings from "../models/WithdrawalSettings.js";
import TournamentSettings from "../models/TournamentSettings.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const userRouter = express.Router();

// Public user routes
userRouter.post("/telegram-login", telegramLogin);
userRouter.post("/telegram-login-code", telegramLoginWithCode);
userRouter.post("/telegram-webapp-login", telegramWebAppLogin);
userRouter.get("/profile/:telegramId", getUserProfile);
userRouter.patch("/profile/:telegramId", updateUserProfile);
userRouter.get("/balance/:telegramId", getUserBalance);
userRouter.get("/stats/:telegramId", getUserStats);
userRouter.get("/history", userAuth, userHistory);
userRouter.post("/deposits", userAuth, submitDeposit);
userRouter.post("/withdrawals", userAuth, submitWithdrawal);
userRouter.get("/tournament", userAuth, async (req, res) => {
  try {
    const settings =
      (await TournamentSettings.findOne({ key: "default" }).lean()) ||
      new TournamentSettings().toObject();
    const users = await User.find({ isBlocked: { $ne: true } })
      .select("telegramId username firstName lastName referralCount")
      .lean();
    const referredUsers = await User.find({
      referredBy: { $in: users.map((entry) => entry.telegramId) },
    })
      .select("telegramId referredBy")
      .lean();
    const referredOwnerByTelegramId = new Map(
      referredUsers.map((entry) => [entry.telegramId, entry.referredBy]),
    );
    const depositRows = await Transaction.aggregate([
      {
        $match: {
          type: "deposit",
          status: "completed",
          telegramId: { $in: referredUsers.map((entry) => entry.telegramId) },
        },
      },
      { $group: { _id: "$telegramId", deposits: { $sum: 1 } } },
    ]);
    const depositCountByOwner = new Map();
    depositRows.forEach((row) => {
      const owner = referredOwnerByTelegramId.get(row._id);
      if (owner)
        depositCountByOwner.set(
          owner,
          (depositCountByOwner.get(owner) || 0) + row.deposits,
        );
    });
    const registrationPoints = Number(
      settings.registrationPoints ?? settings.pointsPerReferral ?? 0,
    );
    const depositPoints = Number(settings.depositPoints ?? 50);
    const leaderboard = users
      .map((entry) => {
        const invited = Number(entry.referralCount || 0);
        const deposits = depositCountByOwner.get(entry.telegramId) || 0;
        return {
          ...entry,
          invited,
          deposits,
          points: invited * registrationPoints + deposits * depositPoints,
        };
      })
      .filter((entry) => entry.invited > 0 || entry.deposits > 0)
      .sort(
        (left, right) =>
          right.points - left.points || right.invited - left.invited,
      )
      .slice(0, 100)
      .map((entry, index) => ({
        rank: index + 1,
        telegramId: entry.telegramId,
        name:
          entry.username ||
          [entry.firstName, entry.lastName].filter(Boolean).join(" ") ||
          "Player",
        invited: entry.invited,
        deposits: entry.deposits,
        points: entry.points,
      }));
    res.json({ success: true, settings, leaderboard });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to load tournament" });
  }
});
userRouter.post("/coupons/redeem", userAuth, redeemCoupon);
userRouter.get("/withdraw-settings", userAuth, async (req, res) => {
  try {
    const settings = (await WithdrawalSettings.findOne({
      key: "default",
    }).lean()) || {
      feeType: "fixed",
      feeAmount: 0,
      minAmount: 200,
      maxAmount: 100000,
    };
    settings.minAmount = Math.max(Number(settings.minAmount || 200), 200);
    res.json({ success: true, settings });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to load withdrawal settings" });
  }
});

// Admin user routes
userRouter.post("/admin/add-coins", adminAddCoins);
userRouter.post("/admin/deduct-coins", adminDeductCoins);
userRouter.patch("/admin/balance", adminSetBalance);
userRouter.get("/admin/users", getAllUsers);
userRouter.patch("/admin/block/:telegramId", toggleUserBlock);
userRouter.patch("/admin/active/:telegramId", toggleUserActive);

export default userRouter;
