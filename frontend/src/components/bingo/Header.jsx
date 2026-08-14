import React from "react";

const Header = ({
  timeLeft,
  stake,
  balance,
  gameType = "selection",
  players = 0,
  called = 0,
  round = "1",
  derash = 0,
}) => {
  // Selection phase header
  if (gameType === "selection") {
    return (
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-3">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              TIME
            </div>
            <div className="text-lg font-bold text-emerald-400">
              {timeLeft}s
            </div>
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
  }

  // Live phase header
  return (
    <div className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="max-w-full mx-auto">
        <div className="grid grid-cols-5 gap-2 text-center mb-3">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              DERASH
            </div>
            <div className="text-sm font-bold text-amber-400">{derash} ETB</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              PLAYERS
            </div>
            <div className="text-sm font-bold text-sky-400">{players} B</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              STAKE
            </div>
            <div className="text-sm font-bold text-emerald-400">
              {stake} ETB
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              CALLED
            </div>
            <div className="text-sm font-bold text-rose-400">{called}/75</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              ROUND
            </div>
            <div className="text-sm font-bold text-purple-400">{round}</div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">AUTO</span>
            <button className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 transition"></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
