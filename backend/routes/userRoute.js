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

const userRouter = express.Router();

// Public user routes
userRouter.post("/telegram-login", telegramLogin);
userRouter.post("/telegram-login-code", telegramLoginWithCode);
userRouter.post("/telegram-webapp-login", telegramWebAppLogin);
userRouter.get("/profile/:telegramId", getUserProfile);
userRouter.patch("/profile/:telegramId", updateUserProfile);
userRouter.get("/balance/:telegramId", getUserBalance);
userRouter.get("/stats/:telegramId", getUserStats);

// Admin user routes
userRouter.post("/admin/add-coins", adminAddCoins);
userRouter.post("/admin/deduct-coins", adminDeductCoins);
userRouter.patch("/admin/balance", adminSetBalance);
userRouter.get("/admin/users", getAllUsers);
userRouter.patch("/admin/block/:telegramId", toggleUserBlock);
userRouter.patch("/admin/active/:telegramId", toggleUserActive);

export default userRouter;
