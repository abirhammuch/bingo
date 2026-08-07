import React from "react";

const CalledNumbers = ({ numbers = [], accent = {} }) => {
  return (
    <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
      <h2
        className={`text-lg font-semibold mb-4 ${accent.title || "text-white"}`}
      >
        Called Numbers
      </h2>

      {numbers.length === 0 ? (
        <div className="text-slate-400 text-center py-6">
          No numbers have been called yet.
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {numbers.map((number, index) => (
            <div
              key={`${number}-${index}`}
              className="aspect-square rounded-lg flex items-center justify-center bg-emerald-600 text-white font-bold border border-emerald-400 transition-all duration-200 hover:scale-105"
            >
              {number}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalledNumbers;
