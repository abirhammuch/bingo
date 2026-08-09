import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BalanceInfo from "../components/BalanceInfo";
import History from "../components/History";
import PaymentMethod from "../components/PaymentMethod";
import PaymentCheck from "../components/PaymentCheck";
import Responsible from "../components/Responsible";
import { getUserProfile } from "../services/userService";
import { promptTelegramShareContact } from "../utils/telegramWebApp";
import { useAuth } from "../context/AuthContext";

const MyWalletPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialMode =
    searchParams.get("mode") === "withdraw" ? "withdraw" : "default";
  const [activeMode, setActiveMode] = useState(initialMode);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: authUser } = useAuth();
  const telegramId = authUser?.telegramId;

  useEffect(() => {
    const mode = new URLSearchParams(location.search).get("mode");
    setActiveMode(mode === "withdraw" ? "withdraw" : "default");
  }, [location.search]);

  useEffect(() => {
    if (!telegramId) {
      navigate("/login");
      return;
    }

    const loadUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getUserProfile(telegramId);
        setUser(data.user || null);
      } catch (err) {
        setError(err.message || "Unable to load user profile");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate, telegramId]);

  const balance = user ? `ETB ${user.balance}` : "ETB 0.00";

  return (
    <div>
      {loading && (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-slate-300">
          Loading wallet data...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-rose-600 bg-rose-950/80 p-6 text-rose-200">
          {error}
        </div>
      )}

      <BalanceInfo
        activeMode={activeMode}
        onWithdraw={() => {
          if (!authUser?.isRegistered) {
            if (promptTelegramShareContact()) {
              return;
            }
            navigate("/login");
            return;
          }
          setActiveMode("withdraw");
        }}
        onDeposit={() => {
          if (!authUser?.isRegistered) {
            if (promptTelegramShareContact()) {
              return;
            }
            navigate("/login");
            return;
          }
          setActiveMode("default");
        }}
        onHistory={() => {
          if (!authUser?.isRegistered) {
            if (promptTelegramShareContact()) {
              return;
            }
            navigate("/login");
            return;
          }
          setActiveMode("history");
        }}
        withdrawableBalance={balance}
        bonusBalance="ETB 0.00"
        lockedBalance="ETB 0.00"
      />

      {activeMode === "default" && <PaymentMethod />}
      {activeMode === "default" && <PaymentCheck />}
      {activeMode === "history" && (
        <History onClose={() => setActiveMode("default")} />
      )}
      <Responsible />
    </div>
  );
};

export default MyWalletPage;
