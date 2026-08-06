import React from "react";

const BingoCell = ({ number, marked, accent = {} }) => {
  return (
    <div
      className={`w-full h-12 rounded-md flex items-center justify-center text-sm font-medium border transition transform duration-200 ease-out hover:scale-105 active:scale-95 ${
        marked
          ? "bg-emerald-700/20 border-emerald-500 text-emerald-200 animate-pulse"
          : "bg-slate-800/40 text-slate-100"
      }`}
    >
      {number}
    </div>
  );
};

export default BingoCell;
