import React from "react";
import { useNavigate } from "react-router-dom";

const Deposite = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/wallet")}
      className="w-full flex flex-col items-center gap-0.5 py-1.5 px-1 hover:text-emerald-400 text-slate-300 transition"
    >
      <span className="text-lg">💳</span>
      <span className="text-[10px] uppercase font-semibold tracking-tight">
        Deposit
      </span>
    </button>
  );
};

export default Deposite;
