import React, { useState } from "react";
import TournamentOverview from "../components/TournamentOverview";
import TournamentUpcoming from "../components/TournamentUpcoming";
import TournamentLive from "../components/TournamentLive";

const tabs = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
];

const TournamentPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-8">
      <TournamentOverview />

      <div className="rounded-3xl bg-slate-900/70 border border-slate-700 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Tournament feed
            </p>
            <h2 className="text-2xl font-semibold text-slate-100">
              Browse tournaments by status
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-slate-900/80 text-slate-400 border border-slate-700 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {activeTab === "all" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <TournamentLive />
              <TournamentUpcoming />
            </div>
          )}
          {activeTab === "live" && <TournamentLive />}
          {activeTab === "upcoming" && <TournamentUpcoming />}
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
