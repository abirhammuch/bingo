import React, { useEffect } from "react";

const WinnerModal = ({
  open,
  winner,
  winners: winnerList = [],
  onClose,
  accent = {},
  isCurrentUserWinner = false,
}) => {
  // Auto-close after 5 seconds
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  // Handle both single winner string and multiple winners array
  const winners =
    winnerList.length > 0
      ? winnerList
      : Array.isArray(winner)
        ? winner
        : [winner];
  const winnerCount = winners.length;
  const isWinner = isCurrentUserWinner || winner === "You";
  const icon = isWinner ? "🏆" : "😢";
  const headerText = isWinner ? "Congratulation!" : "Game Over";

  let messageText = "";
  if (isWinner) {
    messageText =
      winnerCount === 1
        ? "You are winner!"
        : `You are one of ${winnerCount} winners!`;
  } else {
    messageText = "You lost. Better luck next time!";
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[90%] max-w-lg rounded-[2.5rem] border border-slate-700 bg-slate-900/95 p-8 shadow-2xl shadow-cyan-500/10 text-center">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
            isWinner
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300"
          } text-5xl shadow-inner`}
        >
          {icon}
        </div>

        <h2
          className={`mt-6 text-3xl font-bold ${
            isWinner ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {headerText}
        </h2>
        <p className="mt-3 text-lg text-slate-100 font-semibold">
          {messageText}
        </p>

        {winnerCount > 1 && (
          <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/90 p-5 text-sm">
            <div className="text-sm text-slate-400 mb-3">Winners:</div>
            <div className="space-y-2">
              {winners.map((w, idx) => {
                const name = w?.username || `Player ${idx + 1}`;
                const amount = w?.winAmount;
                return (
                  <div
                    key={idx}
                    className="text-slate-300 flex justify-between items-center"
                  >
                    <span>{name}</span>
                    {amount && (
                      <span className="text-emerald-400">+{amount}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className={`mt-8 inline-flex w-full justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
            isWinner
              ? "bg-emerald-500 text-slate-950 hover:brightness-110"
              : "bg-slate-700 text-slate-100 hover:bg-slate-600"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default WinnerModal;
