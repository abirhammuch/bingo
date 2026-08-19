import React, { memo } from "react";

const SelectionPage = ({
  selectionCountdown,
  selectionEndsAt,
  calledNumbers,
  selectedNumbersGlobal,
  mySelections,
  canSelectMore,
  showSelectionPanel,
  toggleLuckyNumber,
}) => {
  const isNumberDisabled = (number) => {
    const isMySelected = mySelections.includes(number);

    const isReservedByOther =
      selectedNumbersGlobal.includes(number) && !isMySelected;

    return (
      !showSelectionPanel ||
      isReservedByOther ||
      (!isMySelected && !canSelectMore)
    );
  };

  const getNumberClasses = (number) => {
    const isMySelected = mySelections.includes(number);

    const isReservedByOther =
      selectedNumbersGlobal.includes(number) && !isMySelected;

    return `
      aspect-square
      rounded-lg
      text-sm
      font-semibold
      transition-all
      border

      ${
        isMySelected
          ? "border-emerald-400 bg-emerald-600/40 text-emerald-100 ring-2 ring-emerald-400/40"
          : ""
      }

      ${
        isReservedByOther
          ? "border-rose-400 bg-rose-600/30 text-rose-100 opacity-70 cursor-not-allowed"
          : ""
      }

      ${
        !isMySelected && !isReservedByOther
          ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:bg-slate-800 hover:text-white"
          : ""
      }

      ${isMySelected ? "cursor-pointer" : ""}
    `;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
            {showSelectionPanel
              ? "SELECT YOUR LUCKY NUMBERS"
              : "SELECTION CLOSED"}
          </h2>

          <p className="text-xs text-slate-500 mt-1">Select up to 3 numbers</p>
        </div>

        <div className="text-xs text-slate-400">{mySelections.length}/3</div>
      </div>

      {/* =====================================================
          SELECTED NUMBERS
      ===================================================== */}

      {mySelections.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {mySelections.map((number) => (
            <div
              key={number}
              className="px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500 text-emerald-300 font-bold"
            >
              #{number}
            </div>
          ))}
        </div>
      )}

      <div className="h-96 overflow-y-auto bg-slate-950/30 p-4 rounded-lg border border-slate-700">
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 300 }, (_, index) => index + 1).map(
            (number) => {
              const disabled = isNumberDisabled(number);

              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => toggleLuckyNumber(number)}
                  disabled={disabled}
                  aria-label={`Lucky number ${number}`}
                  aria-pressed={mySelections.includes(number)}
                  className={getNumberClasses(number)}
                >
                  {number}
                </button>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(SelectionPage);
