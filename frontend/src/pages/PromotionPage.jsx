import React from "react";
import Promotion from "../components/Promotion";
import Responsible from "../components/Responsible";

const PromotionPage = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-3">
              Promotions
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
              Unlock bonuses and boost your gameplay.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Explore active promotions, available bonus offers, and special
              rewards designed to enhance your experience.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Current bonus pool
            </div>
            <div className="text-4xl font-semibold text-slate-100">220 ETB</div>
            <div className="mt-3 text-sm text-slate-500">
              Total value available through promotions
            </div>
          </div>
        </div>
      </section>
      <Promotion />
      <Responsible />
    </div>
  );
};

export default PromotionPage;
