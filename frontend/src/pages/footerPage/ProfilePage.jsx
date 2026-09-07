import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile } from "../../services/userService";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(authUser);

  useEffect(() => {
    let active = true;

    if (!authUser?.telegramId) {
      setProfile(authUser);
      return () => {
        active = false;
      };
    }

    getUserProfile(authUser.telegramId)
      .then((response) => {
        if (active && response.user) setProfile(response.user);
      })
      .catch((error) => {
        console.error("Failed to load profile:", error);
      });

    return () => {
      active = false;
    };
  }, [authUser]);

  const user = {
    name: profile?.firstName || profile?.username || "Player",
    handle: profile?.username ? `@${profile.username}` : "",
    avatar: "👤",
    referrals: Number(profile?.referralCount || 0),
    earned: `${Number(profile?.referralEarnings || 0).toFixed(2)} ETB`,
    isOnline: true,
  };

  return (
    <div className="pb-16 min-h-screen bg-linear-to-b from-slate-950 to-slate-900">
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

            {/* Coupon Code */}
            <button
              onClick={() => navigate("/coupon")}
              className="w-full bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-amber-950/40 hover:border-amber-700 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center group-hover:bg-amber-600/40">
                  <span className="text-xl">🎟️</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white">Coupon Code</h3>
                  <p className="text-xs text-slate-400">
                    Redeem a promotional code
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-amber-400 transition">
                →
              </span>
            </button>

            {/* Tournaments */}
            <button
              onClick={() => navigate("/tournament/invite")}
              className="w-full bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-cyan-950/40 hover:border-cyan-700 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:bg-cyan-600/40">
                  <span className="text-xl">🏆</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white">Tournaments</h3>
                  <p className="text-xs text-slate-400">
                    Join a bingo tournament and compete for prizes
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-cyan-400 transition">
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
