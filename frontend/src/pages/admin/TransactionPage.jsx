import React, { useMemo, useState } from "react";

const seedTransactions = [
  {
    id: 1,
    user: "Abebe Bekele",
    telegram: "@abebe_b",
    amount: 250,
    type: "Deposit",
    method: "Telebirr",
    status: "Completed",
    date: "2026-08-14 09:12",
  },
  {
    id: 2,
    user: "Selam Desta",
    telegram: "@selam_d",
    amount: 100,
    type: "Withdraw",
    method: "CBE",
    status: "Pending",
    date: "2026-08-14 10:45",
  },
  {
    id: 3,
    user: "Mihret Assefa",
    telegram: "@mihr",
    amount: 500,
    type: "Deposit",
    method: "Telebirr",
    status: "Completed",
    date: "2026-08-13 18:30",
  },
  {
    id: 4,
    user: "Daniel Tesfaye",
    telegram: "@daniel_t",
    amount: 75,
    type: "Bet",
    method: "Wallet",
    status: "Completed",
    date: "2026-08-13 22:15",
  },
  {
    id: 5,
    user: "Lidya Hailu",
    telegram: "@lidya_h",
    amount: 1200,
    type: "Win",
    method: "Wallet",
    status: "Completed",
    date: "2026-08-12 14:20",
  },
  {
    id: 6,
    user: "Yared Tadesse",
    telegram: "@yared_t",
    amount: 200,
    type: "Withdraw",
    method: "CBE",
    status: "Rejected",
    date: "2026-08-11 11:05",
  },
];

const statusClasses = {
  Completed: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  Pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  Rejected: "border-rose-500/30 bg-rose-500/15 text-rose-300",
};

const typeClasses = {
  Deposit: "text-sky-300",
  Withdraw: "text-violet-300",
  Bet: "text-amber-300",
  Win: "text-emerald-300",
};

const TransactionPage = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredTransactions = useMemo(() => {
    return seedTransactions.filter((tx) => {
      const matchesQuery =
        query.trim() === "" ||
        [tx.user, tx.telegram, tx.method, tx.type, tx.status]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || tx.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const totalVolume = seedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const completedCount = seedTransactions.filter(
    (tx) => tx.status === "Completed",
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1500px] mx-auto px-4 py-8">
        <div className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Transactions
              </div>
              <h1 className="mt-2 text-4xl font-semibold">Financial Activity</h1>
            </div>

            <button className="rounded-full border border-violet-500/30 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-500/20">
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Total Volume</div>
            <div className="mt-4 text-3xl font-semibold">
              {totalVolume.toLocaleString()} ETB
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Completed</div>
            <div className="mt-4 text-3xl font-semibold text-emerald-300">
              {completedCount}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Pending</div>
            <div className="mt-4 text-3xl font-semibold text-amber-300">
              {seedTransactions.filter((tx) => tx.status === "Pending").length}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by user, telegram, method, type, status..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'Completed', 'Pending', 'Rejected'].map((option) => (
                <button
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    statusFilter === option
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                      : 'border border-slate-700 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Telegram</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-800">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-100">{tx.user}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{tx.telegram}</td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${typeClasses[tx.type]}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{tx.method}</td>
                    <td className="px-4 py-4 font-semibold text-slate-100">
                      {tx.amount.toLocaleString()} ETB
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
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
