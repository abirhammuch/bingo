import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
} from "react-icons/fa";

const Item = ({ icon, title, subtitle, active }) => (
  <div
    className={`flex items-center justify-between p-3 rounded-xl mb-3 cursor-pointer ${
      active
        ? "bg-emerald-700/20 border-emerald-700"
        : "bg-slate-800/50 border-slate-700"
    } border`}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-slate-900/40 flex items-center justify-center text-xl">
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

const Sidebar = ({ collapsed, mobileOpen, onClose }) => {
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
  ];

  const location = useLocation();
  const navigate = useNavigate();

  if (collapsed && !mobileOpen) {
    return (
      <aside className="w-16 h-screen overflow-y-auto bg-slate-900/60 border-r border-slate-800 hidden md:block">
        <div className="flex flex-col justify-between items-center py-4 h-full px-2">
          <div className="flex flex-col items-center gap-3">
            {items.map((it) => {
              const isActive =
                location.pathname === it.to ||
                (it.to === "/lobby" && location.pathname === "/");
              return (
                <Link key={it.title} to={it.to} title={it.title}>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700 ${
                      isActive ? "ring-2 ring-emerald-600" : ""
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
              onClick={() => navigate("/logout")}
              title="Logout"
              className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700"
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
                  (it.to === "/lobby" && location.pathname === "/");
                return (
                  <Link key={it.title} to={it.to}>
                    <Item
                      icon={it.icon}
                      title={it.title}
                      subtitle={it.subtitle}
                      active={isActive}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-4">
            <div className="flex flex-col gap-2">
              <Link
                to="/appearance"
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/40 hover:bg-slate-800/30 border border-slate-700"
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
                    d="M12 3v1m0 16v1M4.2 4.2l.7.7M18.1 18.1l.7.7M1 12h1m20 0h1"
                  />
                </svg>
                <span className="text-sm text-slate-100">Appearance</span>
              </Link>

              <button
                onClick={() => navigate("/logout")}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/40 hover:bg-slate-800/30 border border-slate-700 text-left w-full"
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
