import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminWalletRequests,
  updateAdminWalletRequest,
} from "../../services/userService";

const statusStyles = {
  Pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  Approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  Flagged: "border-rose-500/30 bg-rose-500/15 text-rose-300",
};

const mapTransaction = (transaction) => ({
  ...transaction,
  id: transaction.transactionId,
  user:
    transaction.userId?.username ||
    transaction.userId?.firstName ||
    transaction.telegramId,
  amountValue: Number(transaction.amount || 0),
  amount: `${Number(transaction.amount || 0).toFixed(2)} ETB`,
  method: transaction.metadata?.method || "Unknown",
  date: new Date(transaction.createdAt).toLocaleString(),
  account: transaction.metadata?.account || "-",
  status:
    transaction.status === "completed"
      ? "Approved"
      : transaction.status === "failed"
        ? "Flagged"
        : "Pending",
});

const DepositPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All methods");
  const [dateRange, setDateRange] = useState("Date Range");
  const [amountRange, setAmountRange] = useState("");
  const [deposits, setDeposits] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDeposits = () => {
    setLoading(true);
    setError("");
    return fetchAdminWalletRequests()
      .then((response) =>
        setDeposits(
          (response.transactions || [])
            .filter((transaction) => transaction.type === "deposit")
            .map(mapTransaction),
        ),
      )
      .catch((requestError) =>
        setError(requestError.message || "Failed to load deposits"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const updateRows = async (rows, action) => {
    if (!rows.length) return;
    try {
      await Promise.all(
        rows.map((deposit) =>
          updateAdminWalletRequest(deposit.transactionId, action),
        ),
      );
      const ids = rows.map((deposit) => deposit.transactionId);
      setDeposits((items) =>
        items.map((item) =>
          ids.includes(item.transactionId)
            ? { ...item, status: action === "approve" ? "Approved" : "Flagged" }
            : item,
        ),
      );
      setSelected([]);
    } catch (requestError) {
      setError(requestError.message || "Failed to update deposits");
    }
  };

  const filteredDeposits = useMemo(() => {
    const minimumAmount = Number(amountRange);
    const today = new Date();
    return deposits.filter((deposit) => {
      const transactionDate = new Date(deposit.createdAt);
      const matchesSearch = `${deposit.id} ${deposit.user} ${deposit.method}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDate =
        dateRange === "Date Range" ||
        (dateRange === "Today" &&
          transactionDate.toDateString() === today.toDateString()) ||
        (dateRange === "This month" &&
          transactionDate.getMonth() === today.getMonth() &&
          transactionDate.getFullYear() === today.getFullYear());
      const matchesAmount =
        !amountRange ||
        (Number.isFinite(minimumAmount) &&
          deposit.amountValue >= minimumAmount);
      return (
        matchesSearch &&
        (status === "All" || deposit.status === status) &&
        (method === "All methods" || deposit.method === method) &&
        matchesDate &&
        matchesAmount
      );
    });
  }, [amountRange, dateRange, deposits, method, search, status]);

  const pendingCount = deposits.filter(
    (deposit) => deposit.status === "Pending",
  ).length;
  const failedCount = deposits.filter(
    (deposit) => deposit.status === "Flagged",
  ).length;
  const totalAmount = deposits
    .filter((deposit) => deposit.status === "Approved")
    .reduce((total, deposit) => total + deposit.amountValue, 0);
  const selectedRows = deposits.filter((deposit) =>
    selected.includes(deposit.transactionId),
  );

  return (
    <div className="space-y-5 text-slate-100">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending Deposits", pendingCount, "text-sky-300", "bg-sky-500/15"],
          [
            "Approved Deposits",
            `${totalAmount.toFixed(2)} ETB`,
            "text-teal-300",
            "bg-teal-500/15",
          ],
          ["Failed Deposits", failedCount, "text-rose-300", "bg-rose-500/15"],
          [
            "Total Records",
            deposits.length,
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
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="mt-1 block h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-200"
          >
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
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className="mt-1 block h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-200"
          >
            <option>All methods</option>
            <option>PayPal</option>
            <option>Bank Transfer</option>
            <option>Crypto</option>
            <option>Telebirr</option>
            <option>CBE</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Minimum Amount
          <input
            value={amountRange}
            onChange={(event) => setAmountRange(event.target.value)}
            type="number"
            min="0"
            placeholder="Amount"
            className="mt-1 block h-9 w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </label>
        <button
          onClick={loadDeposits}
          className="h-9 rounded-lg border border-slate-700 px-3 text-xs text-slate-300 hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-4">
          <h2 className="font-semibold">Player Deposit Records</h2>
          <span className="text-xs text-slate-500">
            {loading
              ? "Loading..."
              : `Showing ${filteredDeposits.length} of ${deposits.length} results`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-287.5 text-left text-xs">
            <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500">
              <tr>
                {[
                  "Deposit ID",
                  "Player Username",
                  "Amount",
                  "Method",
                  "Deposit Date",
                  "Source Account",
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
              {!loading && filteredDeposits.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-3 py-10 text-center text-slate-500"
                  >
                    No deposits match the selected filters.
                  </td>
                </tr>
              )}
              {filteredDeposits.map((deposit) => (
                <tr
                  key={deposit.transactionId}
                  className="hover:bg-slate-800/40"
                >
                  <td className="px-3 py-3 font-medium">
                    <input
                      type="checkbox"
                      checked={selected.includes(deposit.transactionId)}
                      onChange={() =>
                        setSelected((items) =>
                          items.includes(deposit.transactionId)
                            ? items.filter((id) => id !== deposit.transactionId)
                            : [...items, deposit.transactionId],
                        )
                      }
                      className="mr-2"
                    />
                    {deposit.id}
                  </td>
                  <td className="px-3 py-3 text-teal-300">{deposit.user}</td>
                  <td className="px-3 py-3 font-medium">{deposit.amount}</td>
                  <td className="px-3 py-3">{deposit.method}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {deposit.date}
                  </td>
                  <td className="px-3 py-3">{deposit.account}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-medium ${statusStyles[deposit.status]}`}
                    >
                      {deposit.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateRows([deposit], "approve")}
                        disabled={deposit.status !== "Pending"}
                        className="rounded-lg bg-teal-600 px-2 py-1 text-[10px] text-white disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateRows([deposit], "reject")}
                        disabled={deposit.status !== "Pending"}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-300 disabled:opacity-40"
                      >
                        Reject
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
            <button
              onClick={() => updateRows(selectedRows, "approve")}
              disabled={!selectedRows.length}
              className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 disabled:opacity-40"
            >
              Approve Selected
            </button>
            <button
              onClick={() => updateRows(selectedRows, "reject")}
              disabled={!selectedRows.length}
              className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 disabled:opacity-40"
            >
              Deny Selected
            </button>
          </div>
          <span className="text-slate-500">{selectedRows.length} selected</span>
        </div>
      </section>
    </div>
  );
};

export default DepositPage;
