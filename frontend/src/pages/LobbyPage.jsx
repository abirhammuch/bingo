import React from "react";
import BingoPage from "./bingopage/BingoPage";
import Footer from "../components/footer/Footer";

const LobbyPage = () => {
  const hasTelegram = !!window?.Telegram?.WebApp;

  console.log("🏠 [LobbyPage] Rendering");
  console.log("📍 Current URL:", window.location.href);
  console.log("📱 Telegram:", hasTelegram);

  return (
    <div style={{ width: "100%", display: "block" }}>
      <BingoPage />
      {!hasTelegram && <Footer />}
    </div>
  );
};

export default LobbyPage;
