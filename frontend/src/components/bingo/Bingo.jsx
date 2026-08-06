import React from "react";
import BingoCard from "./BingoCard";
import BingoCell from "./BingoCell";
import CurrentNumber from "./CurrentNumber";
import CalledNumbers from "./CalledNumbers";
import GameStatus from "./GameStatus";
import Countdown from "./Countdown";
import ClaimBingoButton from "./ClaimBingoButton";
import WinnerModal from "./WinnerModal";
import RoomInfo from "./RoomInfo";

const Bingo = ({ theme }) => {
  const themeMap = {
    green: {
      selectedText: "text-emerald-300",
      selectedBg: "bg-emerald-600/20",
    },
    yellow: { selectedText: "text-amber-300", selectedBg: "bg-amber-600/20" },
    blue: { selectedText: "text-sky-300", selectedBg: "bg-sky-600/20" },
    red: { selectedText: "text-rose-300", selectedBg: "bg-rose-600/20" },
  };
  const accent = themeMap[theme] || themeMap.green;

  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CurrentNumber number={8} accent={accent} />
            <GameStatus status="running" accent={accent} />
          </div>
          <div className="flex items-center gap-3">
            <Countdown seconds={30} />
            <ClaimBingoButton
              accent={accent}
              onClaim={() => alert("Claimed")}
            />
          </div>
        </div>

        <BingoCard title="Lobby Card" accent={accent}>
          {numbers.slice(0, 25).map((n) => (
            <BingoCell key={n} number={n} marked={n === 8} accent={accent} />
          ))}
        </BingoCard>
        <CalledNumbers numbers={[3, 8, 12, 19]} accent={accent} />
      </div>

      <aside className="space-y-4">
        <RoomInfo room="Main Room" players={24} accent={accent} />
        <WinnerModal open={false} winner={null} accent={accent} />
      </aside>
    </div>
  );
};

export default Bingo;
