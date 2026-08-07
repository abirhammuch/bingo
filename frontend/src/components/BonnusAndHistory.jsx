import React from "react";
import { useAppContext } from "../context/AppContext.jsx";
const BonnusAndHistory = () => {
  const { navigateTo } = useAppContext();

  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Bonuses & History
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Track your active wagering requirements and review your past
            bonuses.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigateTo("/happy-hour")}
          className="rounded-3xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-left text-sm font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/10"
        >
          <span className="inline-flex items-center gap-2 text-base font-bold text-amber-200">
            ⚡ HH History
          </span>
          <p className="mt-2 text-xs text-slate-400">
            Review high-value wagering activity.
          </p>
        </button>

        <button
          onClick={() => navigateTo("/wallet")}
          className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-left text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/10"
        >
          <span className="inline-flex items-center gap-2 text-base font-bold text-emerald-200">
            💼 Wallet Ledger
          </span>
          <p className="mt-2 text-xs text-slate-400">
            See your deposit and withdrawal history.
          </p>
        </button>
      </div>
    </div>
  );
};

export default BonnusAndHistory;
