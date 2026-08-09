import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [telegramId, setTelegramId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ telegramId, firstName, lastName, username, profilePhoto });
      navigate("/wallet");
    } catch (err) {
      setError(err.message || "Failed to login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/30">
        <h1 className="text-3xl font-semibold mb-4 text-slate-100">
          Telegram Login
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Sign in with your Telegram details to continue.
        </p>
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
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm">First Name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
              placeholder="Abirham"
              required
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm">Last Name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
              placeholder="Gebremariam"
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
              placeholder="@marshal"
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm">Profile Photo URL</span>
            <input
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
              placeholder="https://..."
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login with Telegram"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
