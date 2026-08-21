import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminWalletRequests,
  updateAdminWalletRequest,
} from "../../services/userService";

const requests = [
  {
    id: "#WD-12345",
    user: "BingoStar99",
    amount: "$150.00",
    method: "PayPal",
    date: "Oct 26, 2023, 14:30 GMT",
    account: "paypal@email.com",
    activity: "55 Games, 1 Win",
    status: "Pending",
  },
  {
    id: "#WD-12346",
    user: "LucyLy",
    amount: "$500.00",
    method: "Bank Transfer",
    date: "Oct 26, 2023, 14:30 GMT",
    account: "****6789",
    activity: "120 Games, 3 Wins",
    status: "Approved",
  },
  {
    id: "#WD-12347",
    user: "LuckyDip22",
    amount: "$75.50",
    method: "Bank Transfer",
    date: "Oct 26, 2023, 14:30 GMT",
    account: "****6789",
    activity: "120 Games, 3 Wins",
    status: "Approved",
  },
  {
    id: "#WD-12348",
    user: "LuckyDip22",
    amount: "$75.50",
    method: "Crypto",
    date: "Oct 26, 2023, 14:30 GMT",
    account: "BTC Address",
    activity: "120 Games, 1 Win",
    status: "Flagged",
  },
  {
    id: "#WD-12345",
    user: "BingoStar99",
    amount: "$150.00",
    method: "PayPal",
    date: "Oct 26, 2023, 14:30 GMT",
    account: "paypal@email.com",
    activity: "120 Games, 3 Wins",
    status: "Approved",
  },
  {
    id: "#WD-12346",
    user: "LucyLy",
    amount: "$500.00",
    method: "Bank Transfer",
    date: "Oct 26, 2023, 14:30 GMT",
    account: "****6789",
    activity: "120 Games, 3 Wins",
    status: "Flagged",
  },
  {
    id: "#WD-12347",
    user: "LuckyDip22",
    amount: "$75.50",
    method: "Crypto",
    date: "Oct 26, 2023, 14:30 GMT",
    account: "BTC Address",
    activity: "120 Games, 3 Wins",
    status: "Flagged",
  },
];

const statusStyles = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Flagged: "bg-rose-100 text-rose-700",
};

const WithdrawPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminWalletRequests()
      .then((response) =>
        setWithdrawalRequests(
          (response.transactions || [])
            .filter((transaction) => transaction.type === "withdraw")
            .map((transaction) => ({
              ...transaction,
              id: transaction.transactionId,
              user:
                transaction.userId?.username ||
                transaction.userId?.firstName ||
                transaction.telegramId,
              amount: `${Number(transaction.amount).toFixed(2)} ETB`,
              method: transaction.metadata?.method || "Unknown",
              date: new Date(transaction.createdAt).toLocaleString(),
              account: transaction.metadata?.account || "-",
              activity: "Wallet withdrawal",
              status:
                transaction.status === "completed"
                  ? "Approved"
                  : transaction.status === "failed"
                    ? "Flagged"
                    : "Pending",
            })),
        ),
      )
      .catch((requestError) =>
        setError(requestError.message || "Failed to load withdrawals"),
      );
  }, []);

  const handleAction = async (request, action) => {
    try {
      await updateAdminWalletRequest(request.transactionId, action);
      setWithdrawalRequests((items) =>
        items.map((item) =>
          item.transactionId === request.transactionId
            ? { ...item, status: action === "approve" ? "Approved" : "Flagged" }
            : item,
        ),
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to update withdrawal");
    }
  };

  const filteredRequests = useMemo(
    () =>
      withdrawalRequests.filter((request) => {
        const matchesSearch = `${request.id} ${request.user} ${request.method}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesSearch && (status === "All" || request.status === status);
      }),
    [search, status],
  );

  return (
    <div className="space-y-5 text-slate-900">
      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending Requests", "38", "bg-sky-100 text-sky-700"],
          ["Approved Today", "$1,450.00", "bg-teal-100 text-teal-700"],
          ["Denied Requests", "5", "bg-rose-100 text-rose-700"],
          [
            "Total Withdrawn (MTD)",
            "$25,780.00",
            "bg-slate-100 text-slate-600",
          ],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-bold">{value}</div>
            </div>
            <div
              className={`grid h-10 w-10 place-items-center rounded-full ${color}`}
            >
              $
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="text-xs text-slate-500">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="mt-1 block h-9 w-44 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-500"
          />
        </label>
        <label className="text-xs text-slate-500">
          Date Range
          <select className="mt-1 block h-9 rounded-md border border-slate-300 px-2 text-sm">
            <option>Date Range</option>
            <option>Today</option>
            <option>This month</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 block h-9 rounded-md border border-slate-300 px-2 text-sm"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Flagged</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Method
          <select className="mt-1 block h-9 rounded-md border border-slate-300 px-2 text-sm">
            <option>All methods</option>
            <option>PayPal</option>
            <option>Bank Transfer</option>
            <option>Crypto</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Min/Max Amount
          <input
            placeholder="Min/Max"
            className="mt-1 block h-9 w-28 rounded-md border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Player Withdrawal Requests</h2>
          <span className="text-xs text-slate-500">
            Showing 1-{filteredRequests.length} of 38 results
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
              <tr>
                {[
                  "Request ID",
                  "Player Username",
                  "Amount",
                  "Method",
                  "Request Date",
                  "Account Details",
                  "Game Activity",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((request, index) => (
                <tr
                  key={`${request.id}-${index}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-3 py-3 font-medium">{request.id}</td>
                  <td className="px-3 py-3 text-teal-700">{request.user} ↗</td>
                  <td className="px-3 py-3 font-medium">{request.amount}</td>
                  <td className="px-3 py-3">{request.method}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {request.date}
                  </td>
                  <td className="px-3 py-3">{request.account}</td>
                  <td className="px-3 py-3">{request.activity}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyles[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAction(request, "approve")}
                        disabled={request.status !== "Pending"}
                        className="rounded bg-teal-600 px-2 py-1 text-[10px] text-white disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(request, "reject")}
                        disabled={request.status !== "Pending"}
                        className="rounded border border-slate-300 px-2 py-1 text-[10px] disabled:opacity-40"
                      >
                        Deny
                      </button>
                      <button className="rounded border border-slate-300 px-2 py-1 text-[10px] whitespace-nowrap">
                        View Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span>Bulk Actions</span>
            <button className="rounded border border-slate-300 px-2 py-1">
              Approve Selected
            </button>
            <button className="rounded border border-slate-300 px-2 py-1">
              Deny Selected
            </button>
          </div>
          <span className="text-slate-500">
            Showing 1-{filteredRequests.length} of 38 results
          </span>
        </div>
      </section>
    </div>
  );
};

export default WithdrawPage;
