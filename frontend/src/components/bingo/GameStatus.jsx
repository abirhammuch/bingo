import React from "react";

const GameStatus = ({ status = "waiting", accent = {} }) => {
  const statusConfig = {
    waiting: {
      text: "Waiting",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    running: {
      text: "Live",
      className:
        accent.selectedBg ||
        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    finished: {
      text: "Finished",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const current = statusConfig[status] || statusConfig.waiting;

  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 font-medium">Game Status:</span>

      <span
        className={`px-3 py-1 rounded-full border text-sm font-semibold ${current.className}`}
      >
        {current.text}
      </span>
    </div>
  );
};

export default GameStatus;
