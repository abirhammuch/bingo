import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { promptTelegramShareContact } from "../../utils/telegramWebApp";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = () => {
  const navigate = useNavigate();
  const { user: authUser, loginWithTelegramInitData } = useAuth();

  useEffect(() => {
    const telegram = window?.Telegram?.WebApp;
    const initData =
      telegram?.initData || telegram?.initDataUnsafe?.initData || null;

    if (!authUser && initData) {
      console.log("🔐 [BingoPage] Attempting WebApp login...");
      loginWithTelegramInitData({ initData })
        .then((result) => {
          console.log("✅ [BingoPage] WebApp login successful", {
            telegramId: result?.user?.telegramId,
            firstName: result?.user?.firstName,
          });
        })
        .catch((err) => {
          console.warn(
            "⚠️ [BingoPage] WebApp login failed, prompting registration",
            {
              error: err.message,
            },
          );
          promptTelegramShareContact();
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

  // Don't render Bingo until authUser is available
  if (!authUser) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          color: "#fff",
        }}
      >
        Loading your profile...
      </div>
    );
  }

  return (
    <div>
      <Bingo />
    </div>
  );
};

export default BingoPage;
