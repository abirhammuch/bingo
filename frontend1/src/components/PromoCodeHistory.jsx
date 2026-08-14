import React, { useMemo, useState } from "react";
import { FiRefreshCcw, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const statusClasses = {
  CLAIMED: "text-emerald-300",
  MISSED: "text-rose-300",
};

const PAGE_SIZE = 5;

const PromoCodeHistory = ({ history, onRefresh }) => {
  const [page, setPage] = useState(1);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  }, [history.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return history.slice(start, start + PAGE_SIZE);
  }, [history, page]);

  const prevPage = () => setPage((current) => Math.max(1, current - 1));
  const nextPage = () => setPage((current) => Math.min(pageCount, current + 1));

  return (
    <div className="rounded-3xl bg-slate-950/90 border border-slate-800 p-6 shadow-xl shadow-slate-950/40">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <FiRefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
              Promo History
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
        >
          <FiRefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {pageItems.map((entry, index) => (
          <div
            key={`${entry.code}-${index}`}
            className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-slate-950/10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="text-base font-semibold text-slate-100">
                {entry.code}
              </div>
              <div className="mt-1 text-sm text-slate-500">{entry.date}</div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm sm:mt-0">
              <div className="text-right text-sm font-semibold text-emerald-300">
                {entry.amount}
              </div>
              <div
                className={`text-xs font-semibold uppercase ${statusClasses[entry.status] || "text-slate-300"}`}
              >
                {entry.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4 text-sm text-slate-400">
        <button
          type="button"
          onClick={prevPage}
          disabled={page === 1}
          className="inline-flex items-center gap-2 text-slate-300 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          <FiChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Page {page} / {pageCount}
        </div>

        <button
          type="button"
          onClick={nextPage}
          disabled={page === pageCount}
          className="inline-flex items-center gap-2 text-slate-300 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          Next
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PromoCodeHistory;
