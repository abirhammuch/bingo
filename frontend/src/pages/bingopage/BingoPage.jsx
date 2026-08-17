import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { promptTelegramShareContact } from "../../utils/telegramWebApp";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = () => {
  const { user: authUser, loginWithTelegramInitData } = useAuth();
  const [showDevMode, setShowDevMode] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If user is already authenticated, we're done
    if (authUser) {
      setIsLoading(false);
      return;
    }

    // Wait for Telegram SDK to load
    const timer = setTimeout(() => {
      try {
        const telegram = window?.Telegram?.WebApp;

        if (!telegram) {
          setDebugInfo("Telegram SDK not found");
          setIsLoading(false);
          return;
        }

        // Call ready if available
        if (typeof telegram.ready === "function") {
          telegram.ready();
        }

        // Get initData
        const initData = telegram.initData || telegram.initDataUnsafe?.initData;

        if (!initData) {
          setDebugInfo("No initData available");
          setIsLoading(false);
          return;
        }

        setDebugInfo("Authenticating with Telegram...");

        loginWithTelegramInitData({ initData })
          .then((result) => {
            setDebugInfo("Login successful!");
            setIsLoading(false);
            setAuthError(null);
          })
          .catch((err) => {
            setAuthError(err.message || "Authentication failed");
            setDebugInfo(`Login error: ${err.message}`);
            setIsLoading(false);
            promptTelegramShareContact();
          });
      } catch (error) {
        console.error("BingoPage error:", error);
        setAuthError(error.message);
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [authUser, loginWithTelegramInitData]);

  const hasTelegram = !!window?.Telegram?.WebApp;

  // Show game if authenticated
  if (authUser && !isLoading) {
    return (
      <div style={{ width: "100%", minHeight: "100vh" }}>
        <Bingo theme="green" />
      </div>
    );
  }

  // Always show loading screen (never null)
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
        ⏳ {hasTelegram ? "Authenticating..." : "Loading..."}
      </div>

      {debugInfo && (
        <div
          style={{
            fontSize: "12px",
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
            ❌ <strong>Error</strong>
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
        <p style={{ fontSize: "12px", color: "#ccc", maxWidth: "400px" }}>
          Open this link from your Telegram bot to play.
        </p>
      )}
    </div>
  );
};

export default BingoPage;
