import React from "react";

const TournamentOverview = () => {
  return (
    <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300 mb-3">
            Tournament Arena
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
            Join tournaments, track live matches, and win big rewards.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Explore active competition, upcoming bracket stages, and live
            leaderboards all in one place.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Active
            </div>
            <div className="mt-3 text-3xl font-semibold text-emerald-300">
              6
            </div>
            <div className="mt-1 text-xs text-slate-500">Live tournaments</div>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Prize pool
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-100">
              320 ETB
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Total prizes today
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Next start
            </div>
            <div className="mt-3 text-3xl font-semibold text-emerald-300">
              02h 15m
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Until the next match
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentOverview;
