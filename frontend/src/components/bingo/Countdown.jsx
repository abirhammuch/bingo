import React, { useEffect, useState } from "react";

const Countdown = ({ seconds = 30, label = "Next Number In" }) => {
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
    <div className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 p-3">
      <div className="text-center">
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
