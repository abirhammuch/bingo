import React from "react";

const CurrentNumber = ({ number = "--", accent = {} }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-slate-800 border border-slate-700 shadow-lg ${
          accent.icon || "text-emerald-400"
        } animate-pulse`}
      >
        {number}
      </div>

      <p className="mt-2 text-sm text-slate-400 font-medium">Current Number</p>
    </div>
  );
};

export default CurrentNumber;
