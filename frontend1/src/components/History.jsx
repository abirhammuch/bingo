import React from "react";

const History = ({ onClose }) => {
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Ledger History</h2>
          <p className="mt-2 text-sm text-slate-400">
            A ledger of all your completed deposits, withdrawals, and gameplay.
          </p>
        </div>
        <button
          onClick={onClose}
          className="self-start rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-500"
        >
          Close
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Qtech Bet
              </div>
              <div className="text-xs text-slate-500">
                6/18/2026, 6:05:20 PM
              </div>
            </div>
            <div className="text-lg font-semibold text-rose-400">
              - ETB 7.00
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Deposit
              </div>
              <div className="text-xs text-slate-500">
                6/12/2026, 1:42:10 PM
              </div>
            </div>
            <div className="text-lg font-semibold text-emerald-400">
              + ETB 15.00
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-3xl bg-slate-900/90 px-4 py-3 text-sm text-slate-400">
        <span>Showing 1 / 2</span>
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

export default History;
