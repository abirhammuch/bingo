import React from "react";

const Responsible = () => {
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-8 text-center shadow-xl shadow-slate-950/20">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-500/30 bg-slate-900 text-rose-400">
        <span className="text-lg font-bold">21+</span>
      </div>

      <h2 className="text-xl font-semibold tracking-[0.2em] text-slate-100 uppercase">
        Responsible Gaming
      </h2>

      <div className="my-6 h-px bg-slate-800" />

      <div className="grid gap-4 sm:grid-cols-3 text-left text-sm text-slate-400">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
            Secure
          </div>
          <div className="font-medium text-slate-100">SSL Encrypted</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
            Identity
          </div>
          <div className="font-medium text-slate-100">21+ Required</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
            Support
          </div>
          <div className="font-medium text-slate-100">24/7 Assistance</div>
        </div>
      </div>

      <div className="mt-8 text-xs uppercase tracking-[0.28em] text-slate-500">
        © 2026 Zare Games · The ultimate experience
      </div>
    </div>
  );
};

export default Responsible;
