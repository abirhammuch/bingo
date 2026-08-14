import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";

const WalletPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("balance");

  const walletData = {
    gameBalance: 0,
    mainBalance: 0,
    currency: "ETB",
  };

  return (
    <div className="pb-16 min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Page Header */}
      <div className="bg-slate-900/60 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">MY WALLET</h1>
          <p className="text-slate-400 text-sm">Manage your funds</p>
        </div>
      </div>

      {/* Balance Cards Section */}
      <div className="px-4 py-6 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Game Balance */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                GAME BALANCE ({walletData.currency})
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold text-white">
                  {walletData.gameBalance}
                </p>
                <p className="text-sm text-slate-400">{walletData.currency}</p>
              </div>
            </div>

            {/* Main Balance */}
            <div className="bg-slate-800/40 border border-emerald-600/30 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                MAIN BALANCE ({walletData.currency})
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold text-emerald-400">
                  {walletData.mainBalance}
                </p>
                <p className="text-sm text-slate-400">{walletData.currency}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Deposit Button */}
          <button
            onClick={() => navigate("/deposit")}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl uppercase tracking-wide transition shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">💳</span>
            DEPOSIT
          </button>

          {/* Withdraw Button */}
          <button
            onClick={() => navigate("/withdraw")}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl uppercase tracking-wide transition border border-slate-700 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🏦</span>
            WITHDRAW
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="px-4 py-6 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              RECENT TRANSACTIONS
            </p>
            <button
              onClick={() => navigate("/history")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition font-semibold"
            >
              VIEW ALL →
            </button>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400 text-sm">No transactions yet</p>
            <p className="text-slate-500 text-xs mt-1">
              Your transaction history will appear here
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
};

export default WalletPage;
