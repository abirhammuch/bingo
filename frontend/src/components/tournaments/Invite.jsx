import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const leaderboard = [
  ["PlayerOne", "48", "1,250", "gold"],
  ["PlayerTwo", "36", "980", "silver"],
  ["PlayerThree", "28", "850", "bronze"],
  ["PlayerFour", "24", "720", ""],
  ["PlayerFive", "20", "650", ""],
  ["PlayerSix", "18", "590", ""],
  ["You", "24", "180", "you"],
  ["PlayerEight", "12", "150", ""],
  ["PlayerNine", "10", "120", ""],
  ["PlayerTen", "8", "90", ""],
];

const steps = [
  [FaLink, "Friend clicks your invite link", "0 points"],
  [FaUserPlus, "Friend registers on Telegram", "+5 points"],
  [FaUsers, "Friend completes profile", "+5 points"],
  [FaGamepad, "Friend plays first game", "+10 points"],
];

const Invite = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const tournamentCode =
    import.meta.env.VITE_TOURNAMENT_INVITE_CODE || "MARSHAL-AB12";
  const inviteLink = `${window.location.origin}/tournament/invite?code=${encodeURIComponent(tournamentCode)}`;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <div className="text-center leading-none">
              <FaCrown className="mx-auto text-lg text-amber-300" />
              <span className="block text-lg font-black tracking-tight text-amber-300">
                MARSHAL
              </span>
              <span className="text-[8px] font-bold tracking-[0.35em] text-amber-400">
                BINGO
              </span>
            </div>
            <div className="hidden h-8 w-px bg-slate-700 sm:block" />
            <div className="hidden text-xs text-slate-400 sm:block">
              Invite Tournament
            </div>
          </div>
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
                Bring your friends to Marshal Bingo and earn points all month
                long! The top players will win amazing rewards!
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-500/60 bg-[#031840]/80 px-3 py-2 text-xs text-slate-300">
                <FaCalendarAlt className="text-cyan-300" />
                <span>Sep 1, 2025 - Sep 30, 2025</span>
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
                    onClick={copyInvite}
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
                    {copied ? "Copied" : "Copy"}
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
                {[<FaUsers />, <FaCheck />, <FaTrophy />, <FaCrown />].map(
                  (icon, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-blue-900 bg-[#071b4a] p-3 text-center"
                    >
                      <div className="mb-1 text-violet-400">{icon}</div>
                      <p className="text-[10px] text-slate-400">
                        {
                          ["Invited", "Registered", "Points", "Your Rank"][
                            index
                          ]
                        }
                      </p>
                      <p className="text-xl font-bold text-cyan-200">
                        {["24", "18", "180", "#7"][index]}
                      </p>
                    </div>
                  ),
                )}
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
                      <th className="px-2 py-2 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(
                      ([name, invited, points, medal], index) => (
                        <tr
                          key={name}
                          className={`border-b border-blue-950 ${medal === "you" ? "bg-indigo-700/60" : medal ? "bg-amber-500/15" : ""}`}
                        >
                          <td className="px-2 py-2 font-bold text-slate-300">
                            {medal === "gold" ? (
                              <FaCrown className="text-amber-300" />
                            ) : medal === "silver" ? (
                              <FaMedal className="text-slate-300" />
                            ) : medal === "bronze" ? (
                              <FaMedal className="text-orange-400" />
                            ) : (
                              index + 1
                            )}
                          </td>
                          <td className="px-2 py-2 font-medium">{name}</td>
                          <td className="px-2 py-2 text-right text-amber-300">
                            {invited}
                          </td>
                          <td className="px-2 py-2 text-right font-semibold">
                            {points}
                          </td>
                        </tr>
                      ),
                    )}
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
                <Prize
                  icon={<FaCrown />}
                  place="1st Place"
                  amount="10,000 ETB"
                  color="amber"
                />
                <Prize
                  icon={<FaMedal />}
                  place="2nd Place"
                  amount="5,000 ETB"
                  color="blue"
                />
                <Prize
                  icon={<FaMedal />}
                  place="3rd Place"
                  amount="2,500 ETB"
                  color="orange"
                />
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

        <section className="mt-4 flex flex-col items-center justify-between gap-4 rounded-xl border border-violet-700/70 bg-gradient-to-r from-[#111266] to-[#1f0d63] px-5 py-4 sm:flex-row sm:px-8">
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
