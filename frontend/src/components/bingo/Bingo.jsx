import React, { useEffect, useRef, useState, useCallback } from "react";

import Header from "./Header";
import SelectionPage from "./SelectionPage";
import LivePage from "./LivePage";
import WinnerModal from "./WinnerModal";

import socket from "../../socket/socket";
import { useAuth } from "../../context/AuthContext";

const MAX_LUCKY_NUMBERS = 3;
const DEFAULT_SELECTION_TIME = 30;

const Bingo = ({ theme }) => {
  // ============================================================
  // THEME
  // ============================================================

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

  // ============================================================
  // AUTH
  // ============================================================

  const { user: authUser } = useAuth();

  // ============================================================
  // ROUND STATE
  // ============================================================

  const [roundStatus, setRoundStatus] = useState("WAITING");

  const [phase, setPhase] = useState("selection");

  // IMPORTANT:
  // This value ALWAYS comes from the server.
  //
  // DO NOT decrement this value locally.
  //
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_SELECTION_TIME,
  );

  const [participantCount, setParticipantCount] = useState(0);

  const [spectatorCount, setSpectatorCount] = useState(0);

  // All numbers selected by all players.
  const [selectedNumbersGlobal, setSelectedNumbersGlobal] = useState([]);

  // Numbers selected by this user.
  const [mySelections, setMySelections] = useState([]);

  const [calledNumbers, setCalledNumbers] = useState([]);

  const [currentNumber, setCurrentNumber] = useState(null);

  const [winner, setWinner] = useState(null);

  const [roundId, setRoundId] = useState(null);

  const [cards, setCards] = useState([]);

  const [isSpectator, setIsSpectator] = useState(false);

  const [hasJoinedRound, setHasJoinedRound] = useState(false);

  const [winnerCard, setWinnerCard] = useState(null);

  const [winnerName, setWinnerName] = useState("");

  const [winnerAmount, setWinnerAmount] = useState(0);

  const [noSelectionsMessage, setNoSelectionsMessage] = useState(null);

  // ============================================================
  // REFS
  // ============================================================

  const roundStatusRef = useRef("WAITING");

  const roundIdRef = useRef(null);

  const remainingSecondsRef = useRef(DEFAULT_SELECTION_TIME);

  const mySelectionsRef = useRef([]);

  const hasJoinedRoundRef = useRef(false);

  const requestRef = useRef(false);

  const autoJoinTriggeredRef = useRef(false);

  const winnerRef = useRef(null);

  // ============================================================
  // KEEP REFS UPDATED
  // ============================================================

  useEffect(() => {
    roundStatusRef.current = roundStatus;
  }, [roundStatus]);

  useEffect(() => {
    roundIdRef.current = roundId;
  }, [roundId]);

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    mySelectionsRef.current = mySelections;
  }, [mySelections]);

  useEffect(() => {
    hasJoinedRoundRef.current = hasJoinedRound;
  }, [hasJoinedRound]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  // ============================================================
  // HELPER: APPLY SERVER TIMER
  // ============================================================

  const updateServerTimer = useCallback((seconds) => {
    if (typeof seconds !== "number") {
      return;
    }

    const value = Math.max(0, Math.ceil(seconds));

    // Store server value.
    remainingSecondsRef.current = value;

    // Display server value.
    setRemainingSeconds(value);
  }, []);

  // ============================================================
  // HELPER: UPDATE ROUND ID
  // ============================================================

  const updateRoundId = useCallback((gameId) => {
    if (!gameId) {
      return;
    }

    roundIdRef.current = gameId;
    setRoundId(gameId);
  }, []);

  // ============================================================
  // AUTO JOIN
  //
  // Called automatically when the SERVER timer reaches 0.
  // ============================================================

  const autoJoinGame = useCallback(() => {
    console.log("⏰ SERVER TIMER FINISHED");

    // Already joined.
    if (hasJoinedRoundRef.current) {
      console.log("ℹ️ Already joined this round.");
      return;
    }

    // Already sent request.
    if (requestRef.current) {
      console.log("ℹ️ Join request already sent.");
      return;
    }

    // Must have authenticated user.
    if (!authUser?.telegramId) {
      console.warn("❌ Cannot auto join: user is not authenticated.");
      return;
    }

    // Must have game ID.
    const gameId = roundIdRef.current;

    if (!gameId) {
      console.warn("❌ Cannot auto join: no game ID.");
      return;
    }

    /*
     * IMPORTANT:
     *
     * The server should now move the game from:
     *
     * WAITING -> PLAYING
     *
     * after processing all selected players.
     *
     * We still send joinRoom here because the server needs
     * to convert the player's selection into a player/card.
     */

    requestRef.current = true;

    if (!socket.connected) {
      socket.connect();
    }

    const luckyNumbers = [...mySelectionsRef.current];

    console.log("🤖 AUTO JOIN");

    console.log({
      gameId,
      telegramId: authUser.telegramId,
      luckyNumbers,
    });

    socket.emit(
      "joinRoom",
      {
        gameId,

        telegramId: authUser.telegramId,

        betAmount: 1,

        luckyNumbers,
      },
      (response) => {
        requestRef.current = false;

        console.log("🤖 AUTO JOIN RESPONSE:", response);

        if (!response?.success) {
          console.error("❌ Automatic join failed:", response?.message);

          return;
        }

        console.log("✅ Automatically joined Bingo game.");

        setHasJoinedRound(true);

        hasJoinedRoundRef.current = true;

        setIsSpectator(Boolean(response.isSpectator));

        // --------------------------------------------------------
        // GLOBAL NUMBERS
        // --------------------------------------------------------

        if (Array.isArray(response.selectedNumbers)) {
          setSelectedNumbersGlobal(response.selectedNumbers);
        }

        // --------------------------------------------------------
        // PLAYER COUNT
        // --------------------------------------------------------

        if (typeof response.playerCount === "number") {
          setParticipantCount(response.playerCount);
        }

        // --------------------------------------------------------
        // SPECTATOR COUNT
        // --------------------------------------------------------

        if (typeof response.spectatorCount === "number") {
          setSpectatorCount(response.spectatorCount);
        }

        // --------------------------------------------------------
        // CARD
        // --------------------------------------------------------

        if (response.card) {
          setCards([response.card]);
        }

        if (Array.isArray(response.cards)) {
          setCards(response.cards);
        }
      },
    );
  }, [authUser?.telegramId]);

  // ============================================================
  // SYNC ROUND STATE
  // ============================================================

  const syncRoundState = useCallback(
    (payload) => {
      if (!payload) {
        return;
      }

      console.log("🎮 SERVER ROUND STATE:", payload);

      const status = String(payload.status || "WAITING").toUpperCase();

      // ----------------------------------------------------------
      // STATUS
      // ----------------------------------------------------------

      setRoundStatus(status);

      roundStatusRef.current = status;

      if (status === "WAITING" || status === "READY") {
        setPhase("selection");
      }

      if (status === "PLAYING" || status === "ACTIVE" || status === "LIVE") {
        setPhase("live");
      }

      if (status === "FINISHED" || status === "COMPLETED") {
        setPhase("finished");
      }

      // ----------------------------------------------------------
      // SERVER TIMER
      // ----------------------------------------------------------

      if (typeof payload.remainingSeconds === "number") {
        updateServerTimer(payload.remainingSeconds);
      }

      // ----------------------------------------------------------
      // PLAYER COUNT
      // ----------------------------------------------------------

      const players =
        payload.playerCount ??
        payload.participantCount ??
        payload.players?.length ??
        0;

      setParticipantCount(Number(players) || 0);

      // ----------------------------------------------------------
      // SPECTATOR COUNT
      // ----------------------------------------------------------

      if (typeof payload.spectatorCount === "number") {
        setSpectatorCount(payload.spectatorCount);
      }

      // ----------------------------------------------------------
      // SELECTED NUMBERS
      // ----------------------------------------------------------

      if (Array.isArray(payload.selectedNumbers)) {
        setSelectedNumbersGlobal(payload.selectedNumbers);
      }

      // ----------------------------------------------------------
      // CALLED NUMBERS
      // ----------------------------------------------------------

      if (Array.isArray(payload.calledNumbers)) {
        setCalledNumbers(payload.calledNumbers);
      }

      // ----------------------------------------------------------
      // CURRENT NUMBER
      // ----------------------------------------------------------

      setCurrentNumber(payload.currentNumber ?? null);

      // ----------------------------------------------------------
      // GAME ID
      // ----------------------------------------------------------

      if (payload.gameId) {
        updateRoundId(payload.gameId);
      }

      // ----------------------------------------------------------
      // WINNER
      // ----------------------------------------------------------

      if (payload.winner) {
        setWinner(payload.winner);

        winnerRef.current = payload.winner;
      }

      // ----------------------------------------------------------
      // IMPORTANT
      //
      // If server already says LIVE, never try to auto join
      // from the frontend timer.
      // ----------------------------------------------------------

      if (status === "PLAYING" || status === "ACTIVE" || status === "LIVE") {
        autoJoinTriggeredRef.current = true;
      }
    },
    [autoJoinGame, updateRoundId, updateServerTimer],
  );

  // ============================================================
  // SOCKET EVENTS
  // ============================================================

  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Bingo socket connected");
    };

    const handleConnectError = (error) => {
      console.error("❌ Bingo socket error:", error);
    };

    // ==========================================================
    // ROUND STATE
    // ==========================================================

    const handleRoundState = (payload) => {
      syncRoundState(payload);
    };

    // ==========================================================
    // SERVER SELECTION TIMER
    // ==========================================================

    const handleSelectionTick = (payload) => {
      if (!payload) {
        return;
      }

      console.log(
        "⏱️ SERVER TIMER:",
        payload.remainingSeconds,
        "GAME:",
        payload.gameId,
      );

      // --------------------------------------------------------
      // GAME ID
      // --------------------------------------------------------

      if (payload.gameId) {
        updateRoundId(payload.gameId);
      }

      // --------------------------------------------------------
      // SERVER TIMER
      // --------------------------------------------------------

      if (typeof payload.remainingSeconds === "number") {
        updateServerTimer(payload.remainingSeconds);
      }

      // --------------------------------------------------------
      // IMPORTANT
      //
      // The frontend does NOT do:
      //
      // setInterval(() => setTime(time - 1))
      //
      // The server is the only clock.
      // --------------------------------------------------------

      const seconds = Math.max(0, Math.ceil(payload.remainingSeconds ?? 0));

      // --------------------------------------------------------
      // SERVER TIMER FINISHED
      // --------------------------------------------------------

      if (seconds <= 0 && roundStatusRef.current === "WAITING") {
        console.log("🚨 SERVER TIMER = 0");

        if (!autoJoinTriggeredRef.current) {
          autoJoinTriggeredRef.current = true;

          autoJoinGame();
        }
      }
    };

    // ==========================================================
    // JOINED ROOM
    // ==========================================================

    const handleJoinedRoom = (payload) => {
      console.log("👤 JOINED ROOM:", payload);

      if (!payload?.success) {
        return;
      }

      requestRef.current = false;

      setHasJoinedRound(true);

      hasJoinedRoundRef.current = true;

      setIsSpectator(Boolean(payload.isSpectator));

      // --------------------------------------------------------
      // CARD
      // --------------------------------------------------------

      if (!payload.isSpectator) {
        const nextCards = Array.isArray(payload.cards)
          ? payload.cards
          : payload.card
            ? [payload.card]
            : [];

        if (nextCards.length > 0) {
          setCards(nextCards);
        }
      } else {
        setCards([]);
      }

      // --------------------------------------------------------
      // SELECTED NUMBERS
      // --------------------------------------------------------

      if (Array.isArray(payload.selectedNumbers)) {
        setSelectedNumbersGlobal(payload.selectedNumbers);
      }

      // --------------------------------------------------------
      // PLAYER COUNT
      // --------------------------------------------------------

      if (typeof payload.playerCount === "number") {
        setParticipantCount(payload.playerCount);
      }

      // --------------------------------------------------------
      // SPECTATOR COUNT
      // --------------------------------------------------------

      if (typeof payload.spectatorCount === "number") {
        setSpectatorCount(payload.spectatorCount);
      }

      // --------------------------------------------------------
      // GAME ID
      // --------------------------------------------------------

      if (payload.gameId) {
        updateRoundId(payload.gameId);
      }
    };

    // ==========================================================
    // PLAYER CARD
    // ==========================================================

    const handlePlayerCard = (payload) => {
      if (!payload) {
        return;
      }

      if (isSpectator) {
        return;
      }

      const nextCards = Array.isArray(payload.cards)
        ? payload.cards
        : payload.card
          ? [payload.card]
          : [];

      if (nextCards.length > 0) {
        setCards(nextCards);
      }
    };

    // ==========================================================
    // NUMBER CALLED
    // ==========================================================

    const handleNumberCalled = (payload) => {
      if (!payload) {
        return;
      }

      if (typeof payload.number === "number") {
        setCurrentNumber(payload.number);
      }

      if (Array.isArray(payload.calledNumbers)) {
        setCalledNumbers(payload.calledNumbers);
      }
    };

    // ==========================================================
    // GAME STARTED
    // ==========================================================

    const handleGameStarted = (payload) => {
      console.log("🚀 GAME STARTED:", payload);

      setRoundStatus("PLAYING");

      roundStatusRef.current = "PLAYING";

      setPhase("live");

      updateServerTimer(0);

      setNoSelectionsMessage(null);

      if (Array.isArray(payload?.calledNumbers)) {
        setCalledNumbers(payload.calledNumbers);
      }

      setCurrentNumber(payload?.currentNumber ?? null);

      if (typeof payload?.playerCount === "number") {
        setParticipantCount(payload.playerCount);
      }
    };

    // ==========================================================
    // ROUND RESET
    // ==========================================================

    const handleRoundReset = (payload) => {
      console.log("🔄 ROUND RESET:", payload);

      setRoundStatus("WAITING");

      roundStatusRef.current = "WAITING";

      setPhase("selection");

      setRemainingSeconds(
        typeof payload?.remainingSeconds === "number"
          ? Math.ceil(payload.remainingSeconds)
          : DEFAULT_SELECTION_TIME,
      );

      remainingSecondsRef.current =
        typeof payload?.remainingSeconds === "number"
          ? Math.ceil(payload.remainingSeconds)
          : DEFAULT_SELECTION_TIME;

      setParticipantCount(0);

      setSpectatorCount(0);

      setSelectedNumbersGlobal([]);

      setCalledNumbers([]);

      setCurrentNumber(null);

      setWinner(null);

      winnerRef.current = null;

      setWinnerCard(null);

      setWinnerName("");

      setWinnerAmount(0);

      setMySelections([]);

      mySelectionsRef.current = [];

      setCards([]);

      setHasJoinedRound(false);

      hasJoinedRoundRef.current = false;

      setIsSpectator(false);

      requestRef.current = false;

      autoJoinTriggeredRef.current = false;

      setNoSelectionsMessage(null);

      if (payload?.gameId) {
        updateRoundId(payload.gameId);
      }
    };

    // ==========================================================
    // NO SELECTIONS
    // ==========================================================

    const handleNoSelections = (payload) => {
      console.log("⚠️ NO SELECTIONS:", payload);

      setNoSelectionsMessage({
        message: payload?.message || "No players selected cards.",
        remainingSeconds: payload?.remainingSeconds ?? DEFAULT_SELECTION_TIME,
      });
    };

    // ==========================================================
    // WINNER
    // ==========================================================

    const handleWinner = (payload) => {
      console.log("🏆 WINNER:", payload);

      if (!payload) {
        return;
      }

      const winnerData = payload.winner || payload.winners?.[0] || null;

      if (!winnerData) {
        return;
      }

      winnerRef.current = winnerData;

      setWinner(winnerData);

      setWinnerName(
        payload.winnerName ||
          winnerData.firstName ||
          winnerData.username ||
          "Winner",
      );

      setWinnerCard(payload.winnerCard || winnerData.card || null);

      setWinnerAmount(payload.winAmount ?? winnerData.winAmount ?? 0);

      if (Array.isArray(payload.calledNumbers)) {
        setCalledNumbers(payload.calledNumbers);
      }

      setRoundStatus("FINISHED");

      roundStatusRef.current = "FINISHED";

      setPhase("finished");

      updateServerTimer(0);
    };

    // ==========================================================
    // ROUND FINISHED
    // ==========================================================

    const handleRoundFinished = (payload) => {
      console.log("🏁 ROUND FINISHED:", payload);

      if (payload?.winner) {
        handleWinner(payload);
      } else {
        setRoundStatus("FINISHED");

        roundStatusRef.current = "FINISHED";

        setPhase("finished");

        updateServerTimer(0);
      }
    };

    // ==========================================================
    // NEXT ROUND
    // ==========================================================

    const handleNextRound = (payload) => {
      console.log("🔄 NEXT ROUND:", payload);

      winnerRef.current = null;

      setWinner(null);

      setWinnerCard(null);

      setWinnerName("");

      setWinnerAmount(0);

      setMySelections([]);

      mySelectionsRef.current = [];

      setCards([]);

      setCalledNumbers([]);

      setCurrentNumber(null);

      setSelectedNumbersGlobal([]);

      setParticipantCount(0);

      setSpectatorCount(0);

      setHasJoinedRound(false);

      hasJoinedRoundRef.current = false;

      setIsSpectator(false);

      requestRef.current = false;

      autoJoinTriggeredRef.current = false;

      setNoSelectionsMessage(null);

      if (payload?.gameId) {
        updateRoundId(payload.gameId);
      }

      setRoundStatus("WAITING");

      roundStatusRef.current = "WAITING";

      setPhase("selection");

      updateServerTimer(
        typeof payload?.remainingSeconds === "number"
          ? payload.remainingSeconds
          : DEFAULT_SELECTION_TIME,
      );
    };

    // ==========================================================
    // REGISTER EVENTS
    // ==========================================================

    socket.on("connect", handleConnect);

    socket.on("connect_error", handleConnectError);

    socket.on("bingo:roundState", handleRoundState);

    socket.on("bingo:selectionTick", handleSelectionTick);

    socket.on("joinedRoom", handleJoinedRoom);

    socket.on("playerCard", handlePlayerCard);

    socket.on("bingo:numberCalled", handleNumberCalled);

    socket.on("bingo:gameStarted", handleGameStarted);

    socket.on("bingo:roundReset", handleRoundReset);

    socket.on("bingo:noSelections", handleNoSelections);

    socket.on("bingo:winner", handleWinner);

    socket.on("bingo:roundFinished", handleRoundFinished);

    socket.on("bingo:nextRound", handleNextRound);

    // ==========================================================
    // CONNECT
    // ==========================================================

    if (!socket.connected) {
      socket.connect();
    }

    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {
      socket.off("connect", handleConnect);

      socket.off("connect_error", handleConnectError);

      socket.off("bingo:roundState", handleRoundState);

      socket.off("bingo:selectionTick", handleSelectionTick);

      socket.off("joinedRoom", handleJoinedRoom);

      socket.off("playerCard", handlePlayerCard);

      socket.off("bingo:numberCalled", handleNumberCalled);

      socket.off("bingo:gameStarted", handleGameStarted);

      socket.off("bingo:roundReset", handleRoundReset);

      socket.off("bingo:noSelections", handleNoSelections);

      socket.off("bingo:winner", handleWinner);

      socket.off("bingo:roundFinished", handleRoundFinished);

      socket.off("bingo:nextRound", handleNextRound);
    };
  }, [
    isSpectator,
    syncRoundState,
    updateRoundId,
    updateServerTimer,
    autoJoinGame,
  ]);

  // ============================================================
  // SELECT / DESELECT LUCKY NUMBER
  // ============================================================

  const toggleLuckyNumber = useCallback(
    (number) => {
      console.log("🎯 SELECT NUMBER:", number);

      // --------------------------------------------------------
      // ROUND MUST BE WAITING
      // --------------------------------------------------------

      if (roundStatusRef.current !== "WAITING") {
        console.log("❌ Selection phase closed.");

        return;
      }

      // --------------------------------------------------------
      // SERVER TIMER
      // --------------------------------------------------------

      if (remainingSecondsRef.current <= 0) {
        console.log("❌ Selection timer expired.");

        return;
      }

      // --------------------------------------------------------
      // AUTH
      // --------------------------------------------------------

      if (!authUser?.telegramId) {
        console.warn("❌ Telegram user not authenticated.");

        return;
      }

      // --------------------------------------------------------
      // GAME ID
      // --------------------------------------------------------

      if (!roundIdRef.current) {
        console.warn("❌ No active Bingo game.");

        return;
      }

      // --------------------------------------------------------
      // CURRENT SELECTIONS
      // --------------------------------------------------------

      const currentSelections = mySelectionsRef.current;

      // --------------------------------------------------------
      // DESELECT
      // --------------------------------------------------------

      if (currentSelections.includes(number)) {
        console.log("↩️ Deselect:", number);

        const nextSelections = currentSelections.filter(
          (item) => item !== number,
        );

        mySelectionsRef.current = nextSelections;

        setMySelections(nextSelections);

        /*
         * Optional backend support.
         *
         * If your backend implements this event,
         * it will release the number globally.
         */

        socket.emit("deselectLuckyNumber", {
          gameId: roundIdRef.current,

          telegramId: authUser.telegramId,

          number,
        });

        return;
      }

      // --------------------------------------------------------
      // MAX 3
      // --------------------------------------------------------

      if (currentSelections.length >= MAX_LUCKY_NUMBERS) {
        console.log(`❌ Maximum ${MAX_LUCKY_NUMBERS} numbers allowed.`);

        return;
      }

      // --------------------------------------------------------
      // NUMBER RESERVED BY SOMEONE
      // --------------------------------------------------------

      if (selectedNumbersGlobal.includes(number)) {
        console.log("❌ Number already selected by another player.");

        return;
      }

      // --------------------------------------------------------
      // SOCKET
      // --------------------------------------------------------

      if (!socket.connected) {
        socket.connect();
      }

      // --------------------------------------------------------
      // SEND SELECTION TO SERVER
      // --------------------------------------------------------

      socket.emit(
        "selectLuckyNumber",
        {
          gameId: roundIdRef.current,

          telegramId: authUser.telegramId,

          number,

          betAmount: 1,
        },
        (response) => {
          console.log("🎯 SERVER SELECTION RESPONSE:", response);

          if (!response?.success) {
            console.error("❌ Number selection failed:", response?.message);

            return;
          }

          // ----------------------------------------------------
          // SERVER CONFIRMED
          // ----------------------------------------------------

          setMySelections((previous) => {
            if (previous.includes(number)) {
              return previous;
            }

            const next = [...previous, number];

            mySelectionsRef.current = next;

            return next;
          });

          // ----------------------------------------------------
          // SERVER GLOBAL NUMBERS
          // ----------------------------------------------------

          if (Array.isArray(response.selectedNumbers)) {
            setSelectedNumbersGlobal(response.selectedNumbers);
          }

          console.log("✅ Lucky number selected:", number);
        },
      );
    },
    [authUser?.telegramId, selectedNumbersGlobal],
  );

  // ============================================================
  // AUTO SPECTATOR
  //
  // If the user did NOT select any number when the server
  // closes selection, the backend can treat them as spectator.
  //
  // This is optional depending on your backend.
  // ============================================================

  const autoJoinAsSpectator = useCallback(() => {
    if (hasJoinedRoundRef.current) {
      return;
    }

    if (!authUser?.telegramId) {
      return;
    }

    if (!roundIdRef.current) {
      return;
    }

    if (requestRef.current) {
      return;
    }

    requestRef.current = true;

    if (!socket.connected) {
      socket.connect();
    }

    console.log("👀 AUTO JOIN AS SPECTATOR");

    socket.emit(
      "joinRoom",
      {
        gameId: roundIdRef.current,

        telegramId: authUser.telegramId,

        betAmount: 0,

        luckyNumbers: [],
      },
      (response) => {
        requestRef.current = false;

        if (!response?.success) {
          console.error("❌ Spectator auto join failed:", response?.message);

          return;
        }

        setHasJoinedRound(true);

        hasJoinedRoundRef.current = true;

        setIsSpectator(true);

        setCards([]);

        if (typeof response.playerCount === "number") {
          setParticipantCount(response.playerCount);
        }

        if (typeof response.spectatorCount === "number") {
          setSpectatorCount(response.spectatorCount);
        }
      },
    );
  }, [authUser?.telegramId]);

  // ============================================================
  // WHEN TIMER IS ZERO
  //
  // Automatically join:
  //
  // 1. Player if they selected lucky numbers.
  // 2. Spectator if they selected nothing.
  //
  // IMPORTANT:
  // The trigger is based on SERVER'S value.
  // ============================================================

  useEffect(() => {
    if (remainingSeconds !== 0) {
      return;
    }

    if (roundStatusRef.current !== "WAITING") {
      return;
    }

    if (hasJoinedRoundRef.current) {
      return;
    }

    if (autoJoinTriggeredRef.current) {
      return;
    }

    autoJoinTriggeredRef.current = true;

    if (mySelectionsRef.current.length > 0) {
      autoJoinGame();
    } else {
      autoJoinAsSpectator();
    }
  }, [remainingSeconds, autoJoinGame, autoJoinAsSpectator]);

  // ============================================================
  // DERIVED VALUES
  // ============================================================

  const canSelectMore =
    roundStatus === "WAITING" &&
    remainingSeconds > 0 &&
    mySelections.length < MAX_LUCKY_NUMBERS;

  // NO JOIN BUTTON ANYMORE.
  //
  // This value is kept only in case another component needs it.
  //

  const joinButtonDisabled = true;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col">
      {/* ======================================================
          HEADER
      ====================================================== */}

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

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <main className="flex-1 overflow-auto p-4">
        {/* ====================================================
            SELECTION
        ==================================================== */}

        {phase === "selection" && (
          <SelectionPage
            selectionCountdown={remainingSeconds}
            calledNumbers={calledNumbers}
            selectedNumbersGlobal={selectedNumbersGlobal}
            mySelections={mySelections}
            canSelectMore={canSelectMore}
            showSelectionPanel={
              roundStatus === "WAITING" && remainingSeconds > 0
            }
            toggleLuckyNumber={toggleLuckyNumber}
            /*
             * No join button.
             */
            joinButtonDisabled={joinButtonDisabled}
            /*
             * Empty function because joining
             * happens automatically.
             */
            handleJoin={() => {}}
          />
        )}

        {/* ====================================================
            LIVE
        ==================================================== */}

        {phase === "live" && (
          <LivePage
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
            cards={isSpectator ? [] : cards}
            selectionNumbers={mySelections}
            accent={accent}
            isSpectator={isSpectator}
            spectatorCount={spectatorCount}
          />
        )}

        {/* ====================================================
            FINISHED
        ==================================================== */}

        {phase === "finished" && (
          <div className="min-h-[300px] flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>

              <h2 className="text-2xl font-bold">Round Finished</h2>

              {winnerName && (
                <p className="text-emerald-300 font-bold mt-3">
                  Winner: {winnerName}
                </p>
              )}

              {winnerAmount > 0 && (
                <p className="text-amber-300 mt-2">Prize: {winnerAmount}</p>
              )}

              <p className="text-slate-400 mt-2">Preparing the next round...</p>

              <p className="text-slate-500 text-sm mt-2">
                Numbers called: {calledNumbers.length}
                /75
              </p>

              {winnerCard && (
                <div className="mt-6">
                  <p className="text-slate-300 mb-3">Winning Card</p>

                  <div className="inline-grid grid-cols-5 gap-1">
                    {winnerCard.flat().map((number, index) => (
                      <div
                        key={`${number}-${index}`}
                        className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold ${
                          number === 0
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-800 text-white"
                        }`}
                      >
                        {number === 0 ? "★" : number}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================
          NO SELECTIONS
      ====================================================== */}

      {noSelectionsMessage && (
        <div className="fixed bottom-20 left-0 right-0 mx-4 bg-amber-900/80 border border-amber-600 rounded-lg p-4 shadow-lg backdrop-blur">
          <div className="max-w-md mx-auto">
            <p className="text-amber-100 font-semibold text-sm">
              ⚠️ {noSelectionsMessage.message}
            </p>

            <p className="text-amber-200 text-xs mt-2">
              Waiting for next round...
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          WINNER MODAL
      ====================================================== */}

      <WinnerModal
        open={Boolean(winner)}
        winner={winner || "Unknown Player"}
        luckyNumber={mySelections[0] ?? null}
        isCurrentUserWinner={
          typeof winner === "object" &&
          winner?.telegramId === authUser?.telegramId
        }
        onClose={() => {
          setWinner(null);

          winnerRef.current = null;
        }}
        accent={accent}
      />
    </div>
  );
};

export default Bingo;
