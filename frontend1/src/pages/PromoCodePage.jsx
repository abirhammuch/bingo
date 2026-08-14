import React from "react";
import PromoCode from "../components/PromoCode";
import Responsible from "../components/Responsible";

const PromoCodePage = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-6 shadow-xl shadow-slate-950/20">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Promo codes
          </p>
          <h1 className="text-3xl font-semibold text-slate-100">Promo Codes</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Claim active codes and boost your bonus wallet with our latest
            promotions.
          </p>
        </div>
      </section>

      <PromoCode />
 
    </div>
  );
};

export default PromoCodePage;
