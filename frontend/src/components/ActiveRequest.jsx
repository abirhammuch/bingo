import React from "react";

const ActiveRequest = () => {
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Active Requests</h2>
          <p className="mt-1 text-sm text-slate-400">
            Waiting for finance confirmation
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
          Pending
        </span>
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-slate-700/60 bg-slate-900/80 p-8 text-center text-slate-400">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950/90 text-2xl text-emerald-400">
          ⏳
        </div>
        <p className="mt-4 text-sm leading-6">No active pending withdrawals.</p>
      </div>
    </div>
  );
};

export default ActiveRequest;
