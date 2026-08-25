import React, { memo } from "react";
import BingoCell from "./BingoCell";

const LivePhase = ({
  calledNumbers,
  currentNumber,
  cards,
  selectionNumbers,
  accent,
}) => {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
      {/* Left: Small Grid */}
      <div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {["B", "I", "N", "G", "O"].map((letter, columnIndex) => (
            <div key={letter} className="flex min-w-0 flex-col gap-2">
              <div className="text-center text-sm font-bold text-emerald-300">
                {letter}
              </div>
              {Array.from(
                { length: 15 },
                (_, rowIndex) => columnIndex * 15 + rowIndex + 1,
              ).map((number) => {
                const isCalled = calledNumbers.includes(number);
                const isHighlight = number === currentNumber;
                return (
                  <button
                    key={number}
                    className={`
                        aspect-square rounded-lg text-xs font-bold transition-all border
                        ${isHighlight ? "border-purple-400 bg-purple-600/40 text-purple-100 scale-110" : ""}
                        ${isCalled && !isHighlight ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100" : ""}
                        ${!isCalled && !isHighlight ? "border-slate-700 bg-slate-900 text-slate-300" : ""}
                      `}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Current Number */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          {currentNumber ? (
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-purple-500 to-pink-500 opacity-20 animate-pulse"></div>
              <div className="relative w-40 h-40 rounded-full border-4 border-purple-400 bg-purple-600/30 flex items-center justify-center">
                <div className="text-6xl font-bold text-purple-100">
                  {currentNumber}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
              <div className="text-center">
                <div className="text-slate-500">Waiting...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Game Status */}
      <div className="flex flex-col gap-4">
        {/* Status Message */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
          <div className="text-center text-slate-400 text-sm mb-4">
            <p>ጤንነት ይሰጣል</p>
            <p>ይህን ዲዛይን ታሊ ሰራብ</p>
            <p>ግምት አይሰጥም</p>
          </div>
        </div>

        {/* No Card Placeholder */}
        {cards.length === 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-300">NO CARD</div>
          </div>
        )}

        {/* Cards Display */}
        {cards.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cards.map((card, index) => (
              <div
                key={`${selectionNumbers[index]}-${index}`}
                className="bg-slate-800/40 border border-slate-700 rounded-lg p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      Card {index + 1}
                    </div>
                    <div className="text-xs text-slate-500">
                      Lucky number {selectionNumbers[index]}
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                    {card.some((row) => row.some((cell) => cell?.marked))
                      ? "In play"
                      : "Ready"}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1 mb-1">
                  {["B", "I", "N", "G", "O"].map((letter) => (
                    <div
                      key={letter}
                      className="text-center text-xs font-bold text-amber-300"
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
                        number={cell?.value}
                        marked={cell?.marked}
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

export default memo(LivePhase);
