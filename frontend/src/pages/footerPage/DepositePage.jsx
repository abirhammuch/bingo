import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";

const DepositePage = () => {
  const navigate = useNavigate();

  const paymentMethods = [
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
      navigate("/telebirr-deposit");
    } else if (method.id === 2) {
      navigate("/cbe-deposit");
    }
  };

  return (
    <div className="pb-16 min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Page Header */}
      <div className="bg-slate-900/60 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">DEPOSIT</h1>
          <p className="text-slate-400 text-sm">Choose payment method</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {paymentMethods.map((method) => (
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
      </div>

      {/* Back Button */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/wallet")}
            className="text-slate-400 hover:text-slate-300 transition text-sm font-semibold flex items-center gap-2"
          >
            <span>←</span>
            Back to wallet
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
};

export default DepositePage;
