import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import CommissionSettings from "../models/CommissionSettings.js";
import BingoGame from "../models/BingoGame.js";
import Transaction from "../models/Transaction.js";
import WithdrawalSettings from "../models/WithdrawalSettings.js";
import ReferralSettings from "../models/ReferralSettings.js";
import { creditReferralReward } from "../services/wallet/referralService.js";

const router = express.Router();

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      authHeader.split(" ")[1],
      process.env.JWT_SECRET,
    );
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

router.get("/withdraw-fee", requireAdmin, async (req, res) => {
  const settings = (await WithdrawalSettings.findOne({
    key: "default",
  }).lean()) || {
    feeType: "fixed",
    feeAmount: 0,
    minAmount: 50,
    maxAmount: 100000,
  };
  res.json({ success: true, settings });
});

router.patch("/withdraw-fee", requireAdmin, async (req, res) => {
  try {
    const { feeType } = req.body;
    const feeAmount = Number(req.body.feeAmount);
    const minAmount = Number(req.body.minAmount);
    const maxAmount = Number(req.body.maxAmount);
    if (
      !["fixed", "percentage"].includes(feeType) ||
      !Number.isFinite(feeAmount) ||
      feeAmount < 0 ||
      !Number.isFinite(minAmount) ||
      !Number.isFinite(maxAmount) ||
      minAmount < 0 ||
      maxAmount < minAmount
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid withdrawal fee settings" });
    }
    const settings = await WithdrawalSettings.findOneAndUpdate(
      { key: "default" },
      { key: "default", feeType, feeAmount, minAmount, maxAmount },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ success: true, settings });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to save withdrawal fee settings",
    });
  }
});

// Simple admin password login (no Telegram initData required)
router.post("/login", async (req, res) => {
  const { password } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

  if (!ADMIN_SECRET || password !== ADMIN_SECRET) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid admin password" });
  }

  // Generate a JWT that marks the user as an admin
  const token = jwt.sign(
    { role: "admin", isAdmin: true },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  res.json({ success: true, token });
});

// Protected admin route: Get all users (no initData required)
router.get("/users", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const users = await User.find().select("-__v").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGames,
      activeGames,
      userBalanceTotals,
      walletFlowTotals,
      transactionTotals,
      currentRound,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, isBlocked: false }),
      BingoGame.countDocuments(),
      BingoGame.countDocuments({ status: { $in: ["waiting", "active"] } }),
      User.aggregate([
        { $group: { _id: null, totalUserBalance: { $sum: "$balance" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            type: { $in: ["deposit", "withdraw"] },
          },
        },
        {
          $group: {
            _id: null,
            deposits: {
              $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] },
            },
            withdrawals: {
              $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] },
            },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            type: { $in: ["BET", "COMMISSION"] },
          },
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: { $cond: [{ $eq: ["$type", "BET"] }, "$amount", 0] },
            },
            commission: {
              $sum: {
                $cond: [{ $eq: ["$type", "COMMISSION"] }, "$amount", 0],
              },
            },
          },
        },
      ]),
      BingoGame.findOne({ status: { $in: ["waiting", "active"] } })
        .sort({ roundNumber: -1 })
        .select("status minBet players selectionEndsAt roundNumber")
        .lean(),
    ]);

    const totals = transactionTotals[0] || {};
    const totalUserBalance = userBalanceTotals[0]?.totalUserBalance || 0;
    const walletFlows = walletFlowTotals[0] || {};
    const systemBalance =
      Number(walletFlows.deposits || 0) -
      Number(walletFlows.withdrawals || 0) -
      Number(totalUserBalance);
    const players = currentRound?.players || [];

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalGames,
        activeGames,
        revenue: totals.revenue || 0,
        commission: totals.commission || 0,
        referralCount: 0,
        referralEarnings: 0,
        totalUserBalance,
        systemBalance,
      },
      currentRound: currentRound
        ? {
            status: currentRound.status,
            stakeAmount: currentRound.minBet ?? 0,
            playerCount: players.filter((player) => !player.isSpectator).length,
            selectionEndsAt: currentRound.selectionEndsAt || null,
            roundNumber: currentRound.roundNumber || null,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
});

router.get("/coupons", requireAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch coupons" });
  }
});

