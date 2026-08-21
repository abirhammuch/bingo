import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminWalletRequests,
  updateAdminWalletRequest,
} from "../../services/userService";
import { FaCopy } from "react-icons/fa";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Flagged: "bg-rose-100 text-rose-700",
  Denied: "bg-rose-100 text-rose-700",
};

const WithdrawPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All methods");
  const [dateRange, setDateRange] = useState("Date Range");
  const [amountRange, setAmountRange] = useState("");
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedAccount, setCopiedAccount] = useState("");

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
              amountValue: Number(transaction.amount || 0),
              amount: `${Number(transaction.amount || 0).toFixed(2)} ETB`,
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
      )
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (request, action) => {
    try {
      const response = await updateAdminWalletRequest(
        request.transactionId,
        action,
      );
      setWithdrawalRequests((items) =>
        items.map((item) =>
          item.transactionId === request.transactionId
            ? {
                ...item,
                status: action === "approve" ? "Approved" : "Denied",
                refundedBalance:
                  action === "reject" ? response.balance : undefined,
              }
            : item,
        ),
      );
      setSelected((items) =>
        items.filter((id) => id !== request.transactionId),
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to update withdrawal");
    }
  };

  const copyAccount = async (request) => {
    if (!request.account || request.account === "-") return;
    try {
      await navigator.clipboard.writeText(request.account);
      setCopiedAccount(request.transactionId);
      window.setTimeout(() => setCopiedAccount(""), 1500);
    } catch {
      setError("Unable to copy the withdrawal phone number");
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
    [search, status, withdrawalRequests],
  );

  const filteredWithControls = filteredRequests.filter((request) => {
    const minimumAmount = Number(amountRange);
    const requestDate = new Date(request.createdAt);
    const today = new Date();
    const matchesDate =
      dateRange === "Date Range" ||
      (dateRange === "Today" &&
        requestDate.toDateString() === today.toDateString()) ||
      (dateRange === "This month" &&
        requestDate.getMonth() === today.getMonth() &&
        requestDate.getFullYear() === today.getFullYear());
    return (
      matchesDate &&
      (method === "All methods" || request.method === method) &&
      (!amountRange ||
        (Number.isFinite(minimumAmount) &&
          request.amountValue >= minimumAmount))
    );
  });

  const updateSelected = (action) => {
    const rows = withdrawalRequests.filter((request) =>
      selected.includes(request.transactionId),
    );
    Promise.all(
      rows.map((request) =>
        updateAdminWalletRequest(request.transactionId, action),
      ),
    )
      .then(() => {
        setWithdrawalRequests((items) =>
          items.map((item) =>
            selected.includes(item.transactionId)
              ? {
                  ...item,
                  status: action === "approve" ? "Approved" : "Denied",
                }
              : item,
          ),
        );
        setSelected([]);
      })
      .catch((requestError) =>
        setError(requestError.message || "Failed to update withdrawals"),
      );
  };

  const pendingCount = withdrawalRequests.filter(
    (request) => request.status === "Pending",
  ).length;
  const deniedCount = withdrawalRequests.filter(
    (request) => request.status === "Flagged" || request.status === "Denied",
  ).length;
  const totalAmount = withdrawalRequests
    .filter((request) => request.status === "Approved")
    .reduce((total, request) => total + request.amountValue, 0);

  return (
    <div className="space-y-5 text-slate-900">
      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending Requests", pendingCount, "bg-sky-100 text-sky-700"],
          [
            "Approved Withdrawals",
            `${totalAmount.toFixed(2)} ETB`,
            "bg-teal-100 text-teal-700",
          ],
          ["Denied Requests", deniedCount, "bg-rose-100 text-rose-700"],
          [
            "Total Withdrawn (MTD)",
            `${totalAmount.toFixed(2)} ETB`,
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
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="mt-1 block h-9 rounded-md border border-slate-300 px-2 text-sm"
          >
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
            <option>Denied</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Method
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className="mt-1 block h-9 rounded-md border border-slate-300 px-2 text-sm"
          >
            <option>All methods</option>
            <option>PayPal</option>
            <option>Bank Transfer</option>
            <option>Crypto</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Min/Max Amount
          <input
            value={amountRange}
            onChange={(event) => setAmountRange(event.target.value)}
            placeholder="Min amount"
            className="mt-1 block h-9 w-28 rounded-md border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Player Withdrawal Requests</h2>
          <span className="text-xs text-slate-500">
            {loading
              ? "Loading..."
              : `Showing ${filteredWithControls.length} of ${withdrawalRequests.length} results`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-262.5 text-left text-xs">
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
              {!loading && filteredWithControls.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="px-3 py-10 text-center text-slate-500"
                  >
                    No withdrawals match the selected filters.
                  </td>
                </tr>
              )}
              {filteredWithControls.map((request, index) => (
                <tr
                  key={`${request.id}-${index}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-3 py-3 font-medium">
                    <input
                      type="checkbox"
                      checked={selected.includes(request.transactionId)}
                      onChange={() =>
                        setSelected((items) =>
                          items.includes(request.transactionId)
                            ? items.filter((id) => id !== request.transactionId)
                            : [...items, request.transactionId],
                        )
                      }
                      className="mr-2"
                    />
                    {request.id}
                  </td>
                  <td className="px-3 py-3 text-teal-700">{request.user} ↗</td>
                  <td className="px-3 py-3 font-medium">{request.amount}</td>
                  <td className="px-3 py-3">{request.method}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {request.date}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span>{request.account}</span>
                      <button
                        type="button"
                        onClick={() => copyAccount(request)}
                        disabled={!request.account || request.account === "-"}
                        title="Copy withdrawal phone"
                        aria-label={`Copy withdrawal phone for ${request.user}`}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-teal-700 disabled:opacity-30"
                      >
                        <FaCopy aria-hidden="true" />
                      </button>
                      {copiedAccount === request.transactionId && (
                        <span className="text-[10px] text-teal-700">
                          Copied
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">{request.activity}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyles[request.status]}`}
                    >
                      {request.status === "Denied"
                        ? "Denied / refunded"
                        : request.status}
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
            <button
              onClick={() => updateSelected("approve")}
              disabled={!selected.length}
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Approve Selected
            </button>
            <button
              onClick={() => updateSelected("reject")}
              disabled={!selected.length}
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Deny Selected
            </button>
          </div>
          <span className="text-slate-500">{selected.length} selected</span>
        </div>
      </section>
    </div>
  );
};

export default WithdrawPage;
