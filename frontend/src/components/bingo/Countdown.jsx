import React, { useEffect, useState } from "react";

const Countdown = ({
  selectionEndsAt = null,
  seconds = 30,
  label = "Next Number In",
  selectedCardsCount = 0,
}) => {
  const calculateRemaining = () => {
    if (!selectionEndsAt) {
      return Math.max(0, Number(seconds) || 0);
    }

    return Math.max(
      0,
      Math.ceil((new Date(selectionEndsAt).getTime() - Date.now()) / 1000),
    );
  };

  const [timeLeft, setTimeLeft] = useState(calculateRemaining);

  useEffect(() => {
    setTimeLeft(calculateRemaining());

    if (!selectionEndsAt) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(calculateRemaining());
    }, 250);

    return () => clearInterval(intervalId);
  }, [selectionEndsAt, seconds]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900 p-3">
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
    </div>
  );
};

export default Countdown;
