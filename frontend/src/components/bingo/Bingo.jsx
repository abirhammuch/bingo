import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [phase, setPhase] = useState("selection");
  const [cards, setCards] = useState([]);
  const [drawTimeLeft, setDrawTimeLeft] = useState(7);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [remainingBalls, setRemainingBalls] = useState(300);
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
  const [selectionCountdown, setSelectionCountdown] = useState(30);
  const [liveCountdown, setLiveCountdown] = useState(null);
  const [pendingSelections, setPendingSelections] = useState([]);
  const [roomCreating, setRoomCreating] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const joinedGamesRef = useRef(new Set());

  const maxSelectionCount = 2;
  const selectedNumbersLabel = useMemo(
    () => selectionNumbers.join(", "),
    [selectionNumbers],
  );
  const reservedCount = selectedNumbersGlobal.length;
  const canSelectMore = mySelections.length < maxSelectionCount;
  const displayedPlayerCount =
    typeof participants === "number" && participants > 0 ? participants : 0;

  // Count actual joined players from the server. Do not use the selected
  // lucky-number list because it can be much larger than the real player count.
  const getActivePlayerCount = (players, _selectedNumbers, fallback = 0) => {
    const playerCount = Array.isArray(players) ? players.length : 0;
    const fallbackCount =
      typeof fallback === "number" && fallback > 0 ? fallback : 0;

    return Math.max(playerCount, fallbackCount);
  };

  // ============================================================
  // joinCurrentGame (Removed callback, now relies on 'joinedRoom' event)
  // ============================================================
  const joinCurrentGame = (targetGameId = gameId) => {
    const telegramId = authUser?.telegramId;
    console.log("📞 [joinCurrentGame called]", {
      targetGameId,
      telegramId,
      authUser: authUser
        ? {
            telegramId: authUser.telegramId,
            firstName: authUser.firstName,
            isRegistered: authUser.isRegistered,
          }
        : null,
      socketConnected: socket.connected,
    });

    if (!targetGameId || !telegramId) {
      console.warn("⚠️ [joinCurrentGame early return]", {
        missingGameId: !targetGameId,
        missingTelegramId: !telegramId,
      });
      return;
    }
    if (joinedGamesRef.current.has(targetGameId)) {
      console.log("⚠️ [Already joined this game]", { targetGameId });
      return;
    }

    console.log("✅ [Proceeding with joinRoom emit]", {
      targetGameId,
      telegramId,
      socketConnected: socket.connected,
    });

    if (!socket.connected) {
      console.log("🔗 [Socket not connected, connecting...]");
      socket.connect();
    }

    joinedGamesRef.current.add(targetGameId);

    const emitPayload = {
      gameId: targetGameId,
      telegramId,
      betAmount: 1,
      luckyNumber: null,
    };

    console.log("📤 [EMITTING joinRoom TO SERVER]", {
      payload: emitPayload,
      socketId: socket.id,
      socketConnected: socket.connected,
    });

    socket.emit("joinRoom", emitPayload);
  };

  const emitStartGame = () => {
    if (!gameId) return;
    if (!socket.connected) {
      socket.connect();
      socket.once("connect", () => {
        socket.emit("startGame", { gameId });
      });
      return;
    }

    socket.emit("startGame", { gameId });
  };

  const flushPendingSelections = async (
    emitStart = false,
    explicitGameId = null,
  ) => {
    const telegramId = authUser?.telegramId;
    const targetGameId = explicitGameId || gameId;
    if (!targetGameId || !telegramId || pendingSelections.length === 0) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const joinPromises = pendingSelections.map(
      (pendingNumber) =>
        new Promise((resolve) => {
          socket.emit(
            "joinRoom",
            {
              gameId: targetGameId,
              telegramId,
              betAmount: 1,
              luckyNumber: pendingNumber,
            },
            (response) => {
              resolve({ pendingNumber, response });
            },
          );
        }),
    );

    const results = await Promise.all(joinPromises);
    const successful = results.filter((r) => r.response?.success);
    const originalPendingCount = pendingSelections.length;

    const uniquePending = successful
      .map((r) => r.pendingNumber)
      .filter((n) => !mySelections.includes(n));

    if (uniquePending.length > 0) {
      setMySelections((prev) => [...prev, ...uniquePending]);
      setSelectionNumbers((prev) => [...prev, ...uniquePending]);
      setMySelectedNumber(uniquePending[0] || null);
    }

    setPendingSelections([]);

    // Only start the game if all selections were successful
    if (
      emitStart &&
      gameId &&
      successful.length === originalPendingCount &&
      successful.length >= 3
    ) {
      emitStartGame();
    } else if (emitStart && successful.length < 3) {
      console.warn(
        `Failed to join enough games. Successful: ${successful.length}, Required: 3`,
      );
      socket.emit("error", {
        success: false,
        message: `Need at least 3 successful card selections. Got ${successful.length}.`,
      });
    }
  };

  const toggleLuckyNumber = (number) => {
    if (phase !== "selection") return;
    if (mySelections.includes(number)) return;

    const telegramId = authUser?.telegramId;
    console.log("🎲 [toggleLuckyNumber]", {
      number,
      phase,
      joined,
      canSelectMore,
      telegramId,
      gameId,
      roomCreating,
      socketConnected: socket.connected,
    });

    if (
      selectedNumbersGlobal.includes(number) &&
      !mySelections.includes(number)
    ) {
      return;
    }

    if (!socket.connected) {
      console.log("🔗 [Socket not connected, connecting now...]");
      socket.connect();
    }

    if (!gameId && !roomCreating) {
      console.log("🏗️ [Creating room - first number selected]", { number });
      setRoomCreating(true);
      setPendingSelections((prev) =>
        prev.includes(number) ? prev : [...prev, number],
      );
      setMySelections((prev) => [...prev, number]);
      setMySelectedNumber(number);
      setSelectionNumbers((prev) =>
        prev.includes(number) ? prev : [...prev, number],
      );
      console.log("📤 [Emitting createRoom]");
      socket.emit("createRoom", { roomId: "Main Room" });
      return;
    }

    if (!gameId && roomCreating) {
      setPendingSelections((prev) =>
        prev.includes(number) ? prev : [...prev, number],
      );
      setMySelections((prev) => [...prev, number]);
      setMySelectedNumber(number);
      setSelectionNumbers((prev) =>
        prev.includes(number) ? prev : [...prev, number],
      );
      return;
    }

    if (!telegramId) {
      setMySelections((prev) => [...prev, number]);
      setMySelectedNumber(number);
      setSelectionNumbers((prev) =>
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
  };
  const lockSelections = () => {
    if (selectionNumbers.length < 1 && pendingSelections.length < 1) return;

    if (pendingSelections.length > 0) {
      if (!gameId) {
        setPendingStart(true);
        return;
      }
      flushPendingSelections(true);
      return;
    }

    if (!gameId) return;

    setCards(selectionNumbers.map((number) => createBingoCard([number])));
    setSelectionTimeLeft(0);
    setNumberPool(createNumberPool());
    setRemainingBalls(300);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setWinner(null);
    setWinningLuckyNumber(null);
    setGameStatus("live");
    setDrawTimeLeft(7);
    setPhase("live");

    emitStartGame();
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
    const handleCountdown = (data) => {
      if (typeof data?.remaining === "number")
        setCountdownRemaining(data.remaining);
      if (typeof data?.playerCount === "number") {
        setParticipants(data.playerCount);
      }
    };

    const handleNumberCalled = (data) => {
      if (!data) return;
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers || ((prev) => prev));
      setRemainingBalls(
        data.remaining ?? 300 - (data.calledNumbers || []).length,
      );
    };

    if (!socket.connected) socket.connect();

    console.log("🔌 [Setting up socket listeners]", {
      socketConnected: socket.connected,
      socketId: socket.id,
    });

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
      const eventGameId = state.gameId || state.game?.gameId || gameId;
      if (eventGameId) {
        setGameId(eventGameId);
        setRoomCreating(false);
      }

      setSelectedNumbersGlobal(
        state.selectedNumbers || state.game?.selectedNumbers || [],
      );

      const playerCount =
        typeof state.playerCount === "number"
          ? state.playerCount
          : typeof state.game?.playerCount === "number"
            ? state.game.playerCount
            : Array.isArray(state.players || state.game?.players)
              ? (state.players || state.game?.players).length
              : 0;

      if (typeof playerCount === "number") {
        setParticipants(playerCount);
      }

      if (state.calledNumbers) setCalledNumbers(state.calledNumbers);
      if (state.currentNumber) setCurrentNumber(state.currentNumber);

      if (pendingSelections.length > 0 && eventGameId) {
        if (pendingStart) {
          flushPendingSelections(true);
        } else {
          flushPendingSelections(false);
        }
      }
    };

    const mapGameUpdateToRoundState = (payload) => {
      if (!payload) return;
      console.log("📨 [gameUpdate received]", {
        type: payload.type,
        gameId: payload.gameId,
        playerCount: payload.playerCount,
        status: payload.status,
      });

      const type = payload.type;
      switch (type) {
        case "roomCreated": {
          console.log("🎮 [roomCreated event]", {
            gameId: payload.gameId,
            hasAuthUser: !!authUser,
            hasTelegramId: !!authUser?.telegramId,
            authUserDetails: authUser
              ? {
                  telegramId: authUser.telegramId,
                  firstName: authUser.firstName,
                }
              : null,
          });

          setJoined(false);
          setCards([]);
          setSelectionNumbers([]);
          setMySelections([]);
          setMySelectedNumber(null);
          setSelectedNumbersGlobal([]);
          setWinner(null);
          setWinningLuckyNumber(null);
          setCurrentNumber(null);
          setCalledNumbers([]);
          setRemainingBalls(300);
          setPhase("selection");
          setGameStatus("waiting");
          setSelectionTimeLeft(30);
          setCountdownRemaining(30);
          setSelectionCountdown(30);
          setLiveCountdown(null);
          setNumberPool(createNumberPool());
          setPendingSelections([]);
          setPendingStart(false);

          handleRoundState({
            gameId: payload.gameId,
            status: payload.status || "waiting",
            selectedNumbers: payload.selectedNumbers || [],
            players: payload.players || [],
          });

          console.log(
            "🎮 [Room created - waiting for player to select numbers]",
            {
              gameId: payload.gameId,
              selectedNumbers: payload.selectedNumbers || [],
            },
          );
          break;
        }
        case "playerJoined":
          setParticipants(
            typeof payload.playerCount === "number"
              ? payload.playerCount
              : Array.isArray(payload.players)
                ? payload.players.length
                : typeof payload.currentPlayers === "number"
                  ? payload.currentPlayers
                  : participants,
          );
          setSelectedNumbersGlobal(payload.selectedNumbers || []);
          break;
        case "countdownStarted": {
          const nextSeconds = payload.seconds ?? 30;
          setCountdownRemaining(nextSeconds);
          setSelectionCountdown(nextSeconds);
          setSelectionTimeLeft(nextSeconds);
          setLiveCountdown(null);
          break;
        }
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
      if (data.selectedNumbers) setSelectedNumbersGlobal(data.selectedNumbers);
      if (typeof data.playerCount === "number") {
        setParticipants(data.playerCount);
      } else if (typeof data.count === "number") {
        setParticipants(data.count);
      } else if (Array.isArray(data.players)) {
        setParticipants(data.players.length);
      }
    };

    const handleNumberCalledUnified = (data) => {
      if (!data) return;
      const number = data.number ?? data.currentNumber;
      const nextCalled = data.calledNumbers || data.called || [];

      setCurrentNumber(number);
      setCalledNumbers(nextCalled);
      setRemainingBalls(data.remaining ?? Math.max(0, 300 - nextCalled.length));

      if (number == null) return;

      setCards((currentCards) => {
        if (!Array.isArray(currentCards) || currentCards.length === 0) {
          return currentCards;
        }

        const nextCards = currentCards.map((card) =>
          markNumberOnCard(card, Number(number)),
        );

        const winningIndex = nextCards.findIndex((card) => hasBingo(card));
        if (winningIndex >= 0) {
          setWinner("You");
          setWinningLuckyNumber(selectionNumbers[winningIndex] ?? number);
          setGameStatus("finished");
          setPhase("finished");
        }

        return nextCards;
      });
    };

    const handleNumberSelectedUnified = (data) => {
      if (!data) return;
      if (data.selectedNumbers) setSelectedNumbersGlobal(data.selectedNumbers);
      setParticipants(
        typeof data.playerCount === "number"
          ? data.playerCount
          : Array.isArray(data.players)
            ? data.players.length
            : typeof data.currentPlayers === "number"
              ? data.currentPlayers
              : participants,
      );
    };

    const handleJoinedRoom = (data) => {
      if (!data) return;
      setJoined(true);
      if (data.gameId) {
        setGameId(data.gameId);
        setRoomCreating(false);
      }
      setMySelectedNumber(selectionNumbers[0] || null);
      if (mySelections.length === 0 && selectionNumbers.length > 0) {
        setMySelections(selectionNumbers);
      }

      setParticipants(
        typeof data.playerCount === "number"
          ? data.playerCount
          : typeof data.currentPlayers === "number"
            ? data.currentPlayers
            : Array.isArray(data.players)
              ? data.players.length
              : participants,
      );

      if (data.gameId && socket.connected) {
        socket.emit("getGameState", { gameId: data.gameId });
      }
      if (data.card) setCards([data.card]);

      if (pendingSelections.length > 0) {
        flushPendingSelections(false);
      }
    };

    socket.on("bingo:roundState", handleRoundState);
    socket.on("bingo:participantCount", handleBingoParticipantCount);
    socket.on("bingo:numberSelected", handleNumberSelectedUnified);
    socket.on("bingo:numberCalled", handleNumberCalledUnified);
    socket.on("bingo:winner", (d) => {
      if (!d) return;

      // Handle new format with multiple winners array
      if (d.winners && Array.isArray(d.winners)) {
        setWinner(d.winners);
        setGameStatus("finished");
        setPhase("finished");
      } else if (d.winner) {
        // Fallback for old single winner format
        setWinner(d.winner);
        setGameStatus("finished");
        setPhase("finished");
      } else {
        // Fallback for direct string
        setWinner(d);
        setGameStatus("finished");
        setPhase("finished");
      }
    });
    socket.on("bingo:roundFinished", (d) => {
      setGameStatus("finished");
      if (d?.winner) setWinner(d.winner);
    });
    socket.on("bingo:nextRound", (d) => {
      // Fully reset the UI for the new round
      setJoined(false);
      setCards([]);
      setSelectionNumbers([]);
      setMySelections([]);
      setMySelectedNumber(null);
      setSelectedNumbersGlobal(d?.selectedNumbers || []);
      setWinner(null);
      setWinningLuckyNumber(null);
      setCurrentNumber(null);
      setCalledNumbers([]);
      setRemainingBalls(300);
      setPhase("selection");
      setGameStatus("waiting");
      setSelectionTimeLeft(30);
      setCountdownRemaining(30);
      setSelectionCountdown(30);
      setLiveCountdown(null);
      setNumberPool(createNumberPool());
      setPendingSelections([]);
      setPendingStart(false);
      setDrawTimeLeft(7);
      setGameId(d?.gameId || d?.newGameId);
      setParticipants((d?.players || []).length);
      setRoomCreating(false);
    });

    socket.on("joinedRoom", handleJoinedRoom);
    socket.on("gameUpdate", mapGameUpdateToRoundState);

    socket.on("countdownTick", (data) => {
      if (data && typeof data.remaining === "number") {
        const nextValue = data.remaining;
        setCountdownRemaining(nextValue);
        if (phase === "selection") {
          setSelectionCountdown(nextValue);
          setSelectionTimeLeft(nextValue);
        } else {
          setLiveCountdown(nextValue);
        }
      }
      if (data && typeof data.playerCount === "number") {
        setParticipants(data.playerCount);
      }
    });

    socket.on("countdownRemaining", (data) => {
      if (typeof data === "number") {
        setCountdownRemaining(data);
        if (phase === "selection") {
          setSelectionCountdown(data);
          setSelectionTimeLeft(data);
        } else {
          setLiveCountdown(data);
        }
      } else if (data && typeof data.remaining === "number") {
        setCountdownRemaining(data.remaining);
        if (phase === "selection") {
          setSelectionCountdown(data.remaining);
          setSelectionTimeLeft(data.remaining);
        } else {
          setLiveCountdown(data.remaining);
        }
      }
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
    socket.on("error", (data) => {
      if (data?.message) {
        console.error("Bingo socket error:", data.message);
      }
    });

    return () => {
      socket.off("bingo:roundState", handleRoundState);
      socket.off("bingo:participantCount", handleBingoParticipantCount);
      socket.off("bingo:numberSelected", handleNumberSelectedUnified);
      socket.off("bingo:numberCalled", handleNumberCalledUnified);
      socket.off("bingo:winner");
      socket.off("bingo:roundFinished");
      socket.off("bingo:nextRound");
      socket.off("joinedRoom", handleJoinedRoom);
      socket.off("gameUpdate", mapGameUpdateToRoundState);
      socket.off("countdownTick");
      socket.off("countdownRemaining");
      socket.off("numberCalled", handleNumberCalledUnified);
      socket.off("gameState");
      socket.off("error");
    };
  }, [
    participants,
    selectionNumbers,
    authUser,
    gameId,
    pendingSelections,
    phase,
  ]);

  // ============================================================
  // Don't auto-join with luckyNumber: null
  // User joins when they select a number via toggleLuckyNumber
  // ============================================================
  useEffect(() => {
    if (gameId && !joined) {
      console.log(
        "🎮 [gameId changed - user must click 'Join game' button to proceed]",
        {
          gameId,
        },
      );
    }
  }, [gameId, joined]);

  const resetRoundState = (keepJoined = true) => {
    setJoined(keepJoined);
    setPhase("selection");
    setSelectionTimeLeft(30);
    setCountdownRemaining(30);
    setSelectionCountdown(30);
    setLiveCountdown(null);
    setGameStatus("waiting");
    setWinner(null);
    setWinningLuckyNumber(null);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setCards([]);
    setNumberPool(createNumberPool());
    setRemainingBalls(300);
    setSelectionNumbers([]);
    setMySelections([]);
    setSelectedNumbersGlobal([]);
    setMySelectedNumber(null);
    setPendingSelections([]);
    setPendingStart(false);
    setDrawTimeLeft(7);
  };

  const handleJoin = () => {
    // Only allow joining during selection phase with time remaining
    if (
      phase === "live" ||
      gameStatus === "live" ||
      gameStatus === "finished" ||
      (phase === "selection" && selectionTimeLeft <= 0)
    ) {
      console.log(
        "⏳ [Cannot join] Round is locked or in progress. Waiting for next round.",
        {
          phase,
          gameStatus,
          selectionTimeLeft,
        },
      );
      return;
    }

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // Create room if it doesn't exist yet
    if (!gameId) {
      console.log("🏗️ [Creating room for first joiner]");
      socket.emit("createRoom", { roomId: "Main Room" });
    } else {
      console.log("📍 [User joining existing game]", {
        gameId,
        selectionTimeLeft,
      });
    }

    setRoomCreating(false);
  };

  // When phase transitions from selection to live, clear selection countdown
  // and initialize live countdown so timers don't bleed between phases
  useEffect(() => {
    if (phase === "live") {
      setSelectionCountdown(null);
      setSelectionTimeLeft(0);
      setLiveCountdown(5); // Start live draw countdown at 5 seconds
    } else if (phase === "selection") {
      setLiveCountdown(null);
      setSelectionCountdown(30);
    } else if (phase === "finished") {
      setSelectionCountdown(null);
      setLiveCountdown(null);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "selection") return;

    // Start countdown from 30 to 0
    const interval = setInterval(() => {
      setSelectionCountdown((prev) => {
        const newValue = prev - 1;
        if (newValue < 0) {
          return prev; // Don't go below 0
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Handle countdown reaching 0
  useEffect(() => {
    if (phase !== "selection" || selectionCountdown > 0) return;

    // Timer reached 0, check if user selected
    if (mySelections.length > 0) {
      // User selected a number, proceed to live phase
      lockSelections();
    } else {
      // User didn't select, reset timer to 30
      setSelectionCountdown(30);
    }
  }, [phase, selectionCountdown, mySelections]);

  // Update selectionTimeLeft whenever selectionCountdown changes
  useEffect(() => {
    if (phase === "selection") {
      setSelectionTimeLeft(selectionCountdown);
    }
  }, [selectionCountdown, phase]);

  useEffect(() => {
    if (!pendingStart || !gameId) return;
    if (pendingSelections.length === 0) return;

    flushPendingSelections(false);
    setPendingStart(false);
  }, [pendingStart, gameId, pendingSelections]);

  const joinButtonDisabled =
    phase === "live" ||
    gameStatus === "live" ||
    gameStatus === "finished" ||
    phase === "finished" ||
    (phase === "selection" && selectionTimeLeft <= 0);

  const joinButtonLabel =
    phase === "live" || gameStatus === "live"
      ? "Game in progress"
      : gameStatus === "finished" ||
          phase === "finished" ||
          (phase === "selection" && selectionTimeLeft <= 0)
        ? "Wait for next round"
        : "Join game";

  const statusText = phase === "selection" ? "Selection" : gameStatus;
  const currentStatus =
    phase === "selection"
      ? "waiting"
      : gameStatus === "finished"
        ? "finished"
        : "running";
  const showSelectionPanel = phase === "selection";
  const showLivePanel = phase === "live" && gameStatus === "live";
  const showLiveNumberCountdown = showLivePanel;
  const currentCountdownValue =
    phase === "live"
      ? (liveCountdown ?? countdownRemaining ?? drawTimeLeft)
      : (selectionCountdown ?? countdownRemaining ?? selectionTimeLeft);

  // ============================================================
  // Render UI - New Design
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col">
      {/* Header */}
      {phase === "selection" ? (
        <Header
          gameType="selection"
          timeLeft={Math.ceil(selectionCountdown || countdownRemaining || 30)}
          stake="10"
          balance="0.00"
        />
      ) : (
        <Header
          gameType="live"
          players={participants}
          called={calledNumbers.length}
          derash={1250}
          round="5/TECI"
          stake="10"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* SELECTION PHASE */}
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

        {/* LIVE PHASE */}
        {phase === "live" && (
          <LivePage
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
            cards={cards}
            selectionNumbers={selectionNumbers}
            accent={accent}
            selectedNumbersGlobal={selectedNumbersGlobal}
            mySelections={mySelections}
          />
        )}
      </div>

      {/* Winner Modal */}
      <WinnerModal
        open={Boolean(winner)}
        winner={winner || "Unknown Player"}
        luckyNumber={winningLuckyNumber}
        isCurrentUserWinner={
          winner === "You" ||
          (Array.isArray(winner) &&
            winner.some((w) => w?.telegramId === authUser?.telegramId))
        }
        onClose={() => {
          setWinner(null);
          setWinningLuckyNumber(null);
          resetRoundState(true);
        }}
        accent={accent}
      />
    </div>
  );
};

export default Bingo;
