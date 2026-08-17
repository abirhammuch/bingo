import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { promptTelegramShareContact } from "../../utils/telegramWebApp";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = () => {
  const { user: authUser, loginWithTelegramInitData } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("Loading...");
  const [telegramFound, setTelegramFound] = useState(false);

  console.log(
    "🎮 [BingoPage] RENDER - authUser:",
    !!authUser,
    "debugInfo:",
    debugInfo,
  );

  useEffect(() => {
    console.log("🎮 [BingoPage] Mounted");

    // Check if user is authenticated
    if (authUser) {
      console.log("✅ [BingoPage] Already authenticated");
      return;
    }

    // Check Telegram immediately
    const hasTelegram = !!window?.Telegram?.WebApp;
    setTelegramFound(hasTelegram);
    console.log("🔍 Telegram found:", hasTelegram);

    if (!hasTelegram) {
      setDebugInfo("Open from Telegram bot");
      return;
    }

    // Small delay for SDK
    const timer = setTimeout(() => {
      const telegram = window.Telegram.WebApp;

      if (telegram.expand) {
        telegram.expand();
      }

      if (telegram.ready) {
        telegram.ready();
      }

      const initData = telegram.initData || telegram.initDataUnsafe?.initData;

      if (!initData) {
        setDebugInfo("No initData - open this page from the Telegram bot");
        return;
      }

      setDebugInfo("Logging in...");

      loginWithTelegramInitData({ initData })
        .then(() => {
          setDebugInfo("Login success!");
        })
        .catch((err) => {
          setAuthError(err.message || "Login failed");
          setDebugInfo("Login failed");
        });
    }, 100);

    return () => clearTimeout(timer);
  }, [authUser, loginWithTelegramInitData]);

  const hasTelegram = !!window?.Telegram?.WebApp;

  // Show game if authenticated
  if (authUser) {
    return (
      <div style={{ width: "100%", minHeight: "100vh" }}>
        <Bingo theme="green" />
      </div>
    );
  }

  // Show loading screen - use absolute positioning for Telegram compatibility
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px",
        boxSizing: "border-box",
        zIndex: 9999,
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎮</div>
      <h1
        style={{ fontSize: "28px", marginBottom: "15px", fontWeight: "bold" }}
      >
        BINGO GAME
      </h1>
      <div
        style={{
          fontSize: "18px",
          marginBottom: "30px",
          color: "#aaffaa",
          fontWeight: "bold",
        }}
      >
        {authError ? "⚠️ ERROR" : "⏳ LOADING"}
      </div>
      <div
        style={{
          fontSize: "16px",
          color: "#fff",
          marginBottom: "20px",
          fontWeight: "500",
          minHeight: "24px",
        }}
      >
        {debugInfo}
      </div>
      <div
        style={{
          fontSize: "14px",
          color: telegramFound ? "#00ff00" : "#ffcc00",
          marginTop: "20px",
          fontWeight: "bold",
        }}
      >
        {telegramFound ? "✓ Telegram OK" : "! Open from Bot"}
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
