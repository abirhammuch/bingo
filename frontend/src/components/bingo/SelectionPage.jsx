import React, { memo } from "react";
import Countdown from "./Countdown";

// IMPORTANT: Users select lucky numbers from 1-300 pool
// Calling numbers during live phase are 1-75 (traditional bingo)
const TOTAL_LUCKY_NUMBERS = 300;

const SelectionPage = ({
  selectionCountdown,
  calledNumbers = [],
  selectedNumbersGlobal = [],
  mySelections = [],
  canSelectMore,
  showSelectionPanel,
  toggleLuckyNumber,
}) => {
  // ============================================================
  // NUMBER DISABLED
  // ============================================================

  const isNumberDisabled = (number) => {
    const isMySelected = mySelections.includes(number);

    // The backend is the source of truth. Do not hard-block a click just
    // because the number already exists in the global list; the user may still
    // be selecting their own valid number and the server will decide.
    if (!showSelectionPanel) {
      return true;
    }

    if (!isMySelected && !canSelectMore) {
      return true;
    }

    return false;
  };

  // ============================================================
  // NUMBER STYLE
  // ============================================================

  const getNumberClasses = (number) => {
    const isCalled = calledNumbers.includes(number);

    const isMySelected = mySelections.includes(number);

    const isReservedByOther =
      selectedNumbersGlobal.includes(number) && !isMySelected;

    // ----------------------------------------------------------
    // My selected number
    // ----------------------------------------------------------

    if (isMySelected) {
      return `
        aspect-square
        rounded-lg
        text-sm
        font-bold
        transition-all
        border
        border-emerald-400
        bg-emerald-600/50
        text-emerald-100
        ring-2
        ring-emerald-400/30
        cursor-pointer
        hover:bg-emerald-500/60
        active:scale-95
      `;
    }

    // ----------------------------------------------------------
    // Reserved by another player
    // ----------------------------------------------------------

    if (isReservedByOther) {
      return `
        aspect-square
        rounded-lg
        text-sm
        font-semibold
        transition-all
        border
        border-rose-400/50
        bg-rose-600/30
        text-rose-100
        opacity-60
        cursor-not-allowed
      `;
    }

    // ----------------------------------------------------------
    // Called number
    // ----------------------------------------------------------

    if (isCalled) {
      return `
        aspect-square
        rounded-lg
        text-sm
        font-semibold
        transition-all
        border
        border-emerald-400/40
        bg-emerald-500/10
        text-emerald-200
        cursor-not-allowed
      `;
    }

    // ----------------------------------------------------------
    // Normal available number
    // ----------------------------------------------------------

    return `
      aspect-square
      rounded-lg
      text-sm
      font-semibold
      transition-all
      border
      border-slate-700
      bg-slate-900
      text-slate-300
      cursor-pointer
      hover:border-emerald-500
      hover:bg-slate-800
      hover:text-white
      active:scale-95
    `;
  };

  // ============================================================
  // SELECTED COUNT
  // ============================================================

  const selectedCount = mySelections.length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2
            className={`text-sm font-semibold uppercase tracking-wide ${
              showSelectionPanel ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {showSelectionPanel
              ? `SELECT LUCKY NUMBERS 1-${TOTAL_LUCKY_NUMBERS}`
              : "WAITING FOR NEXT SELECTION"}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Select up to 3 lucky numbers
          </p>
        </div>
      </div>

      {/* ======================================================
          SELECTION STATUS
      ====================================================== */}

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Your selections:
          <span className="ml-2 font-bold text-emerald-400">
            {selectedCount}/3
          </span>
        </div>

        <div className="text-xs text-slate-500">
          {selectionCountdown > 0 ? (
            <>
              <span className="text-emerald-400 font-bold text-sm">
                {selectionCountdown}s
              </span>
              <span className="text-xs"> remaining</span>
            </>
          ) : (
            "Selection closed"
          )}
        </div>
      </div>

      {/* ======================================================
          SELECTED NUMBERS
      ====================================================== */}

      <div className="mb-4 flex gap-2 flex-wrap">
        {mySelections.length === 0 && (
          <div className="text-xs text-slate-500">
            Tap a number below to select it.
          </div>
        )}

        {mySelections.map((number) => (
          <div
            key={number}
            className="
              px-3
              py-1.5
              rounded-lg
              bg-emerald-600/20
              border
              border-emerald-500/40
              text-emerald-300
              text-xs
              font-bold
            "
          >
            #{number}
          </div>
        ))}
      </div>

      {/* ======================================================
          NUMBER GRID
      ====================================================== */}

      <div
        className="
          h-96
          overflow-y-auto
          bg-slate-950/30
          p-4
          rounded-lg
          mb-8
          border
          border-slate-700
        "
      >
        <div className="grid grid-cols-8 gap-2">
          {Array.from(
            { length: TOTAL_LUCKY_NUMBERS },
            (_, index) => index + 1,
          ).map((number) => {
            const disabled = isNumberDisabled(number);

            return (
              <button
                key={number}
                type="button"
                onClick={() => {
                  if (!disabled) {
                    toggleLuckyNumber(number);
                  }
                }}
                disabled={disabled}
                aria-label={`Lucky number ${number}`}
                aria-pressed={mySelections.includes(number)}
                className={getNumberClasses(number)}
              >
                {number}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================
          CARD SELECTION
      ====================================================== */}

      <div className="flex gap-4 mb-8">
        <button
          type="button"
          disabled={mySelections.length === 0}
          className="
            flex-1
            py-4
            bg-slate-800/60
            border
            border-slate-700
            rounded-lg
            text-slate-300
            font-semibold
            hover:bg-slate-800
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >
          Select Card 1
        </button>

        <button
          type="button"
          disabled={mySelections.length === 0}
          className="
            flex-1
            py-4
            bg-slate-800/60
            border
            border-slate-700
            rounded-lg
            text-slate-300
            font-semibold
            hover:bg-slate-800
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >
          Select Card 2
        </button>
      </div>

      {/* ======================================================
          COUNTDOWN
      ====================================================== */}

      <Countdown
        seconds={selectionCountdown}
        label="Time To Close Selection"
        selectedCardsCount={selectedCount}
      />
    </div>
  );
};

export default memo(SelectionPage);
