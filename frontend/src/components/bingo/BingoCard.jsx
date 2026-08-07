import React from "react";

const BingoCard = ({ title = "Bingo Card", children, accent = {} }) => {
  return (
    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/20">
      <h2
        className={`text-lg font-semibold mb-4 ${accent.title || "text-white"}`}
      >
        {title}
      </h2>

      <div>{children}</div>
    </div>
  );
};

export default BingoCard;
