import BingoTicket from "../models/BingoTicket.js";
import BingoGame from "../models/BingoGame.js";
import Transaction from "../models/Transaction.js";

const userHistory = async (req, res) => {
  try {
    const telegramId = String(req.user.telegramId || "");
    if (!telegramId) {
      return res.status(401).json({ success: false, message: "Invalid user" });
    }

    const [tickets, transactions] = await Promise.all([
      BingoTicket.find({ telegramId })
        .select("ticketId gameId betAmount winAmount isWinner purchaseTime")
        .sort({ purchaseTime: -1 })
        .limit(100)
        .lean(),
      Transaction.find({ telegramId })
        .select(
          "transactionId type amount status description reference createdAt metadata",
        )
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const gameIds = [...new Set(tickets.map((ticket) => ticket.gameId))];
    const games = await BingoGame.find({ gameId: { $in: gameIds } })
      .select("gameId roundNumber status roundEndedAt")
      .lean();
    const gamesById = new Map(games.map((game) => [game.gameId, game]));

    res.json({
      success: true,
      games: tickets.map((ticket) => ({
        ...ticket,
        game: gamesById.get(ticket.gameId) || null,
      })),
      deposits: transactions.filter((transaction) =>
        ["deposit", "DEPOSIT"].includes(transaction.type),
      ),
      withdrawals: transactions.filter((transaction) =>
        ["withdraw", "WITHDRAW"].includes(transaction.type),
      ),
      coupons: transactions.filter(
        (transaction) =>
          transaction.type === "COUPON" || transaction.metadata?.coupon,
      ),
    });
  } catch (error) {
    console.error("User history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load history",
    });
  }
};

export default userHistory;
