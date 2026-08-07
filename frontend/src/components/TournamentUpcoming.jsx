import React from "react";

const upcomingEvents = [
  {
    id: 1,
    name: "Weekend Clash",
    start: "Jul 12, 2026 08:00 PM",
    entry: "10 ETB",
  },
  {
    id: 2,
    name: "Champions Sprint",
    start: "Jul 13, 2026 06:00 PM",
    entry: "15 ETB",
  },
  {
    id: 3,
    name: "Elite Showdown",
    start: "Jul 14, 2026 09:30 PM",
    entry: "20 ETB",
  },
];

const TournamentUpcoming = () => {
  return (
    <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Upcoming
          </p>
          <h2 className="text-2xl font-semibold text-slate-100">
            Next tournament events
          </h2>
        </div>
        <button className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/15 transition">
          View all tournaments
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-100">
                  {event.name}
                </div>
                <div className="text-sm text-slate-400">
                  Starts: {event.start}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  Entry fee
                </div>
                <div className="text-lg font-semibold text-slate-200">
                  {event.entry}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TournamentUpcoming;
