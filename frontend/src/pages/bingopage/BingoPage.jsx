import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { promptTelegramShareContact } from "../../utils/telegramWebApp";
import Bingo from "../../components/bingo/Bingo";

const BingoPPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    if (authUser.isRegistered === false) {
      if (promptTelegramShareContact()) {
        return;
      }
      navigate("/login");
    }
  }, [authUser, navigate]);

  return (
    <div>
      <Bingo />
    </div>
  );
};

export default BingoPPage;
