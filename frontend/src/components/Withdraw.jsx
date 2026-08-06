import React from "react";
import WithdrawHistory from "./WithdrawHistory";
import ActiveRequest from "./ActiveRequest";

const Withdraw = ({ onClose }) => {
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400">
            Withdraw Funds
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Enter the amount you want to withdraw and choose your preferred
            payout method.
          </p>
        </div>
        <button
          onClick={onClose}
          className="self-start rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-500"
        >
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
          <label className="block text-sm font-semibold text-slate-200">
            Withdraw Amount
          </label>
          <input
            type="number"
            min="0"
            placeholder="ETB 0.00"
            className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400"
          />
          <p className="text-xs text-slate-500">
            Available withdrawable balance: ETB 0.00
          </p>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
          <label className="block text-sm font-semibold text-slate-200">
            Payout Method
          </label>
          <select className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400">
            <option>Bank Transfer</option>
            <option>Mobile Wallet</option>
            <option>Cash Pickup</option>
          </select>
          <p className="text-xs text-slate-500">
            Choose where you want to receive your withdrawal.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-400">
          <p className="font-semibold text-slate-200">Note:</p>
          <p className="mt-2">
            Withdrawals are processed within 1-2 business days. Minimum amount
            ETB 10.00.
          </p>
        </div>
        <button className="w-full rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 sm:w-auto">
          Request Withdraw
        </button>
      </div>
      <ActiveRequest />
      <WithdrawHistory />
    </div>
  );
};

export default Withdraw;
