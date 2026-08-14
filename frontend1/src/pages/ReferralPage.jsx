import React from "react";
import Responsible from "../components/Responsible";

const ReferralPage = () => {
  return (
    <>
      <div className="space-y-8 mb-8">
        <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-3">
                Invite & earn
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100">
                Refer friends and collect rewards.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                Share your referral link to grow the community. Earn bonus
                credits when your friends sign up and play.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
              <div className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
                Your referral code
              </div>
              <div className="flex items-center justify-between gap-4 rounded-3xl bg-slate-900/90 px-5 py-4 border border-slate-800">
                <span className="text-lg font-semibold tracking-[0.2em] text-slate-100">
                  ZARE-REF-2026
                </span>
                <button className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/15 transition">
                  Copy
                </button>
              </div>
              <button className="mt-5 w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110">
                Share referral link
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Referral rewards
            </div>
            <div className="text-4xl font-semibold text-slate-100">50 ETB</div>
            <p className="mt-2 text-sm text-slate-500">
              Earned from successful referrals
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Invited friends
            </div>
            <div className="text-4xl font-semibold text-slate-100">8</div>
            <p className="mt-2 text-sm text-slate-500">
              Friends who joined from your link
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/20">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
              Pending rewards
            </div>
            <div className="text-4xl font-semibold text-slate-100">12 ETB</div>
            <p className="mt-2 text-sm text-slate-500">
              Awaiting approval from referrals
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-3">
                How it works
              </div>
              <h2 className="text-2xl font-semibold text-slate-100">
                Grow your rewards in 3 easy steps.
              </h2>
            </div>
            <button className="self-start rounded-3xl bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/15 transition xl:self-center">
              View referral FAQ
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5">
              <div className="text-sm font-semibold text-slate-100">01</div>
              <p className="mt-3 text-sm text-slate-400">
                Share your referral link with friends and family.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5">
              <div className="text-sm font-semibold text-slate-100">02</div>
              <p className="mt-3 text-sm text-slate-400">
                They sign up and make their first deposit.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5">
              <div className="text-sm font-semibold text-slate-100">03</div>
              <p className="mt-3 text-sm text-slate-400">
                Collect your bonus instantly.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Responsible />
    </>
  );
};

export default ReferralPage;
