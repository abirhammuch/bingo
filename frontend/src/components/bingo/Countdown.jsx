import React, { useEffect, useState, useRef } from "react";

const Countdown = ({
  seconds = 30,
  label = "Next Number In",
  selectedCardsCount = 0,
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const prevSecondsRef = useRef(seconds);

  useEffect(() => {
    // Only reset the timer if seconds increased (new round), not on every update
    if (seconds > prevSecondsRef.current) {
      setTimeLeft(seconds);
      prevSecondsRef.current = seconds;
    }

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
