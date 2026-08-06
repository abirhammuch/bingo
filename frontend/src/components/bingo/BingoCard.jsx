import React from "react";

const BingoCard = ({ title = "Bingo Card", children, accent = {} }) => {
  return (
    <div
      className={`p-3 rounded-lg bg-slate-900/40 border border-slate-700 transition transform duration-300 hover:-translate-y-1`}
    >
      <div className={`font-semibold text-slate-100 mb-2`}>{title}</div>
      <div className="grid grid-cols-5 gap-2">{children}</div>
    </div>
  );
};

export default BingoCard;
