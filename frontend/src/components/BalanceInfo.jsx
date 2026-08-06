import React from "react";
import Withdraw from "./Withdraw";

const BalanceInfo = ({
  activeMode,
  onWithdraw,
  onDeposit,
  onHistory,
  onClose,
}) => {
  return (
    <div className="space-y-6 px-4 py-4 sm:px-0">
      <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 sm:text-4xl">
            My Wallet
          </h1>
        </div>

        <div className="rounded-[2rem] border border-slate-700/80 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/20 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr] xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-3xl bg-slate-950/80 p-5 shadow-inner shadow-slate-950/10 sm:p-6">
              <div className="flex flex-col gap-3 text-xs uppercase tracking-[0.35em] text-slate-400 sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-emerald-300 text-base">
                  💼
                </span>
                <span>Total Balance</span>
              </div>
              <div className="text-4xl font-bold text-emerald-400 sm:text-5xl">
                ETB 0.70
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-950/80 p-4 text-center border border-slate-800 sm:p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Withdrawable
                </div>
                <div className="mt-3 text-xl font-semibold text-emerald-400">
                  ETB 0.00
                </div>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-center border border-slate-800 sm:p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Special Bonus
                </div>
                <div className="mt-3 text-xl font-semibold text-amber-300">
                  ETB 0.00
                </div>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-center border border-slate-800 sm:p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Locked Balance
                </div>
                <div className="mt-3 text-xl font-semibold text-amber-300">
                  ETB 0.70
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <button
              onClick={onDeposit}
              className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition sm:w-auto ${
                activeMode === "default"
                  ? "bg-emerald-400 text-slate-950 hover:brightness-110"
                  : "border border-slate-700 bg-slate-900/90 text-slate-100 hover:border-emerald-500"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={onWithdraw}
              className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition sm:w-auto ${
                activeMode === "withdraw"
                  ? "border border-emerald-400 bg-emerald-400/10 text-emerald-300"
                  : "border border-slate-700 bg-slate-900/90 text-slate-100 hover:border-emerald-500"
              }`}
            >
              Withdraw
            </button>
            <button
              onClick={onHistory}
              className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition sm:w-auto ${
                activeMode === "history"
                  ? "border border-emerald-400 bg-emerald-400/10 text-emerald-300"
                  : "border border-slate-700 bg-slate-900/90 text-slate-100 hover:border-emerald-500"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {activeMode === "withdraw" && <Withdraw onClose={onClose} />}
    </div>
  );
};

export default BalanceInfo;
