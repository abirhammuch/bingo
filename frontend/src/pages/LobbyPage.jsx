import React from "react";
import BingoPage from "./bingopage/BingoPage";
import Footer from "../components/footer/Footer";

const LobbyPage = () => {
  console.log("🏠 [LobbyPage] Rendering");
  console.log("📍 Current URL:", window.location.href);

  return (
    <div style={{ width: "100%", display: "block" }}>
      <BingoPage />
      <Footer />
    </div>
  );
};

export default LobbyPage;
