import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: { type: String, default: "Bonus Type", trim: true },
    value: { type: Number, required: true, min: 0 },
    usage: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    maxClaims: { type: Number, default: null, min: 1 },
    expiry: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Coupon = mongoose.model.Coupon || mongoose.model("Coupon", couponSchema);
export default Coupon;
