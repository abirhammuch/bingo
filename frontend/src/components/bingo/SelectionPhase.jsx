import React, { memo } from "react";

const SelectionPhase = ({
  selectionCountdown,
  calledNumbers,
  selectedNumbersGlobal,
  mySelections,
  canSelectMore,
  showSelectionPanel,
  toggleLuckyNumber,
  joinButtonDisabled,
  handleJoin,
}) => {
  const isNumberDisabled = (number) => {
    const isMySelected = mySelections.includes(number);
    const isReservedByOther =
      selectedNumbersGlobal.includes(number) && !isMySelected;

    return (
      !showSelectionPanel ||
      isMySelected ||
      isReservedByOther ||
      (!isMySelected && !canSelectMore)
    );
  };

  const getNumberClasses = (number) => {
    const isCalled = calledNumbers.includes(number);
    const isMySelected = mySelections.includes(number);
    const isReservedByOther =
      selectedNumbersGlobal.includes(number) && !isMySelected;

    return `
      aspect-square rounded-lg text-sm font-semibold transition-all border
      ${isCalled ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100" : ""}
      ${isMySelected && !isCalled ? "border-emerald-400 bg-emerald-600/30 text-emerald-100" : ""}
      ${isReservedByOther && !isCalled ? "border-rose-400 bg-rose-600/30 text-rose-100 opacity-70 cursor-not-allowed" : ""}
      ${!isCalled && !isMySelected && !isReservedByOther ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800" : ""}
      ${isMySelected || isReservedByOther ? "cursor-not-allowed" : ""}
    `;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Available Numbers Label */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
          AVAILABLE ({300 - calledNumbers.length})
        </h2>
        <button
          onClick={handleJoin}
          disabled={joinButtonDisabled}
          className={`text-xs px-3 py-1 rounded transition ${
            joinButtonDisabled
              ? "text-slate-500 cursor-not-allowed"
              : "text-emerald-400 hover:text-emerald-300"
          }`}
        >
          Tap to select
        </button>
      </div>

      {/* Bingo Grid - Scrollable with 8 rows visible */}
      <div className="h-96 overflow-y-auto bg-slate-950/30 p-4 rounded-lg mb-8 border border-slate-700">
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 300 }, (_, index) => index + 1).map(
            (number) => (
              <button
                key={number}
                onClick={() => toggleLuckyNumber(number)}
                disabled={isNumberDisabled(number)}
                className={getNumberClasses(number)}
              >
                {number}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Select Card Buttons */}
      <div className="flex gap-4 mb-8">
        <button className="flex-1 py-4 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 font-semibold hover:bg-slate-800 transition">
          Select Card 1
        </button>
        <button className="flex-1 py-4 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 font-semibold hover:bg-slate-800 transition">
          Select Card 2
        </button>
      </div>
    </div>
  );
};

export default memo(SelectionPhase);
