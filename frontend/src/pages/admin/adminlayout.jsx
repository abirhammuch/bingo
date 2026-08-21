import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  FaUsers,
  FaBan,
  FaGamepad,
  FaTrophy,
  FaMoneyBillWave,
  FaCoins,
  FaShieldAlt,
  FaChartLine,
} from "react-icons/fa";
import { fetchAdminDashboard } from "../../services/userService";

const adminMenu = [
  { to: "/admin", label: "Dashboard", icon: <FaChartLine /> },
  { to: "/admin/users", label: "Users", icon: <FaUsers /> },
  { to: "/admin/referral-bonus", label: "Referral Bonus", icon: <FaTrophy /> },
  { to: "/admin/coupons", label: "Coupons", icon: <FaCoins /> },
  { to: "/admin/stake", label: "Stake", icon: <FaCoins /> },
  {
    to: "/admin/registration-bonus",
    label: "Registration Bonus",
    icon: <FaUsers />,
  },
  {
    to: "/admin/game-commission",
    label: "Game Commission",
    icon: <FaGamepad />,
  },
  { to: "/admin/withdraw-fee", label: "Withdraw Fee", icon: <FaShieldAlt /> },
  {
    to: "/admin/transactions",
    label: "Transactions",
    icon: <FaMoneyBillWave />,
  },
  { to: "/admin/deposit", label: "Deposit", icon: <FaCoins /> },
  {
    to: "/admin/withdraw",
    label: "Withdraw",
    icon: <FaShieldAlt />,
  },
];

const stats = [
  {
    label: "Total Users",
    value: "6,159",
    meta: "Active: 1,193",
    color: "from-slate-900 to-slate-800",
  },
  {
    label: "Total Games",
    value: "390",
    meta: "Active: 1",
    color: "from-emerald-950 to-emerald-800",
  },
  {
    label: "Revenue",
    value: "952.2 ETB",
    meta: "Today: 0 ETB",
    color: "from-violet-950 to-violet-800",
  },
  {
    label: "Commission",
    value: "763.5 ETB",
    meta: "Today: 6 ETB",
    color: "from-amber-950 to-amber-800",
  },
  {
    label: "Referral",
    value: "3,285",
    meta: "Earnings: 657 ETB",
    color: "from-cyan-950 to-cyan-800",
  },
];

