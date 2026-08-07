import React from "react";

const historyItems = [
  {
    id: 1,
    date: "Jul 13, 2026",
    time: "06:00 PM",
    bonus: "25 ETB",
    status: "Claimed",
  },
  {
    id: 2,
    date: "Jul 12, 2026",
    time: "05:00 PM",
    bonus: "20 ETB",
    status: "Claimed",
  },
  {
    id: 3,
    date: "Jul 11, 2026",
    time: "06:00 PM",
    bonus: "15 ETB",
    status: "Claimed",
  },
  {
    id: 4,
    date: "Jul 10, 2026",
    time: "04:00 PM",
    bonus: "18 ETB",
    status: "Missed",
  },
];

const HappyHourHistory = () => {
  return (
    <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            History
          </p>
          <h2 className="text-2xl font-semibold text-slate-100">
            Happy hour claim activity
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Your recent happy hour bonus claims and status updates.
          </p>
        </div>
        <button className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/15">
          Download activity report
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {historyItems.map((entry) => (
          <div
            key={entry.id}
            className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-100">
                  {entry.date}
                </div>
                <div className="text-xs text-slate-500">{entry.time}</div>
              </div>
              <div className="text-lg font-semibold text-slate-100">
                {entry.bonus}
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  entry.status === "Claimed"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-rose-500/10 text-rose-300"
                }`}
              >
                {entry.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-400">
        <p>
          Note: All Happy Hour bonuses are subject to their respective wagering
          requirements. Funds are only unlocked and moved to your main balance
          after targets are met.
        </p>
      </div>
    </section>
  );
};

export default HappyHourHistory;
