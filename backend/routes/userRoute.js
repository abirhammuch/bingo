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
