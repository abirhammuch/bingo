import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = () => {
  const { user: authUser, loginWithTelegramInitData } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("Loading...");
  const [telegramFound, setTelegramFound] = useState(false);

  console.log("🎮 [BingoPage] RENDER CALLED - authUser:", !!authUser);

  useEffect(() => {
    console.log("🎮 [BingoPage] useEffect - MOUNTING");

    if (authUser) {
      console.log("✅ Already authenticated");
      return;
    }

    const hasTelegram = !!window?.Telegram?.WebApp;
    setTelegramFound(hasTelegram);
    console.log("📱 Telegram SDK found:", hasTelegram);

    if (!hasTelegram) {
      setDebugInfo("Open from Telegram bot");
      return;
    }

    const timer = setTimeout(() => {
      try {
        const telegram = window.Telegram.WebApp;

        if (telegram.ready) {
          telegram.ready();
          console.log("✅ Telegram ready() called");
        }

        const initData = telegram.initData || telegram.initDataUnsafe?.initData;
        console.log("🔐 initData exists:", !!initData);

        if (!initData) {
          setDebugInfo("No initData - refresh page");
          return;
        }

        setDebugInfo("Authenticating...");

        loginWithTelegramInitData({ initData })
          .then(() => {
            console.log("✅ Login successful!");
            setDebugInfo("Login success!");
          })
          .catch((err) => {
            console.error("❌ Login failed:", err);
            setAuthError(err.message || "Login failed");
            setDebugInfo("Login failed - " + (err.message || "Unknown error"));
          });
      } catch (error) {
        console.error("❌ Exception:", error);
        setAuthError(error.message);
        setDebugInfo("Exception: " + error.message);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [authUser, loginWithTelegramInitData]);

  const hasTelegram = !!window?.Telegram?.WebApp;

  // Show game if authenticated
  if (authUser) {
    console.log("🎮 RENDERING GAME");
    return <Bingo theme="green" />;
  }

  // Show loading screen
  console.log("⏳ RENDERING LOADING SCREEN");

  const loaderStyle = {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontFamily: "system-ui, -apple-system, sans-serif",
    textAlign: "center",
    padding: "20px",
    boxSizing: "border-box",
  };

  return (
    <div style={loaderStyle}>
      <div style={{ fontSize: "56px", marginBottom: "25px", lineHeight: 1 }}>
        🎮
      </div>

      <h1
        style={{
          fontSize: "32px",
          marginBottom: "15px",
          fontWeight: "bold",
          margin: "0 0 15px 0",
        }}
      >
        BINGO GAME
      </h1>

      <div
        style={{
          fontSize: "20px",
          marginBottom: "25px",
          color: "#aaffaa",
          fontWeight: "bold",
        }}
      >
        {authError ? "⚠️ ERROR" : "⏳ LOADING"}
      </div>

      <div
        style={{
          fontSize: "18px",
          color: "#ccc",
          marginBottom: "20px",
          minHeight: "24px",
          fontWeight: "500",
        }}
      >
        {debugInfo}
      </div>

      <div
        style={{
          fontSize: "16px",
          color: telegramFound ? "#00ff00" : "#ffcc00",
          marginTop: "25px",
          fontWeight: "bold",
        }}
      >
        {telegramFound ? "✓ Telegram Detected" : "! Open from Bot"}
      </div>

      {authError && (
        <>
          <div
            style={{
              fontSize: "16px",
              color: "#ff6666",
              marginTop: "30px",
              backgroundColor: "rgba(255,0,0,0.2)",
              padding: "15px",
              borderRadius: "8px",
              minWidth: "250px",
            }}
          >
            ERROR: {authError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "12px 30px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
};

export default BingoPage;
