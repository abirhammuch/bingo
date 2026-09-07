import { randomUUID } from "node:crypto";
import BonusSettings from "../../models/BonusSettings.js";
import Transaction from "../../models/Transaction.js";
import User from "../../models/User.js";

export const getBonusSettings = async () =>
  (await BonusSettings.findOne({ key: "default" }).lean()) || {
    key: "default",
    registrationBonus: 100,
    firstDepositBonus: 50,
    depositBonusPercentage: 5,
  };

const creditBonus = async ({
  user,
  amount,
  description,
  reference,
  bonusType,
}) => {
  if (!amount || amount <= 0) return 0;

  const balanceBefore = Number(user.balance || 0);
  user.balance = balanceBefore + amount;
  user.bonusWagerRemaining =
    Number(user.bonusWagerRemaining || 0) + Number(amount);
  await user.save();
  await Transaction.create({
    transactionId: `bonus:${randomUUID()}`,
    telegramId: user.telegramId,
    userId: user._id,
    type: "reward",
    amount,
    status: "completed",
    reference,
    description,
    balanceBefore,
    balanceAfter: user.balance,
    metadata: { bonus: true, bonusType },
  });
  return amount;
};

export const creditRegistrationBonus = async (telegramId) => {
  const user = await User.findOne({ telegramId });
  if (!user) return 0;

  const alreadyPaid = await Transaction.exists({
    telegramId,
    type: "reward",
    "metadata.bonusType": "registration",
  });
  if (alreadyPaid) return 0;

  const settings = await getBonusSettings();
  return creditBonus({
    user,
    amount: Number(settings.registrationBonus || 0),
    description: "Registration bonus",
    reference: `registration:${telegramId}`,
    bonusType: "registration",
  });
};

export const creditDepositBonuses = async (transaction) => {
  const settings = await getBonusSettings();
  const previousDeposit = await Transaction.exists({
    telegramId: transaction.telegramId,
    type: "deposit",
    status: "completed",
    _id: { $ne: transaction._id },
  });
  const firstBonus = previousDeposit
    ? 0
    : Number(settings.firstDepositBonus || 0);
  const percentageBonus =
    (Number(transaction.amount) *
      Number(settings.depositBonusPercentage || 0)) /
    100;
  const user = await User.findOne({ telegramId: transaction.telegramId });
  if (!user) return 0;

  let total = 0;
  total += await creditBonus({
    user,
    amount: firstBonus,
    description: "First deposit bonus",
    reference: `${transaction.transactionId}:first`,
    bonusType: "first-deposit",
  });
  total += await creditBonus({
    user,
    amount: percentageBonus,
    description: `Deposit bonus (${settings.depositBonusPercentage}%)`,
    reference: `${transaction.transactionId}:percentage`,
    bonusType: "deposit-percentage",
  });
  return total;
};
