import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminTransactions } from "../../services/userService";

const statusClasses = {
  Completed: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  Pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  Rejected: "border-rose-500/30 bg-rose-500/15 text-rose-300",
};

const typeClasses = {
  deposit: "text-sky-300",
  withdraw: "text-violet-300",
  bet: "text-amber-300",
  reward: "text-emerald-300",
  refund: "text-emerald-300",
  BET: "text-amber-300",
  WIN: "text-emerald-300",
  REFUND: "text-emerald-300",
  COMMISSION: "text-violet-300",
};

const normalizeTransaction = (transaction) => ({
  ...transaction,
  user:
    transaction.userId?.username ||
    transaction.userId?.firstName ||
    transaction.telegramId,
  telegram: transaction.telegramId,
  method: transaction.metadata?.method || "Wallet",
  status:
    transaction.status === "completed"
      ? "Completed"
      : transaction.status === "failed"
        ? "Rejected"
        : "Pending",
});

const TransactionPage = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminTransactions()
      .then((response) =>
        setTransactions(
          (response.transactions || []).map(normalizeTransaction),
        ),
      )
      .catch((requestError) =>
        setError(requestError.message || "Failed to load transactions"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          transaction.user,
          transaction.telegram,
          transaction.method,
          transaction.type,
          transaction.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return (
        matchesQuery &&
        (statusFilter === "All" || transaction.status === statusFilter)
      );
    });
  }, [query, statusFilter, transactions]);

  const totalVolume = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );
  const completedCount = transactions.filter(
    (transaction) => transaction.status === "Completed",
  ).length;
  const pendingCount = transactions.filter(
    (transaction) => transaction.status === "Pending",
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-375 px-1 py-3 sm:px-2 sm:py-5 lg:px-4 lg:py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl shadow-slate-950/40 sm:rounded-3xl sm:p-4 lg:rounded-4xl lg:p-6">
          <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
            Transactions
          </div>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl lg:mt-2 lg:text-4xl">
            Financial Activity
          </h1>
        </div>

        <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 md:grid-cols-3 lg:mt-6">
          {[
            [
              "Total Volume",
              `${totalVolume.toLocaleString()} ETB`,
              "text-slate-100",
            ],
            ["Completed", completedCount, "text-emerald-300"],
            ["Pending", pendingCount, "text-amber-300"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:rounded-3xl sm:p-4"
            >
              <div className="text-sm text-slate-400">{label}</div>
              <div
                className={`mt-2 text-2xl font-semibold ${color} sm:mt-3 sm:text-3xl`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl shadow-slate-950/40 sm:mt-4 sm:rounded-3xl sm:p-4 lg:mt-6 lg:rounded-4xl lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by user, telegram, method, type, status..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
            />
            <div className="flex flex-wrap gap-2">
              {["All", "Completed", "Pending", "Rejected"].map((option) => (
                <button
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-full px-3 py-2 text-sm transition ${statusFilter === option ? "border border-violet-500/30 bg-violet-500/15 text-violet-300" : "border border-slate-700 bg-slate-950/70 text-slate-300 hover:bg-slate-800"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 sm:mt-4 sm:rounded-3xl lg:mt-6">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  {[
                    "User",
                    "Telegram",
                    "Type",
                    "Method",
                    "Amount",
                    "Status",
                    "Date",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Loading transactions...
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.transactionId}
                      className="border-t border-slate-800"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-100">
                        {transaction.user}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {transaction.telegram}
                      </td>
                      <td
                        className={`px-4 py-4 font-medium ${typeClasses[transaction.type] || "text-slate-300"}`}
                      >
                        {transaction.type}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {transaction.method}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-100">
                        {Number(transaction.amount || 0).toLocaleString()} ETB
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[transaction.status]}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredTransactions.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-slate-400">
              No transactions match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
