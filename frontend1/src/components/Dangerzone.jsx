import React from "react";

const Dangerzone = () => {
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-rose-500/10 text-2xl text-rose-400">
            ⚠️
          </span>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Danger Zone</h2>
            <p className="text-sm text-slate-400">
              Logging out will end your session. You'll need to log back in to
              access your account.
            </p>
          </div>
        </div>
      </div>

      <button className="mt-6 w-full rounded-3xl bg-rose-500/20 px-6 py-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/30">
        Log Out
      </button>
    </div>
  );
};

export default Dangerzone;
