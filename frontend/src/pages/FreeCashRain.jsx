import React from "react";
import Responsible from "../components/Responsible";

const drops = [
  { id: 1, amount: "5 ETB", status: "Available" },
  { id: 2, amount: "8 ETB", status: "Claimed" },
  { id: 3, amount: "10 ETB", status: "Available" },
];

const FreeCashRain = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 mb-3">
              Free Cash Rain
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
              Catch the cash when it falls.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Join the rain event to collect free rewards. The more you play,
              the bigger your drop window.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Next rain in
            </div>
            <div className="mt-3 text-4xl font-semibold text-slate-100">
              01:38:12
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Stay online to claim your drop.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-slate-950/80 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">
              Cash rain drops
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Tap the drop to claim free cash before it disappears.
            </p>
          </div>
          <button className="rounded-3xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition">
            View rain rules
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {drops.map((drop) => (
            <div
              key={drop.id}
              className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5 text-center"
            >
              <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Drop #{drop.id}
              </div>
              <div className="mt-4 text-4xl font-semibold text-slate-100">
                {drop.amount}
              </div>
              <div className="mt-2 text-sm text-slate-500">{drop.status}</div>
              <button
                disabled={drop.status !== "Available"}
                className={`mt-5 w-full rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                  drop.status === "Available"
                    ? "bg-cyan-500 text-slate-950 hover:brightness-110"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                {drop.status === "Available" ? "Claim" : "Claimed"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <h2 className="text-2xl font-semibold text-slate-100">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5">
            <div className="text-sm font-semibold text-slate-100">01</div>
            <p className="mt-3 text-sm text-slate-400">
              Stay active during rain events.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5">
            <div className="text-sm font-semibold text-slate-100">02</div>
            <p className="mt-3 text-sm text-slate-400">
              Claim drops before they expire.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5">
            <div className="text-sm font-semibold text-slate-100">03</div>
            <p className="mt-3 text-sm text-slate-400">
              Watch your balance grow instantly.
            </p>
          </div>
        </div>
      </section>
      <Responsible />
    </div>
  );
};

export default FreeCashRain;
