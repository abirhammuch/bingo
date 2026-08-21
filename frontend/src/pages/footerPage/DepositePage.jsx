import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import { fetchUserHistory } from "../../services/userService";

const DepositePage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState({ deposits: [], withdrawals: [] });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchUserHistory()
      .then((response) => {
        if (!mounted) return;
        setHistory({
          deposits: response.deposits || [],
          withdrawals: response.withdrawals || [],
        });
      })
      .catch((error) => {
        if (mounted) setHistoryError(error.message || "Failed to load history");
      })
      .finally(() => {
        if (mounted) setHistoryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const recentHistory = [
    ...history.deposits.map((item) => ({ ...item, activityType: "Deposit" })),
    ...history.withdrawals.map((item) => ({
      ...item,
      activityType: "Withdraw",
    })),
  ]
    .sort(
      (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
    )
    .slice(0, 6);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "Unknown date";

  const paymentMethods = [
    {
      id: 1,
      name: "Telebirr",
      description: "Ethio Telecom wallet",
      icon: "📱",
      color: "from-purple-600 to-purple-700",
    },
    {
      id: 2,
      name: "CBE Birr",
      description: "Commercial Bank of Ethiopia",
      icon: "🏦",
      color: "from-blue-600 to-blue-700",
    },
  ];

  const handleSelectMethod = (method) => {
    if (method.id === 1) {
      navigate("/telebirr-deposit");
    } else if (method.id === 2) {
      navigate("/cbe-deposit");
    }
  };

  return (
    <div className="pb-16 min-h-screen bg-linear-to-b from-slate-950 to-slate-900">
      {/* Page Header */}
      <div className="bg-slate-900/60 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">DEPOSIT</h1>
          <p className="text-slate-400 text-sm">Choose payment method</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelectMethod(method)}
              className="w-full bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/60 hover:border-slate-600 transition group"
            >
              {/* Icon and Details */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-lg bg-linear-to-br ${method.color} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-2xl">{method.icon}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-lg">
                    {method.name}
                  </h3>
                  <p className="text-xs text-slate-400">{method.description}</p>
                </div>
              </div>

              {/* Arrow */}
              <span className="text-slate-500 group-hover:text-slate-300 transition text-xl">
                →
              </span>
            </button>
          ))}
        </div>
      </div>

      <section className="border-t border-slate-700/50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Deposit & Withdraw History
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Recent wallet requests and their status
              </p>
            </div>
            <button
              onClick={() => navigate("/history")}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              VIEW ALL
            </button>
          </div>

          {historyLoading && (
            <p className="py-8 text-center text-sm text-slate-400">
              Loading history...
            </p>
          )}
          {!historyLoading && historyError && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-300">
              {historyError}
            </p>
          )}
          {!historyLoading && !historyError && recentHistory.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
              No deposit or withdrawal history yet.
            </p>
          )}
          {!historyLoading && !historyError && recentHistory.length > 0 && (
            <div className="space-y-2">
              {recentHistory.map((item, index) => (
                <div
                  key={item.transactionId || item._id || index}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 p-3"
                >
                  <div>
                    <p
                      className={`font-semibold ${item.activityType === "Deposit" ? "text-sky-300" : "text-violet-300"}`}
                    >
                      {item.activityType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-100">
                      {Number(item.amount || 0).toFixed(2)} ETB
                    </p>
                    <p className="text-xs capitalize text-slate-400">
                      {item.status || "pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Back Button */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/wallet")}
            className="text-slate-400 hover:text-slate-300 transition text-sm font-semibold flex items-center gap-2"
          >
            <span>←</span>
            Back to wallet
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
};

export default DepositePage;
