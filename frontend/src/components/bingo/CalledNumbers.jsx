import React from "react";

const CalledNumbers = ({ numbers = [], accent = {} }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {numbers.map((n) => (
        <div
          key={n}
          className="w-10 h-10 rounded-md flex items-center justify-center bg-slate-800/40 border border-slate-700 text-slate-100 transition transform duration-200 hover:scale-110"
        >
          {n}
        </div>
      ))}
    </div>
  );
};

export default CalledNumbers;
