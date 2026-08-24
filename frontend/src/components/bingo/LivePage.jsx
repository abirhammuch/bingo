import React, { memo } from "react";
import BingoCell from "./BingoCell";

const LivePage = ({
  calledNumbers = [],
  currentNumber = null,
  cards = [],
  selectionNumbers = [],
  accent = {},
}) => {
  const safeCalledNumbers = Array.isArray(calledNumbers) ? calledNumbers : [];
  const normalizedCurrentNumber = Number(currentNumber);
  const normalizedCalledNumbers = safeCalledNumbers
    .map((number) => Number(number))
    .filter((number) => Number.isInteger(number) && number >= 1 && number <= 75)
    .filter((number, index, numbers) => numbers.indexOf(number) === index);
  const previousCalls = normalizedCalledNumbers
    .filter((number) => number !== normalizedCurrentNumber)
    .reverse();
  const recentCalls = [
    ...(Number.isInteger(normalizedCurrentNumber) &&
    normalizedCurrentNumber >= 1 &&
    normalizedCurrentNumber <= 75
      ? [normalizedCurrentNumber]
      : []),
    ...previousCalls,
  ].slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-2 gap-6">
      {/* =================================================
          LEFT - 75 NUMBER BOARD
      ================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200">CALLED NUMBERS</h2>

          <span className="text-xs font-semibold text-slate-400">
            {safeCalledNumbers.length}/75
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 75 }, (_, index) => index + 1).map((number) => {
            const isCalled = safeCalledNumbers.includes(number);

            const isCurrent = number === currentNumber;

            return (
              <div
                key={number}
                className={`
                  aspect-square
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-xs
                  font-bold
                  border
                  transition-all
                  duration-300

                  ${
                    isCurrent
                      ? "border-purple-400 bg-purple-600 text-white scale-110 shadow-lg shadow-purple-500/30"
                      : isCalled
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                        : "border-slate-700 bg-slate-900 text-slate-500"
                  }
                `}
              >
                {number}
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================
          RIGHT
      ================================================= */}
      <div className="flex flex-col gap-4">
        {/* Recent Calls */}
        <div className="py-3">
          <div className="mb-2 text-center text-xs font-bold text-slate-400">
            RECENT CALLS
          </div>
          <div className="flex min-h-16 items-center justify-center gap-3">
            {Array.from({ length: 3 }, (_, index) => {
              const number = recentCalls[index];
              const isCurrent =
                index === 0 && number === normalizedCurrentNumber;

              return (
                <div
                  key={number ?? `empty-${index}`}
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-bold ${
                    number
                      ? isCurrent
                        ? "border-purple-400 bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                        : "border-slate-500 bg-slate-800 text-slate-200"
                      : "border-dashed border-slate-700 text-slate-600"
                  }`}
                >
                  {number ?? "-"}
                </div>
              );
            })}
          </div>
        </div>

        {/* No card */}
        {cards.length === 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-slate-300">NO CARD</div>

            <p className="text-xs text-slate-500 mt-1">
              Your Bingo card is loading...
            </p>
          </div>
        )}

        {/* Cards */}
        {cards.length > 0 && (
          <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
            {cards.map((card, index) => (
              <div
                key={`${selectionNumbers[index] || "card"}-${index}`}
                className="bg-slate-800/40 border border-slate-700 rounded-lg p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      Card {index + 1}
                    </div>

                    {selectionNumbers[index] && (
                      <div className="text-xs text-slate-500">
                        Lucky number {selectionNumbers[index]}
                      </div>
                    )}
                  </div>

                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                    IN PLAY
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 mb-1">
                  {["B", "I", "N", "G", "O"].map((letter) => (
                    <div
                      key={letter}
                      className="text-center text-xs font-bold text-emerald-300"
                    >
                      {letter}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {card.map((row, rowIndex) =>
                    row.map((cell, columnIndex) => (
                      <BingoCell
                        key={`${rowIndex}-${columnIndex}`}
                        number={cell?.value ?? cell}
                        marked={
                          Boolean(cell?.marked) ||
                          safeCalledNumbers.includes(
                            Number(cell?.value ?? cell),
                          )
                        }
                        accent={accent}
                      />
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(LivePage);
