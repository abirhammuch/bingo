import React from "react";

const liveMatches = [
  {
    id: 1,
    title: "Solo Rush",
    status: "Live",
    prize: "55 ETB",
    progress: "75%",
  },
  {
    id: 2,
    title: "Team Blitz",
    status: "Live",
    prize: "110 ETB",
    progress: "42%",
  },
];

const TournamentLive = () => {
  return (
    <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Live
          </p>
          <h2 className="text-2xl font-semibold text-slate-100">
            Live tournament action
          </h2>
        </div>
        <div className="rounded-3xl bg-slate-950/80 px-4 py-2 text-sm text-slate-400 border border-slate-700">
          2 Tournaments in progress
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {liveMatches.map((match) => (
          <div
            key={match.id}
            className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-100">
                  {match.title}
                </div>
                <div className="text-sm text-slate-400">{match.status}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Prize pool</div>
                <div className="text-lg font-semibold text-slate-200">
                  {match.prize}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-full bg-slate-900/80 p-2">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Progress</span>
                <span>{match.progress}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: match.progress }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TournamentLive;
