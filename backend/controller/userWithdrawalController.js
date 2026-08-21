import { randomUUID } from "node:crypto";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import WithdrawalSettings from "../models/WithdrawalSettings.js";

const submitWithdrawal = async (req, res) => {
  try {
    const telegramId = String(req.user.telegramId || "");
    const amount = Number(req.body.amount);
    const method = String(req.body.method || "").trim();
    const account = String(req.body.account || "").trim();

    const settings = (await WithdrawalSettings.findOne({
      key: "default",
    }).lean()) || {
      feeType: "fixed",
      feeAmount: 0,
      minAmount: 50,
      maxAmount: 100000,
    };
    const fee =
      settings.feeType === "percentage"
        ? (amount * Number(settings.feeAmount || 0)) / 100
        : Number(settings.feeAmount || 0);
    const total = amount + fee;

    if (!telegramId || !method || !account) {
      return res.status(400).json({
        success: false,
        message: "Method, account, and amount are required",
      });
    }
    if (
      !Number.isFinite(amount) ||
      amount < settings.minAmount ||
      amount > settings.maxAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal amount is outside the allowed range",
      });
    }

    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const balanceBefore = Number(user.balance);
    const updatedUser = await User.findOneAndUpdate(
      { telegramId, balance: { $gte: total } },
      { $inc: { balance: -total } },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for withdrawal and fee",
      });
    }

    let transaction;
    try {
      transaction = await Transaction.create({
        transactionId: `withdraw:${randomUUID()}`,
        telegramId,
        userId: user._id,
        type: "withdraw",
        amount,
        status: "pending",
        description: `${method} withdrawal request`,
        balanceBefore,
        balanceAfter: updatedUser.balance,
        metadata: { method, account, fee, total, walletDebited: true },
      });
    } catch (error) {
      await User.updateOne({ _id: user._id }, { $inc: { balance: total } });
      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Withdrawal submitted for review",
      transaction: {
        transactionId: transaction.transactionId,
        amount,
        fee,
        total,
        status: transaction.status,
        balance: updatedUser.balance,
      },
    });
  } catch (error) {
    console.error("Withdrawal submission error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit withdrawal" });
  }
};

export default submitWithdrawal;
