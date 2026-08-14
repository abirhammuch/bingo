import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ensureTelegramRegistration } from "../utils/telegramWebApp";
import {
  FaGamepad,
  FaTrophy,
  FaGift,
  FaTicketAlt,
  FaBullseye,
  FaUserFriends,
  FaGem,
  FaWallet,
  FaBolt,
  FaCloudShowersHeavy,
  FaUser,
  FaChevronDown,
  FaShieldAlt,
} from "react-icons/fa";

const Item = ({ icon, title, subtitle, active, accent }) => (
  <div
    className={`flex items-center justify-between p-3 rounded-xl mb-3 cursor-pointer border ${
      active
        ? `bg-slate-800/40 ${accent.activeBorder}`
        : "bg-slate-800/50 border-slate-700"
    }`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg bg-slate-900/40 flex items-center justify-center text-xl ${
          active ? accent.icon : "text-slate-300"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="font-medium text-slate-100">{title}</div>
        {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
      </div>
    </div>
    <div className="text-slate-300">&gt;</div>
  </div>
);

const Sidebar = ({ collapsed, mobileOpen, theme, setTheme, onClose }) => {
  const themeClasses = {
    green: {
      activeBorder: "border-emerald-500",
      activeRing: "ring-emerald-500",
      selectedBg: "bg-slate-800 border-emerald-500",
      icon: "text-emerald-400",
      selectedText: "text-emerald-300",
    },
    yellow: {
      activeBorder: "border-amber-500",
      activeRing: "ring-amber-500",
      selectedBg: "bg-slate-800 border-amber-500",
      icon: "text-amber-400",
      selectedText: "text-amber-300",
    },
    blue: {
      activeBorder: "border-sky-500",
      activeRing: "ring-sky-500",
      selectedBg: "bg-slate-800 border-sky-500",
      icon: "text-sky-400",
      selectedText: "text-sky-300",
    },
    red: {
      activeBorder: "border-rose-500",
      activeRing: "ring-rose-500",
      selectedBg: "bg-slate-800 border-rose-500",
      icon: "text-rose-400",
      selectedText: "text-rose-300",
    },
  };
  const accent = themeClasses[theme] || themeClasses.green;

  const items = [
    { icon: <FaGamepad />, title: "Home", to: "/lobby" },
    { icon: <FaTrophy />, title: "Tournament", to: "/tournament" },
    { icon: <FaGift />, title: "Promotions", to: "/promotions" },
    { icon: <FaTicketAlt />, title: "Promo Codes", to: "/promo-codes" },
    { icon: <FaBullseye />, title: "Prediction Pool", to: "/prediction" },
    {
      icon: <FaUserFriends />,
      title: "Referral Tournament",
      to: "/referral",
      active: true,
    },
    { icon: <FaGem />, title: "VIP Rewards", to: "/vip" },
    { icon: <FaWallet />, title: "Daily Cashback", to: "/cashback" },
    { icon: <FaBolt />, title: "Happy Hour History", to: "/happy-hour" },
    {
      icon: <FaCloudShowersHeavy />,
      title: "Free Cash Rain",
      to: "/free-cash-rain",
    },
    { icon: <FaShieldAlt />, title: "Admin Panel", to: "/admin" },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const handleSidebarNavigation = (event, to) => {
    if (!ensureTelegramRegistration(authUser)) {
      event.preventDefault();
      return;
    }
    navigate(to);
    onClose();
  };

  const appearanceOptions = [
    { label: "Green", value: "green", dot: "bg-emerald-400" },
    { label: "Yellow", value: "yellow", dot: "bg-amber-400" },
    { label: "Blue", value: "blue", dot: "bg-sky-400" },
    { label: "Red", value: "red", dot: "bg-rose-400" },
  ];

  if (collapsed && !mobileOpen) {
    return (
      <aside className="w-16 h-screen overflow-y-auto bg-slate-900/60 border-r border-slate-800 hidden md:block">
        <div className="flex flex-col justify-between items-center py-4 h-full px-2">
          <div className="flex flex-col items-center gap-3">
            {items.map((it) => {
              const isActive =
                location.pathname === it.to ||
                (it.to === "/lobby" && location.pathname === "/") ||
                (it.to === "/admin" && location.pathname.startsWith("/admin"));
              return (
                <Link
                  key={it.title}
                  to={it.to}
                  title={it.title}
                  onClick={(event) => handleSidebarNavigation(event, it.to)}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700 ${
                      isActive ? `ring-2 ${accent.activeRing}` : ""
                    }`}
                  >
                    <span>{it.icon}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link to="/appearance" title="Appearance">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700">
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
                    d="M12 3v1m0 16v1M4.2 4.2l.7.7M18.1 18.1l.7.7M1 12h1m20 0h1"
                  />
                </svg>
              </div>
            </Link>

            <button
              onClick={() => {
                onClose();
                navigate("/logout");
              }}
              title="Logout"
              className="w-12 h-12 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-200 border border-rose-600 hover:bg-rose-500/25"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7"
                />
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 8v8"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-slate-900/95 border-r border-slate-800 transform transition-transform duration-300 ease-out md:relative md:translate-x-0 md:w-72 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 md:hidden">
          <div className="text-slate-100 font-semibold">Menu</div>
          <button
            onClick={onClose}
            className="rounded-md bg-slate-800/60 p-2 text-slate-200"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-4 flex flex-col h-full justify-between">
          <div>
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-slate-800/70 to-slate-900/50 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Logged in as</div>
                  <div className="font-semibold text-slate-100">Marshal</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <FaUser className="text-slate-200" />
                </div>
              </div>
              <div className="mt-3">
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/40 hover:bg-slate-800/30 border border-slate-700"
                >
                  <FaUser className="text-slate-200" />
                  <span className="text-sm text-slate-100">Profile</span>
                </Link>
              </div>
            </div>

            <nav>
              {items.map((it) => {
                const isActive =
                  location.pathname === it.to ||
                  (it.to === "/lobby" && location.pathname === "/") ||
                  (it.to === "/admin" &&
                    location.pathname.startsWith("/admin"));
                return (
                  <Link
                    key={it.title}
                    to={it.to}
                    onClick={(event) => handleSidebarNavigation(event, it.to)}
                  >
                    <Item
                      icon={it.icon}
                      title={it.title}
                      subtitle={it.subtitle}
                      active={isActive}
                      accent={accent}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-4">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setAppearanceOpen((open) => !open)}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-slate-800/40 hover:bg-slate-800/30 border border-slate-700 w-full"
                aria-expanded={appearanceOpen}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1M4.2 4.2l.7.7M18.1 18.1l.7.7M1 12h1m20 0h1"
                    />
                  </svg>
                  <span className="text-sm text-slate-100">Appearance</span>
                </div>
                <FaChevronDown
                  className={`w-4 h-4 transition-transform ${
                    appearanceOpen ? "rotate-180" : "rotate-0"
                  } text-slate-400`}
                />
              </button>
              {appearanceOpen && (
                <div className="mt-2 space-y-2 rounded-xl border border-slate-700 bg-slate-950/95 p-3">
                  {appearanceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setTheme(option.value);
                        setAppearanceOpen(false);
                        onClose();
                      }}
                      className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-left transition ${
                        theme === option.value
                          ? accent.selectedBg
                          : "bg-slate-900/70 hover:bg-slate-900/90"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${option.dot}`}
                        />
                        <span className="text-sm text-slate-100">
                          {option.label}
                        </span>
                      </div>
                      {theme === option.value && (
                        <span className={`text-xs ${accent.selectedText}`}>
                          Selected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  onClose();
                  navigate("/logout");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-600 text-left w-full text-rose-100"
              >
                <svg
                  className="w-4 h-4 text-slate-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7"
                  />
                  <path
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 8v8"
                  />
                </svg>
                <span className="text-sm text-slate-100">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
