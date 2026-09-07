import ReferralSettings from "../../models/ReferralSettings.js";
import Transaction from "../../models/Transaction.js";
import User from "../../models/User.js";

export const getReferralSettings = async () =>
  (await ReferralSettings.findOne({ key: "default" }).lean()) || {
    depositPercentage: 5,
    wagerPercentage: 1,
  };

export const creditReferralReward = async ({
  referredTelegramId,
  baseAmount,
  kind,
  reference,
}) => {
  const referredUser = await User.findOne({ telegramId: referredTelegramId })
    .select("referredBy")
    .lean();
  if (!referredUser?.referredBy) return null;

  const settings = await getReferralSettings();
  const percentage =
    kind === "deposit"
      ? Number(settings.depositPercentage || 0)
      : Number(settings.wagerPercentage || 0);
  const amount = Number(baseAmount || 0);
  const reward = Number(((amount * percentage) / 100).toFixed(2));
  if (!Number.isFinite(reward) || reward <= 0) return null;

  const rewardReference = `referral:${kind}:${reference}`;
  if (await Transaction.exists({ reference: rewardReference })) return null;

  const inviter = await User.findOne({ telegramId: referredUser.referredBy });
  if (!inviter) return null;

  const balanceBefore = Number(inviter.balance || 0);
  const balanceAfter = balanceBefore + reward;
  await Transaction.create({
    transactionId: rewardReference,
    telegramId: inviter.telegramId,
    userId: inviter._id,
    type: "reward",
    amount: reward,
    status: "completed",
    reference: rewardReference,
    balanceBefore,
    balanceAfter,
    description:
      kind === "deposit" ? "Referral deposit reward" : "Referral wager reward",
    metadata: {
      referralReward: true,
      rewardKind: kind,
      referredTelegramId,
      sourceReference: reference,
      percentage,
    },
  });

  await User.updateOne(
    { _id: inviter._id },
    {
      $inc: {
        balance: reward,
        referralEarnings: reward,
        bonusWagerRemaining: reward,
      },
    },
  );
  return { amount: reward, percentage, telegramId: inviter.telegramId };
};
