import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitDeposit } from "../../services/userService";

const CBEDepositePage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Number(amount) < 50) return setError("Minimum deposit is 50 ETB");
    if (!account.trim() || !receipt.trim()) {
      return setError("CBE account and receipt are required");
    }
    setSubmitting(true);
    setError("");
    try {
      await submitDeposit({
        amount: Number(amount),
        method: "CBE Birr",
        account,
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
            <h1 className="text-2xl font-bold text-white">CBE BIRR DEPOSIT</h1>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            min="50"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount in ETB"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-white outline-none focus:border-emerald-500"
          />
          <input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder="Your CBE account or phone"
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
