import React from "react";
import { useAppContext } from "../context/AppContext.jsx";

const options = [
  { label: "Green", value: "green", description: "Fresh and balanced" },
  { label: "Yellow", value: "yellow", description: "Bright and energetic" },
  { label: "Blue", value: "blue", description: "Calm and cool" },
  { label: "Red", value: "red", description: "Bold and intense" },
];

const AppearancePage = () => {
  const { theme, setTheme } = useAppContext();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Appearance
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
              Apply a theme across the entire app.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Select an appearance option and it will immediately apply to the
              full layout.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Current theme
            </div>
            <div className="mt-4 text-2xl font-semibold text-slate-100">
              {theme}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`rounded-3xl border p-6 text-left transition ${
              theme === option.value
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-700 bg-slate-950/80 hover:border-slate-500"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  {option.label}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {option.description}
                </p>
              </div>
              {theme === option.value && (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Selected
                </span>
              )}
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};

export default AppearancePage;
