import React, { useEffect, useState } from "react";
import { fetchAdminStake, updateAdminStake } from "../../services/userService";
import { useAppContext } from "../../context/AppContext";

const StakePage = () => {
  const [stake, setStake] = useState({ stakeAmount: 10 });
  const { currency, formatCurrency } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStake()
      .then((response) => setStake(response.stake))
      .catch((requestError) =>
        setError(requestError.message || "Failed to load stake settings"),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const saveStake = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);
    try {
      const response = await updateAdminStake({
        stakeAmount: stake.stakeAmount,
      });
      setStake(response.stake);
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message || "Failed to save stake settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center text-slate-400">
        Loading stake settings...
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-100">
      <div>
        <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
          Game Configuration
        </div>
        <h1 className="mt-2 text-3xl font-semibold">Stake Management</h1>
        <p className="mt-2 text-sm text-slate-400">
          Set the fixed amount players stake in the current Bingo round.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="text-xs text-slate-500">Current round</div>
          <div className="mt-2 font-semibold">
            {stake.gameId || "No round ID"}
          </div>
          <div className="mt-1 text-xs uppercase text-emerald-300">
            {stake.status || "waiting"}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="text-xs text-slate-500">Fixed stake</div>
          <div className="mt-2 text-2xl font-semibold text-sky-300">
            {formatCurrency(Number(stake.stakeAmount).toFixed(2))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="text-xs text-slate-500">Currency</div>
          <div className="mt-2 text-2xl font-semibold text-teal-300">
            {currency}
          </div>
        </div>
      </div>

      <form
        onSubmit={saveStake}
        className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20"
      >
        <h2 className="font-semibold">Edit Fixed Stake</h2>
        <div className="mt-5 flex max-w-sm items-end gap-3">
          <label className="text-sm text-slate-400">
            Fixed stake amount
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={stake.stakeAmount}
              onChange={(event) =>
                setStake({ ...stake, stakeAmount: event.target.value })
              }
              className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <span className="mb-2 text-sm font-semibold text-teal-300">
            {currency}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500">Quick amount:</span>
          {[10, 20].map((amount) => (
            <button
              type="button"
              key={amount}
              onClick={() => setStake({ ...stake, stakeAmount: amount })}
              className="rounded-lg border border-slate-700 px-3 py-1 text-slate-300 hover:border-teal-500 hover:text-teal-300"
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
        <button
          disabled={isSaving}
          className="mt-5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Stake Settings"}
        </button>
      </form>
    </div>
  );
};

export default StakePage;
