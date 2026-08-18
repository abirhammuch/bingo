import React, { useEffect, useRef, useState } from "react";

import Header from "./Header";
import SelectionPage from "./SelectionPage";
import LivePage from "./LivePage";
import WinnerModal from "./WinnerModal";

import socket from "../../socket/socket";

import { useAuth } from "../../context/AuthContext";

const Bingo = ({ theme }) => {
  const themeMap = {
    green: {
      accentText: "text-emerald-300",
      accentBg: "bg-emerald-600/20",
      accentIcon: "text-emerald-400",
      title: "text-emerald-300",
    },

    yellow: {
      accentText: "text-amber-300",
      accentBg: "bg-amber-600/20",
      accentIcon: "text-amber-400",
      title: "text-amber-300",
    },

    blue: {
      accentText: "text-sky-300",
      accentBg: "bg-sky-600/20",
      accentIcon: "text-sky-400",
      title: "text-sky-300",
    },

    red: {
      accentText: "text-rose-300",
      accentBg: "bg-rose-600/20",
      accentIcon: "text-rose-400",
      title: "text-rose-300",
    },
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

  const winnerRef = useRef(null);

  const roundStatusRef = useRef("WAITING");

  /* ======================================================
     SYNC STATE
  ====================================================== */

  const syncRoundState = (payload) => {
    if (!payload) {
      return;
    }

    const status = String(payload.status || "WAITING").toUpperCase();

    setRoundStatus(status);

    if (status === "WAITING") {
      setPhase("selection");
    } else if (status === "ACTIVE" || status === "PLAYING") {
      setPhase("live");
    } else {
      setPhase("finished");
    }

    const seconds =
      typeof payload.remainingSeconds === "number"
        ? payload.remainingSeconds
        : 30;

    setRemainingSeconds(Math.max(0, seconds));

    setSelectionCountdown(Math.max(0, seconds));

    const players =
      payload.playerCount ??
      payload.participantCount ??
      payload.players?.length ??
      payload.participants ??
      0;

    setParticipantCount(Number(players) || 0);

    setSelectedNumbersGlobal(
      Array.isArray(payload.selectedNumbers) ? payload.selectedNumbers : [],
    );

    setCalledNumbers(
      Array.isArray(payload.calledNumbers) ? payload.calledNumbers : [],
    );

    setCurrentNumber(payload.currentNumber ?? null);

    if (payload.gameId) {
      setRoundId(payload.gameId);
    }

    if (payload.winner) {
      setWinner(payload.winner);
    }
  };

  /* ======================================================
     REFS
  ====================================================== */

  useEffect(() => {
    roundStatusRef.current = roundStatus;
  }, [roundStatus]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  /* ======================================================
     SOCKET
  ====================================================== */

  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Bingo socket connected");
    };

    const handleRoundState = (payload) => {
      console.log("🎮 Round state:", payload);

      syncRoundState(payload);
    };

    const handleWinner = (payload) => {
      if (!payload) {
        return;
      }

      const winnerData = payload.winner || payload.winners?.[0] || payload;

      winnerRef.current = winnerData;

      setWinner(winnerData);

      setRoundStatus("COMPLETED");

      setPhase("finished");
    };

    const handleNextRound = (payload) => {
      console.log("🔄 Next Bingo round", payload);

      winnerRef.current = null;

      setWinner(null);

      setMySelections([]);

      setMySelectedNumber(null);

      setCards([]);

      setCalledNumbers([]);

      setCurrentNumber(null);

      setSelectedNumbersGlobal([]);

      syncRoundState({
        ...payload,

        status: "WAITING",

        remainingSeconds: payload?.remainingSeconds ?? 30,
      });
    };

    socket.on("connect", handleConnect);

    socket.on("bingo:roundState", handleRoundState);

    socket.on("bingo:winner", handleWinner);

    socket.on("bingo:roundFinished", handleWinner);

    socket.on("bingo:nextRound", handleNextRound);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);

      socket.off("bingo:roundState", handleRoundState);

      socket.off("bingo:winner", handleWinner);

      socket.off("bingo:roundFinished", handleWinner);

      socket.off("bingo:nextRound", handleNextRound);
    };
  }, []);

  /* ======================================================
     SELECT LUCKY NUMBER
  ====================================================== */

  const toggleLuckyNumber = (number) => {
    if (roundStatus !== "WAITING") {
      return;
    }

    if (mySelections.includes(number)) {
      return;
    }

    if (selectedNumbersGlobal.includes(number)) {
      return;
    }

    if (!authUser?.telegramId) {
      console.warn("No authenticated user");

      return;
    }

    if (!roundId) {
      console.warn("No game ID");

      return;
    }

    if (mySelections.length >= 2) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinRoom", {
      gameId: roundId,

      telegramId: authUser.telegramId,

      betAmount: 1,

      luckyNumber: number,
    });

    setMySelections((previous) => [...previous, number]);

    setMySelectedNumber(number);
  };

  /* ======================================================
     JOIN
  ====================================================== */

  const handleJoin = () => {
    if (!authUser?.telegramId) {
      console.warn("User is not authenticated");

      return;
    }

    if (roundStatus !== "WAITING") {
      return;
    }

    if (!roundId) {
      socket.emit("createRoom", {
        roomId: "Main Room",
      });

      return;
    }

    socket.emit("joinRoom", {
      gameId: roundId,

      telegramId: authUser.telegramId,

      betAmount: 1,

      luckyNumber: null,
    });
  };

  /* ======================================================
     WINNER CLEANUP
  ====================================================== */

  useEffect(() => {
    if (!winner) {
      return;
    }

    const timeout = setTimeout(() => {
      setWinner(null);

      winnerRef.current = null;
    }, 8000);

    return () => {
      clearTimeout(timeout);
    };
  }, [winner]);

  /* ======================================================
     VALUES
  ====================================================== */

  const canSelectMore = mySelections.length < 2;

  const joinButtonDisabled =
    roundStatus !== "WAITING" || mySelections.length >= 2;

  const selectionNumbers = mySelections;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col">
      {/* HEADER */}

      {roundStatus === "WAITING" ? (
        <Header
          gameType="selection"
          timeLeft={Math.max(0, remainingSeconds)}
          stake={10}
          balance={authUser?.balance ?? 0}
        />
      ) : (
        <Header
          gameType="live"
          players={participantCount}
          called={calledNumbers.length}
          derash={1250}
          round="LIVE"
          stake={10}
        />
      )}

      {/* CONTENT */}

      <main className="flex-1 overflow-auto p-4">
        {phase === "selection" && (
          <SelectionPage
            selectionCountdown={selectionCountdown}
            calledNumbers={calledNumbers}
            selectedNumbersGlobal={selectedNumbersGlobal}
            mySelections={mySelections}
            canSelectMore={canSelectMore}
            showSelectionPanel={true}
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

        {phase === "finished" && (
          <div className="min-h-[300px] flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>

              <h2 className="text-2xl font-bold">Round Finished</h2>

              <p className="text-slate-400 mt-2">Preparing the next round...</p>

              <p className="text-slate-500 text-sm mt-2">
                Numbers called: {calledNumbers.length}
                /75
              </p>
            </div>
          </div>
        )}
      </main>

      {/* WINNER */}

      <WinnerModal
        open={Boolean(winner)}
        winner={winner || "Unknown Player"}
        luckyNumber={mySelectedNumber}
        isCurrentUserWinner={
          winner === "You" ||
          (typeof winner === "object" &&
            winner?.telegramId === authUser?.telegramId)
        }
        onClose={() => setWinner(null)}
        accent={accent}
      />
    </div>
  );
};

export default Bingo;
