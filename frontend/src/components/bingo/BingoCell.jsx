import React from "react";

const BingoCell = ({ number, marked = false, accent = {} }) => {
  // ✅ FIX: Handle 0 (from backend) OR "FREE" (from frontend)
  const isFree = number === 0 || number === "FREE";

  return (
    <div
      className={`w-full aspect-square rounded-2xl flex items-center justify-center text-sm font-semibold border transition-all duration-200 ease-out ${
        marked
          ? `bg-emerald-600/20 border-emerald-400 text-emerald-200 shadow-inner ${accent.accentText || ""}`
          : isFree
            ? "bg-amber-500/20 border-amber-400 text-amber-100"
            : "bg-slate-950 border-slate-700 text-slate-100 hover:bg-slate-900 hover:border-slate-500"
      }`}
    >
      {/* ✅ FIX: Show "⭐" for FREE, otherwise show the number */}
      {isFree ? "⭐" : number}
    </div>
  );
};

export default BingoCell;