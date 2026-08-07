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
  const [winningCardNumber, setWinningCardNumber] = useState(null);
  const [livePlayers] = useState(128);
  const [prizePool] = useState(1250);

  const selectedNumbersLabel = useMemo(
    () => selectionNumbers.join(", "),
    [selectionNumbers],
  );

  const toggleLuckyNumber = (number) => {
    if (phase !== "selection") {
      return;
    }

    setSelectionNumbers((prev) => {
      if (prev.includes(number)) {
        return prev.filter((value) => value !== number);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, number];
    });
  };

  const lockSelections = () => {
    if (selectionNumbers.length < 1) {
      return;
    }

    setCards(selectionNumbers.map((number) => createBingoCard([number])));
    setNumberPool(createNumberPool());
    setRemainingBalls(75);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setWinner(null);
    setWinningCardNumber(null);
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
          setWinningCardNumber(winningIndex + 1);
          setGameStatus("finished");
        }

        return nextCards;
      });

      return rest;
    });
  };

  useEffect(() => {
    if (!joined || phase !== "selection") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSelectionTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          lockSelections();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [joined, phase, selectionNumbers]);

  useEffect(() => {
    if (!joined || phase !== "live" || gameStatus !== "live" || winner) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setDrawTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          drawNextNumber();
          return 7;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [joined, phase, gameStatus, winner, numberPool]);

  const handleJoin = () => {
    setJoined(true);
    setSelectionNumbers([]);
    setSelectionTimeLeft(20);
    setPhase("selection");
    setGameStatus("waiting");
    setWinner(null);
    setWinningCardNumber(null);
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">
              Room
            </div>
            <div className="text-3xl font-semibold text-slate-100">
              Main Room
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">
              Prize pool
            </div>
            <div className="text-3xl font-semibold text-slate-100">
              ${prizePool}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">
              Remaining balls
            </div>
            <div className="text-3xl font-semibold text-slate-100">
              {remainingBalls}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-emerald-950/10 shadow-xl shadow-slate-950/20 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-700 bg-slate-950/90 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Flash · Bingo
              </div>
              <div className="mt-2 text-sm text-slate-300">
                {joined
                  ? "Choose your lucky numbers before the lock timer ends."
                  : "Join the room to enter the selection phase."}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-3xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-100">
                {livePlayers} players
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
                {selectionNumbers.length > 0 ? (
                  selectionNumbers.map((number) => (
                    <span
                      key={number}
                      className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300"
                    >
                      {number}
                    </span>
                  ))
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
                  const isSelected = selectionNumbers.includes(number);
                  return (
                    <button
                      key={number}
                      onClick={() => toggleLuckyNumber(number)}
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
          cardNumber={winningCardNumber}
          onClose={() => {
            setWinner(null);
            setWinningCardNumber(null);
          }}
          accent={accent}
        />
      </aside>
    </div>
  );
};

export default Bingo;
