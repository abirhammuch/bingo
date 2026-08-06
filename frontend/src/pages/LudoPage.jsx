import React from "react";
import Ludo from "../components/Ludo";

const LudoPage = ({ theme }) => {
  return (
    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700">
      <h1 className="text-2xl font-semibold text-slate-100 mb-4">Ludo</h1>
      <Ludo />
    </div>
  );
};

export default LudoPage;
