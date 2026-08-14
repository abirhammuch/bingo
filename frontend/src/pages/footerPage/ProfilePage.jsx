import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Mock user data
  const user = {
    name: "abm2997",
    handle: "@abm2997",
    avatar: "👤",
    referralCode: "LY9NEFCG",
    referrals: 0,
    earned: "0 ETB",
    isOnline: true,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-16 min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Profile Header */}
      <div className="bg-slate-900/60 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <span className="text-3xl">{user.avatar}</span>
              </div>
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <p className="text-slate-400 text-sm">{user.handle}</p>

              {/* Referral Code */}
              <div className="mt-4 p-3 bg-slate-800/60 border border-slate-700 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                    REF CODE
                  </p>
                  <p className="text-lg font-mono font-bold text-emerald-400">
                    {user.referralCode}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-1 rounded border text-xs font-semibold uppercase tracking-wide transition ${
                    copied
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                      : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                  }`}
                >
                  {copied ? "✓ COPIED" : "COPY"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="px-4 py-6 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
          {/* Referrals */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
              REFERRALS
            </p>
            <p className="text-3xl font-bold text-white">{user.referrals}</p>
          </div>

          {/* Earned */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
              EARNED
            </p>
            <p className="text-3xl font-bold text-emerald-400">{user.earned}</p>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
            ACTIONS
          </p>

          <div className="space-y-3">
            {/* My Wallet */}
            <button
              onClick={() => navigate("/wallet")}
              className="w-full bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/60 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <span className="text-xl">👛</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white">My Wallet</h3>
                  <p className="text-xs text-slate-400">
                    Deposit & withdraw funds
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-emerald-400 transition">
                →
              </span>
            </button>

            {/* Invite Friends */}
            <button
              onClick={() => navigate("/referral")}
              className="w-full bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/60 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white">Invite Friends</h3>
                  <p className="text-xs text-slate-400">
                    Earn from every friend you refer
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-emerald-400 transition">
                →
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={() => navigate("/logout")}
              className="w-full bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-red-950/40 hover:border-red-700 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center group-hover:bg-red-600/40">
                  <span className="text-xl">🚪</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white">Logout</h3>
                  <p className="text-xs text-slate-400">
                    Sign out of your account
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-red-400 transition">
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
};

export default ProfilePage;
