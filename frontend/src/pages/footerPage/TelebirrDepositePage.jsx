import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitDeposit } from "../../services/userService";

const TelebirrDepositePage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Send money, Step 2: Enter receipt
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const telebirrData = {
    method: "Telebirr",
    minAmount: 50,
    currency: "ETB",
    phoneNumber: "0980808525",
    name: "Marshal M",
    instructions:
      "After sending, copy the full SMS and paste it on the next step.",
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(telebirrData.phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextStep = () => {
    if (Number(amount) < telebirrData.minAmount) {
      setError(`Minimum deposit is ${telebirrData.minAmount} ETB`);
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!receipt.trim()) {
      setError("Paste the payment receipt");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitDeposit({
        amount: Number(amount),
        method: telebirrData.method,
        receipt,
      });
      navigate("/history");
    } catch (submitError) {
      setError(submitError.message || "Failed to submit deposit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50">
      {/* Modal Container */}
      <div className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-6 pb-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">DEPOSIT</h1>
          <button
            onClick={() => navigate("/deposit")}
            className="text-slate-400 hover:text-white transition"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-6">
          Send via {telebirrData.method} Min {telebirrData.minAmount}{" "}
          {telebirrData.currency}
        </p>
        {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex gap-1">
            {/* Step 1 Progress */}
            <div
              className={`h-1 flex-1 rounded-full transition ${step >= 1 ? "bg-emerald-500" : "bg-slate-700"}`}
            ></div>
            {/* Step 2 Progress */}
            <div
              className={`h-1 flex-1 rounded-full transition ${step >= 2 ? "bg-emerald-500" : "bg-slate-700"}`}
            ></div>
          </div>
        </div>

        {/* Step 1: Send Money */}
        {step === 1 && (
          <>
            {/* Phone Number Section */}
            <div className="mb-6 bg-slate-800/30 border border-slate-700 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
                Min {telebirrData.minAmount} {telebirrData.currency} send to
                this number
              </p>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-2xl font-mono font-bold text-white tracking-wider">
                    {telebirrData.phoneNumber}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    {telebirrData.name}
                  </p>
                </div>
                <button
                  onClick={handleCopyNumber}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wide transition flex items-center gap-2 ${
                    copied
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                      : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                  }`}
                >
                  {copied ? "✓" : "📋"} {copied ? "COPIED" : "COPY"}
                </button>
              </div>
            </div>

            <input
              type="number"
              min={telebirrData.minAmount}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={`Deposit amount (min ${telebirrData.minAmount} ETB)`}
              className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-white outline-none focus:border-emerald-500"
            />

            {/* Instructions */}
            <div className="mb-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex gap-3">
              <div className="text-slate-500 shrink-0">
                <span className="text-lg">ℹ️</span>
              </div>
              <p className="text-sm text-slate-400">
                {telebirrData.instructions}
              </p>
            </div>

            {/* Next Step Button */}
            <button
              onClick={handleNextStep}
              className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition shadow-lg"
            >
              I'VE SENT — ENTER RECEIPT &gt;
            </button>
          </>
        )}

        {/* Step 2: Enter Receipt */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Paste SMS Receipt
              </label>
              <textarea
                value={receipt}
                onChange={(event) => setReceipt(event.target.value)}
                placeholder="Paste the full SMS you received after sending money..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                rows="5"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition shadow-lg"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
            </button>

            {/* Back to previous step */}
            <button
              onClick={() => setStep(1)}
              className="mt-3 w-full text-slate-400 hover:text-slate-300 transition font-semibold text-sm"
            >
              ← Back
            </button>
          </>
        )}

        {/* Bottom Back Button */}
        {step === 1 && (
          <button
            onClick={() => navigate("/deposit")}
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

export default TelebirrDepositePage;
