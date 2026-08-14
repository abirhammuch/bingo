import React from "react";

const WithdrawHistory = () => {
  return (
    <div className="mt-8 rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-100">
            Withdrawal History
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Completed withdrawals and receipts for your recent payout activity.
          </p>
        </div>
        <span className="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
          ETB 303.00
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Telebirr Withdrawal
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span>4/30/2026, 1:33:40 PM</span>
                <span className="inline-flex h-1 w-1 rounded-full bg-slate-500" />
                <span className="text-emerald-400">Completed</span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 text-right sm:items-end">
              <span className="text-lg font-bold text-emerald-400">
                ETB 303.00
              </span>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300">
                  View Receipt
                </button>
                <button className="rounded-full border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300 transition hover:bg-emerald-500/20">
                  Request Receipt
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Telebirr Withdrawal
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span>4/25/2026, 10:20:15 AM</span>
                <span className="inline-flex h-1 w-1 rounded-full bg-slate-500" />
                <span className="text-slate-400">Receipt requested</span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 text-right sm:items-end">
              <span className="text-lg font-bold text-rose-400">
                - ETB 120.00
              </span>
              <button className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300">
                View Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-400">
        <span>Showing 2 / 2</span>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-700 px-3 py-2 text-slate-400 transition hover:border-emerald-500 hover:text-emerald-300">
            Back
          </button>
          <button className="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-emerald-300 transition hover:bg-emerald-500/20">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawHistory;
