import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { promptTelegramShareContact } from "../utils/telegramWebApp";
import SpinGame from "../components/SpinGame";

const SpinPage = ({ theme }) => {
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
    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700">
      <h1 className="text-2xl font-semibold text-slate-100 mb-4">Spin</h1>
      <SpinGame />
    </div>
  );
};

export default SpinPage;
