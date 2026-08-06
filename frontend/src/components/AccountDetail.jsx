import React from "react";

const AccountDetail = () => {
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-2xl text-emerald-400">
            🧾
          </span>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              Account Details
            </h2>
            <p className="text-sm text-slate-400">
              User account overview and status details.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Account Status
          </p>
          <p className="mt-3 rounded-3xl bg-slate-950/90 px-4 py-3 text-sm font-semibold text-emerald-300">
            Active
          </p>
        </div>

        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Role
          </p>
          <p className="mt-3 rounded-3xl bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-300">
            user
          </p>
        </div>

        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 px-5 py-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Member Since
          </p>
          <p className="mt-3 rounded-3xl bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-300">
            April 23, 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
