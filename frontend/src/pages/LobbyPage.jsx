import React from "react";
import BingoPage from "./bingopage/BingoPage";
import Footer from "../components/footer/Footer";

const LobbyPage = () => {
  // Don't show Footer in Telegram WebApp
  const hasTelegram = !!window?.Telegram?.WebApp;

  return (
    <div className={hasTelegram ? "" : "pb-16"}>
      <BingoPage />
      {!hasTelegram && <Footer />}
    </div>
  );
};

export default LobbyPage;
