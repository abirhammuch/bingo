import React from "react";
import { FaGift } from "react-icons/fa";

const promotions = [
  {
    title: "Daily Login Bonus",
    description: "Claim 10 ETB each day you log in and play.",
    tag: "Active",
    bonus: "10 ETB",
  },
  {
    title: "Weekend Cashback",
    description: "Get 15% cashback on losses every weekend.",
    tag: "Active",
    bonus: "15% cash back",
  },
  {
    title: "New Player Offer",
    description: "Deposit 50 ETB and receive 75 ETB bonus.",
    tag: "Available",
    bonus: "75 ETB",
  },
];

const Promotion = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-3">
        {promotions.map((offer) => (
          <div
            key={offer.title}
            className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-slate-100">
                {offer.title}
              </div>
              <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                {offer.tag}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              {offer.description}
            </p>
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="rounded-3xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                {offer.bonus}
              </div>
              <button className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110">
                Claim now
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 text-center shadow-sm shadow-slate-950/20">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-emerald-300 border border-emerald-500/20">
          <FaGift className="h-6 w-6" />
        </div>
        <div className="text-lg font-semibold text-slate-100">
          Available promotions
        </div>
        <p className="mt-3 text-sm text-slate-400">
          No public promos available right now.
        </p>
      </div>
    </div>
  );
};

export default Promotion;
