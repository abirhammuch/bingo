import React from "react";
import Responsible from "../components/Responsible";

const tiers = [
  {
    name: "Bronze",
    requirement: "0-999 points",
    rewards: ["2% cashback", "Exclusive badge", "Priority support"],
  },
  {
    name: "Silver",
    requirement: "1,000-2,499 points",
    rewards: ["5% cashback", "Birthday bonus", "Faster withdrawals"],
  },
  {
    name: "Gold",
    requirement: "2,500-4,999 points",
    rewards: ["10% cashback", "Monthly free spins", "Personal VIP host"],
  },
  {
    name: "Platinum",
    requirement: "5,000+ points",
    rewards: ["15% cashback", "Weekly bonus drops", "Exclusive events"],
  },
];

const VIPRewardPage = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300 mb-3">
              VIP Rewards
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
              Unlock premium rewards as you climb the VIP tiers.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Earn points with every play and unlock better bonuses, faster
              payouts, and exclusive perks reserved for our top players.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Your VIP score
            </div>
            <div className="text-4xl font-semibold text-slate-100">
              2,340 pts
            </div>
            <div className="mt-3 text-sm text-slate-500">
              You are currently at Gold tier.
            </div>
            <button className="mt-6 w-full rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110">
              View tier progress
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20"
          >
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              {tier.name}
            </div>
            <div className="text-2xl font-semibold text-slate-100">
              {tier.requirement}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {tier.rewards.map((reward) => (
                <li key={reward} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <span>{reward}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Daily bonus
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-100">
              10 ETB
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Claim a daily reward just for being a VIP member.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Weekly cashback
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-100">
              12%
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Receive cashback on all gameplay losses every week.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Exclusive drops
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-100">
              Yes
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Get access to VIP-only events and reward drops.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-slate-950/80 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              How it works
            </p>
            <h2 className="text-2xl font-semibold text-slate-100">
              Boost your rank and rewards.
            </h2>
          </div>
          <button className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition">
            View VIP rules
          </button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-5">
            <div className="text-sm font-semibold text-slate-100">01</div>
            <p className="mt-3 text-sm text-slate-400">
              Play eligible games to earn points.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-5">
            <div className="text-sm font-semibold text-slate-100">02</div>
            <p className="mt-3 text-sm text-slate-400">
              Reach higher tiers for bigger bonuses.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-5">
            <div className="text-sm font-semibold text-slate-100">03</div>
            <p className="mt-3 text-sm text-slate-400">
              Enjoy exclusive VIP perks and events.
            </p>
          </div>
        </div>
      </section>
      <Responsible />
    </div>
  );
};

export default VIPRewardPage;
