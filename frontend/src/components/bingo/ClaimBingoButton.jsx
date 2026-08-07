import React from "react";

const ClaimBingoButton = ({ onClaim, accent = {}, disabled = false }) => {
  return (
    <button
      onClick={onClaim}
      disabled={disabled}
      className={`w-full py-3 rounded-lg font-semibold text-lg transition-all duration-200
        ${
          disabled
            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
            : `${accent.selectedBg || "bg-emerald-600"} ${
                accent.selectedText || "text-white"
              } hover:bg-emerald-500 hover:scale-[1.02] active:scale-95`
        }`}
    >
      🏆 Claim Bingo
    </button>
  );
};

export default ClaimBingoButton;
