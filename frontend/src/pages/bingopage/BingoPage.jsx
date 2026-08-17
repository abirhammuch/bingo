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

  useEffect(() => {
    const telegram = window?.Telegram?.WebApp;
    console.log("🔐 [BingoPage] Checking Telegram WebApp availability", {
      hasTelegram: !!telegram,
      telegramKeys: telegram ? Object.keys(telegram).slice(0, 10) : null,
    });

    // Try multiple ways to get initData
    let initData = null;
    if (telegram) {
      initData = telegram.initData || null;
      if (!initData && telegram.initDataUnsafe) {
        initData = telegram.initDataUnsafe.initData || null;
      }
      // Also check all properties for any that might contain initData
      if (!initData) {
        console.log(
          "🔐 [BingoPage] Looking for initData in Telegram WebApp properties",
        );
        for (const key in telegram) {
          if (
            typeof telegram[key] === "string" &&
            telegram[key].includes("hash=")
          ) {
            console.log(
              `🔐 [BingoPage] Found initData-like string in telegram.${key}`,
            );
            initData = telegram[key];
            break;
          }
        }
      }
    }

    console.log("🔐 [BingoPage] WebApp initData check", {
      hasInitData: !!initData,
      initDataLength: initData?.length || 0,
      initDataPreview: initData ? initData.substring(0, 50) + "..." : "none",
      authUserExists: !!authUser,
    });

    if (!authUser && initData) {
      console.log("🔐 [BingoPage] Attempting WebApp login with initData...");
      loginWithTelegramInitData({ initData })
        .then((result) => {
          console.log("✅ [BingoPage] WebApp login returned", {
            hasResult: !!result,
            telegramId: result?.user?.telegramId,
            firstName: result?.user?.firstName,
            hasToken: !!result?.token,
          });
        })
        .catch((err) => {
          console.error("❌ [BingoPage] WebApp login API call failed", {
            error: err.message,
            stack: err.stack,
          });
          setAuthError(err.message);
          promptTelegramShareContact();
        });
      return;
    }

    if (!authUser && !initData) {
      console.log(
        "⚠️ [BingoPage] No authUser and no initData - checking localStorage...",
      );
      const storedToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("authUser");
      console.log("📦 [BingoPage] LocalStorage check", {
        hasStoredToken: !!storedToken,
        hasStoredUser: !!storedUser,
      });
      return;
    }

    if (!authUser) {
      console.log("⏳ [BingoPage] Waiting for authUser...");
      return;
    }

    console.log("👤 [BingoPage] authUser available", {
      telegramId: authUser.telegramId,
      firstName: authUser.firstName,
      isRegistered: authUser.isRegistered,
    });

    if (authUser.isRegistered === false) {
      console.log(
        "📱 [BingoPage] User not registered, prompting contact share",
      );
      promptTelegramShareContact();
    }
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
          ⏳ Loading your profile...
        </div>

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
              If you're in the bot, refresh the page (swipe down).
            </p>
            {showDevMode && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              >
                <p>
                  Debug: window.Telegram is{" "}
                  {hasTelegram ? "available" : "NOT available"}
                </p>
                <p>Dev Info: Check browser console for detailed logs</p>
              </div>
            )}
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
            <p>✅ Telegram WebApp detected, waiting for authentication...</p>
            <p style={{ fontSize: "11px", marginTop: "10px" }}>
              If this takes too long, refresh the page.
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
