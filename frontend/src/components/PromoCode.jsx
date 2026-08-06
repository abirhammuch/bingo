import React, { useState } from "react";
import PromoCodeHistory from "./PromoCodeHistory";
import AvailablePromoCode from "./AvailablePromoCode";
import Responsible from "./Responsible";

const defaultHistory = [
  {
    code: "HAMUS91",
    date: "8/6/2026, 5:22:15 PM",
    amount: "20 ETB",
    status: "MISSED",
  },
  {
    code: "EROB MESHET",
    date: "8/5/2026, 11:25:46 PM",
    amount: "20 ETB",
    status: "MISSED",
  },
  {
    code: "EROB765",
    date: "8/5/2026, 8:23:19 PM",
    amount: "50 ETB",
    status: "MISSED",
  },
  {
    code: "EROB09",
    date: "8/5/2026, 6:22:49 PM",
    amount: "20 ETB",
    status: "MISSED",
  },
];

const formatDate = (date) => {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    },
  )}`;
};

const PromoCode = () => {
  const [code, setCode] = useState("");
  const [history, setHistory] = useState(defaultHistory);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const claimPromo = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setMessage("Enter a promo code to claim.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    window.setTimeout(() => {
      const newEntry = {
        code: trimmed.toUpperCase(),
        date: formatDate(new Date()),
        amount: "20 ETB",
        status: "CLAIMED",
      };
      setHistory((items) => [newEntry, ...items]);
      setCode("");
      setMessage(`Promo code ${newEntry.code} claimed successfully.`);
      setIsLoading(false);
    }, 300);
  };

  const refreshHistory = () => {
    setMessage("Promo history refreshed.");
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-slate-900/70 border border-slate-700 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-2">
              Have a secret code?
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-100">
              Enter promo code
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Claim active codes and boost your bonus wallet with a single
              click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <label className="relative block w-full">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER PROMO CODE"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-sm uppercase tracking-[0.2em] text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>

          <button
            type="button"
            onClick={claimPromo}
            disabled={isLoading}
            className="inline-flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Claiming..." : "Claim"}
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
      </div>

      <PromoCodeHistory history={history} onRefresh={refreshHistory} />
      <AvailablePromoCode />
      <Responsible />
    </div>
  );
};

export default PromoCode;
