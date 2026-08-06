import React, { useState } from "react";

const paymentMethods = [
  {
    id: "telebirr",
    label: "Telebirr",
    icon: "https://via.placeholder.com/48?text=T",
  },
  {
    id: "cbe",
    label: "CBE Birr",
    icon: "https://via.placeholder.com/48?text=C",
  },
  {
    id: "mpesa",
    label: "Mpesa",
    icon: "https://via.placeholder.com/48?text=M",
  },
];

const PaymentMethod = () => {
  const [selected, setSelected] = useState("telebirr");

  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 mt-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Select Payment Method
          </h2>
          <p className="text-sm text-slate-400">
            Choose a deposit method to continue.
          </p>
        </div>
        <div className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400">
          {paymentMethods.length} Available
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setSelected(method.id)}
            className={`group rounded-3xl border p-4 text-left transition ${
              selected === method.id
                ? "border-emerald-400 bg-emerald-400/10"
                : "border-slate-700 bg-slate-900/80 hover:border-emerald-500"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900">
                <img src={method.icon} alt={method.label} className="h-8 w-8" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {method.label}
                </div>
                <div className="text-xs text-slate-500">Secure payment</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-full bg-emerald-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        Continue Deposit
      </button>
    </div>
  );
};

export default PaymentMethod;
