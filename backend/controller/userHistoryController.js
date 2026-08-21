import BingoGame from "../models/BingoGame.js";
import Transaction from "../models/Transaction.js";

const userHistory = async (req, res) => {
  try {
    const telegramId = String(req.user.telegramId || "");
    if (!telegramId) {
      return res.status(401).json({ success: false, message: "Invalid user" });
    }

    const [games, transactions] = await Promise.all([
      BingoGame.find({
        status: "completed",
        players: { $elemMatch: { telegramId, isSpectator: { $ne: true } } },
      })
        .select(
          "gameId roundNumber status minBet roundStartedAt roundEndedAt players roundSummary",
        )
        .sort({ roundEndedAt: -1 })
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

    res.json({
      success: true,
      games: games.map((game) => {
        const player = game.players.find(
          (entry) =>
            String(entry.telegramId) === telegramId &&
            entry.isSpectator !== true,
        );
        const cardCount = Number(
          player.cardsSelected ||
            player.selectedLuckyNumbers?.length ||
            player.cards?.length ||
            0,
        );
        const stake = Number(game.minBet || 0) * cardCount;
        const won = Boolean(
          player.hasBingo || Number(player.winAmount || 0) > 0,
        );

        return {
          gameId: game.gameId,
          roundNumber: game.roundNumber,
          date: game.roundEndedAt || game.roundStartedAt,
          cardCount,
          stake,
          outcome: won ? "won" : "lost",
          amount: won ? Number(player.winAmount || 0) : stake,
          prizePool: won ? Number(player.winAmount || 0) : 0,
          game: {
            status: game.status,
            roundEndedAt: game.roundEndedAt,
          },
        };
      }),
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
