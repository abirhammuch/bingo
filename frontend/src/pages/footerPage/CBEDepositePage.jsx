import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitDeposit } from "../../services/userService";

const CBEDepositePage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cbeData = {
    accountNumber: "1000766599641",
    name: "Abirham",
  };

  const handleCopyAccount = async () => {
    await navigator.clipboard.writeText(cbeData.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Number(amount) < 50) return setError("Minimum deposit is 50 ETB");
    if (!receipt.trim()) {
      return setError("Payment receipt is required");
    }
    setSubmitting(true);
    setError("");
    try {
      await submitDeposit({
        amount: Number(amount),
        method: "CBE",
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-auto rounded-t-3xl border-t border-slate-700 bg-slate-900 p-6 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CBE DEPOSIT</h1>
            <p className="mt-1 text-sm text-slate-400">
              Minimum deposit: 50 ETB
            </p>
          </div>
          <button
            onClick={() => navigate("/deposit")}
            className="text-2xl text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
          Send the deposit to the configured CBE account, then submit the
          receipt for admin review.
        </div>

        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/30 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Send your deposit to this account
          </p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-2xl font-bold tracking-wider text-white">
                {cbeData.accountNumber}
              </p>
              <p className="mt-2 text-sm text-slate-400">{cbeData.name}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyAccount}
              aria-label="Copy CBE account number"
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                copied
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
              }`}
            >
              <span aria-hidden="true">{copied ? "✓" : "📋"}</span>
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            min="50"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount in ETB"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-white outline-none focus:border-emerald-500"
          />
          <textarea
            value={receipt}
            onChange={(event) => setReceipt(event.target.value)}
            rows="5"
            placeholder="Paste the CBE receipt or transaction reference"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-white outline-none focus:border-emerald-500"
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
          </button>
        </form>
        <button
          onClick={() => navigate("/deposit")}
          className="mt-4 text-sm font-semibold text-slate-400 hover:text-white"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default CBEDepositePage;
