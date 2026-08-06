import React from "react";
import { FaGift } from "react-icons/fa";

const AvailablePromoCode = () => {
  return (
    <div className="rounded-3xl border border-slate-700/70 bg-slate-950/80 p-8 text-center shadow-sm shadow-slate-950/20">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 text-emerald-300">
        <FaGift className="h-7 w-7" />
      </div>
      <div className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400 mb-3">
        Available Promos
      </div>
      <p className="text-sm text-slate-500">
        No public promos available right now.
      </p>
    </div>
  );
};

export default AvailablePromoCode;
