import React from "react";

const Countdown = ({
  seconds = 30,
  label = "Next Number In",
  selectedCardsCount = 0,
  stake = null,
  balance = null,
}) => {
  const timeLeft = Math.max(0, Number(seconds) || 0);

  return (
    <div
      className={`grid items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 p-3 text-center ${
        stake !== null && balance !== null ? "grid-cols-4" : "grid-cols-2"
      }`}
    >
      {/* Total Selected Cards Counter on the left - GLOBAL from all devices */}
      <div className="flex flex-col items-center justify-center min-w-fit">
        <p className="text-xs text-slate-500 uppercase tracking-wide">
          Total Selected
        </p>
        <div className="text-2xl font-bold text-blue-400 mt-1">
          {selectedCardsCount}
        </div>
        <p className="text-xs text-slate-600 mt-0.5">cards in round</p>
      </div>

      {/* Countdown timer in the center */}
      <div className="flex-1 text-center">
        <p className="text-sm text-slate-400">{label}</p>
        <h2
          className={`text-3xl font-bold ${
            timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-emerald-400"
          }`}
        >
          {timeLeft}s
        </h2>
      </div>

      {stake !== null && balance !== null && (
        <>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              Stake
            </p>
            <p className="mt-1 text-lg font-bold text-amber-400">{stake} ETB</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              Balance
            </p>
            <p className="mt-1 text-lg font-bold text-sky-400">
              {Number(balance || 0).toFixed(2)} ETB
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Countdown;
