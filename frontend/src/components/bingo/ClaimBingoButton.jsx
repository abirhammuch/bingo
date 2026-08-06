import React from "react";

const ClaimBingoButton = ({ onClaim, accent = {} }) => {
  return (
    <button
      onClick={onClaim}
      className={`px-3 py-2 rounded-md font-semibold transition transform duration-150 hover:scale-105 ${accent.selectedBg || "bg-emerald-600/20"} ${accent.selectedText || "text-emerald-300"}`}
    >
      Claim Bingo
    </button>
  );
};

export default ClaimBingoButton;