router.post("/coupons", requireAdmin, async (req, res) => {
  try {
    const { code, type, value, expiry, perUserLimit } = req.body;
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();
    const numericValue = Number(value);
    if (!normalizedCode || !Number.isFinite(numericValue) || numericValue < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Code and valid value are required" });
    }
    const coupon = await Coupon.create({
      code: normalizedCode,
      type: type || "Bonus Type",
      value: numericValue,
      expiry: expiry || null,
      perUserLimit: Math.max(1, Number(perUserLimit) || 1),
    });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    const duplicate = error.code === 11000;
    res.status(duplicate ? 409 : 500).json({
      success: false,
      message: duplicate
        ? "Coupon code already exists"
        : "Failed to create coupon",
    });
  }
});

router.patch("/coupons/:id", requireAdmin, async (req, res) => {
  try {
    const updates = {};
    if (req.body.code !== undefined)
      updates.code = String(req.body.code).trim().toUpperCase();
    if (req.body.type !== undefined) updates.type = req.body.type;
    if (req.body.value !== undefined) updates.value = Number(req.body.value);
    if (req.body.expiry !== undefined) updates.expiry = req.body.expiry || null;
    if (req.body.perUserLimit !== undefined) {
      updates.perUserLimit = Math.max(1, Number(req.body.perUserLimit) || 1);
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    res.json({ success: true, coupon });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Failed to update coupon" });
  }
});

router.patch("/coupons/:id/toggle", requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, coupon });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to update coupon status" });
  }
});

router.get("/commission", requireAdmin, async (req, res) => {
  try {
    const defaults = {
      below100Percentage: 20,
      between100And1000Percentage: 25,
      above1000Percentage: 30,
    };
    const settings = {
      ...defaults,
      ...((await CommissionSettings.findOne({ key: "bingo" }).lean()) || {}),
    };
    const rounds = await BingoGame.find({
      "roundSummary.commissionAmount": { $gt: 0 },
    })
      .select("gameId roundSummary roundEndedAt")
      .sort({ roundEndedAt: -1 })
      .limit(20)
      .lean();
    const [totalsResult] = await BingoGame.aggregate([
      { $match: { "roundSummary.commissionAmount": { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$roundSummary.totalBetAmount" },
          totalCommission: { $sum: "$roundSummary.commissionAmount" },
        },
      },
    ]);
    const totals = {
      totalBalance: totalsResult?.totalBalance || 0,
      totalCommission: totalsResult?.totalCommission || 0,
    };
    res.json({ success: true, settings, rounds, totals });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load commission data" });
  }
});

router.patch("/commission", requireAdmin, async (req, res) => {
  try {
    const values = [
      req.body.below100Percentage,
      req.body.between100And1000Percentage,
      req.body.above1000Percentage,
    ];
    if (
      values.some(
        (value) =>
          !Number.isFinite(Number(value)) ||
          Number(value) < 0 ||
          Number(value) > 100,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Commission percentages must be between 0 and 100",
      });
    }
    const settings = await CommissionSettings.findOneAndUpdate(
      { key: "bingo" },
      {
        key: "bingo",
        below100Percentage: Number(req.body.below100Percentage),
        between100And1000Percentage: Number(
          req.body.between100And1000Percentage,
        ),
        above1000Percentage: Number(req.body.above1000Percentage),
      },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update commission settings",
    });
  }
});

router.delete("/commission", requireAdmin, async (req, res) => {
  try {
    await CommissionSettings.deleteOne({ key: "bingo" });
    res.json({
      success: true,
      settings: {
        below100Percentage: 20,
        between100And1000Percentage: 25,
        above1000Percentage: 30,
      },
      message: "Commission rules deleted and defaults restored",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete commission rules",
    });
  }
});

router.get("/referral-settings", requireAdmin, async (req, res) => {
  const settings = (await ReferralSettings.findOne({
    key: "default",
  }).lean()) || {
    key: "default",
    depositPercentage: 5,
    wagerPercentage: 1,
  };
  res.json({ success: true, settings });
});

router.patch("/referral-settings", requireAdmin, async (req, res) => {
  const depositPercentage = Number(req.body.depositPercentage);
  const wagerPercentage = Number(req.body.wagerPercentage);
  if (
    !Number.isFinite(depositPercentage) ||
    !Number.isFinite(wagerPercentage) ||
    depositPercentage < 0 ||
    depositPercentage > 100 ||
    wagerPercentage < 0 ||
    wagerPercentage > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Referral percentages must be between 0 and 100",
    });
  }
  const settings = await ReferralSettings.findOneAndUpdate(
    { key: "default" },
    { key: "default", depositPercentage, wagerPercentage },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ success: true, settings });
});

