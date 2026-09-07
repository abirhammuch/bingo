import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Invite = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const tournamentCode =
    import.meta.env.VITE_TOURNAMENT_INVITE_CODE || "WEEKLY";
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
          title: "Join my bingo tournament",
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
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-cyan-950/20 to-slate-900 px-4 pb-24 pt-6 text-slate-100">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Tournament
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Invite Players
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="rounded-full border border-slate-700 px-3 py-2 text-xl text-slate-400 hover:border-cyan-400 hover:text-white"
            aria-label="Close tournament invite"
          >
            x
          </button>
        </div>

        <section className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-xl shadow-cyan-950/20">
          <div className="mb-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-3xl">
              🏆
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Weekly Bingo</h2>
              <p className="text-sm text-slate-400">
                Bring your friends and compete together.
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Tournament code
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-cyan-300">
              {tournamentCode}
            </p>
          </div>

          <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Invite link
            </p>
            <p className="truncate text-sm text-slate-300">{inviteLink}</p>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={copyInvite}
              className="rounded-xl bg-cyan-500 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              {copied ? "COPIED" : "COPY INVITE LINK"}
            </button>
            <button
              type="button"
              onClick={shareInvite}
              className="rounded-xl border border-slate-700 bg-slate-800 py-3 font-bold text-white transition hover:border-cyan-400 hover:bg-slate-700"
            >
              SHARE TO FRIENDS
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Invite;
