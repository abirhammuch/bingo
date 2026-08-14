import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Invite = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Mock user data
  const referralData = {
    referralCode: "LY9NEFCG",
    referrals: 0,
    earned: "0 ETB",
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const referralLink = `https://yourapp.com/ref/${referralData.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const referralLink = `https://yourapp.com/ref/${referralData.referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: "Invite Friends",
        text: "Earn ETB for every friend you bring",
        url: referralLink,
      });
    } else {
      // Fallback: copy link
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50">
      {/* Modal Container */}
      <div className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-6 pb-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">INVITE FRIENDS</h1>
          <button
            onClick={() => navigate("/profile")}
            className="text-slate-400 hover:text-white transition"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-6">
          Earn ETB for every friend you bring
        </p>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Referrals */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
              REFERRALS
            </p>
            <p className="text-3xl font-bold text-white mb-1">
              {referralData.referrals}
            </p>
            <p className="text-xs text-slate-400">friends</p>
          </div>

          {/* Earnings */}
          <div className="bg-slate-800/50 border border-emerald-600/30 rounded-xl p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
              EARNINGS
            </p>
            <p className="text-3xl font-bold text-emerald-400 mb-1">
              {referralData.earned}
            </p>
            <p className="text-xs text-slate-400">ETB earned</p>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
            YOUR REFERRAL CODE
          </p>
          <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <p className="text-2xl font-mono font-bold text-white tracking-wider">
              {referralData.referralCode}
            </p>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wide transition flex items-center gap-2 ${
                copied
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                  : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
              }`}
            >
              <span className="text-sm">{copied ? "✓" : "📋"}</span>
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition shadow-lg"
          >
            COPY LINK
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition border border-slate-700"
          >
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invite;
