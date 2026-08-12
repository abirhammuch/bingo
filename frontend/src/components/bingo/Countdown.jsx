import React, { useEffect, useState } from "react";

const Countdown = ({
  seconds = 30,
  label = "Next Number In",
  selectedCardsCount = 0,
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900 p-3">
      {/* Selected Cards Counter on the left */}
      <div className="flex flex-col items-center justify-center min-w-fit">
        <p className="text-xs text-slate-500 uppercase tracking-wide">
          Selected Cards
        </p>
        <div className="text-2xl font-bold text-blue-400 mt-1">
          {selectedCardsCount}
        </div>
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
