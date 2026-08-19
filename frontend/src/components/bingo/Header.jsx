import React from "react";
import Countdown from "./Countdown";

const Header = ({
  timeLeft = 0,
  stake = 10,
  balance = 0,
  gameType = "selection",
  players = 0,
  called = 0,
  round = "1",
  derash = 0,
  selectionEndsAt = null,
  selectedCardsCount = 0,
}) => {
  const safeCalled = Math.min(Math.max(Number(called) || 0, 0), 75);

  /*
   * Selection header
   */
  if (gameType === "selection") {
    return (
      <header className="bg-slate-900 border-b border-slate-700 px-4 py-3">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4 text-center">
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

            <div className="text-lg font-bold text-sky-400">
              {Number(balance || 0).toFixed(2)} ETB
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-3">
          <Countdown
            selectionEndsAt={selectionEndsAt}
            seconds={timeLeft}
            label="Time To Close Selection"
            selectedCardsCount={selectedCardsCount}
          />
        </div>
      </header>
    );
  }

  /*
   * Live header
   */
  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="max-w-full mx-auto">
        <div className="grid grid-cols-5 gap-2 text-center mb-3">
          {/* DERASH */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              DERASH
            </div>

            <div className="text-sm font-bold text-amber-400">
              {Number(derash || 0).toFixed(2)} ETB
            </div>
          </div>

          {/* PLAYERS */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              PLAYERS
            </div>

            <div className="text-sm font-bold text-sky-400">{players} B</div>
          </div>

          {/* STAKE */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              STAKE
            </div>

            <div className="text-sm font-bold text-emerald-400">
              {stake} ETB
            </div>
          </div>

          {/* CALLED */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              CALLED
            </div>

            <div
              className={`text-sm font-bold ${
                safeCalled >= 75 ? "text-rose-400" : "text-rose-400"
              }`}
            >
              {safeCalled}/75
            </div>
          </div>

          {/* ROUND */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              ROUND
            </div>

            <div className="text-sm font-bold text-purple-400">{round}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${(safeCalled / 75) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="text-xs text-slate-500">
            {safeCalled < 75
              ? `${75 - safeCalled} numbers remaining`
              : "All numbers called"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
