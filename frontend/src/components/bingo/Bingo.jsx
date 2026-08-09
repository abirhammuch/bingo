import React, { useEffect, useMemo, useState } from "react";
import BingoCell from "./BingoCell";
import CurrentNumber from "./CurrentNumber";
import CalledNumbers from "./CalledNumbers";
import GameStatus from "./GameStatus";
import Countdown from "./Countdown";
import ClaimBingoButton from "./ClaimBingoButton";
import WinnerModal from "./WinnerModal";
import RoomInfo from "./RoomInfo";
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
    green: {
      accentText: "text-emerald-300",
      accentBg: "bg-emerald-600/20",
      accentIcon: "text-emerald-400",
    },
    yellow: {
      accentText: "text-amber-300",
      accentBg: "bg-amber-600/20",
      accentIcon: "text-amber-400",
    },
    blue: {
      accentText: "text-sky-300",
      accentBg: "bg-sky-600/20",
      accentIcon: "text-sky-400",
    },
    red: {
      accentText: "text-rose-300",
      accentBg: "bg-rose-600/20",
      accentIcon: "text-rose-400",
    },
  };

  const accent = themeMap[theme] || themeMap.green;
  const [joined, setJoined] = useState(false);
  const [selectionNumbers, setSelectionNumbers] = useState([]);
  const [selectionTimeLeft, setSelectionTimeLeft] = useState(20);
  const [phase, setPhase] = useState("waiting");
  const [cards, setCards] = useState([]);
  const [drawTimeLeft, setDrawTimeLeft] = useState(7);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [remainingBalls, setRemainingBalls] = useState(75);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [numberPool, setNumberPool] = useState(() => createNumberPool());
  const [winner, setWinner] = useState(null);
  const [winningLuckyNumber, setWinningLuckyNumber] = useState(null);
  const [livePlayers] = useState(128);
  const [prizePool] = useState(1250);
  const { user: authUser } = useAuth();
  const [gameId, setGameId] = useState(null);
  const [participants, setParticipants] = useState(0);
  const [selectedNumbersGlobal, setSelectedNumbersGlobal] = useState([]);
  const [mySelectedNumber, setMySelectedNumber] = useState(null);
  const [countdownRemaining, setCountdownRemaining] = useState(null);

  const selectedNumbersLabel = useMemo(
    () => selectionNumbers.join(", "),
    [selectionNumbers],
  );

  const toggleLuckyNumber = (number) => {
    if (phase !== "selection") return;
    // Prevent multiple selections locally
    if (mySelectedNumber) return;

    // Emit join with chosen lucky number (server will reserve and return card)
    const telegramId = authUser?.telegramId;
    if (!telegramId || !gameId) return;

    socket.emit("joinRoom", {
      gameId,
      telegramId,
      betAmount: 1,
      luckyNumber: number,
    });
    // optimistically lock locally until server confirms
    setMySelectedNumber(number);
    setSelectionNumbers([number]);
  };

  const lockSelections = () => {
    if (selectionNumbers.length < 1) return;

    setCards(selectionNumbers.map((number) => createBingoCard([number])));
    setNumberPool(createNumberPool());
    setRemainingBalls(75);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setWinner(null);
    setWinningLuckyNumber(null);
    setGameStatus("live");
    setDrawTimeLeft(7);
    setPhase("live");
  };

  const drawNextNumber = () => {
    if (!joined || phase !== "live" || gameStatus !== "live" || winner) {
      return;
    }

    setNumberPool((prevPool) => {
      if (prevPool.length === 0) {
        setGameStatus("finished");
        setDrawTimeLeft(0);
        return [];
      }

      const [nextNumber, ...rest] = prevPool;
      setCurrentNumber(nextNumber);
      setCalledNumbers((history) => {
        if (history.includes(nextNumber)) {
          return history;
        }

        return [nextNumber, ...history].slice(0, 12);
      });
      setRemainingBalls(rest.length);
      setDrawTimeLeft(7);

      setCards((currentCards) => {
        if (!currentCards?.length) {
          return currentCards;
        }

        const nextCards = currentCards.map((currentCard) =>
          markNumberOnCard(currentCard, nextNumber),
        );

        const winningIndex = nextCards.findIndex((card) => hasBingo(card));
        if (winningIndex >= 0) {
          setWinner("You");
          setWinningLuckyNumber(selectionNumbers[winningIndex]);
          setGameStatus("finished");
        }

        return nextCards;
      });

      return rest;
    });
  };

  // Server-driven selection countdown: handled via socket 'countdownTick' events
  useEffect(() => {
    const handleGameUpdate = (payload) => {
      const type = payload?.type;
      if (!type) return;

      switch (type) {
        case "roomCreated":
          setGameId(payload.gameId);
          setPhase("waiting");
          setGameStatus("waiting");
          setSelectedNumbersGlobal(payload.selectedNumbers || []);
          setParticipants((payload.players || []).length || 0);
          // reset local picks
          setMySelectedNumber(null);
          setSelectionNumbers([]);
          setCalledNumbers([]);
          setWinner(null);
          setCountdownRemaining(null);
          break;
        case "playerJoined":
          setParticipants(payload.playerCount || 0);
          setSelectedNumbersGlobal(payload.selectedNumbers || []);
          break;
        case "countdownStarted":
          setCountdownRemaining(payload.seconds ?? null);
          break;
        case "gameStarted":
          setPhase("live");
          setGameStatus("live");
          setCountdownRemaining(null);
          break;
        case "notEnoughPlayers":
          // stay waiting
          setPhase("waiting");
          setGameStatus("waiting");
          break;
        case "bingo":
          setWinner(payload.winner || null);
          break;
        case "gameEnded":
          setGameStatus("finished");
          break;
        default:
          break;
      }
    };

    const handleCountdown = (data) => {
      if (typeof data?.remaining === "number")
        setCountdownRemaining(data.remaining);
    };

    const handleNumberCalled = (data) => {
      if (!data) return;
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers || ((prev) => prev));
      setRemainingBalls(
        data.remaining ?? 75 - (data.calledNumbers || []).length,
      );
    };

    const handleJoinedRoom = (data) => {
      if (!data) return;
      setJoined(true);
      setMySelectedNumber(selectionNumbers[0] || null);
      setParticipants(data.currentPlayers || participants);
      // server returns the player's card
      if (data.card) {
        setCards([data.card]);
      }
    };

    // Ensure socket is connected
    if (!socket.connected) socket.connect();

    // STANDARDIZED handlers for bingo:* events (preferred)
    const handleRoundState = (payload) => {
      // payload expected to contain: gameId, status, selectedNumbers, players, calledNumbers, currentNumber
      if (!payload) return;
      const state = payload;
      setGameId(state.gameId || state.game?.gameId || gameId);
      const status = state.status || (state.game && state.game.status) || null;
      if (status === "waiting") {
        setPhase("selection");
        setGameStatus("waiting");
      } else if (
        status === "active" ||
        status === "playing" ||
        status === "live"
      ) {
        setPhase("live");
        setGameStatus("live");
      } else if (status === "finished" || status === "ended") {
        setPhase("finished");
        setGameStatus("finished");
      }
      setSelectedNumbersGlobal(
        state.selectedNumbers || state.game?.selectedNumbers || [],
      );
      setParticipants(
        (state.players && state.players.length) ||
          state.playerCount ||
          participants,
      );
      if (state.calledNumbers) setCalledNumbers(state.calledNumbers);
      if (state.currentNumber) setCurrentNumber(state.currentNumber);
    };

    // Map backend's legacy/primary events to the standardized bingo:* handlers
    const mapGameUpdateToRoundState = (payload) => {
      if (!payload) return;
      const type = payload.type;
      switch (type) {
        case "roomCreated":
          handleRoundState({
            gameId: payload.gameId,
            status: payload.status || "waiting",
            selectedNumbers: payload.selectedNumbers || [],
            players: payload.players || [],
          });
          break;
        case "playerJoined":
          // emit participant change and selected numbers
          setParticipants(
            payload.playerCount ||
              (payload.players || []).length ||
              participants,
          );
          setSelectedNumbersGlobal(payload.selectedNumbers || []);
          break;
        case "countdownStarted":
          setCountdownRemaining(payload.seconds ?? null);
          break;
        case "gameStarted":
          handleRoundState({ gameId: payload.gameId, status: "active" });
          break;
        case "notEnoughPlayers":
          handleRoundState({ status: "waiting" });
          break;
        case "bingo":
        case "gameEnded":
          handleRoundState({ status: "finished" });
          if (payload.winner) setWinner(payload.winner);
          break;
        default:
          break;
      }
    };

    const handleBingoParticipantCount = (data) => {
      if (!data) return;
      setParticipants(data.count ?? data.players?.length ?? participants);
      if (data.selectedNumbers) setSelectedNumbersGlobal(data.selectedNumbers);
    };

    const handleNumberCalledUnified = (data) => {
      if (!data) return;
      setCurrentNumber(data.number ?? data.currentNumber);
      setCalledNumbers(data.calledNumbers || data.called || []);
      setRemainingBalls(
        data.remaining ?? 75 - (data.calledNumbers || []).length,
      );
    };

    const handleNumberSelectedUnified = (data) => {
      if (!data) return;
      // data may include { telegramId, luckyNumber, selectedNumbers, playerCount }
      if (data.selectedNumbers) setSelectedNumbersGlobal(data.selectedNumbers);
      if (data.playerCount) setParticipants(data.playerCount);
    };

    const handleJoinedRoom = (data) => {
      if (!data) return;
      setJoined(true);
      setMySelectedNumber(selectionNumbers[0] || null);
      setParticipants(data.currentPlayers || participants);
      if (data.card) setCards([data.card]);
    };

    // Listen to standardized bingo:* channels (if server emits them in future)
    socket.on("bingo:roundState", handleRoundState);
    socket.on("bingo:participantCount", handleBingoParticipantCount);
    socket.on("bingo:numberSelected", handleNumberSelectedUnified);
    socket.on("bingo:numberCalled", handleNumberCalledUnified);
    socket.on("bingo:winner", (d) => d && setWinner(d.winner || d));
    socket.on("bingo:roundFinished", (d) => {
      setGameStatus("finished");
      if (d?.winner) setWinner(d.winner);
    });
    socket.on("bingo:nextRound", (d) => {
      // server announces a next round
      handleRoundState({
        gameId: d?.gameId || d?.newGameId,
        status: "waiting",
        selectedNumbers: d?.selectedNumbers || [],
        players: d?.players || [],
      });
    });

    // Also listen to the backend's current event names and map them
    socket.on("gameUpdate", mapGameUpdateToRoundState);
    socket.on("countdownTick", (data) => {
      if (data && typeof data.remaining === "number")
        setCountdownRemaining(data.remaining);
    });
    socket.on("numberCalled", handleNumberCalledUnified);
    socket.on("joinedRoom", handleJoinedRoom);
    socket.on("playerCard", (d) => {
      if (d?.card) setCards([d.card]);
    });

    return () => {
      // standardized
      socket.off("bingo:roundState", handleRoundState);
      socket.off("bingo:participantCount", handleBingoParticipantCount);
      socket.off("bingo:numberSelected", handleNumberSelectedUnified);
      socket.off("bingo:numberCalled", handleNumberCalledUnified);
      socket.off("bingo:winner");
      socket.off("bingo:roundFinished");
      socket.off("bingo:nextRound");
      // backend originals
      socket.off("gameUpdate", mapGameUpdateToRoundState);
      socket.off("countdownTick");
      socket.off("numberCalled", handleNumberCalledUnified);
      socket.off("joinedRoom", handleJoinedRoom);
      socket.off("playerCard");
    };
  }, [participants, selectionNumbers, authUser, gameId]);

  // Number calling is server driven; we update UI on 'numberCalled' events

  const handleJoin = () => {
    // Request server to create or announce a room (server will emit roomCreated)
    if (!socket.connected) socket.connect();
    socket.emit("createRoom", { roomId: "Main Room" });
    setPhase("selection");
    setGameStatus("waiting");
    setWinner(null);
    setWinningLuckyNumber(null);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setCards([]);
    setNumberPool(createNumberPool());
    setRemainingBalls(75);
  };

  const statusText = phase === "selection" ? "Selection" : gameStatus;
  const currentStatus =
    phase === "selection"
      ? "waiting"
      : gameStatus === "finished"
        ? "finished"
        : "running";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_0.95fr] gap-6">
      <div className="space-y-6">
        <div className="flex flex-nowrap gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 rounded-3xl border border-slate-700 bg-slate-950/80 p-3 shadow-xl shadow-slate-950/20 sm:p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:mb-3 sm:text-xs">
              Room
            </div>
            <div className="text-lg font-semibold text-slate-100 sm:text-2xl md:text-3xl">
              Main Room
            </div>
          </div>
          <div className="flex-1 min-w-0 rounded-3xl border border-slate-700 bg-slate-950/80 p-3 shadow-xl shadow-slate-950/20 sm:p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:mb-3 sm:text-xs">
              Prize pool
            </div>
            <div className="text-lg font-semibold text-slate-100 sm:text-2xl md:text-3xl">
              ${prizePool}
            </div>
          </div>
          <div className="flex-1 min-w-0 rounded-3xl border border-slate-700 bg-slate-950/80 p-3 shadow-xl shadow-slate-950/20 sm:p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:mb-3 sm:text-xs">
              Remaining balls
            </div>
            <div className="text-lg font-semibold text-slate-100 sm:text-2xl md:text-3xl">
              {remainingBalls}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-emerald-950/10 shadow-xl shadow-slate-950/20 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-700 bg-slate-950/90 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Marshal · Bingo
              </div>
              <div className="text-sm text-slate-300">
                {joined
                  ? "Choose your lucky numbers before the lock timer ends."
                  : "Join the room to enter the selection phase."}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-3xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-100">
                {participants || livePlayers} players
              </div>
              <button
                onClick={handleJoin}
                className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300"
              >
                {joined ? "Restart session" : "Join game"}
              </button>
            </div>
          </div>

          {phase === "selection" && (
            <div className="border-b border-slate-700 bg-slate-900/70 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    Lucky numbers
                  </div>
                  <div className="text-sm text-slate-400">
                    Pick 1–3 numbers from 1–75.
                  </div>
                </div>
                <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm text-slate-300">
                  {selectionNumbers.length}/3 selected
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {mySelectedNumber ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                    {mySelectedNumber}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    No lucky numbers selected yet.
                  </span>
                )}
              </div>
            </div>
          )}

          {phase === "selection" && (
            <div className="grid grid-cols-5 gap-2 p-5 sm:grid-cols-8 lg:grid-cols-10 max-h-[360px] overflow-y-auto">
              {Array.from({ length: 75 }, (_, index) => index + 1).map(
                (number) => {
                  const isSelected =
                    selectedNumbersGlobal.includes(number) ||
                    mySelectedNumber === number;
                  const disabled =
                    Boolean(
                      selectedNumbersGlobal.includes(number) &&
                      mySelectedNumber !== number,
                    ) ||
                    phase !== "selection" ||
                    Boolean(mySelectedNumber);
                  return (
                    <button
                      key={number}
                      onClick={() => toggleLuckyNumber(number)}
                      disabled={disabled}
                      className={`aspect-square rounded-2xl border text-sm font-semibold transition-all ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                          : "border-slate-700 bg-slate-950 text-slate-100 hover:border-slate-500"
                      }`}
                    >
                      {number}
                    </button>
                  );
                },
              )}
            </div>
          )}

          {phase !== "selection" && cards.length > 0 && (
            <div className="grid gap-6 p-5 lg:grid-cols-2">
              {cards.map((card, index) => (
                <div
                  key={`${selectionNumbers[index]}-${index}`}
                  className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        Card {index + 1}
                      </div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Lucky number {selectionNumbers[index]}
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {card.some((row) => row.some((cell) => cell?.marked))
                        ? "In play"
                        : "Ready"}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {card.map((row, rowIndex) =>
                      row.map((cell, columnIndex) => (
                        <BingoCell
                          key={`${rowIndex}-${columnIndex}`}
                          number={cell?.value}
                          marked={cell?.marked}
                          accent={accent}
                        />
                      )),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {phase !== "selection" && cards.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-400">
              The game cards will appear after your picks are locked.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900/60 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-100">
            Selected lucky numbers
          </div>
          <div className="min-h-10 text-sm text-slate-400">
            {selectedNumbersLabel || "No lucky numbers locked yet."}
          </div>
        </div>

        <CalledNumbers numbers={calledNumbers} accent={accent} />
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Current number
              </div>
              <div className="mt-2 text-4xl font-semibold text-slate-100">
                {currentNumber ?? "—"}
              </div>
            </div>
            <div
              className={`rounded-3xl px-4 py-2 text-sm font-semibold ${accent.accentText} border ${accent.accentBg} border-emerald-500/20`}
            >
              {statusText}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-4">
              <CurrentNumber number={currentNumber ?? "—"} accent={accent} />
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-4">
              <GameStatus status={currentStatus} accent={accent} />
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-4">
              <Countdown
                seconds={
                  phase === "selection" ? selectionTimeLeft : drawTimeLeft
                }
                label={
                  phase === "selection"
                    ? "Selection closes in"
                    : "Next number in"
                }
              />
            </div>
            <ClaimBingoButton
              accent={accent}
              disabled={phase !== "selection" || selectionNumbers.length < 1}
              onClaim={lockSelections}
            />
          </div>
        </div>

        <RoomInfo room="Main Room" players={livePlayers} accent={accent} />
        <WinnerModal
          open={Boolean(winner)}
          winner={winner || "You"}
          luckyNumber={winningLuckyNumber}
          onClose={() => {
            setWinner(null);
            setWinningLuckyNumber(null);
          }}
          accent={accent}
        />
      </aside>
    </div>
  );
};

export default Bingo;
