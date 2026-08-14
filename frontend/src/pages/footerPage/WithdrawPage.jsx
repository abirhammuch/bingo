import React from "react";
import { useNavigate } from "react-router-dom";

const WithdrawPage = () => {
  const navigate = useNavigate();

  const withdrawalMethods = [
    {
      id: 1,
      name: "Telebirr",
      description: "Ethio Telecom wallet",
      icon: "📱",
      color: "from-purple-600 to-purple-700",
    },
    {
      id: 2,
      name: "CBE Birr",
      description: "Commercial Bank of Ethiopia",
      icon: "🏦",
      color: "from-blue-600 to-blue-700",
    },
  ];

  const handleSelectMethod = (method) => {
    if (method.id === 1) {
      navigate("/telebirr-withdraw");
    } else if (method.id === 2) {
      navigate("/cbe-withdraw");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50">
      {/* Modal Container */}
      <div className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-6 pb-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">WITHDRAW</h1>
          <button
            onClick={() => navigate("/wallet")}
            className="text-slate-400 hover:text-white transition"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-6">Choose withdrawal method</p>

        {/* Withdrawal Methods */}
        <div className="space-y-3 mb-6">
          {withdrawalMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelectMethod(method)}
              className="w-full bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/60 hover:border-slate-600 transition group"
            >
              {/* Icon and Details */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-2xl">{method.icon}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-lg">
                    {method.name}
                  </h3>
                  <p className="text-xs text-slate-400">{method.description}</p>
                </div>
              </div>

              {/* Arrow */}
              <span className="text-slate-500 group-hover:text-slate-300 transition text-xl">
                →
              </span>
            </button>
          ))}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/wallet")}
          className="text-slate-400 hover:text-slate-300 transition text-sm font-semibold flex items-center gap-2"
        >
          <span>←</span>
          Back to wallet
        </button>
      </div>
    </div>
  );
};

export default WithdrawPage;
