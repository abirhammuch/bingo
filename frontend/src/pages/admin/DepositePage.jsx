import React, { useMemo, useState } from "react";

const deposits = [
  {
    id: "#DP-98765",
    user: "BingoStar99",
    amount: "$200.00",
    method: "PayPal",
    date: "Oct 27, 2023, 11:15 GMT",
    account: "paypal_user@email.com",
    bonus: "None",
    status: "Pending",
  },
  {
    id: "#DP-98766",
    user: "LucyLy",
    amount: "$500.00",
    method: "Bank Transfer",
    date: "Oct 27, 2023, 11:20 GMT",
    account: "****4567",
    bonus: "Welcome Bonus",
    status: "Approved",
  },
  {
    id: "#DP-98767",
    user: "LuckyDip22",
    amount: "$75.50",
    method: "Bank Transfer",
    date: "Oct 27, 2023, 11:30 GMT",
    account: "****6789",
    bonus: "Welcome Bonus",
    status: "Approved",
  },
  {
    id: "#DP-98768",
    user: "LuckyDip22",
    amount: "$75.50",
    method: "Crypto",
    date: "Oct 27, 2023, 11:30 GMT",
    account: "BTC Address",
    bonus: "None",
    status: "Flagged",
  },
  {
    id: "#DP-98765",
    user: "BingoStar99",
    amount: "$150.00",
    method: "PayPal",
    date: "Oct 27, 2023, 11:15 GMT",
    account: "paypal_user@email.com",
    bonus: "None",
    status: "Pending",
  },
  {
    id: "#DP-98766",
    user: "LucyLy",
    amount: "$500.00",
    method: "Bank Transfer",
    date: "Oct 27, 2023, 11:20 GMT",
    account: "****4567",
    bonus: "Welcome Bonus",
    status: "Approved",
  },
  {
    id: "#DP-98767",
    user: "LuckyDip22",
    amount: "$75.50",
    method: "Crypto",
    date: "Oct 27, 2023, 11:30 GMT",
    account: "BTC Address",
    bonus: "None",
    status: "Approved",
  },
  {
    id: "#DP-98768",
    user: "LuckyDip22",
    amount: "$75.50",
    method: "Crypto",
    date: "Oct 27, 2023, 11:30 GMT",
    account: "BTC Address",
    bonus: "None",
    status: "Flagged",
  },
];

const statusStyles = {
  Pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  Approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  Flagged: "border-rose-500/30 bg-rose-500/15 text-rose-300",
};

const DepositPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filteredDeposits = useMemo(
    () =>
      deposits.filter((deposit) => {
        const matchesSearch = `${deposit.id} ${deposit.user} ${deposit.method}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesSearch && (status === "All" || deposit.status === status);
      }),
    [search, status],
  );

  return (
    <div className="space-y-5 text-slate-100">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending Deposits", "38", "text-sky-300", "bg-sky-500/15"],
          ["Deposits Today", "$2,100.00", "text-teal-300", "bg-teal-500/15"],
          ["Failed Deposits", "7", "text-rose-300", "bg-rose-500/15"],
          [
            "Total Deposited (MTD)",
            "$39,600.00",
            "text-slate-300",
            "bg-slate-500/15",
          ],
        ].map(([label, value, textColor, iconColor]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg shadow-slate-950/20"
          >
            <div>
              <div className="text-xs text-slate-400">{label}</div>
              <div className="mt-1 text-2xl font-semibold">{value}</div>
            </div>
            <div
              className={`grid h-10 w-10 place-items-center rounded-full ${iconColor} ${textColor}`}
            >
              $
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg shadow-slate-950/20">
        <label className="text-xs text-slate-400">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="mt-1 block h-9 w-44 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-500"
          />
        </label>
        <label className="text-xs text-slate-400">
          Date Range
          <select className="mt-1 block h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-200">
            <option>Date Range</option>
            <option>Today</option>
            <option>This month</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 block h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-200"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Flagged</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Method
          <select className="mt-1 block h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-200">
            <option>All methods</option>
            <option>PayPal</option>
            <option>Bank Transfer</option>
            <option>Crypto</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Min/Max Amount
          <input
            placeholder="Min/Max"
            className="mt-1 block h-9 w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-4">
          <h2 className="font-semibold">Player Deposit Records</h2>
          <span className="text-xs text-slate-500">
            Showing 1-{filteredDeposits.length} of 38 results
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500">
              <tr>
                {[
                  "Deposit ID",
                  "Player Username",
                  "Amount",
                  "Method",
                  "Deposit Date",
                  "Source Account",
                  "Bonus Used",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredDeposits.map((deposit, index) => (
                <tr
                  key={`${deposit.id}-${index}`}
                  className="hover:bg-slate-800/40"
                >
                  <td className="px-3 py-3 font-medium">{deposit.id}</td>
                  <td className="px-3 py-3 text-teal-300">{deposit.user} ↗</td>
                  <td className="px-3 py-3 font-medium">{deposit.amount}</td>
                  <td className="px-3 py-3">{deposit.method}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {deposit.date}
                  </td>
                  <td className="px-3 py-3">{deposit.account}</td>
                  <td className="px-3 py-3 text-slate-400">{deposit.bonus}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-medium ${statusStyles[deposit.status]}`}
                    >
                      {deposit.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button className="rounded-lg bg-teal-600 px-2 py-1 text-[10px] text-white hover:bg-teal-500">
                        Approve
                      </button>
                      <button className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800">
                        Reject
                      </button>
                      <button className="whitespace-nowrap rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Bulk Actions</span>
            <button className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300">
              Approve Selected
            </button>
            <button className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300">
              Deny Selected
            </button>
          </div>
          <span className="text-slate-500">
            Showing 1-{filteredDeposits.length} of 38 results
          </span>
        </div>
      </section>
    </div>
  );
};

export default DepositPage;
