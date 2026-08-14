import React, { useState } from "react";

const PaymentCheck = () => {
  const [activeMethod, setActiveMethod] = useState("cbe");
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Payment check
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Transaction ID እንዴት — የሚል የክፍያ ማረጋገጫ መረጃ እንዲሰጥ እንዲሁም የክፍያ ስርዓት ይሠራል።
          </p>
        </div>
        <button className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300">
          Auto-check
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { id: "telebirr", label: "Telebirr" },
            { id: "cbe", label: "CBE Birr" },
            { id: "mpesa", label: "Mpesa" },
          ].map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setActiveMethod(method.id)}
              className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                activeMethod === method.id
                  ? "bg-violet-500 text-slate-950"
                  : "bg-slate-950/60 text-slate-400 hover:bg-slate-900"
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm uppercase tracking-[0.25em] text-slate-400 mb-2">
          {activeMethod === "cbe" ? "CBE Birr Message" : "Message"}
        </label>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            activeMethod === "cbe"
              ? "እባክዎ የCBE Birr መልዕክትዎን እዚህ ያስገቡ..."
              : "Enter your payment message here..."
          }
          className="w-full rounded-3xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-3xl bg-indigo-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        መረጃ ይላኩ →
      </button>
    </div>
  );
};

export default PaymentCheck;
