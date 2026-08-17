import React from "react";
import BingoPage from "./bingopage/BingoPage";
import Footer from "../components/footer/Footer";

const LobbyPage = () => {
  // Don't show Footer in Telegram WebApp
  const hasTelegram = !!window?.Telegram?.WebApp;

  console.log("🏠 [LobbyPage] Rendering - Telegram:", hasTelegram);

  return (
    <div style={{ width: "100%", display: "block" }}>
      <BingoPage />
      {!hasTelegram && <Footer />}
    </div>
  );
};

export default LobbyPage;
