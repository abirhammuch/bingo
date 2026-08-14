import React from "react";
import HappyHourHistory from "../components/HappyHourHistory";
import Responsible from "../components/Responsible";

const HappyHour = () => {
  return (
    <>
      <div className="space-y-8 mb-8">
        <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-3">
                Happy Hour History
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
                Review your claimed bonuses & progress.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                Track your hourly bonus claims, see your streak and upcoming
                happy hour times, and maximize your reward opportunities.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
              <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
                Next happy hour
              </div>
              <div className="text-4xl font-semibold text-slate-100">
                05:12:34
              </div>
              <div className="mt-3 text-sm text-slate-500">
                Time remaining until the next happy hour event.
              </div>
              <button className="mt-6 w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110">
                View happy hour rules
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Total claimed
            </div>
            <div className="text-4xl font-semibold text-slate-100">320 ETB</div>
            <p className="mt-2 text-sm text-slate-500">
              Bonuses collected during happy hour sessions.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Current streak
            </div>
            <div className="text-4xl font-semibold text-slate-100">7 days</div>
            <p className="mt-2 text-sm text-slate-500">
              Claimed consecutive happy hour bonuses this week.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Next reward
            </div>
            <div className="text-4xl font-semibold text-slate-100">
              + 25 ETB
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Bonus amount available at the next happy hour claim.
            </p>
          </div>
        </section>

        <HappyHourHistory />
      </div>
    <Responsible />
    </>
  );
};

export default HappyHour;
