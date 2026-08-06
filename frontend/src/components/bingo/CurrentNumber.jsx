import React from "react";

const CurrentNumber = ({ number, accent = {} }) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-slate-800/60 border border-slate-700 ${accent.icon || "text-emerald-400"} motion-safe:animate-bounce`}
      >
        {number}
      </div>
      <div className="text-sm text-slate-300">Current</div>
    </div>
  );
};

export default CurrentNumber;
