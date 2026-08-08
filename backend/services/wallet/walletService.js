import User from "../../models/User.js";

export const getWalletBalance = async (telegramId) => {
  const user = await User.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }
  return user.balance;
};

export const depositToWallet = async (telegramId, amount) => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  const user = await User.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }
  user.balance += amount;
  await user.save();
  return user;
};

export const withdrawFromWallet = async (telegramId, amount) => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  const user = await User.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.balance < amount) {
    throw new Error("Insufficient funds");
  }
  user.balance -= amount;
  await user.save();
  return user;
};
