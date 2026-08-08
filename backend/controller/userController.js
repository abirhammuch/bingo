import User from "../models/User.js";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";

// ==========================================
// 1. Register or Login User via Telegram
// ==========================================
export const telegramLogin = async (req, res) => {
  try {
    const { telegramId, firstName, lastName, username, profilePhoto } =
      req.body;

    if (!telegramId || !firstName) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID and First Name are required",
      });
    }

    // Find user by Telegram ID
    let user = await User.findOne({ telegramId: telegramId.toString() });

    if (!user) {
      // Create new user with a Welcome Bonus
      user = new User({
        telegramId: telegramId.toString(),
        firstName,
        lastName: lastName || "",
        username: username || "",
        profilePhoto: profilePhoto || "",
        balance: 100, // 🎁 Welcome Bonus
        lastLogin: new Date(),
      });
      await user.save();

      return res.status(201).json({
        success: true,
        message: "User registered successfully!",
        isNewUser: true,
        user: {
          id: user._id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          balance: user.balance,
          profilePhoto: user.profilePhoto,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          bingoGames: user.bingoGames,
          bingoWins: user.bingoWins,
          createdAt: user.createdAt,
        },
      });
    }

    // Update last login for returning user
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User logged in successfully!",
      isNewUser: false,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        balance: user.balance,
        profilePhoto: user.profilePhoto,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        bingoGames: user.bingoGames,
        bingoWins: user.bingoWins,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Telegram Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login user",
      error: error.message,
    });
  }
};

// ==========================================
// 2. Get User Profile
// ==========================================
export const getUserProfile = async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID is required",
      });
    }

    const user = await User.findOne({ telegramId: telegramId.toString() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate win rates
    const totalWinRate =
      user.gamesPlayed > 0
        ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1)
        : 0;

    const bingoWinRate =
      user.bingoGames > 0
        ? ((user.bingoWins / user.bingoGames) * 100).toFixed(1)
        : 0;

    res.json({
      success: true,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        balance: user.balance,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        bingoGames: user.bingoGames,
        bingoWins: user.bingoWins,
        ludoGames: user.ludoGames,
        ludoWins: user.ludoWins,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        stats: {
          totalWinRate: `${totalWinRate}%`,
          bingoWinRate: `${bingoWinRate}%`,
        },
      },
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message,
    });
  }
};

// ==========================================
// 3. Update User Profile (Basic details)
// ==========================================
export const updateUserProfile = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const updates = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID is required",
      });
    }

    // Fields that users are allowed to update
    const allowedUpdates = [
      "firstName",
      "lastName",
      "username",
      "phoneNumber",
      "profilePhoto",
    ];

    // Filter out any fields that aren't allowed
    const validUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });

    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const user = await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { $set: validUpdates },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update User Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// ==========================================
// 4. Get User Balance (Quick check)
// ==========================================
export const getUserBalance = async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID is required",
      });
    }

    const user = await User.findOne({ telegramId: telegramId.toString() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      balance: user.balance,
      telegramId: user.telegramId,
    });
  } catch (error) {
    console.error("Get User Balance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get balance",
      error: error.message,
    });
  }
};

// ==========================================
// 5. Get User Statistics (Deep dive)
// ==========================================
export const getUserStats = async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID is required",
      });
    }

    const user = await User.findOne({ telegramId: telegramId.toString() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const totalWinRate =
      user.gamesPlayed > 0
        ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1)
        : 0;

    const bingoWinRate =
      user.bingoGames > 0
        ? ((user.bingoWins / user.bingoGames) * 100).toFixed(1)
        : 0;

    const ludoWinRate =
      user.ludoGames > 0
        ? ((user.ludoWins / user.ludoGames) * 100).toFixed(1)
        : 0;

    res.json({
      success: true,
      stats: {
        balance: user.balance,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        totalWinRate: `${totalWinRate}%`,
        bingoGames: user.bingoGames,
        bingoWins: user.bingoWins,
        bingoWinRate: `${bingoWinRate}%`,
        ludoGames: user.ludoGames,
        ludoWins: user.ludoWins,
        ludoWinRate: `${ludoWinRate}%`,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        memberSince: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get User Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get statistics",
      error: error.message,
    });
  }
};

// ==========================================
// 6. ADMIN: Add Coins to a User
// ==========================================
export const adminAddCoins = async (req, res) => {
  try {
    const { telegramId, amount, reason } = req.body;

    if (!telegramId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID and valid amount are required",
      });
    }

    const user = await User.findOne({ telegramId: telegramId.toString() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.balance += amount;
    await user.save();

    res.json({
      success: true,
      message: `Added ${amount} coins to user`,
      reason: reason || "Admin adjustment",
      newBalance: user.balance,
      telegramId: user.telegramId,
    });
  } catch (error) {
    console.error("Admin Add Coins Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add coins",
      error: error.message,
    });
  }
};

// ==========================================
// 7. ADMIN: Deduct Coins from a User
// ==========================================
export const adminDeductCoins = async (req, res) => {
  try {
    const { telegramId, amount, reason } = req.body;

    if (!telegramId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID and valid amount are required",
      });
    }

    const user = await User.findOne({ telegramId: telegramId.toString() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        currentBalance: user.balance,
      });
    }

    user.balance -= amount;
    await user.save();

    res.json({
      success: true,
      message: `Deducted ${amount} coins from user`,
      reason: reason || "Admin adjustment",
      newBalance: user.balance,
      telegramId: user.telegramId,
    });
  } catch (error) {
    console.error("Admin Deduct Coins Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deduct coins",
      error: error.message,
    });
  }
};

// ==========================================
// 8. ADMIN: Get All Users (with search & pagination)
// ==========================================
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    let query = {};

    // If a search term is provided, search by telegramId, firstName, or username
    if (search) {
      query = {
        $or: [
          { telegramId: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 })
      .select(
        "telegramId firstName lastName username balance gamesPlayed gamesWon bingoGames bingoWins isActive isBlocked lastLogin createdAt",
      );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// ==========================================
// 9. ADMIN: Toggle User Block Status
// ==========================================
export const toggleUserBlock = async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID is required",
      });
    }

    const user = await User.findOne({ telegramId: telegramId.toString() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: user.isBlocked
        ? "User has been blocked"
        : "User has been unblocked",
      isBlocked: user.isBlocked,
      telegramId: user.telegramId,
    });
  } catch (error) {
    console.error("Toggle User Block Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle block status",
      error: error.message,
    });
  }
};