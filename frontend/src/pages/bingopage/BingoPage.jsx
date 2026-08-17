import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { promptTelegramShareContact } from "../../utils/telegramWebApp";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = () => {
  const navigate = useNavigate();
  const { user: authUser, loginWithTelegramInitData } = useAuth();
  const [showDevMode, setShowDevMode] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    // Wait a bit for Telegram SDK to fully load
    const timer = setTimeout(() => {
      const telegram = window?.Telegram?.WebApp;

      if (!telegram) {
        setDebugInfo("Telegram WebApp SDK not found");
        console.log("⚠️ [BingoPage] Telegram WebApp SDK not found");
        return;
      }

      // Make sure Telegram WebApp is ready
      if (telegram.ready && typeof telegram.ready === "function") {
        telegram.ready();
      }

      console.log("✅ [BingoPage] Telegram WebApp SDK loaded", {
        hasReady: !!telegram.ready,
        hasInitData: !!telegram.initData,
      });

      // Try multiple ways to get initData
      let initData = null;
      if (telegram.initData) {
        initData = telegram.initData;
        setDebugInfo("Got initData from telegram.initData");
      } else if (telegram.initDataUnsafe?.initData) {
        initData = telegram.initDataUnsafe.initData;
        setDebugInfo("Got initData from telegram.initDataUnsafe.initData");
      }

      console.log("🔐 [BingoPage] WebApp initData check", {
        hasInitData: !!initData,
        initDataLength: initData?.length || 0,
        authUserExists: !!authUser,
      });

      // If we have initData and no authUser, try to login
      if (initData && !authUser) {
        console.log("🔐 [BingoPage] Attempting WebApp login with initData...");
        setDebugInfo("Authenticating with Telegram...");

        loginWithTelegramInitData({ initData })
          .then((result) => {
            console.log("✅ [BingoPage] WebApp login successful", {
              telegramId: result?.user?.telegramId,
              firstName: result?.user?.firstName,
            });
            setDebugInfo("Authentication successful!");
          })
          .catch((err) => {
            console.error("❌ [BingoPage] WebApp login failed", {
              error: err.message,
              status: err.response?.status,
              data: err.response?.data,
            });
            setAuthError(err.message || "Authentication failed");
            setDebugInfo(`Auth error: ${err.message}`);
            promptTelegramShareContact();
          });
      } else if (!initData && !authUser) {
        setDebugInfo("No initData available");
        console.log("⚠️ [BingoPage] No initData found in Telegram WebApp");
      }
    }, 500); // Wait 500ms for SDK to load

    return () => clearTimeout(timer);
  }, [authUser, loginWithTelegramInitData]);

  // Fallback for testing outside Telegram
  if (!authUser) {
    const hasTelegram = !!window?.Telegram?.WebApp;

    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <div style={{ marginBottom: "20px", fontSize: "18px" }}>
          ⏳{" "}
          {hasTelegram
            ? "Authenticating with Telegram..."
            : "Loading your profile..."}
        </div>

        {debugInfo && (
          <div
            style={{
              fontSize: "11px",
              color: "#aaa",
              marginBottom: "15px",
              fontFamily: "monospace",
              maxWidth: "400px",
            }}
          >
            {debugInfo}
          </div>
        )}

        {authError && (
          <div
            style={{
              fontSize: "14px",
              color: "#ffcccc",
              maxWidth: "400px",
              margin: "20px auto",
              padding: "15px",
              backgroundColor: "rgba(255,0,0,0.1)",
              borderRadius: "8px",
              lineHeight: "1.6",
            }}
          >
            <p>
              ❌ <strong>Authentication Error</strong>
            </p>
            <p>{authError}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "1px solid #fff",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!hasTelegram && !authError && (
          <div
            style={{
              fontSize: "14px",
              color: "#ffcccc",
              maxWidth: "400px",
              margin: "20px auto",
              padding: "15px",
              backgroundColor: "rgba(255,0,0,0.1)",
              borderRadius: "8px",
              lineHeight: "1.6",
            }}
          >
            <p>
              ⚠️ <strong>Not running in Telegram WebApp</strong>
            </p>
            <p>This app must be opened from inside the Telegram bot.</p>
            <p style={{ fontSize: "12px", marginTop: "10px", color: "#ccc" }}>
              If you're in the bot, try refreshing the page.
            </p>
            <button
              onClick={() => setShowDevMode(!showDevMode)}
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                fontSize: "11px",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showDevMode ? "Hide" : "Show"} Debug Info
            </button>
            {showDevMode && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: "4px",
                  fontSize: "11px",
                  textAlign: "left",
                  fontFamily: "monospace",
                  color: "#0f0",
                }}
              >
                <p>Telegram SDK: {hasTelegram ? "Found" : "NOT found"}</p>
                <p>Debug: {debugInfo || "Checking..."}</p>
                <p>Auth User: {authUser ? "Yes" : "No"}</p>
              </div>
            )}
          </div>
        )}

        {hasTelegram && !authError && (
          <div
            style={{
              fontSize: "12px",
              color: "#ffdd99",
              maxWidth: "400px",
              margin: "20px auto",
              padding: "15px",
              backgroundColor: "rgba(255,200,0,0.1)",
              borderRadius: "8px",
            }}
          >
            <p>✅ Telegram WebApp detected</p>
            <p style={{ fontSize: "11px", marginTop: "10px" }}>
              {debugInfo || "Waiting for authentication..."}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Bingo theme="green" />
    </div>
  );
};

export default BingoPage;
