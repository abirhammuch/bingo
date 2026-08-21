import { randomUUID } from "node:crypto";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const MIN_DEPOSIT = 50;

const submitDeposit = async (req, res) => {
  try {
    const telegramId = String(req.user.telegramId || "");
    const amount = Number(req.body.amount);
    const method = String(req.body.method || "").trim();
    const receipt = String(req.body.receipt || "").trim();
    const account = String(req.body.account || "").trim();

    if (!telegramId || !method || !receipt) {
      return res.status(400).json({
        success: false,
        message: "Method and payment receipt are required",
      });
    }
    if (!Number.isFinite(amount) || amount < MIN_DEPOSIT) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is ${MIN_DEPOSIT} ETB`,
      });
    }

    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const transaction = await Transaction.create({
      transactionId: `deposit:${randomUUID()}`,
      telegramId,
      userId: user._id,
      type: "deposit",
      amount,
      status: "pending",
      reference: receipt,
      description: `${method} deposit request`,
      metadata: { method, account },
    });

    res.status(201).json({
      success: true,
      message: "Deposit submitted for review",
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        method,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error("Deposit submission error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit deposit" });
  }
};

export default submitDeposit;