const AdminLayout = () => {
  const location = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const query = location.search.replace("?", "");
  const isActive = (to) => {
    const [path, mode] = to.split("?");
    if (mode) {
      return location.pathname === path && query === mode;
    }
    return location.pathname === to;
  };

  useEffect(() => {
    if (location.pathname !== "/admin") return undefined;

    let active = true;
    setDashboardError("");
    fetchAdminDashboard()
      .then((response) => {
        if (active) setDashboard(response);
      })
      .catch((error) => {
        if (active) setDashboardError(error.message || "Dashboard unavailable");
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  const dashboardStats = dashboard?.stats
    ? [
        {
          label: "Total Users",
          value: dashboard.stats.totalUsers.toLocaleString(),
          meta: `Active: ${dashboard.stats.activeUsers.toLocaleString()}`,
          color: "from-slate-900 to-slate-800",
        },
        {
          label: "Total Games",
          value: dashboard.stats.totalGames.toLocaleString(),
          meta: `Active: ${dashboard.stats.activeGames.toLocaleString()}`,
          color: "from-emerald-950 to-emerald-800",
        },
        {
          label: "Revenue",
          value: `${Number(dashboard.stats.revenue).toFixed(2)} ETB`,
          meta: "Completed bets",
          color: "from-violet-950 to-violet-800",
        },
        {
          label: "Commission",
          value: `${Number(dashboard.stats.commission).toFixed(2)} ETB`,
          meta: "Recorded commission",
          color: "from-amber-950 to-amber-800",
        },
        {
          label: "Referral",
          value: dashboard.stats.referralCount.toLocaleString(),
          meta: `Earnings: ${Number(dashboard.stats.referralEarnings).toFixed(2)} ETB`,
          color: "from-cyan-950 to-cyan-800",
        },
      ]
    : stats;

  const currentRound = dashboard?.currentRound;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="lg:grid lg:grid-cols-[280px_1fr] gap-6 max-w-[1600px] mx-auto px-4 py-6">
        <aside className="hidden lg:flex flex-col rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/40">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 grid place-items-center text-xl">
                B
              </div>
              <div>
                <div className="font-semibold text-lg">BingoX Admin</div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Management Portal
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 grid place-items-center text-slate-100 text-xl">
                Y
              </div>
              <div>
                <div className="font-semibold">yegna$bingo!</div>
                <div className="text-xs text-slate-500">Super Admin</div>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {adminMenu.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-sm transition-colors ${
                  isActive(item.to)
                    ? "bg-slate-800 border border-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800 text-slate-500 text-sm">
            <div className="font-semibold text-slate-100 mb-2">System</div>
            <div className="space-y-2">
              <button className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-left text-slate-300 hover:bg-slate-800/60">
                Settings
              </button>
              <button className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-left text-slate-300 hover:bg-slate-800/60">
                Broadcast
              </button>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Dashboard
                </div>
                <h1 className="mt-2 text-4xl font-semibold">
                  Welcome back, yegna$bingo!
                </h1>
                <p className="mt-2 text-slate-400 max-w-2xl">
                  Review platform performance, manage users, monitor
                  transactions, and oversee active rooms from one place.
                </p>
              </div>
              <Link
                to="/admin/transactions"
                className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                View reports
              </Link>
            </div>
          </div>

          {location.pathname === "/admin" && (
            <>
              <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-2">
                {dashboardError && (
                  <div className="xl:col-span-5 lg:col-span-2 rounded-2xl border border-rose-400/30 bg-rose-950/40 p-4 text-sm text-rose-200">
                    {dashboardError}
                  </div>
                )}
                {dashboardStats.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-3xl border border-slate-800 p-5 bg-gradient-to-br ${item.color} bg-slate-950/80 shadow-lg shadow-slate-950/20`}
                  >
                    <div className="text-sm text-slate-400">{item.label}</div>
                    <div className="mt-4 text-3xl font-semibold">
                      {item.value}
                    </div>
                    <div className="mt-3 text-sm text-slate-400">
                      {item.meta}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
                        Bingo Round
                      </div>
                      <h2 className="mt-2 text-2xl font-semibold">
                        Round Status
                      </h2>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
                      {currentRound?.status === "active" ? "Live" : "Waiting"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Phase
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">
                        {currentRound?.status === "active"
                          ? "Live"
                          : "Selection"}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Timer
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-amber-300">
                        {currentRound?.selectionEndsAt
                          ? `${Math.max(0, Math.ceil((new Date(currentRound.selectionEndsAt).getTime() - Date.now()) / 1000))}s`
                          : "--"}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Players
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-emerald-300">
                        {currentRound?.playerCount ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">
                          Global round rules
                        </div>
                        <div className="mt-2 text-lg font-medium text-slate-100">
                          Selection closes at 0s, then live game begins.
                        </div>
                      </div>
                      <Link
                        to="/admin/stake"
                        className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                      >
                        Manage Round
                      </Link>
                    </div>
                  </div>
                </section>

                <aside className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
                    Quick actions
                  </div>
                  <div className="mt-5 space-y-3">
                    <Link
                      to="/admin/stake"
                      className="block w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 hover:bg-slate-700"
                    >
                      Start new round
                    </Link>
                    <Link
                      to="/admin/stake"
                      className="block w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 hover:bg-slate-700"
                    >
                      Manage live draw
                    </Link>
                    <Link
                      to="/admin/transactions"
                      className="block w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 hover:bg-slate-700"
                    >
                      Review transactions
                    </Link>
                  </div>
                </aside>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                <section className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">Analytics</h2>
                      <p className="mt-1 text-slate-400">
                        Trend of revenue, commission, referral bonus, and new
                        users.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/70 p-2">
                      {["Daily", "Weekly", "Monthly", "Yearly"].map(
                        (label, idx) => (
                          <button
                            key={label}
                            className={`rounded-full px-4 py-2 text-sm transition ${idx === 0 ? "bg-emerald-500/15 text-emerald-300" : "text-slate-300 hover:bg-slate-800/60"}`}
                          >
                            {label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-slate-950/90 p-5">
                    <div className="h-72 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 text-slate-500 relative overflow-hidden">
                      <div className="absolute inset-x-6 bottom-6 flex justify-between text-xs text-slate-500">
                        <span>12 AM</span>
                        <span>6 AM</span>
                        <span>12 PM</span>
                        <span>6 PM</span>
                        <span>11 PM</span>
                      </div>
                      <div className="absolute inset-x-0 top-0 bottom-0 left-12 right-12">
                        <svg
                          className="w-full h-full"
                          viewBox="0 0 500 300"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M0 230 C100 180 160 180 220 145 C280 110 340 100 400 120 C460 140 500 100 500 100"
                            stroke="#10b981"
                            strokeWidth="4"
                            fill="transparent"
                            strokeLinecap="round"
                          />
                          <path
                            d="M0 210 C100 170 160 160 220 130 C280 100 340 90 400 110 C460 130 500 90 500 90"
                            stroke="#38bdf8"
                            strokeWidth="4"
                            fill="transparent"
                            strokeLinecap="round"
                            opacity="0.7"
                          />
                          <circle cx="82" cy="190" r="5" fill="#10b981" />
                          <circle cx="172" cy="175" r="5" fill="#10b981" />
                          <circle cx="252" cy="165" r="5" fill="#10b981" />
                          <circle cx="332" cy="150" r="5" fill="#10b981" />
                          <circle cx="412" cy="155" r="5" fill="#10b981" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="space-y-4 rounded-[32px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
                  <div>
                    <div className="text-sm text-slate-400">
                      Pending approval
                    </div>
                    <div className="mt-3 text-3xl font-semibold">0</div>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="text-sm text-slate-400">Live Rooms</div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-3xl font-semibold">14</div>
                        <div className="text-sm text-slate-500">Active now</div>
                      </div>
                      <div className="rounded-3xl bg-emerald-500/15 px-3 py-2 text-emerald-300 text-sm">
                        Stable
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="text-sm text-slate-400">Top Referral</div>
                    <div className="mt-3 text-xl font-semibold">Mulugeta</div>
                    <div className="text-sm text-slate-500">
                      657 ETB earnings
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}

          {location.pathname !== "/admin" && (
            <section className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
              <Outlet />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
