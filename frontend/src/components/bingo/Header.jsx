import React from "react";

const Header = ({ timeLeft, stake, balance }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            TIME
          </div>
          <div className="text-lg font-bold text-emerald-400">{timeLeft}s</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            STAKE
          </div>
          <div className="text-lg font-bold text-amber-400">{stake} ETB</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            BALANCE
          </div>
          <div className="text-lg font-bold text-sky-400">{balance} ETB</div>
        </div>
      </div>
    </div>
  );
};

export default Header;
