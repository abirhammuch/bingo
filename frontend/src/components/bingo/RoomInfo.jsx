import React from "react";

const RoomInfo = ({ room = "Room A", players = 12, accent = {} }) => {
  return (
    <div className="p-3 rounded-md bg-slate-900/40 border border-slate-700 transition transform duration-200 hover:scale-105 hover:-translate-y-1">
      <div className="text-sm text-slate-300">{room}</div>
      <div
        className={`font-semibold ${accent.selectedText || "text-emerald-300"}`}
      >
        {players} Players
      </div>
    </div>
  );
};

export default RoomInfo;
