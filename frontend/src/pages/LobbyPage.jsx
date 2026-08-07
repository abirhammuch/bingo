import React from "react";
import { Link } from "react-router-dom";
import bingoImage from "../assets/Image/bingo.png";
import ludoImage from "../assets/Image/ludo.png";
import spinImage from "../assets/Image/spin.png";
import Responsible from "../components/Responsible";

const LobbyPage = ({ theme }) => {
  const themeMap = {
    green: {
      from: "from-emerald-400",
      to: "to-green-600",
      text: "text-emerald-300",
    },
    yellow: {
      from: "from-amber-400",
      to: "to-amber-600",
      text: "text-amber-300",
    },
    blue: { from: "from-sky-400", to: "to-sky-600", text: "text-sky-300" },
    red: { from: "from-rose-400", to: "to-rose-600", text: "text-rose-300" },
  };
  const accent = themeMap[theme] || themeMap.green;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome to Marshal Bingo
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Play featured games, join tournaments, and win prizes — fast,
              fair, and fun.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                className={`bg-gradient-to-br ${accent.from} ${accent.to} text-slate-900 font-semibold px-4 py-2 rounded-full`}
              >
                Play Now
              </button>
              <button className="px-4 py-2 rounded-md bg-slate-800/50 border border-slate-700 text-sm text-slate-200">
                Browse All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-900/40 border border-slate-700">
              <div className={`text-lg font-semibold ${accent.text}`}>24</div>
              <div className="text-xs text-slate-400">Live Games</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/40 border border-slate-700">
              <div className={`text-lg font-semibold ${accent.text}`}>1.2K</div>
              <div className="text-xs text-slate-400">Players Online</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/40 border border-slate-700">
              <div className={`text-lg font-semibold ${accent.text}`}>
                ₮ 2,340
              </div>
              <div className="text-xs text-slate-400">Jackpot</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">
          Featured Games
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/bingopage"
            className="block rounded-xl bg-slate-800/40 border border-slate-700 p-4 hover:shadow-lg transition"
          >
            <div className="mb-3 text-sm text-slate-300">Bingo</div>
            <img
              src={bingoImage}
              alt="Bingo"
              className="h-40 w-full rounded-2xl object-cover"
            />
          </Link>
          <Link
            to="/ludo"
            className="block rounded-xl bg-slate-800/40 border border-slate-700 p-4 hover:shadow-lg transition"
          >
            <div className="mb-3 text-sm text-slate-300">Ludo</div>
            <img
              src={ludoImage}
              alt="Ludo"
              className="h-40 w-full rounded-2xl object-cover"
            />
          </Link>
          <Link
            to="/spin"
            className="block rounded-xl bg-slate-800/40 border border-slate-700 p-4 hover:shadow-lg transition"
          >
            <div className="mb-3 text-sm text-slate-300">Spin</div>
            <img
              src={spinImage}
              alt="Spin"
              className="h-40 w-full rounded-2xl object-cover"
            />
          </Link>
        </div>
      </section>
      <Responsible />
    </div>
  );
};

export default LobbyPage;
