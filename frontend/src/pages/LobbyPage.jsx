import React, { useState } from "react";
import BingoPage from "./bingopage/BingoPage";
import Footer from "../components/footer/Footer";

const LobbyPage = () => {
  const [blocked, setBlocked] = useState(false);
  console.log("🏠 [LobbyPage] Rendering");
  console.log("📍 Current URL:", window.location.href);

  return (
    <div style={{ width: "100%", display: "block" }}>
      <BingoPage onBlocked={() => setBlocked(true)} />
      {!blocked && <Footer />}
    </div>
  );
};

export default LobbyPage;
