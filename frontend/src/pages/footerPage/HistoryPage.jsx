import React, { useEffect, useMemo, useState } from "react";
import Footer from "../../components/footer/Footer";
import { fetchUserHistory } from "../../services/userService";

const PAGE_SIZE = 8;
const tabs = [
  { id: "games", label: "Game History" },
  { id: "deposits", label: "Deposits" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "coupons", label: "Coupon History" },
];

const formatDate = (value) => {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const amountLabel = (amount) => `${Number(amount || 0).toFixed(2)} ETB`;

const HistoryPage = () => {
  const [activeTab, setActiveTab] = useState("games");
  const [history, setHistory] = useState({
    games: [],
    deposits: [],
    withdrawals: [],
    coupons: [],
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchUserHistory()
      .then((response) => {
        if (!mounted) return;
        setHistory({
          games: response.games || [],
          deposits: response.deposits || [],
          withdrawals: response.withdrawals || [],
          coupons: response.coupons || [],
        });
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message || "Failed to load history");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => setPage(1), [activeTab]);

  const records = history[activeTab];
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const visibleRecords = useMemo(
    () => records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, records],
  );

  const renderRecord = (record, index) => {
    if (activeTab === "games") {
      const won = record.outcome === "won";
      return (
        <div
          key={record.ticketId || index}
          className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-100">
                Bingo Round {record.roundNumber || record.gameId}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {formatDate(record.date)}
              </p>
            </div>
            <span
              className={
                won
                  ? "font-semibold text-emerald-300"
                  : "font-semibold text-rose-400"
              }
            >
              {won
                ? `Won  ${amountLabel(record.prizePool)}`
                : `Lost ${amountLabel(record.amount)}`}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {record.cardCount} card{record.cardCount === 1 ? "" : "s"} × stake
          </p>
        </div>
      );
    }

    const status = record.status || "pending";
    const isCoupon = activeTab === "coupons";
    return (
      <div
        key={record.transactionId || record._id || index}
        className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold capitalize text-slate-100">
              {isCoupon
                ? record.metadata?.couponCode || "Coupon redemption"
                : record.description || activeTab.slice(0, -1)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {formatDate(record.createdAt)}
            </p>
          </div>
          <div className="text-right">
            {!isCoupon && (
              <p className="font-semibold text-emerald-300">
                {amountLabel(record.amount)}
              </p>
            )}
            <span className="text-xs capitalize text-slate-400">{status}</span>
          </div>
        </div>
        {record.reference && (
          <p className="mt-2 text-xs text-slate-500">
            Reference: {record.reference}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-16 text-slate-100">
      <div className="border-b border-slate-700 bg-slate-900/60 p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="mt-1 text-sm text-slate-400">Your account activity</p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-emerald-300">
            {records.length} records
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-4xl p-4">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 md:grid-cols-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${activeTab === tab.id ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-16 text-center text-slate-400">
            Loading history...
          </div>
        )}
        {!loading && error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-950/40 p-4 text-center text-rose-200">
            {error}
          </div>
        )}
        {!loading && !error && visibleRecords.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
            <h2 className="font-semibold text-slate-200">
              No {tabs.find((tab) => tab.id === activeTab)?.label.toLowerCase()}{" "}
              yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              New activity will appear here automatically.
            </p>
          </div>
        )}
        {!loading && !error && visibleRecords.length > 0 && (
          <div className="space-y-3">{visibleRecords.map(renderRecord)}</div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default HistoryPage;
