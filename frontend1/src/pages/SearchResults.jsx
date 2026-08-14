import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ensureTelegramRegistration } from "../utils/telegramWebApp";

const searchCatalog = [
  {
    id: 1,
    title: "Bingo",
    category: "Game",
    description: "Join the bingo hall for instant wins and live draws.",
    path: "/bingopage",
  },
  {
    id: 2,
    title: "Ludo",
    category: "Game",
    description: "Play Ludo against others in quick competitive rounds.",
    path: "/ludo",
  },
  {
    id: 3,
    title: "Spin",
    category: "Game",
    description: "Spin the wheel for chances to win bonus credits.",
    path: "/spin",
  },
  {
    id: 4,
    title: "Prediction Pool",
    category: "Prediction",
    description: "Place bets on upcoming match outcomes.",
    path: "/prediction",
  },
  {
    id: 5,
    title: "Weekend Clash",
    category: "Tournament",
    description: "Upcoming tournament with a large prize pool.",
    path: "/tournament",
  },
  {
    id: 6,
    title: "Solo Rush",
    category: "Live Tournament",
    description: "Live tournament action happening right now.",
    path: "/tournament",
  },
];

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const query = new URLSearchParams(location.search).get("query")?.trim() || "";
  const filteredResults = query
    ? searchCatalog.filter((item) => {
        const lower = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(lower) ||
          item.category.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower)
        );
      })
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Search
            </p>
            <h1 className="text-3xl font-semibold text-slate-100">
              Search results for "{query || "your query"}"
            </h1>
          </div>
          <div className="rounded-3xl bg-slate-950/80 px-5 py-3 text-sm text-slate-400 border border-slate-700">
            {query
              ? `${filteredResults.length} result${filteredResults.length === 1 ? "" : "s"}`
              : "Enter a search term"}
          </div>
        </div>
      </section>

      {!query ? (
        <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-8 text-slate-400">
          Use the search box in the header to look for games, tournaments, and
          predictions.
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-8 text-slate-400">
          No results found. Try a different term like "bingo" or "live".
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResults.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={(event) => {
                if (!ensureTelegramRegistration(authUser, navigate)) {
                  event.preventDefault();
                }
              }}
              className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 transition hover:border-emerald-500"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-100">
                    {item.title}
                  </div>
                  <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    {item.category}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.description}
                  </p>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                  Go
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
