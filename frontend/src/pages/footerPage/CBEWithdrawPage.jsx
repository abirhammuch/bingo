import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchWithdrawalSettings,
  getUserBalance,
  submitWithdrawal,
} from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const CBEWithdrawPage = () => {
  const navigate = useNavigate();
  const { user, updateUserBalance } = useAuth();
  const [step, setStep] = useState(1);
  const [amountInput, setAmountInput] = useState("");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [withdrawData, setWithdrawData] = useState({
    method: "CBE",
    minAmount: 200,
    maxAmount: 100000,
    currency: "ETB",
    availableBalance: 0,
    fee: 0,
    feeType: "fixed",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.telegramId) return undefined;
    let mounted = true;

    Promise.all([getUserBalance(user.telegramId), fetchWithdrawalSettings()])
      .then(([balanceResponse, settingsResponse]) => {
        if (!mounted) return;
        const settings = settingsResponse.settings || {};
        const balance = Number(balanceResponse.balance || 0);
        updateUserBalance(balance);
        setWithdrawData((current) => ({
          ...current,
          availableBalance: balance,
          minAmount: Number(settings.minAmount ?? current.minAmount),
          maxAmount: Number(settings.maxAmount ?? current.maxAmount),
          fee: Number(settings.feeAmount ?? 0),
          feeType: settings.feeType || "fixed",
        }));
      })
      .catch((requestError) =>
        setError(requestError.message || "Failed to load wallet settings"),
      )
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [user?.telegramId, updateUserBalance]);

  const amount = Number(amountInput || 0);
  const fee =
    withdrawData.feeType === "percentage"
      ? (amount * withdrawData.fee) / 100
      : withdrawData.fee;
  const total = amount + fee;

  const handleContinue = () => {
    if (amount < withdrawData.minAmount || amount > withdrawData.maxAmount) {
      setError(
        `Withdrawal must be between ${withdrawData.minAmount} and ${withdrawData.maxAmount} ${withdrawData.currency}`,
      );
      return;
    }
    if (total > withdrawData.availableBalance) {
      setError("Insufficient balance for this withdrawal and fee");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Enter the CBE account holder name");
      return;
    }
    if (!account.trim()) {
      setError("Enter your CBE account number");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await submitWithdrawal({
        amount,
        method: withdrawData.method,
        name: name.trim(),
        account: account.trim(),
      });
      if (typeof response.transaction?.balance === "number") {
        updateUserBalance(response.transaction.balance);
        setWithdrawData((current) => ({
          ...current,
          availableBalance: response.transaction.balance,
        }));
      }
      setStep(3);
    } catch (submitError) {
      setError(submitError.message || "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-auto rounded-t-3xl border-t border-slate-700 bg-slate-900 p-6 pb-8">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">CBE WITHDRAW</h1>
          <button
            onClick={() => navigate("/withdraw")}
            className="text-2xl text-slate-400 hover:text-white"
            aria-label="Close CBE withdrawal"
          >
            ×
          </button>
        </div>
        <p className="mb-6 text-sm text-slate-400">
          Withdraw to your CBE account
        </p>
        {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}

        {step === 1 && (
          <>
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/30 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                AVAILABLE BALANCE
              </p>
              <p className="text-4xl font-bold text-white">
                {loading ? "..." : withdrawData.availableBalance.toFixed(2)}{" "}
                {withdrawData.currency}
              </p>
              <p className="mt-3 text-xs font-semibold text-emerald-400">
                Min {withdrawData.minAmount} {withdrawData.currency} · Fee{" "}
                {withdrawData.fee}
                {withdrawData.feeType === "percentage" ? "%" : " ETB"}
              </p>
            </div>
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Withdrawal Amount
            </label>
            <input
              type="number"
              min={withdrawData.minAmount}
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="Enter amount"
              className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-white outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleContinue}
              className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950"
            >
              CONTINUE
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/30 p-5 text-sm">
              <p className="mb-3 font-semibold uppercase tracking-widest text-slate-500">
                WITHDRAWAL SUMMARY
              </p>
              <div className="flex justify-between text-slate-300">
                <span>Amount</span>
                <span>{amount.toFixed(2)} ETB</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-300">
                <span>Fee</span>
                <span>{fee.toFixed(2)} ETB</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 font-bold text-white">
                <span>Total</span>
                <span>{total.toFixed(2)} ETB</span>
              </div>
            </div>
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              CBE Account Holder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter account holder name"
              className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-white outline-none focus:border-emerald-500"
            />
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              CBE Account Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              placeholder="Enter your CBE account number"
              className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-white outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {submitting ? "SUBMITTING..." : "CONFIRM WITHDRAWAL"}
            </button>
            <button
              onClick={() => setStep(1)}
              className="mt-3 w-full text-sm font-semibold text-slate-400"
            >
              Back
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="py-8 text-center">
              <div className="mb-4 text-6xl text-emerald-400">✓</div>
              <h2 className="mb-2 text-2xl font-bold text-white">Success!</h2>
              <p className="text-sm text-slate-400">
                Your CBE withdrawal request was submitted for review.
              </p>
            </div>
            <button
              onClick={() => navigate("/wallet")}
              className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950"
            >
              BACK TO WALLET
            </button>
          </>
        )}

        {step === 1 && (
          <button
            onClick={() => navigate("/withdraw")}
            className="mt-6 text-sm font-semibold text-slate-400"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};

export default CBEWithdrawPage;
