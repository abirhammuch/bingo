import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";

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

// Simple admin password login (no Telegram initData required)
router.post("/login", async (req, res) => {
  const { password } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

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

export default router;
