import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OpenPrediction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const match = searchParams.get("match") || "Selected match";

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-3">
              Place prediction
            </p>
            <h1 className="text-3xl font-semibold text-slate-100">{match}</h1>
            <p className="mt-3 text-sm text-slate-400 max-w-2xl">
              Choose the outcome and lock in your prediction before kickoff.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-200"
          >
            Back to predictions
          </button>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
        <div className="grid gap-4 md:grid-cols-3">
          {["Home", "Draw", "Away"].map((option) => (
            <button
              key={option}
              type="button"
              className="rounded-3xl border border-slate-700 bg-slate-900/80 px-5 py-6 text-left transition hover:border-emerald-500 hover:bg-slate-900"
            >
              <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
                {option}
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-100">
                {option === "Draw"
                  ? "3.20"
                  : option === "Home"
                    ? "1.95"
                    : "2.75"}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-center shadow-sm shadow-slate-950/20">
        <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Stake amount
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {["5 ETB", "10 ETB", "20 ETB"].map((value) => (
            <button
              key={value}
              type="button"
              className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-500"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 text-right shadow-sm shadow-slate-950/20">
        <button className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110">
          Confirm prediction
        </button>
      </div>
    </div>
  );
};

export default OpenPrediction;
