import React, { memo } from "react";
import Countdown from "./Countdown";

// IMPORTANT: Users select lucky numbers from 1-300 pool
// Calling numbers during live phase are 1-75 (traditional bingo)
const TOTAL_LUCKY_NUMBERS = 300;

const SelectionPhase = ({
  selectionCountdown,
  calledNumbers = [],
  selectedNumbersGlobal = [],
  mySelections = [],
  canSelectMore,
  showSelectionPanel,
  toggleLuckyNumber,
  joinButtonDisabled,
  handleJoin,

  // NEW
  selectedCard,
  setSelectedCard,
}) => {
  const isSelectionOpen = showSelectionPanel && selectionCountdown > 0;

  const isNumberDisabled = (number) => {
    const isMySelected = mySelections.includes(number);

    const isReservedByOther =
      selectedNumbersGlobal.includes(number) && !isMySelected;

    // Selection closed
    if (!isSelectionOpen) {
      return true;
    }

    // Already selected by me
    if (isMySelected) {
      return false;
    }

    // Selected by another player
    if (isReservedByOther) {
      return true;
    }

    // Maximum selections reached
    if (!canSelectMore) {
      return true;
    }

    // Card must be selected first
    if (!selectedCard) {
      return true;
    }

    return false;
  };

  const getNumberClasses = (number) => {
    const isCalled = calledNumbers.includes(number);

    const isMySelected = mySelections.includes(number);

    const isReservedByOther =
      selectedNumbersGlobal.includes(number) && !isMySelected;

    const disabled = isNumberDisabled(number);

    return `
      aspect-square
      rounded-lg
      text-sm
      font-semibold
      transition-all
      border

      ${
        isMySelected
          ? "border-emerald-400 bg-emerald-600/40 text-emerald-100 scale-105"
          : ""
      }

      ${
        isReservedByOther
          ? "border-rose-400 bg-rose-600/30 text-rose-100 opacity-60 cursor-not-allowed"
          : ""
      }

      ${
        isCalled && !isMySelected
          ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
          : ""
      }

      ${
        !isMySelected && !isReservedByOther && !isCalled
          ? "border-slate-700 bg-slate-900 text-slate-300"
          : ""
      }

      ${
        !disabled && !isMySelected && !isReservedByOther
          ? "hover:border-emerald-400 hover:bg-slate-800 cursor-pointer active:scale-95"
          : ""
      }

      ${disabled && !isMySelected ? "cursor-not-allowed" : ""}
    `;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
            AVAILABLE NUMBERS
          </h2>

          {!selectedCard && isSelectionOpen && (
            <p className="text-xs text-amber-400 mt-1">Select a card first</p>
          )}

          {selectedCard && isSelectionOpen && (
            <p className="text-xs text-slate-400 mt-1">
              Select up to 2 lucky numbers
            </p>
          )}
        </div>

        <div className="text-xs text-slate-400">
          Selected:{" "}
          <span className="text-emerald-400 font-bold">
            {mySelections.length}/2
          </span>
        </div>
      </div>

      {/* =========================================
          CARD SELECTION
      ========================================= */}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* CARD 1 */}

        <button
          type="button"
          onClick={() => setSelectedCard(1)}
          disabled={!isSelectionOpen}
          className={`
            py-4
            rounded-xl
            border
            font-semibold
            transition-all

            ${
              selectedCard === 1
                ? "border-emerald-400 bg-emerald-600/30 text-emerald-300"
                : "border-slate-700 bg-slate-800/60 text-slate-300"
            }

            ${
              isSelectionOpen
                ? "hover:border-emerald-400 hover:bg-slate-800 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }
          `}
        >
          🎫 Card 1
          {selectedCard === 1 && (
            <span className="block text-xs mt-1 text-emerald-400">
              Selected
            </span>
          )}
        </button>

        {/* CARD 2 */}

        <button
          type="button"
          onClick={() => setSelectedCard(2)}
          disabled={!isSelectionOpen}
          className={`
            py-4
            rounded-xl
            border
            font-semibold
            transition-all

            ${
              selectedCard === 2
                ? "border-emerald-400 bg-emerald-600/30 text-emerald-300"
                : "border-slate-700 bg-slate-800/60 text-slate-300"
            }

            ${
              isSelectionOpen
                ? "hover:border-emerald-400 hover:bg-slate-800 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }
          `}
        >
          🎫 Card 2
          {selectedCard === 2 && (
            <span className="block text-xs mt-1 text-emerald-400">
              Selected
            </span>
          )}
        </button>
      </div>

      {/* =========================================
          NUMBER GRID
      ========================================= */}

      <div
        className="
          h-96
          overflow-y-auto
          bg-slate-950/30
          p-4
          rounded-lg
          mb-6
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
                onClick={() => !disabled && toggleLuckyNumber(number)}
                disabled={disabled}
                className={getNumberClasses(number)}
              >
                {number}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================
          SELECTED NUMBERS
      ========================================= */}

      {mySelections.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-400 mb-2">Your lucky numbers</p>

          <div className="flex gap-2">
            {mySelections.map((number) => (
              <div
                key={number}
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-emerald-600/30
                  border
                  border-emerald-400
                  text-emerald-300
                  font-bold
                "
              >
                {number}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================
          JOIN / CONFIRM
      ========================================= */}

      <button
        type="button"
        onClick={handleJoin}
        disabled={
          joinButtonDisabled ||
          !selectedCard ||
          mySelections.length === 0 ||
          !isSelectionOpen
        }
        className={`
          w-full
          py-4
          rounded-xl
          font-bold
          transition-all
          mb-8

          ${
            !joinButtonDisabled &&
            selectedCard &&
            mySelections.length > 0 &&
            isSelectionOpen
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }
        `}
      >
        {!selectedCard
          ? "Select a Card"
          : mySelections.length === 0
            ? "Select a Lucky Number"
            : `Join Game — Card ${selectedCard}`}
      </button>

      {/* =========================================
          COUNTDOWN
      ========================================= */}

      <Countdown
        seconds={selectionCountdown}
        label="Time To Close Selection"
        selectedCardsCount={mySelections.length}
      />
    </div>
  );
};

export default memo(SelectionPhase);