router.get("/transactions/requests", requireAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      type: { $in: ["deposit", "withdraw"] },
    })
      .populate("userId", "firstName username telegramId")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ success: true, transactions });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to load wallet requests" });
  }
});

router.get("/transactions", requireAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "firstName username telegramId")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, transactions });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to load transactions" });
  }
});

router.patch(
  "/transactions/:transactionId/:action",
  requireAdmin,
  async (req, res) => {
    const { transactionId, action } = req.params;
    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction action" });
    }

    try {
      const transaction = await Transaction.findOne({
        transactionId,
        type: { $in: ["deposit", "withdraw"] },
        status: "pending",
      });
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Pending wallet request not found",
        });
      }

      if (action === "reject") {
        const user = await User.findOne({ telegramId: transaction.telegramId });
        const balanceBefore = user ? Number(user.balance) : null;
        const refundAmount =
          transaction.type === "withdraw" && transaction.metadata?.walletDebited
            ? Number(transaction.metadata.total ?? transaction.amount)
            : 0;

        if (user && refundAmount > 0) {
          user.balance = Number(user.balance) + refundAmount;
          await user.save();
        }
        transaction.status = "failed";
        transaction.balanceBefore = balanceBefore;
        transaction.balanceAfter = user
          ? Number(user.balance)
          : transaction.balanceAfter;
        if (refundAmount > 0) {
          transaction.metadata = {
            ...(transaction.metadata || {}),
            walletRefunded: true,
          };
        }
        await transaction.save();
        return res.json({
          success: true,
          transaction,
          balance: user?.balance,
        });
      }

      const user = await User.findOne({ telegramId: transaction.telegramId });
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const walletAlreadyDebited =
        transaction.type === "withdraw" &&
        transaction.metadata?.walletDebited === true;
      const walletChange =
        transaction.type === "deposit"
          ? Number(transaction.amount)
          : walletAlreadyDebited
            ? 0
            : -Number(transaction.metadata?.total ?? transaction.amount);
      const nextBalance = Number(user.balance) + walletChange;
      if (nextBalance < 0) {
        return res
          .status(400)
          .json({ success: false, message: "User balance is insufficient" });
      }

      transaction.status = "completed";
      transaction.balanceBefore = Number(user.balance);
      transaction.balanceAfter = nextBalance;
      user.balance = nextBalance;
      await user.save();
      await transaction.save();
      if (transaction.type === "deposit") {
        await creditReferralReward({
          referredTelegramId: transaction.telegramId,
          baseAmount: transaction.amount,
          kind: "deposit",
          reference: transaction.reference || transaction.transactionId,
        });
      }

      res.json({ success: true, transaction, balance: nextBalance });
    } catch (error) {
      console.error("Wallet request approval error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update wallet request" });
    }
  },
);

router.get("/stake", requireAdmin, async (req, res) => {
  try {
    const game = await BingoGame.findOne({
      status: { $in: ["waiting", "active"] },
    }).sort({ roundNumber: -1 });
    res.json({
      success: true,
      stake: {
        gameId: game?.gameId || null,
        roomId: game?.roomId || "default-bingo-room",
        status: game?.status || "waiting",
        stakeAmount: game?.minBet ?? 10,
        maxPlayers: game?.maxPlayers ?? 10,
      },
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to load stake settings" });
  }
});

router.patch("/stake", requireAdmin, async (req, res) => {
  try {
    const stakeAmount = Number(req.body.stakeAmount);
    if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stake amount must be greater than zero",
      });
    }
    const game = await BingoGame.findOne({
      status: { $in: ["waiting", "active"] },
    }).sort({ roundNumber: -1 });
    if (!game)
      return res
        .status(404)
        .json({ success: false, message: "No active Bingo round found" });
    game.minBet = stakeAmount;
    game.maxBet = stakeAmount;
    await game.save();
    res.json({
      success: true,
      message: "Stake settings updated for the current round",
      stake: {
        gameId: game.gameId,
        roomId: game.roomId,
        status: game.status,
        stakeAmount: game.minBet,
        maxPlayers: game.maxPlayers,
      },
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to update stake settings" });
  }
});

export default router;
