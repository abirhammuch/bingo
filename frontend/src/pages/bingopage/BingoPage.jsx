import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = ({ onBlocked }) => {
  const { user, loading, loginWithTelegramInitData } = useAuth();
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user || loading) return;

    const telegram = window?.Telegram?.WebApp;
    const initData = telegram?.initData || telegram?.initDataUnsafe?.initData;

    if (!initData) return;

    setAuthenticating(true);
    loginWithTelegramInitData({ initData })
      .catch((error) => {
        console.error("Telegram WebApp login failed:", error);
        setAuthError(error?.message || "Telegram authentication failed.");
      })
      .finally(() => setAuthenticating(false));
  }, [user, loading, loginWithTelegramInitData]);

  if (loading || authenticating) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "#020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <div style={{ fontSize: "50px" }}>🎮</div>

        <h2
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          Loading Bingo...
        </h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "#020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            fontSize: "50px",
            marginBottom: "20px",
          }}
        >
          🔐
        </div>

        <h2
          style={{
            marginBottom: "10px",
          }}
        >
          Please Login
        </h2>

        <p
          style={{
            color: "#94a3b8",
          }}
        >
          {authError ||
            "Open this game from the Telegram bot so your account can be identified."}
        </p>
      </div>
    );
  }

  /*
   * User authenticated → show Bingo.
   */
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <Bingo theme="green" onBlocked={onBlocked} />
    </div>
  );
};

export default BingoPage;
