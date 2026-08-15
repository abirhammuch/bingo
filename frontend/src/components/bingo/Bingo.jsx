import React, { useEffect, useMemo, useState } from "react";
import BingoCell from "./BingoCell";
import CurrentNumber from "./CurrentNumber";
import CalledNumbers from "./CalledNumbers";
import GameStatus from "./GameStatus";
import Countdown from "./Countdown";
import WinnerModal from "./WinnerModal";
import Header from "./Header";
import SelectionPage from "./SelectionPage";
import LivePage from "./LivePage";
import {
  createBingoCard,
  createNumberPool,
  hasBingo,
  markNumberOnCard,
} from "./gameLogic";
import socket from "../../socket/socket";
import { useAuth } from "../../context/AuthContext";

const Bingo = ({ theme }) => {
  const themeMap = {
    green: { accentText: "text-emerald-300", accentBg: "bg-emerald-600/20", accentIcon: "text-emerald-400" },
    yellow: { accentText: "text-amber-300", accentBg: "bg-amber-600/20", accentIcon: "text-amber-400" },
    blue: { accentText: "text-sky-300", accentBg: "bg-sky-600/20", accentIcon: "text-sky-400" },
    red: { accentText: "text-rose-300", accentBg: "bg-rose-600/20", accentIcon: "text-rose-400" },
  };

  const accent = themeMap[theme] || themeMap.green;
  const { user: authUser } = useAuth();

  const [roundStatus, setRoundStatus] = useState("WAITING");
  const [phase, setPhase] = useState("selection");
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [participantCount, setParticipantCount] = useState(0);
  const [selectedNumbersGlobal, setSelectedNumbersGlobal] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [winner, setWinner] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [mySelections, setMySelections] = useState([]);
  const [mySelectedNumber, setMySelectedNumber] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectionCountdown, setSelectionCountdown] = useState(30);
  const [liveCountdown, setLiveCountdown] = useState(null);

  const selectionNumbers = mySelections;
  const canSelectMore = mySelections.length < 2;
  const showSelectionPanel = phase === "selection";

  const syncRoundState = (payload) => {
    if (!payload) return;

    const nextStatus = String(payload.status || "WAITING").toUpperCase();
    const nextPhase = nextStatus === "WAITING" ? "selection" : nextStatus === "PLAYING" ? "live" : "finished";

    setRoundStatus(nextStatus);
    setPhase(nextPhase);
    setRemainingSeconds(
      typeof payload.remainingSeconds === "number" ? payload.remainingSeconds : 30,
    );
    setSelectionCountdown(
      typeof payload.remainingSeconds === "number" ? payload.remainingSeconds : 30,
    );
    setParticipantCount(
      typeof payload.playerCount === "number"
        ? payload.playerCount
        : typeof payload.participants === "number"
          ? payload.participants
          : Array.isArray(payload.players)
            ? payload.players.length
            : 0,
    );
    setSelectedNumbersGlobal(Array.isArray(payload.selectedNumbers) ? payload.selectedNumbers : []);
    setCalledNumbers(Array.isArray(payload.calledNumbers) ? payload.calledNumbers : []);
    setCurrentNumber(payload.currentNumber ?? null);
    setWinner(payload.winner ?? null);
    if (payload.gameId) setRoundId(payload.gameId);

    if (nextStatus === "PLAYING") {
      setLiveCountdown(0);
    } else if (nextStatus === "WAITING") {
      setLiveCountdown(null);
    } else {
      setLiveCountdown(null);
    }
  };

  useEffect(() => {
    const handleRoundState = (payload) => {
      syncRoundState(payload);
    };

    const handleWinner = (payload) => {
      if (!payload) return;
      const winnerPayload = payload.winner || payload.winners?.[0] || payload;
      setWinner(winnerPayload);
      setRoundStatus("FINISHED");
      setPhase("finished");
    };

    if (!socket.connected) socket.connect();

    socket.on("bingo:roundState", handleRoundState);
    socket.on("bingo:winner", handleWinner);
    socket.on("bingo:roundFinished", handleWinner);
    socket.on("bingo:nextRound", (payload) => {
      syncRoundState({
        ...payload,
        status: "WAITING",
        remainingSeconds: payload.remainingSeconds ?? 30,
      });
      setMySelections([]);
      setMySelectedNumber(null);
      setCards([]);
      setCalledNumbers([]);
      setCurrentNumber(null);
      setSelectedNumbersGlobal([]);
      setWinner(null);
    });

    return () => {
      socket.off("bingo:roundState", handleRoundState);
      socket.off("bingo:winner", handleWinner);
      socket.off("bingo:roundFinished", handleWinner);
    };
  }, []);

  useEffect(() => {
    if (!winner) return;
    const timeoutId = setTimeout(() => {
      setWinner(null);
      setMySelectedNumber(null);
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, [winner]);

  const toggleLuckyNumber = (number) => {
    if (roundStatus !== "WAITING") return;
    if (mySelections.includes(number)) return;
    if (selectedNumbersGlobal.includes(number) && !mySelections.includes(number)) return;
    if (!authUser?.telegramId || !roundId) return;

    if (!socket.connected) socket.connect();

    socket.emit("joinRoom", {
      gameId: roundId,
      telegramId: authUser.telegramId,
      betAmount: 1,
      luckyNumber: number,
    });

    setMySelections((prev) => [...prev, number]);
    setMySelectedNumber(number);
  };

  const handleJoin = () => {
    if (!authUser?.telegramId) return;
    if (roundStatus !== "WAITING") return;

    if (!roundId) {
      socket.emit("createRoom", { roomId: "Main Room" });
      return;
    }

    socket.emit("joinRoom", {
      gameId: roundId,
      telegramId: authUser.telegramId,
      betAmount: 1,
      luckyNumber: null,
    });
  };

  const joinButtonDisabled = roundStatus !== "WAITING" || mySelections.length >= 2;
  const joinButtonLabel = roundStatus === "WAITING" ? "Tap to select" : "Waiting...";

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 to-slate-900 flex flex-col">
      {roundStatus === "WAITING" ? (
        <Header
          gameType="selection"
          timeLeft={Math.max(0, remainingSeconds)}
          stake="10"
          balance="0.00"
        />
      ) : (
        <Header
          gameType="live"
          players={participantCount}
          called={calledNumbers.length}
          derash={1250}
          round="5/TECI"
          stake="10"
        />
      )}

      <div className="flex-1 overflow-auto p-4">
        {phase === "selection" && (
          <SelectionPage
            selectionCountdown={selectionCountdown}
            calledNumbers={calledNumbers}
            selectedNumbersGlobal={selectedNumbersGlobal}
            mySelections={mySelections}
            canSelectMore={canSelectMore}
            showSelectionPanel={showSelectionPanel}
            toggleLuckyNumber={toggleLuckyNumber}
            joinButtonDisabled={joinButtonDisabled}
            handleJoin={handleJoin}
          />
        )}

        {phase === "live" && (
          <LivePage
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
            cards={cards}
            selectionNumbers={selectionNumbers}
            accent={accent}
          />
        )}
      </div>

      <WinnerModal
        open={Boolean(winner)}
        winner={winner || "Unknown Player"}
        luckyNumber={mySelectedNumber}
        isCurrentUserWinner={
          winner === "You" ||
          (typeof winner === "object" &&
            winner.telegramId === authUser?.telegramId)
        }
        onClose={() => setWinner(null)}
        accent={accent}
      />
    </div>
  );
};

export default Bingo;
