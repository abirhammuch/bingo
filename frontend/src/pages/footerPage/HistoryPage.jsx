import React, { useState } from "react";
import Footer from "../../components/footer/Footer";

const HistoryPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 1;
  const historyData = []; // Empty for now, will be populated from API

  return (
    <div className="pb-16 min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header Section */}
      <div className="bg-slate-900/60 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <span className="text-lg">⏰</span>
            </div>
            <h1 className="text-2xl font-bold text-white">History</h1>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            {historyData.length} Rounds
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
        {historyData.length === 0 ? (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-slate-800/50 border-2 border-slate-700 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">⏰</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              No history yet
            </h2>
            <p className="text-slate-400 text-sm">
              Your gaming activity will appear here
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* History items will be rendered here */}
            {historyData.map((item, index) => (
              <div
                key={index}
                className="bg-slate-800/40 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-100 font-semibold">{item.game}</p>
                    <p className="text-slate-400 text-sm">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${item.result === "win" ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {item.amount}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="border-t border-slate-700 bg-slate-900/60 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ◀
          </button>
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
};

export default HistoryPage;
