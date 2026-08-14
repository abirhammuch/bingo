import React from "react";
import Responsible from "../components/Responsible";

const rewards = [
  {
    title: "Daily cashback rate",
    value: "5%",
    description: "Earn cash back on eligible losses every day.",
  },
  {
    title: "Minimum play requirement",
    value: "10 ETB",
    description: "Play 10 ETB or more to qualify for daily cashback.",
  },
  {
    title: "Maximum cashback",
    value: "50 ETB",
    description: "Receive up to 50 ETB cashback each day.",
  },
];

const history = [
  {
    date: "Jul 13, 2026",
    amount: "12.50 ETB",
    status: "Paid",
  },
  {
    date: "Jul 12, 2026",
    amount: "9.00 ETB",
    status: "Paid",
  },
  {
    date: "Jul 11, 2026",
    amount: "0.00 ETB",
    status: "Not qualified",
  },
];

const CashbackPage = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300 mb-3">
              Daily Cashback
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
              Claim cashback on your daily play.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Get rewarded for your activity with automatic cashback every day.
              Stay active to maximize each cashback payout.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Estimated today
            </div>
            <div className="text-4xl font-semibold text-slate-100">
              18.75 ETB
            </div>
            <div className="mt-3 text-sm text-slate-500">
              Based on your current eligible play.
            </div>
            <button className="mt-6 w-full rounded-3xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition">
              View cashback rules
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {rewards.map((reward) => (
          <div
            key={reward.title}
            className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20"
          >
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              {reward.title}
            </div>
            <div className="text-3xl font-semibold text-slate-100">
              {reward.value}
            </div>
            <p className="mt-3 text-sm text-slate-400">{reward.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Cashback history
            </p>
            <h2 className="text-2xl font-semibold text-slate-100">
              Recent cashback payouts
            </h2>
          </div>
          <button className="rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-sky-400 transition">
            Export history
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {history.map((item) => (
            <div
              key={item.date}
              className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {item.date}
                </div>
                <div className="text-xs text-slate-500">Daily payout</div>
              </div>
              <div className="text-lg font-semibold text-slate-100">
                {item.amount}
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  item.status === "Paid"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-rose-500/10 text-rose-300"
                }`}
              >
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Eligibility
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Be active daily and meet the minimum wagering requirements to
              qualify.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Claim time
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Cashback is calculated each day and paid out automatically by
              midnight.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Support
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Need help? Contact support to understand your cashback totals.
            </p>
          </div>
        </div>
      </section>
      <Responsible />
    </div>
  );
};

export default CashbackPage;
