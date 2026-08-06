import React from "react";

const GameStatus = ({ status = "waiting", accent = {} }) => {
  const statusMap = {
    waiting: "text-slate-300",
    running: accent.selectedText || "text-emerald-300",
    finished: "text-rose-300",
  };
  return (
    <div className={`text-sm ${statusMap[status] || "text-slate-300"}`}>
      Status: {status}
    </div>
  );
};

export default GameStatus;
