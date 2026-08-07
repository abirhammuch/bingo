import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRedo, FaEye, FaEyeSlash } from "react-icons/fa";

const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-slate-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
    />
  </svg>
);

const WalletIcon = () => (
  <svg
    className="w-5 h-5 inline-block mr-2"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7h15a2 2 0 012 2v6a2 2 0 01-2 2H3V7z"
    />
    <path
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 10v2"
    />
  </svg>
);

const Header = ({
  onToggleSidebar,
  isSidebarCollapsed,
  isMobileOpen,
  onRefresh,
  theme,
}) => {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [search, setSearch] = useState("");
  const balance = "0.95 ETB";

  const themeMap = {
    green: {
      accentText: "text-emerald-300",
      icon: "text-emerald-400",
      btnFrom: "from-emerald-400",
      btnTo: "to-green-600",
    },
    yellow: {
      accentText: "text-amber-300",
      icon: "text-amber-400",
      btnFrom: "from-amber-400",
      btnTo: "to-amber-600",
    },
    blue: {
      accentText: "text-sky-300",
      icon: "text-sky-400",
      btnFrom: "from-sky-400",
      btnTo: "to-sky-600",
    },
    red: {
      accentText: "text-rose-300",
      icon: "text-rose-400",
      btnFrom: "from-rose-400",
      btnTo: "to-rose-600",
    },
  };
  const accent = themeMap[theme] || themeMap.green;

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Marshal Bingo"
                className="w-10 h-10 rounded-full bg-slate-900/80 p-1"
              />
              <span className="font-semibold text-lg tracking-wide">
                Marshal Games
              </span>
            </div>

            <div className="hidden sm:flex items-center bg-slate-800/60 rounded-full px-3 py-1 border border-slate-700">
              <SearchIcon />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && search.trim()) {
                    navigate(
                      `/search?query=${encodeURIComponent(search.trim())}`,
                    );
                  }
                }}
                className="bg-transparent outline-none placeholder:text-slate-400 text-sm text-slate-100 w-56"
                placeholder="Search games..."
                aria-label="Search"
              />
            </div>

            <div className="hidden md:flex items-center gap-2 ml-2">
              <select className="bg-slate-800/60 text-sm rounded-md px-3 py-1 border border-slate-700">
                <option>All Providers</option>
                <option>Provider A</option>
                <option>Provider B</option>
              </select>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="hidden lg:flex items-center gap-3 bg-slate-800/30 px-4 py-2 rounded-full border border-slate-700">
              <WalletIcon />
              <div className="text-center">
                <div className="text-xs text-slate-300">TOTAL BALANCE</div>
                <div className={`font-semibold ${accent.accentText}`}>
                  {hidden ? "••••" : balance}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => {
                    if (typeof onRefresh === "function") onRefresh();
                    else console.log("refresh balance");
                  }}
                  className="p-2 rounded-md bg-slate-800/50 hover:bg-slate-800/40"
                  title="Refresh balance"
                  aria-label="Refresh balance"
                >
                  <FaRedo className={`w-4 h-4 ${accent.icon}`} />
                </button>

                <button
                  onClick={() => setHidden((s) => !s)}
                  className="p-2 rounded-md bg-slate-800/50 hover:bg-slate-800/40"
                  title={hidden ? "Show balance" : "Hide balance"}
                  aria-label="Toggle hide balance"
                >
                  {hidden ? (
                    <FaEyeSlash className={`w-4 h-4 ${accent.icon}`} />
                  ) : (
                    <FaEye className={`w-4 h-4 ${accent.icon}`} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/wallet")}
              className={`bg-gradient-to-br ${accent.btnFrom} ${accent.btnTo} text-slate-900 font-semibold px-4 py-2 rounded-full`}
            >
              Deposit
            </button>

            <button
              className="p-2 rounded-md bg-slate-800/60 border border-slate-700"
              aria-label="Toggle theme"
            >
              <svg
                className="w-5 h-5 text-slate-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1M4.2 4.2l.7.7M18.1 18.1l.7.7M1 12h1m20 0h1M4.2 19.8l.7-.7M18.1 5.9l.7-.7"
                />
                <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <select className="bg-transparent text-sm text-slate-200 px-2 py-1 border border-slate-700 rounded-md">
                  <option>English</option>
                  <option>አማርኛ</option>
                </select>
              </div>

              {/* Profile / Appearance / Logout moved to sidebar */}

              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-md bg-slate-800/60 border border-slate-700"
                aria-label="Toggle sidebar"
                title={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? (
                  <svg
                    className="w-5 h-5 text-slate-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 18l6-6-6-6"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-slate-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
