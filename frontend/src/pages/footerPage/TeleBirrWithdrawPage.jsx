import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const TeleBirrWithdrawPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [withdrawData] = useState({
    method: "Telebirr",
    minAmount: 50,
    maxAmount: 100000,
    currency: "ETB",
    availableBalance: 0,
    fee: 0,
  });

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
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
            onClick={() => navigate("/withdraw")}
            className="text-slate-400 hover:text-white transition"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-6">Balance & fees</p>

        {/* Progress Bar - 4 Steps */}
        <div className="mb-6">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition ${
                  s <= step ? "bg-purple-500" : "bg-slate-700"
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Step 1: Enter Amount */}
        {step === 1 && (
          <>
            {/* Available Balance */}
            <div className="mb-6 bg-slate-800/30 border border-slate-700 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
                AVAILABLE BALANCE
              </p>

              <div className="mb-3">
                <p className="text-4xl font-bold text-white">
                  {withdrawData.availableBalance}{" "}
                  <span className="text-xl text-slate-400">
                    {withdrawData.currency}
                  </span>
                </p>
              </div>

              <p className="text-xs text-emerald-400 font-semibold">
                Min withdrawal {withdrawData.minAmount} {withdrawData.currency}{" "}
                · No fee
              </p>
            </div>

            {/* Input Amount */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Withdrawal Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                  {withdrawData.currency}
                </span>
              </div>
            </div>

            {/* Next Step Button */}
            <button
              onClick={handleNextStep}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition shadow-lg"
            >
              ENTER AMOUNT &gt;
            </button>
          </>
        )}

        {/* Step 2: Enter Phone Number */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Telebirr Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
              />
              <p className="text-xs text-slate-400 mt-2">
                Enter your Telebirr registered phone number
              </p>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={handleNextStep}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition shadow-lg"
            >
              CONTINUE &gt;
            </button>

            <button
              onClick={handlePreviousStep}
              className="mt-3 w-full text-slate-400 hover:text-slate-300 transition font-semibold text-sm"
            >
              ← Back
            </button>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <>
            <div className="mb-6 bg-slate-800/30 border border-slate-700 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
                WITHDRAWAL SUMMARY
              </p>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white font-bold">
                    {withdrawAmount || "0"} {withdrawData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fee:</span>
                  <span className="text-white font-bold">
                    {withdrawData.fee} {withdrawData.currency}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between">
                  <span className="text-slate-400 font-semibold">Total:</span>
                  <span className="text-emerald-400 font-bold">
                    {withdrawAmount || "0"} {withdrawData.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            <button
              onClick={handleNextStep}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition shadow-lg"
            >
              CONFIRM WITHDRAWAL &gt;
            </button>

            <button
              onClick={handlePreviousStep}
              className="mt-3 w-full text-slate-400 hover:text-slate-300 transition font-semibold text-sm"
            >
              ← Back
            </button>
          </>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <>
            <div className="mb-6 text-center py-8">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-slate-400 text-sm">
                Your withdrawal request has been submitted successfully
              </p>

              <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                  Amount
                </p>
                <p className="text-2xl font-bold text-white">
                  {withdrawAmount} {withdrawData.currency}
                </p>
              </div>
            </div>

            {/* Return Button */}
            <button
              onClick={() => navigate("/wallet")}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition shadow-lg"
            >
              BACK TO WALLET
            </button>
          </>
        )}

        {/* Bottom Back Button - Step 1 only */}
        {step === 1 && (
          <button
            onClick={() => navigate("/withdraw")}
            className="mt-6 text-slate-400 hover:text-slate-300 transition text-sm font-semibold flex items-center gap-2"
          >
            <span>←</span>
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default TeleBirrWithdrawPage;
