import React from "react";
import BingoPage from "./bingopage/BingoPage";

const LobbyPage = () => {
  console.log("🏠 [LobbyPage] Rendering");
  console.log("📍 Current URL:", window.location.href);

  return (
    <div style={{ width: "100%", display: "block" }}>
      <BingoPage />
    </div>
  );
};

export default LobbyPage;
