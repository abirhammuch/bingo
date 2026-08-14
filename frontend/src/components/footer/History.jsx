import React from "react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/history")}
      className="w-full flex flex-col items-center gap-0.5 py-1.5 px-1 hover:text-emerald-400 text-slate-300 transition"
    >
      <span className="text-lg">⏰</span>
      <span className="text-[10px] uppercase font-semibold tracking-tight">
        History
      </span>
    </button>
  );
};

export default History;
