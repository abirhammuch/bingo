import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaBan,
  FaGamepad,
  FaTrophy,
  FaMoneyBillWave,
  FaCoins,
  FaShieldAlt,
  FaChartLine,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaBullhorn,
  FaKey,
  FaUserShield,
} from "react-icons/fa";
import {
  createSystemWithdrawal,
  fetchAdminDashboard,
} from "../../services/userService";

const adminMenu = [
  { to: "/admin", label: "Dashboard", icon: <FaChartLine /> },
  { to: "/admin/users", label: "Users", icon: <FaUsers /> },
  {
    to: "/admin/telegram-broadcast",
    label: "Telegram Broadcast",
    icon: <FaBullhorn />,
  },
  { to: "/admin/password", label: "Change Password", icon: <FaKey /> },
  { to: "/admin/admins", label: "Admin Accounts", icon: <FaUserShield /> },
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
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [financialPeriod, setFinancialPeriod] = useState("1d");
  const [systemWithdrawal, setSystemWithdrawal] = useState({
    amount: "",
    method: "",
    account: "",
  });
  const [systemWithdrawalMessage, setSystemWithdrawalMessage] = useState("");
  const [systemWithdrawalError, setSystemWithdrawalError] = useState("");
  const [systemWithdrawalLoading, setSystemWithdrawalLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isSuperAdmin = (() => {
    try {
      const token = localStorage.getItem("adminToken");
      return (
        token && JSON.parse(atob(token.split(".")[1])).role === "super-admin"
      );
    } catch {
      return false;
    }
  })();
  const visibleAdminMenu = isSuperAdmin
    ? adminMenu
    : adminMenu.filter(
        (item) =>
          ![
            "/admin/password",
            "/admin/admins",
            "/admin/telegram-broadcast",
            "/admin/referral-bonus",
            "/admin/registration-bonus",
            "/admin/game-commission",
            "/admin/withdraw-fee",
            "/admin/coupons",
          ].includes(item.to),
      );
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
    fetchAdminDashboard(financialPeriod)
      .then((response) => {
        if (active) setDashboard(response);
      })
      .catch((error) => {
        if (active) setDashboardError(error.message || "Dashboard unavailable");
      });

    return () => {
      active = false;
    };
  }, [financialPeriod, location.pathname]);

  const dashboardStats = dashboard?.stats
    ? [
        {
          label: "Total Users",
          value: dashboard.stats.totalUsers.toLocaleString(),
          meta: `Active: ${dashboard.stats.activeUsers.toLocaleString()}`,
          color: "from-slate-900 to-slate-800",
        },
        {
          label: "Commission",
          value: `${Number(dashboard.stats.commission).toFixed(2)} ETB`,
          meta: "From completed game rounds",
          color: "from-amber-950 to-amber-800",
        },
        {
          label: "Referral",
          value: dashboard.stats.referralCount.toLocaleString(),
          meta: `Earnings: ${Number(dashboard.stats.referralEarnings).toFixed(2)} ETB`,
          color: "from-cyan-950 to-cyan-800",
        },
        {
          label: "User Balance",
          value: `${Number(dashboard.stats.totalUserBalance).toFixed(2)} ETB`,
          meta: "Total wallet liability",
          color: "from-cyan-950 to-cyan-800",
        },
        {
          label: "System Balance",
          value: `${Number(dashboard.stats.systemBalance).toFixed(2)} ETB`,
          meta: "Net platform funds",
          color: "from-amber-950 to-amber-800",
        },
      ]
    : stats;

  const currentRound = dashboard?.currentRound;
  const financialSummary = dashboard?.financialSummary || {
    systemGain: 0,
    systemLoss: 0,
    netBalance: 0,
    withdrawableBalance: 0,
  };
  const financialPeriods = [
    ["1d", "1 Day"],
    ["2d", "2 Days"],
    ["weekly", "Weekly"],
    ["monthly", "Monthly"],
    ["alltime", "All Time"],
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    setMobileMenuOpen(false);
    navigate("/admin/login", { replace: true });
  };

  const handleSystemWithdrawal = async (event) => {
    event.preventDefault();
    setSystemWithdrawalMessage("");
    setSystemWithdrawalError("");
    setSystemWithdrawalLoading(true);
    try {
      await createSystemWithdrawal(systemWithdrawal);
      setSystemWithdrawal({ amount: "", method: "", account: "" });
      setSystemWithdrawalMessage("System withdrawal recorded.");
      const response = await fetchAdminDashboard(financialPeriod);
      setDashboard(response);
    } catch (error) {
      setSystemWithdrawalError(error.message || "System withdrawal failed");
    } finally {
      setSystemWithdrawalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="lg:grid lg:grid-cols-[280px_1fr] gap-6 max-w-[1600px] mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg shadow-slate-950/30 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-lg text-emerald-300">
              B
            </div>
            <div>
              <div className="font-semibold">BingoX Admin</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Management Portal
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open admin menu"
            className="rounded-xl border border-slate-700 p-3 text-slate-200 hover:bg-slate-800"
          >
            <FaBars aria-hidden="true" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            <aside className="relative h-full w-[min(86vw,320px)] overflow-y-auto border-r border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/50">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">BingoX Admin</div>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Management Portal
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close admin menu"
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>
              <nav className="space-y-2">
                {visibleAdminMenu.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
                      isActive(item.to)
                        ? "border border-slate-700 bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-rose-500/30 px-4 py-3 text-left text-sm text-rose-300 hover:bg-rose-500/10"
              >
                <FaSignOutAlt aria-hidden="true" />
                Logout
              </button>
            </aside>
          </div>
        )}

        <aside className="hidden lg:flex flex-col rounded-4xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/40">
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
            {visibleAdminMenu.map((item) => (
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
              <button
                type="button"
                onClick={handleAdminLogout}
                className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/30 px-4 py-3 text-left text-rose-300 hover:bg-rose-500/10"
              >
                <FaSignOutAlt aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <div className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Dashboard
                </div>
                <h1 className="mt-2 text-4xl font-semibold">
                  Welcome back, Super admin!
                </h1>
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
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-7">
                {dashboardError && (
                  <div className="xl:col-span-5 lg:col-span-2 rounded-2xl border border-rose-400/30 bg-rose-950/40 p-4 text-sm text-rose-200">
                    {dashboardError}
                  </div>
                )}
                {dashboardStats.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border border-slate-800 p-3 sm:rounded-2xl sm:p-4 xl:rounded-3xl xl:p-5 bg-linear-to-br ${item.color} bg-slate-950/80 shadow-lg shadow-slate-950/20`}
                  >
                    <div className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-xs sm:normal-case sm:tracking-normal">
                      {item.label}
                    </div>
                    <div className="mt-2 wrap-break-word text-lg font-semibold sm:mt-3 sm:text-2xl xl:mt-4 xl:text-3xl">
                      {item.value}
                    </div>
                    <div className="mt-1 text-[10px] leading-tight text-slate-400 sm:mt-2 sm:text-xs xl:mt-3 xl:text-sm">
                      {item.meta}
                    </div>
                  </div>
                ))}
              </div>

              <section className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
                      Financial summary
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">
                      System gain and loss
                    </h2>
                  </div>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Financial period"
                  >
                    {financialPeriods.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFinancialPeriod(value)}
                        className={`rounded-full border px-3 py-2 text-sm transition ${
                          financialPeriod === value
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : "border-slate-700 text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    [
                      "System Gain",
                      financialSummary.systemGain,
                      "text-emerald-300",
                    ],
                    [
                      "System Loss",
                      financialSummary.systemLoss,
                      "text-rose-300",
                    ],
                    [
                      "Net Balance",
                      financialSummary.netBalance,
                      "text-cyan-300",
                    ],
                    [
                      "Withdrawable Balance",
                      financialSummary.withdrawableBalance,
                      "text-amber-300",
                    ],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <div className="text-sm text-slate-400">{label}</div>
                      <div className={`mt-3 text-2xl font-semibold ${color}`}>
                        {Number(value).toFixed(2)} ETB
                      </div>
                      {label === "Net Balance" && (
                        <div className="mt-1 text-xs text-slate-500">
                          For the selected period
                        </div>
                      )}
                      {label === "Withdrawable Balance" && (
                        <div className="mt-1 text-xs text-slate-500">
                          All-time amount available to withdraw
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {isSuperAdmin && (
                <section className="rounded-4xl border border-rose-500/20 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
                  <div>
                    <div className="text-sm uppercase tracking-[0.25em] text-rose-300/70">
                      Super admin
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Withdraw from system
                    </h2>
                  </div>
                  <form
                    onSubmit={handleSystemWithdrawal}
                    className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto]"
                  >
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Amount (ETB)"
                      value={systemWithdrawal.amount}
                      onChange={(event) =>
                        setSystemWithdrawal({
                          ...systemWithdrawal,
                          amount: event.target.value,
                        })
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-rose-400"
                    />
                    <input
                      required
                      placeholder="Payment method"
                      value={systemWithdrawal.method}
                      onChange={(event) =>
                        setSystemWithdrawal({
                          ...systemWithdrawal,
                          method: event.target.value,
                        })
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-rose-400"
                    />
                    <input
                      required
                      placeholder="Account or phone number"
                      value={systemWithdrawal.account}
                      onChange={(event) =>
                        setSystemWithdrawal({
                          ...systemWithdrawal,
                          account: event.target.value,
                        })
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-rose-400"
                    />
                    <button
                      type="submit"
                      disabled={systemWithdrawalLoading}
                      className="rounded-2xl bg-rose-500 px-5 py-3 font-medium text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {systemWithdrawalLoading ? "Processing..." : "Withdraw"}
                    </button>
                  </form>
                  {(systemWithdrawalMessage || systemWithdrawalError) && (
                    <p
                      className={`mt-3 text-sm ${
                        systemWithdrawalError
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {systemWithdrawalError || systemWithdrawalMessage}
                    </p>
                  )}
                </section>
              )}

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
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

                <aside className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
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
                <section className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
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
                    <div className="h-72 rounded-3xl border border-slate-800 bg-linear-to-b from-slate-950 to-slate-900 p-5 text-slate-500 relative overflow-hidden">
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

                <aside className="space-y-4 rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
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
            <section className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
              <Outlet />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
