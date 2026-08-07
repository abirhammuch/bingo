import React from "react";

const WinnerModal = ({ open, winner, luckyNumber, onClose, accent = {} }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[90%] max-w-lg rounded-[2.5rem] border border-slate-700 bg-slate-900/95 p-8 shadow-2xl shadow-cyan-500/10 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 text-5xl text-emerald-300 shadow-inner">
          🏆
        </div>

        <h2 className="mt-6 text-3xl font-bold text-slate-100">Bingo Winner</h2>
        <p className="mt-3 text-sm text-slate-400">
          Congratulations! A new winner has been announced.
        </p>

        <div
          className={`mt-6 rounded-3xl border ${accent.accentBg || "border-emerald-500/20"} bg-slate-950/90 p-5 text-2xl font-semibold ${accent.accentText || "text-emerald-300"}`}
        >
          <div>{winner}</div>
          {luckyNumber ? (
            <div className="mt-2 text-sm font-medium text-slate-400">
              Winning lucky number: {luckyNumber}
            </div>
          ) : null}
        </div>

        <button
          onClick={onClose}
          className="mt-8 inline-flex w-full justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default WinnerModal;
