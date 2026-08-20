import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

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

export default router;
