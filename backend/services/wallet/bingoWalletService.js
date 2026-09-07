import mongoose from "mongoose";
import User from "../../models/User.js";
import Transaction from "../../models/Transaction.js";
import { creditReferralReward } from "./referralService.js";

const withSession = async (callback) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const findExistingTransaction = async (reference) =>
  Transaction.findOne({ reference }).lean();

export const chargeBingoCard = async ({
  telegramId,
  gameId,
  cardReference,
  stakePerCard,
}) => {
  const amount = Number(stakePerCard);
  const reference = `bingo-card:${gameId}:${telegramId}:${cardReference}`;

  const existing = await findExistingTransaction(reference);
  if (existing) {
    const user = await User.findOne({ telegramId }).select("balance").lean();
    return { balance: user?.balance ?? 0, amount, alreadyCharged: true };
  }

  try {
    const result = await withSession(async (session) => {
      const user = await User.findOneAndUpdate(
        { telegramId: String(telegramId), balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: false, session },
      );

      if (!user) {
        const current = await User.findOne({ telegramId: String(telegramId) })
          .select("balance")
          .lean();
        const error = new Error("Insufficient wallet balance");
        error.code = "INSUFFICIENT_BALANCE";
        error.balance = current?.balance ?? 0;
        error.required = amount;
        throw error;
      }

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore - amount;
      const wagerFromBonus = Math.min(
        amount,
        Math.max(0, Number(user.bonusWagerRemaining || 0)),
      );
      if (wagerFromBonus > 0) {
        await User.updateOne(
          { _id: user._id },
          {
            $inc: {
              bonusWagerRemaining: -wagerFromBonus,
              bonusBalance: -Math.min(
                wagerFromBonus,
                Number(user.bonusBalance || 0),
              ),
            },
          },
          { session },
        );
      }

      try {
        await Transaction.create(
          [
            {
              transactionId: reference,
              telegramId: String(telegramId),
              type: "BET",
              userId: user._id,
              amount,
              status: "completed",
              reference,
              balanceBefore,
              balanceAfter,
              description: "Bingo card purchase",
              metadata: { gameId, cardReference, stakePerCard: amount },
            },
          ],
          { session },
        );
      } catch (error) {
        if (error.code === 11000) {
          throw Object.assign(new Error("Duplicate card purchase"), {
            code: "DUPLICATE_CARD_PURCHASE",
          });
        }
        throw error;
      }

      return { balance: balanceAfter, amount, alreadyCharged: false };
    });
    await creditReferralReward({
      referredTelegramId: String(telegramId),
      baseAmount: amount,
      kind: "wager",
      reference,
    });
    return result;
  } catch (error) {
    if (
      error.code === "DUPLICATE_CARD_PURCHASE" &&
      (await findExistingTransaction(reference))
    ) {
      const user = await User.findOne({ telegramId }).select("balance").lean();
      return { balance: user?.balance ?? 0, amount, alreadyCharged: true };
    }
    throw error;
  }
};

export const creditBingoWinner = async ({
  telegramId,
  gameId,
  amount,
  description = "Bingo winning prize",
}) => {
  const payout = Number(amount);
  const reference = `bingo-win:${gameId}:${telegramId}`;
  const existing = await findExistingTransaction(reference);
  if (existing) {
    const user = await User.findOne({ telegramId }).select("balance").lean();
    return { balance: user?.balance ?? 0, alreadyPaid: true };
  }

  try {
    return await withSession(async (session) => {
      const user = await User.findOneAndUpdate(
        { telegramId: String(telegramId) },
        { $inc: { balance: payout } },
        { new: false, session },
      );
      if (!user) throw new Error("Winner user not found");

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + payout;
      try {
        await Transaction.create(
          [
            {
              transactionId: reference,
              telegramId: String(telegramId),
              type: "WIN",
              userId: user._id,
              amount: payout,
              status: "completed",
              reference,
              balanceBefore,
              balanceAfter,
              description,
              metadata: { gameId },
            },
          ],
          { session },
        );
      } catch (error) {
        if (error.code === 11000) {
          throw Object.assign(new Error("Duplicate winner payout"), {
            code: "DUPLICATE_WINNER_PAYOUT",
          });
        }
        throw error;
      }
      return { balance: balanceAfter, alreadyPaid: false };
    });
  } catch (error) {
    if (
      error.code === "DUPLICATE_WINNER_PAYOUT" &&
      (await findExistingTransaction(reference))
    ) {
      const user = await User.findOne({ telegramId }).select("balance").lean();
      return { balance: user?.balance ?? 0, alreadyPaid: true };
    }
    throw error;
  }
};

export const recordBingoCommission = async ({ gameId, amount }) => {
  const commission = Number(amount);
  const reference = `bingo-commission:${gameId}`;
  if (await findExistingTransaction(reference)) return;
  try {
    await Transaction.create({
      transactionId: reference,
      telegramId: "SYSTEM",
      type: "COMMISSION",
      amount: commission,
      status: "completed",
      reference,
      description: "Bingo round commission",
      metadata: { gameId, commission: true },
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

export const refundBingoPlayer = async ({
  telegramId,
  gameId,
  amount,
  cardReference,
}) => {
  const refundAmount = Number(amount);
  const reference = cardReference
    ? `bingo-refund:${gameId}:${telegramId}:${cardReference}`
    : `bingo-refund:${gameId}:${telegramId}`;
  const existing = await findExistingTransaction(reference);
  if (existing) return { alreadyRefunded: true };

  try {
    return await withSession(async (session) => {
      const user = await User.findOneAndUpdate(
        { telegramId: String(telegramId) },
        { $inc: { balance: refundAmount } },
        { new: false, session },
      );
      if (!user) throw new Error("Refund user not found");

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + refundAmount;
      await Transaction.create(
        [
          {
            transactionId: reference,
            telegramId: String(telegramId),
            userId: user._id,
            type: "REFUND",
            amount: refundAmount,
            status: "completed",
            reference,
            balanceBefore,
            balanceAfter,
            description: "Bingo card purchase refund",
            metadata: { gameId },
          },
        ],
        { session },
      );
      return { balance: balanceAfter, alreadyRefunded: false };
    });
  } catch (error) {
    if (error.code === 11000 && (await findExistingTransaction(reference))) {
      return { alreadyRefunded: true };
    }
    throw error;
  }
};
