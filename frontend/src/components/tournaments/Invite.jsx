import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchTournament, getUserProfile } from "../../services/userService";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCheck,
  FaCopy,
  FaCrown,
  FaGamepad,
  FaGift,
  FaLink,
  FaMedal,
  FaShareAlt,
  FaTimes,
  FaTrophy,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";

const getSteps = (registrationPoints, depositPoints) => [
  [FaLink, "Friend clicks your invite link", "0 points"],
  [FaUserPlus, "Friend registers on Telegram", `+${registrationPoints} points`],
  [FaUsers, "Friend makes a deposit", `+${depositPoints} points`],
  [FaGamepad, "Points update the leaderboard", "Highest scores win"],
];

const getTimeLeft = (endDate) => {
  const difference = Math.max(0, new Date(endDate).getTime() - Date.now());
  const totalSeconds = Math.floor(difference / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    ended: difference === 0,
  };
};

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const Invite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState("");
  const [referralUser, setReferralUser] = useState(user);
  const [tournament, setTournament] = useState(null);
  const [tournamentError, setTournamentError] = useState("");
  const [timeLeft, setTimeLeft] = useState(() =>
    getTimeLeft("2026-09-30T23:59:59.000Z"),
  );

  useEffect(() => {
    if (!user?.telegramId) return undefined;

    let active = true;
    getUserProfile(user.telegramId)
      .then((response) => {
        if (active && response?.user) setReferralUser(response.user);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user?.telegramId]);

  useEffect(() => {
    if (!user?.telegramId) return undefined;
    let active = true;
    fetchTournament()
      .then((response) => {
        if (!active) return;
        setTournament(response);
        setTimeLeft(getTimeLeft(response.settings.endDate));
      })
      .catch((error) => active && setTournamentError(error.message));
    return () => {
      active = false;
    };
  }, [user?.telegramId]);

  const tournamentStart = new Date(
    tournament?.settings?.startDate || "2026-09-01T00:00:00.000Z",
  );
  const tournamentEnd = new Date(
    tournament?.settings?.endDate || "2026-09-30T23:59:59.000Z",
  );
  const leaderboard = tournament?.leaderboard || [];
  const currentPlayer = tournament?.currentPlayer;
  const prizes = tournament?.settings?.prizes || [];
  const registrationPoints = Number(
    tournament?.settings?.registrationPoints ??
      tournament?.settings?.pointsPerReferral ??
      20,
  );
  const depositPoints = Number(tournament?.settings?.depositPoints || 50);
  const steps = getSteps(registrationPoints, depositPoints);

  const tournamentCode =
    referralUser?.referralCode ||
    `REF${String(referralUser?.telegramId || "PLAYER")
      .slice(-8)
      .toUpperCase()}`;
  const telegramBotUsername =
    import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "casinabingobot";
  const inviteLink = `https://t.me/${telegramBotUsername}?start=ref_${encodeURIComponent(tournamentCode)}`;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(tournamentEnd));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [tournamentEnd.getTime()]);

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  };

  const copyCode = () => copyValue(tournamentCode, "code");
  const copyInvite = () => copyValue(inviteLink, "link");

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Marshal Bingo tournament",
          text: `Join my tournament with code ${tournamentCode}.`,
          url: inviteLink,
        });
        return;
      } catch {
        return;
      }
    }
    await copyInvite();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030b25] px-3 pb-10 pt-4 text-slate-100 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-center justify-between px-1 sm:mb-5">
          <div className="text-xs text-slate-400">Invite Tournament</div>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-700 text-slate-400 transition hover:border-cyan-400 hover:text-white"
            aria-label="Close tournament invite"
          >
            <FaTimes />
          </button>
        </header>

        <section className="relative mb-4 overflow-hidden rounded-2xl border border-violet-600/70 bg-[radial-gradient(circle_at_80%_10%,#42158c,transparent_35%),linear-gradient(110deg,#160967,#26106e_52%,#16084f)] px-5 py-6 shadow-[0_0_35px_rgba(88,28,135,0.35)] sm:mb-5 sm:px-10 sm:py-8">
          <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-fuchsia-500/15 blur-2xl" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.1fr_1fr]">
            <div className="hidden min-h-44 items-center justify-center sm:flex">
              <div className="relative grid h-40 w-44 place-items-center rounded-[45%] border-x-8 border-amber-300/80 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-800 text-7xl shadow-[0_12px_35px_rgba(251,191,36,0.4)]">
                <FaTrophy className="text-amber-100 drop-shadow-[0_4px_2px_rgba(120,53,15,0.8)]" />
                <div className="absolute -bottom-5 left-1/2 h-8 w-52 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-800 via-blue-500 to-blue-800 text-center text-sm font-black italic text-white shadow-lg">
                  INVITE &amp; WIN
                </div>
              </div>
            </div>
            <div>
              <span className="inline-flex rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-600 px-5 py-1 text-sm font-extrabold tracking-wide text-white">
                1 MONTH
              </span>
              <h1 className="mt-2 text-3xl font-black uppercase leading-none text-amber-300 sm:text-5xl">
                Invite Tournament
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-blue-100 sm:text-base">
                Bring your friends and earn points all month long. The top
                players will win amazing rewards!
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-cyan-500/60 bg-[#031840]/80 px-3 py-2 text-xs text-slate-300">
                <FaCalendarAlt className="text-cyan-300" />
                <span>
                  {formatDate(tournamentStart)} - {formatDate(tournamentEnd)}
                </span>
                <span className="ml-auto text-cyan-300">
                  {timeLeft.ended ? "Tournament ended" : "Tournament ends in"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-cyan-500/60 bg-[#031840]/90 p-3 text-center">
                {["days", "hours", "minutes", "seconds"].map((unit) => (
                  <div key={unit}>
                    <p className="text-xl font-black text-amber-300 sm:text-2xl">
                      {String(timeLeft[unit]).padStart(2, "0")}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">
                      {unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <main className="space-y-4">
            <section className="rounded-xl border border-blue-800/80 bg-[#06143a]/90 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-violet-600/40 text-2xl text-violet-300">
                  <FaUsers />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    Invite Friends &amp; Win
                  </h2>
                  <p className="text-xs text-blue-200">
                    Share your unique invite link with friends.
                    <br />
                    When they register and play, you both earn points!
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-blue-700/80 bg-[#071b4a] p-2">
                <div className="flex items-center gap-2 rounded-lg bg-[#0b2556] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400">Your Invite Code</p>
                    <p className="truncate font-bold tracking-wide text-white">
                      {tournamentCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="text-slate-300 hover:text-white"
                    aria-label="Copy invite code"
                  >
                    <FaCopy />
                  </button>
                  <button
                    type="button"
                    onClick={copyInvite}
                    className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white"
                  >
                    {copied === "code" ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={shareInvite}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-violet-900/40"
                >
                  <FaShareAlt /> Invite Friends
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-blue-800/80 bg-[#06143a]/90 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold">
                  <FaChartIcon /> Your Stats
                </h2>
                <button type="button" className="text-xs text-cyan-300">
                  View Details <FaArrowRight className="ml-1 inline" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  [<FaUsers />, "Invited", currentPlayer?.invited ?? 0],
                  [<FaCheck />, "Deposits", currentPlayer?.deposits ?? 0],
                  [<FaTrophy />, "Points", currentPlayer?.points ?? 0],
                  [
                    <FaCrown />,
                    "Your Rank",
                    currentPlayer ? `#${currentPlayer.rank}` : "-",
                  ],
                ].map(([icon, label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-blue-900 bg-[#071b4a] p-3 text-center"
                  >
                    <div className="mb-1 text-violet-400">{icon}</div>
                    <p className="text-[10px] text-slate-400">{label}</p>
                    <p className="text-xl font-bold text-cyan-200">
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-blue-800/80 bg-[#06143a]/90 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold">
                  <FaTrophy className="text-amber-300" /> Leaderboard
                </h2>
                <button type="button" className="text-xs text-cyan-300">
                  View Full Ranking <FaArrowRight className="ml-1 inline" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-xs">
                  <thead className="bg-[#0a2353] text-[10px] text-slate-400">
                    <tr>
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Player</th>
                      <th className="px-2 py-2 text-right">Invited</th>
                      <th className="px-2 py-2 text-right">Deposits</th>
                      <th className="px-2 py-2 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.telegramId}
                        className={`border-b border-blue-950 ${entry.telegramId === user?.telegramId ? "bg-indigo-700/60" : entry.rank <= 3 ? "bg-amber-500/15" : ""}`}
                      >
                        <td className="px-2 py-2 font-bold text-slate-300">
                          {entry.rank === 1 ? (
                            <FaCrown className="text-amber-300" />
                          ) : entry.rank === 2 ? (
                            <FaMedal className="text-slate-300" />
                          ) : entry.rank === 3 ? (
                            <FaMedal className="text-orange-400" />
                          ) : (
                            entry.rank
                          )}
                        </td>
                        <td className="px-2 py-2 font-medium">{entry.name}</td>
                        <td className="px-2 py-2 text-right text-amber-300">
                          {entry.invited}
                        </td>
                        <td className="px-2 py-2 text-right text-cyan-300">
                          {entry.deposits}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold">
                          {entry.points.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          <aside className="space-y-4">
            <section className="rounded-xl border border-blue-800/80 bg-[#06143a]/90 p-4 sm:p-5">
              <h2 className="mb-4 font-bold">How It Works</h2>
              <div className="space-y-4">
                {steps.map(([Icon, title, points], index) => (
                  <div key={title} className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                      <Icon />
                    </div>
                    <span className="font-bold text-cyan-300">{index + 1}</span>
                    <div className="text-xs">
                      <p className="text-slate-200">{title}</p>
                      <p className="text-emerald-300">{points}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-blue-800/80 bg-[#06143a]/90 p-4 sm:p-5">
              <h2 className="mb-4 flex items-center gap-2 font-bold">
                <FaGift className="text-fuchsia-400" /> Tournament Prizes
              </h2>
              <div className="space-y-2">
                {prizes.map((prize) => (
                  <Prize
                    key={prize.place}
                    icon={prize.place === 1 ? <FaCrown /> : <FaMedal />}
                    place={`${prize.place}${prize.place === 1 ? "st" : prize.place === 2 ? "nd" : prize.place === 3 ? "rd" : "th"} Place`}
                    amount={`${Number(prize.amount).toLocaleString()} ETB`}
                    color={
                      prize.place === 1
                        ? "amber"
                        : prize.place === 2
                          ? "blue"
                          : "orange"
                    }
                  />
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-blue-900 pt-3 text-xs text-slate-300">
                <p>
                  <FaCheck className="mr-2 inline text-emerald-400" />
                  Top 10 players get special badges
                </p>
                <p>
                  <FaCheck className="mr-2 inline text-emerald-400" />
                  Exclusive in-game items
                </p>
                <p>
                  <FaCheck className="mr-2 inline text-emerald-400" />
                  Bragging rights for the next month!
                </p>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-4 flex flex-col mb-5 items-center justify-between gap-4 rounded-xl border border-violet-700/70 bg-gradient-to-r from-[#111266] to-[#1f0d63] px-5 py-4 sm:flex-row sm:px-8">
          <div className="flex items-center gap-3">
            <FaShareAlt className="text-3xl text-cyan-300" />
            <div>
              <h2 className="font-bold">Invite Now and Be the Champion!</h2>
              <p className="text-xs text-slate-400">
                More friends = More points = Bigger rewards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={shareInvite}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold"
          >
            <FaShareAlt /> Share on Telegram
          </button>
        </section>
      </div>
    </div>
  );
};

const FaChartIcon = () => <span className="text-violet-400">◉</span>;

const Prize = ({ icon, place, amount, color }) => (
  <div
    className={`flex items-center gap-3 rounded-xl border p-3 ${color === "amber" ? "border-amber-500/50 bg-amber-500/20" : color === "blue" ? "border-blue-400/40 bg-blue-500/20" : "border-orange-400/40 bg-orange-500/20"}`}
  >
    <span
      className={`text-3xl ${color === "amber" ? "text-amber-300" : color === "blue" ? "text-blue-200" : "text-orange-300"}`}
    >
      {icon}
    </span>
    <div>
      <p className="text-xs text-slate-300">{place}</p>
      <p className="font-bold text-amber-300">{amount}</p>
    </div>
  </div>
);

export default Invite;
