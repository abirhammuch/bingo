import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

const redeemCoupon = async (req, res) => {
  const code = String(req.body.code || "")
    .trim()
    .toUpperCase();
  const telegramId = String(req.user.telegramId || "");
  if (!code) {
    return res
      .status(400)
      .json({ success: false, message: "Coupon code is required" });
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const user = await User.findOne({ telegramId }).session(session);
      if (!user) throw new Error("User not found");

      const coupon = await Coupon.findOne({ code }).session(session);
      if (!coupon || !coupon.isActive)
        throw new Error("Coupon is not available");
      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        throw new Error("Coupon has expired");
      }
      if (
        coupon.maxClaims !== null &&
        Number(coupon.usage || 0) >= Number(coupon.maxClaims)
      ) {
        throw new Error("Coupon has reached its maximum number of users");
      }

      const transactionId = `coupon:${coupon.code}:${telegramId}`;
      const existing = await Transaction.findOne({ transactionId }).session(
        session,
      );
      if (existing) throw new Error("You have already redeemed this coupon");

      const userUses = await Transaction.countDocuments({
        telegramId,
        type: "COUPON",
        "metadata.couponCode": coupon.code,
      }).session(session);
      if (userUses >= Number(coupon.perUserLimit || 1)) {
        throw new Error("You have reached this coupon's usage limit");
      }

      const balanceBefore = Number(user.balance || 0);
      const balanceAfter = balanceBefore + Number(coupon.value || 0);
      user.balance = balanceAfter;
      await user.save({ session });
      coupon.usage = Number(coupon.usage || 0) + 1;
      await coupon.save({ session });
      await Transaction.create(
        [
          {
            transactionId,
            telegramId,
            userId: user._id,
            type: "COUPON",
            amount: Number(coupon.value || 0),
            status: "completed",
            balanceBefore,
            balanceAfter,
            description: "Coupon redemption",
            metadata: {
              coupon: true,
              couponCode: coupon.code,
              couponType: coupon.type,
            },
          },
        ],
        { session },
      );
      result = { balance: balanceAfter, amount: Number(coupon.value || 0) };
    });
    res.json({
      success: true,
      message: "Coupon redeemed successfully",
      ...result,
    });
  } catch (error) {
    const clientErrors = [
      "Coupon code is required",
      "User not found",
      "Coupon is not available",
      "Coupon has expired",
      "Coupon has reached its maximum number of users",
      "You have already redeemed this coupon",
      "You have reached this coupon's usage limit",
    ];
    res.status(clientErrors.includes(error.message) ? 400 : 500).json({
      success: false,
      message: clientErrors.includes(error.message)
        ? error.message
        : "Failed to redeem coupon",
    });
  } finally {
    await session.endSession();
  }
};

export default redeemCoupon;
