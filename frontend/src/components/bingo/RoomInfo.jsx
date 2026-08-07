import React from "react";

const RoomInfo = ({ room = "Room A", players = 12, accent = {} }) => {
  return (
    <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between shadow-md">
      <div>
        <p className="text-gray-400 text-sm">Room</p>
        <h2 className="text-xl font-bold text-white">{room}</h2>
      </div>

      <div className="text-right">
        <p className="text-gray-400 text-sm">Players</p>
        <h2
          className={`text-xl font-semibold ${
            accent.selectedText || "text-emerald-400"
          }`}
        >
          {players} Players
        </h2>
      </div>
    </div>
  );
};

export default RoomInfo;
