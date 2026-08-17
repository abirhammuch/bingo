import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { promptTelegramShareContact } from "../utils/telegramWebApp";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithTelegramInitData, loading } = useAuth();
  const [telegramId, setTelegramId] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState(null);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ telegramId, loginCode });
      navigate("/wallet");
    } catch (err) {
      setError(err.message || "Failed to login");
    }
  };

  useEffect(() => {
    const telegram = window?.Telegram?.WebApp;
    const initData =
      telegram?.initData || telegram?.initDataUnsafe?.initData || null;

    if (!telegram) {
      return;
    }

    if (!initData) {
      setError("This page must be opened from the Telegram bot.");
      setIsTelegramWebApp(true);
      return;
    }

    setIsTelegramWebApp(true);
    setIsAuthenticating(true);

    const doWebAppLogin = async () => {
      setError(null);
      try {
        // ✅ FIX 1: Decode the initData before sending
        const decodedInitData = decodeURIComponent(initData);
        console.log("🔐 [LoginPage] Sending decoded initData to backend...");

        const result = await loginWithTelegramInitData({
          initData: decodedInitData,
        });
        console.log("✅ [LoginPage] WebApp login successful", result);

        // ✅ Restore the correct route that exists in the app
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } catch (err) {
        console.warn("❌ [LoginPage] Telegram WebApp login failed:", err);
        setError(err.message || "Login failed");

        // Prompt user to share contact as fallback
        promptTelegramShareContact();

        // ✅ FIX 3: Do NOT navigate on failure — let the user stay and retry
        setIsAuthenticating(false);
      }
    };

    doWebAppLogin();
  }, [loginWithTelegramInitData, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/30">
        <h1 className="text-3xl font-semibold mb-4 text-slate-100">
          Telegram Login
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Use the Telegram bot to generate a login code, then enter your
          Telegram ID and the code here.
        </p>

        {isTelegramWebApp && (
          <div className="mb-4 rounded-2xl border border-emerald-600 bg-emerald-950/80 px-4 py-3 text-emerald-200">
            {isAuthenticating
              ? "Logging in automatically..."
              : "Telegram WebApp detected."}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-600 bg-rose-950/80 px-4 py-3 text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-slate-300 text-sm">Telegram ID</span>
            <input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
              placeholder="123456789"
              required
              disabled={isTelegramWebApp || isAuthenticating}
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm">Login Code</span>
            <input
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
              placeholder="Enter code from Telegram bot"
              required
              disabled={isTelegramWebApp || isAuthenticating}
            />
          </label>
          <div className="text-xs text-slate-500">
            Run <strong>/login</strong> in the Telegram bot to get your one-time
            code.
          </div>

          <button
            type="submit"
            disabled={loading || isTelegramWebApp || isAuthenticating}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-70"
          >
            {loading || isAuthenticating
              ? "Logging in..."
              : "Login with Telegram"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
