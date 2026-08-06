import React from "react";

const WinnerModal = ({ open, winner, onClose, accent = {} }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900/95 p-6 rounded-xl border border-slate-700 w-full max-w-md transform transition duration-200 ease-out scale-100">
        <div className="text-lg font-semibold text-slate-100">Winner!</div>
        <div
          className={`mt-4 text-2xl font-bold ${accent.selectedText || "text-emerald-300"}`}
        >
          {winner}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-800/40 border border-slate-700 transition hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;
