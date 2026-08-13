import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { promptTelegramShareContact } from "../../utils/telegramWebApp";
import Bingo from "../../components/bingo/Bingo";

const BingoPPage = () => {
  const navigate = useNavigate();
  const { user: authUser, loginWithTelegramInitData } = useAuth();

  useEffect(() => {
    const telegram = window?.Telegram?.WebApp;
    const initData =
      telegram?.initData || telegram?.initDataUnsafe?.initData || null;

    if (!authUser && initData) {
      loginWithTelegramInitData({ initData }).catch(() => {
        promptTelegramShareContact();
      });
      return;
    }

    if (!authUser) {
      return;
    }

    if (authUser.isRegistered === false) {
      promptTelegramShareContact();
    }
  }, [authUser, loginWithTelegramInitData, navigate]);

  return (
    <div>
      <Bingo />
    </div>
  );
};

export default BingoPPage;
