import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import { fetchUserHistory, getUserBalance } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getRecentActivity = (history) => {
  const games = (history.games || []).map((game) => ({
    id: `game-${game.gameId}-${game.date}`,
    title: `Bingo Round ${game.roundNumber || game.gameId}`,
    date: game.date,
    amount: game.outcome === "won" ? game.prizePool : -game.amount,
    status: game.outcome === "won" ? "Won" : "Lost",
  }));
  const transactions = [
    ...(history.deposits || []),
    ...(history.withdrawals || []),
    ...(history.coupons || []),
  ].map((transaction) => ({
    id: transaction.transactionId || transaction._id,
    title: transaction.description || transaction.type || "Wallet activity",
    date: transaction.createdAt,
    amount: ["withdraw", "WITHDRAW"].includes(transaction.type)
      ? -Number(transaction.amount || 0)
      : Number(transaction.amount || 0),
    status: transaction.status || "pending",
  }));

  return [...games, ...transactions]
    .sort((first, second) => new Date(second.date) - new Date(first.date))
    .slice(0, 5);
};

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, updateUserBalance, currency } = useAuth();
  const [balance, setBalance] = useState(Number(user?.balance || 0));
  const [withdrawableBalance, setWithdrawableBalance] = useState(
    Number(user?.balance || 0),
  );
  const [bonusBalance, setBonusBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.telegramId) {
      setLoading(false);
      return undefined;
    }
    let mounted = true;
    Promise.all([getUserBalance(user.telegramId), fetchUserHistory()])
      .then(([balanceResponse, historyResponse]) => {
        if (!mounted) return;
        const nextBalance = Number(balanceResponse.balance || 0);
        setBalance(nextBalance);
        setWithdrawableBalance(
          Number(balanceResponse.withdrawableBalance ?? nextBalance),
        );
        setBonusBalance(Number(balanceResponse.bonusBalance || 0));
        updateUserBalance(nextBalance);
        setRecentActivity(getRecentActivity(historyResponse));
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message || "Failed to load wallet");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.telegramId]);

  return (
    <div className="pb-16 min-h-screen bg-linear-to-b from-slate-950 to-slate-900">
      {/* Page Header */}
      <div className="bg-slate-900/60 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">MY WALLET</h1>
          <p className="text-slate-400 text-sm">Manage your funds</p>
        </div>
      </div>

      {/* Balance Cards Section */}
      <div className="px-4 py-6 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Game Balance */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                WITHDRAWABLE BALANCE ({currency})
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold text-white">
                  {loading ? "..." : withdrawableBalance.toFixed(2)}
                </p>
                <p className="text-sm text-slate-400">{currency}</p>
              </div>
            </div>

            {/* Main Balance */}
            <div className="bg-slate-800/40 border border-emerald-600/30 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                BONUS BALANCE ({currency})
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold text-emerald-400">
                  {loading ? "..." : bonusBalance.toFixed(2)}
                </p>
                <p className="text-sm text-slate-400">{currency}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Deposit Button */}
          <button
            onClick={() => navigate("/deposit")}
            className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl uppercase tracking-wide transition shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">💳</span>
            DEPOSIT
          </button>

          {/* Withdraw Button */}
          <button
            onClick={() => navigate("/withdraw")}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl uppercase tracking-wide transition border border-slate-700 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🏦</span>
            WITHDRAW
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="px-4 py-6 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              RECENT TRANSACTIONS
            </p>
            <button
              onClick={() => navigate("/history")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition font-semibold"
            >
              VIEW ALL →
            </button>
          </div>

          {loading && (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading activity...
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-950/40 p-4 text-center text-sm text-rose-200">
              {error}
            </div>
          )}
          {!loading && !error && recentActivity.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-slate-400 text-sm">No wallet activity yet</p>
              <p className="text-slate-500 text-xs mt-1">
                Your deposits, withdrawals, and games will appear here
              </p>
            </div>
          )}
          {!loading && !error && recentActivity.length > 0 && (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/40 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-200">
                      {activity.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(activity.date)} · {activity.status}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold ${activity.amount < 0 ? "text-rose-300" : "text-emerald-300"}`}
                  >
                    {activity.amount > 0 ? "+" : ""}
                    {Number(activity.amount || 0).toFixed(2)} {currency}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
};

export default WalletPage;
