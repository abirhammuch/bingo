import React, { useEffect, useMemo, useState } from "react";
import BingoCell from "./BingoCell";
import CurrentNumber from "./CurrentNumber";
import CalledNumbers from "./CalledNumbers";
import GameStatus from "./GameStatus";
import Countdown from "./Countdown";
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
  const [selectionTimeLeft, setSelectionTimeLeft] = useState(30);
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
  const [prizePool] = useState(1250);
  const { user: authUser } = useAuth();
  const [gameId, setGameId] = useState(null);
  const [participants, setParticipants] = useState(0);
  const [selectedNumbersGlobal, setSelectedNumbersGlobal] = useState([]);
  const [mySelectedNumber, setMySelectedNumber] = useState(null);
  const [mySelections, setMySelections] = useState([]);
  const [countdownRemaining, setCountdownRemaining] = useState(null);
  const [pendingSelections, setPendingSelections] = useState([]);

  const maxSelectionCount = 3;
  const selectedNumbersLabel = useMemo(
    () => selectionNumbers.join(", "),
    [selectionNumbers],
  );
  const reservedCount = selectedNumbersGlobal.length;
  const canSelectMore = mySelections.length < maxSelectionCount;
  const displayedPlayerCount = Math.max(participants, selectionNumbers.length);

  // ============================================================
  // ✅ FIX 1: Updated helper to TRUST server playerCount first
  // ============================================================
  const getActivePlayerCount = (players, selectedNumbers, fallback = 0) => {
    const playerCount = Array.isArray(players) ? players.length : 0;
    const selectedCount = Array.isArray(selectedNumbers)
      ? selectedNumbers.length
      : 0;
    const fallbackCount =
      typeof fallback === "number" && fallback > 0 ? fallback : 0;

    return Math.max(playerCount, selectedCount, fallbackCount);
  };

  const toggleLuckyNumber = (number) => {
    if (phase !== "selection") return;
    if (!joined) return;
    if (!canSelectMore) return;
    if (mySelections.includes(number)) return;

    const telegramId = authUser?.telegramId;
    if (
      selectedNumbersGlobal.includes(number) &&
      !mySelections.includes(number)
    ) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    if (!gameId) {
      setPendingSelections((prev) =>
        prev.includes(number) ? prev : [...prev, number],
      );
      socket.emit("createRoom", { roomId: "Main Room" });
      return;
    }

    if (!telegramId) {
      setMySelections((prev) => [...prev, number]);
      setMySelectedNumber(number);
      setSelectionNumbers((prev) =>
        prev.includes(number) ? prev : [...prev, number],
      );
      setSelectedNumbersGlobal((prev) =>
        prev.includes(number) ? prev : [...prev, number],
      );
      return;
    }

    socket.emit("joinRoom", {
      gameId,
      telegramId,
      betAmount: 1,
      luckyNumber: number,
    });
    setMySelections((prev) => [...prev, number]);
    setMySelectedNumber(number);
    setSelectionNumbers((prev) =>
      prev.includes(number) ? prev : [...prev, number],
    );
    setSelectedNumbersGlobal((prev) =>
      prev.includes(number) ? prev : [...prev, number],
    );
  };

  const lockSelections = () => {
    if (selectionNumbers.length < 1) return;

    setCards(selectionNumbers.map((number) => createBingoCard([number])));
    setSelectionTimeLeft(0);
    setNumberPool(createNumberPool());
    setRemainingBalls(75);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setWinner(null);
    setWinningLuckyNumber(null);
    setGameStatus("live");
    setDrawTimeLeft(7);
    setPhase("live");

    if (gameId && socket.connected) {
      socket.emit("startGame", { gameId });
    }
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

  // ============================================================
  // Socket Listeners
  // ============================================================
  useEffect(() => {
    const handleGameUpdate = (payload) => {
      const type = payload?.type;
      if (!type) return;

      switch (type) {
        case "roomCreated":
          setGameId(payload.gameId);
          setPhase("selection");
          setGameStatus("waiting");
          setSelectedNumbersGlobal(payload.selectedNumbers || []);
          // ✅ Use server playerCount directly
          setParticipants(
            typeof payload.playerCount === "number"
              ? payload.playerCount
              : getActivePlayerCount(
                  payload.players || [],
                  payload.selectedNumbers || [],
                ),
          );
          setMySelectedNumber(null);
          setMySelections([]);
          setSelectionNumbers([]);
          setCalledNumbers([]);
          setWinner(null);
          setCountdownRemaining(30);
          setSelectionTimeLeft(30);
          break;

        case "playerJoined":
          // ✅ FIX: Trust the server's playerCount first
          setParticipants(
            typeof payload.playerCount === "number"
              ? payload.playerCount
              : getActivePlayerCount(
                  payload.players || [],
                  payload.selectedNumbers || [],
                  payload.playerCount || 0,
                ),
          );
          setSelectedNumbersGlobal(payload.selectedNumbers || []);
          if (
            (payload.players || []).length >= 1 ||
            (payload.selectedNumbers || []).length >= 1
          ) {
            setCountdownRemaining(30);
            setSelectionTimeLeft(30);
          }
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
      // ✅ NEW: Update player count if provided by server during countdown
      if (typeof data?.playerCount === "number") {
        setParticipants(data.playerCount);
      }
    };

    const handleNumberCalled = (data) => {
      if (!data) return;
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers || ((prev) => prev));
      setRemainingBalls(
        data.remaining ?? 75 - (data.calledNumbers || []).length,
      );
    };

    if (!socket.connected) socket.connect();

    // ============================================================
    // ✅ FIX 2: Handle bingo:* events with direct playerCount trust
    // ============================================================
    const handleRoundState = (payload) => {
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

      // ✅ Set participants directly from playerCount
      const playerCount = state.playerCount || state.game?.playerCount || 0;
      if (typeof playerCount === "number" && playerCount > 0) {
        setParticipants(playerCount);
      } else {
        setParticipants(
          getActivePlayerCount(
            state.players || state.game?.players || [],
            state.selectedNumbers || state.game?.selectedNumbers || [],
          ),
        );
      }

      if (state.calledNumbers) setCalledNumbers(state.calledNumbers);
      if (state.currentNumber) setCurrentNumber(state.currentNumber);

      if (
        pendingSelections.length > 0 &&
        (state.gameId || state.game?.gameId)
      ) {
        const gid = state.gameId || state.game?.gameId;
        const telegramId = authUser?.telegramId;
        if (gid && telegramId) {
          pendingSelections.forEach((pendingNumber) => {
            socket.emit("joinRoom", {
              gameId: gid,
              telegramId,
              betAmount: 1,
              luckyNumber: pendingNumber,
            });
          });
          setMySelections((prev) => [
            ...prev,
            ...pendingSelections.filter((n) => !prev.includes(n)),
          ]);
          setSelectionNumbers((prev) => [
            ...prev,
            ...pendingSelections.filter((n) => !prev.includes(n)),
          ]);
          setMySelectedNumber(pendingSelections[0] || null);
          setPendingSelections([]);
        }
      }
    };

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
          setParticipants(
            typeof payload.playerCount === "number"
              ? payload.playerCount
              : getActivePlayerCount(
                  payload.players || [],
                  payload.selectedNumbers || [],
                  payload.playerCount || participants,
                ),
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

    // ============================================================
    // ✅ FIX 3: Directly set participants from server playerCount
    // ============================================================
    const handleBingoParticipantCount = (data) => {
      if (!data) return;
      if (data.selectedNumbers) setSelectedNumbersGlobal(data.selectedNumbers);
      if (typeof data.playerCount === "number") {
        setParticipants(data.playerCount);
      } else if (typeof data.count === "number") {
        setParticipants(data.count);
      } else {
        setParticipants(
          getActivePlayerCount(
            data.players || [],
            data.selectedNumbers || [],
            0,
          ),
        );
      }
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
      if (data.selectedNumbers) setSelectedNumbersGlobal(data.selectedNumbers);
      setParticipants(
        typeof data.playerCount === "number"
          ? data.playerCount
          : getActivePlayerCount(
              data.players || [],
              data.selectedNumbers || [],
              data.playerCount || participants,
            ),
      );
    };

    // ============================================================
    // ✅ FIX 4: joinedRoom should trust server playerCount directly
    // ============================================================
    const handleJoinedRoom = (data) => {
      if (!data) return;
      setJoined(true);
      setMySelectedNumber(selectionNumbers[0] || null);
      if (mySelections.length === 0 && selectionNumbers.length > 0) {
        setMySelections(selectionNumbers);
      }

      setParticipants(
        typeof data.playerCount === "number"
          ? data.playerCount
          : typeof data.currentPlayers === "number"
            ? data.currentPlayers
            : getActivePlayerCount(
                data.players || [],
                data.selectedNumbers || [],
                0,
              ),
      );

      if (data.gameId && socket.connected) {
        socket.emit("getGameState", { gameId: data.gameId });
      }
      if (data.card) setCards([data.card]);

      if (pendingSelections.length > 0) {
        const telegramId = authUser?.telegramId;
        if (telegramId && data.gameId) {
          pendingSelections.forEach((pendingNumber) => {
            socket.emit("joinRoom", {
              gameId: data.gameId,
              telegramId,
              betAmount: 1,
              luckyNumber: pendingNumber,
            });
          });
          setMySelections((prev) => [
            ...prev,
            ...pendingSelections.filter((n) => !prev.includes(n)),
          ]);
          setSelectionNumbers((prev) => [
            ...prev,
            ...pendingSelections.filter((n) => !prev.includes(n)),
          ]);
          setMySelectedNumber(pendingSelections[0] || null);
          setPendingSelections([]);
        }
      }
    };

    // ============================================================
    // Register all Socket Listeners
    // ============================================================
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
      handleRoundState({
        gameId: d?.gameId || d?.newGameId,
        status: "waiting",
        selectedNumbers: d?.selectedNumbers || [],
        players: d?.players || [],
      });
    });

    socket.on("gameUpdate", mapGameUpdateToRoundState);

    // ✅ UPDATED: countdownTick now also updates playerCount
    socket.on("countdownTick", (data) => {
      if (data && typeof data.remaining === "number") {
        setCountdownRemaining(data.remaining);
      }
      if (data && typeof data.playerCount === "number") {
        setParticipants(data.playerCount);
      }
    });

    socket.on("countdownRemaining", (data) => {
      if (typeof data === "number") setCountdownRemaining(data);
      else if (data && typeof data.remaining === "number")
        setCountdownRemaining(data.remaining);
    });

    socket.on("numberCalled", handleNumberCalledUnified);

    socket.on("gameState", (data) => {
      if (!data?.game) return;
      const game = data.game;
      if (Array.isArray(game.calledNumbers))
        setCalledNumbers(game.calledNumbers);
      if (game.currentNumber !== undefined && game.currentNumber !== null) {
        setCurrentNumber(game.currentNumber);
      }
      // ✅ Also update participants from gameState if available
      if (typeof game.playerCount === "number") {
        setParticipants(game.playerCount);
      } else if (Array.isArray(game.players)) {
        setParticipants(game.players.length);
      }
      if (game.status) {
        if (
          game.status === "active" ||
          game.status === "playing" ||
          game.status === "live"
        ) {
          setPhase("live");
          setGameStatus("live");
        } else if (game.status === "finished" || game.status === "ended") {
          setPhase("finished");
          setGameStatus("finished");
        } else {
          setPhase("selection");
          setGameStatus("waiting");
        }
      }
    });

    socket.on("joinedRoom", handleJoinedRoom);
    socket.on("playerCard", (d) => {
      if (d?.card) setCards([d.card]);
    });

    // ============================================================
    // Cleanup on unmount
    // ============================================================
    return () => {
      socket.off("bingo:roundState", handleRoundState);
      socket.off("bingo:participantCount", handleBingoParticipantCount);
      socket.off("bingo:numberSelected", handleNumberSelectedUnified);
      socket.off("bingo:numberCalled", handleNumberCalledUnified);
      socket.off("bingo:winner");
      socket.off("bingo:roundFinished");
      socket.off("bingo:nextRound");
      socket.off("gameUpdate", mapGameUpdateToRoundState);
      socket.off("countdownTick");
      socket.off("numberCalled", handleNumberCalledUnified);
      socket.off("gameState");
      socket.off("joinedRoom", handleJoinedRoom);
      socket.off("playerCard");
    };
  }, [participants, selectionNumbers, authUser, gameId, pendingSelections]);

  // ============================================================
  // Selection Timer
  // ============================================================
  const handleJoin = () => {
    if (!socket.connected) socket.connect();
    socket.emit("createRoom", { roomId: "Main Room" });
    setJoined(true);
    setPhase("selection");
    setSelectionTimeLeft(30);
    setCountdownRemaining(30);
    setGameStatus("waiting");
    setWinner(null);
    setWinningLuckyNumber(null);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setCards([]);
    setNumberPool(createNumberPool());
    setRemainingBalls(75);
    setSelectionNumbers([]);
    setMySelections([]);
    setSelectedNumbersGlobal([]);
    setMySelectedNumber(null);
    setPendingSelections([]);
  };

  useEffect(() => {
    if (phase !== "selection") return;

    if (typeof countdownRemaining === "number") {
      setSelectionTimeLeft(countdownRemaining);
      if (countdownRemaining <= 0) {
        lockSelections();
      }
      return;
    }

    if (selectionTimeLeft <= 0) {
      lockSelections();
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectionTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phase, countdownRemaining, selectionTimeLeft]);

  const statusText = phase === "selection" ? "Selection" : gameStatus;
  const currentStatus =
    phase === "selection"
      ? "waiting"
      : gameStatus === "finished"
        ? "finished"
        : "running";

  // ============================================================
  // Render UI
  // ============================================================
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
                {displayedPlayerCount} players
              </div>
              <div className="flex items-center gap-2 rounded-3xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300">
                <span>Auto-claim in</span>
                <span>
                  {phase === "selection" ? `${selectionTimeLeft}s` : "—"}
                </span>
              </div>
              <button
                onClick={handleJoin}
                className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300"
              >
                {joined ? "Restart room" : "Join game"}
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
                    Pick up to {maxSelectionCount} numbers from 1–75.
                  </div>
                </div>
                <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm text-slate-300">
                  {selectionNumbers.length}/{maxSelectionCount} selected
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {mySelections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mySelections.map((number) => (
                      <span
                        key={number}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
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
                    mySelections.includes(number);
                  const isReservedByOther =
                    selectedNumbersGlobal.includes(number) &&
                    !mySelections.includes(number);
                  const disabled =
                    phase !== "selection" ||
                    isReservedByOther ||
                    (!mySelections.includes(number) && !canSelectMore);

                  return (
                    <button
                      key={number}
                      onClick={() => toggleLuckyNumber(number)}
                      disabled={disabled}
                      className={`aspect-square rounded-2xl border text-sm font-semibold transition-all ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                          : "border-slate-700 bg-slate-950 text-slate-100 hover:border-slate-500"
                      } ${
                        isReservedByOther ? "opacity-50 cursor-not-allowed" : ""
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
                  typeof countdownRemaining === "number"
                    ? countdownRemaining
                    : phase === "selection"
                      ? selectionTimeLeft
                      : drawTimeLeft
                }
                label={
                  phase === "selection"
                    ? "Selection closes in"
                    : "Next number in"
                }
              />
            </div>
          </div>
        </div>

        <RoomInfo room="Main Room" players={participants} accent={accent} />
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
