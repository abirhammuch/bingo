import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const samplePredictions = [
  {
    league: "Premier League",
    match: "Manchester United vs Chelsea",
    kickoff: "Aug 7, 2026 · 9:00 PM",
    confidence: "High",
    status: "Open",
  },
  {
    league: "La Liga",
    match: "Real Madrid vs Barcelona",
    kickoff: "Aug 7, 2026 · 11:30 PM",
    confidence: "Medium",
    status: "Open",
  },
  {
    league: "NBA",
    match: "Lakers vs Celtics",
    kickoff: "Aug 8, 2026 · 1:00 AM",
    confidence: "Low",
    status: "Open",
  },
];

const statusStyles = {
  Open: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  Closed: "bg-slate-700/60 text-slate-200 border border-slate-600",
};

const Prediction = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = samplePredictions.filter((item) => {
    if (activeFilter === "All") return true;
    return item.confidence === activeFilter;
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
          <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Total predictions
          </div>
          <div className="mt-4 text-4xl font-semibold text-slate-100">12</div>
          <div className="mt-2 text-sm text-slate-500">
            Matches predicted this week
          </div>
        </div>
        <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
          <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Success rate
          </div>
          <div className="mt-4 text-4xl font-semibold text-slate-100">78%</div>
          <div className="mt-2 text-sm text-slate-500">
            Accurate forecasts so far
          </div>
        </div>
        <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
          <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Reward pool
          </div>
          <div className="mt-4 text-4xl font-semibold text-slate-100">
            120 ETB
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Available for winners
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Live predictions
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Choose your confidence and submit your forecast.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "High", "Medium", "Low"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveFilter(option)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === option
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filtered.map((item, index) => (
            <div
              key={`${item.match}-${index}`}
              className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    {item.league}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-100">
                    {item.match}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Kickoff: {item.kickoff}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/prediction/open?match=${encodeURIComponent(item.match)}`,
                      )
                    }
                    className="rounded-3xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/15 transition"
                  >
                    Place prediction
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-center text-slate-400">
              No predictions found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prediction;
