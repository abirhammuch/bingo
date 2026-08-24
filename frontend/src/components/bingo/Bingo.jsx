import React, { useEffect, useRef, useState, useCallback } from "react";

import Header from "./Header";
import SelectionPage from "./SelectionPage";
import LivePage from "./LivePage";
import WinnerModal from "./WinnerModal";

import socket, { authenticateTelegram } from "../../socket/socket";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance } from "../../services/userService";
import { speakCalledNumber, speakWinner } from "../../utils/amharicNumberVoice";

const MAX_LUCKY_NUMBERS = 3;
const DEFAULT_SELECTION_TIME = 30;

const Bingo = ({ theme, onBlocked }) => {
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

  const { user: authUser, updateUserBalance } = useAuth();

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

  const [selectionEndsAt, setSelectionEndsAt] = useState(null);

  const [participantCount, setParticipantCount] = useState(0);

  const [stakeAmount, setStakeAmount] = useState(10);

  const [prizePool, setPrizePool] = useState(0);

  const [spectatorCount, setSpectatorCount] = useState(0);

  // All numbers selected by all players.
  const [selectedNumbersGlobal, setSelectedNumbersGlobal] = useState([]);

  // Numbers selected by this user.
  const [mySelections, setMySelections] = useState([]);

  const [calledNumbers, setCalledNumbers] = useState([]);

  const [currentNumber, setCurrentNumber] = useState(null);

  const [winner, setWinner] = useState(null);
  const [winners, setWinners] = useState([]);

  const [roundId, setRoundId] = useState(null);

  const [cards, setCards] = useState([]);

  const [isSpectator, setIsSpectator] = useState(false);

  const [winnerCard, setWinnerCard] = useState(null);

  const [winnerName, setWinnerName] = useState("");

  const [winnerAmount, setWinnerAmount] = useState(0);

  const [noSelectionsMessage, setNoSelectionsMessage] = useState(null);

  const [selectionError, setSelectionError] = useState("");

  const [toastMessage, setToastMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ============================================================
  // REFS
  // ============================================================

  const roundStatusRef = useRef("WAITING");

  const roundIdRef = useRef(null);

  const balanceRoundRef = useRef(null);

  const remainingSecondsRef = useRef(DEFAULT_SELECTION_TIME);

  const mySelectionsRef = useRef([]);

  const winnerRef = useRef(null);
  const soundEnabledRef = useRef(true);
  const announcedNumberRef = useRef(null);

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
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timeout = setTimeout(() => setToastMessage(""), 3000);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = useCallback((message) => {
    setToastMessage(message);
  }, []);

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

  const refreshWalletBalance = useCallback(
    (gameId = null) => {
      if (!authUser?.telegramId) return;

      const roundKey = gameId ? String(gameId) : null;
      if (roundKey && balanceRoundRef.current === roundKey) return;

      if (roundKey) {
        balanceRoundRef.current = roundKey;
      }

      getUserBalance(authUser.telegramId)
        .then((response) => {
          const balance = Number(response?.balance);
          if (Number.isFinite(balance)) {
            updateUserBalance(balance);
          }
        })
        .catch((error) => {
          console.error("Failed to refresh wallet balance for round:", error);
        });
    },
    [authUser?.telegramId, updateUserBalance],
  );

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
        setWinner(null);
        setWinners([]);
        winnerRef.current = null;
        setWinnerCard(null);
        setWinnerName("");
        setWinnerAmount(0);
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

      if (payload.selectionEndsAt) {
        setSelectionEndsAt(payload.selectionEndsAt);
      }

      if (payload.stakeAmount !== undefined) {
        setStakeAmount(Number(payload.stakeAmount));
      }

      if (payload.prizePool !== undefined) {
        setPrizePool(Number(payload.prizePool) || 0);
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

      if (payload.winner || Array.isArray(payload.winners)) {
        const stateWinners = Array.isArray(payload.winners)
          ? payload.winners
          : [payload.winner];
        const firstWinner = stateWinners[0];
        setWinner(firstWinner);
        setWinners(stateWinners);
        winnerRef.current = firstWinner;
        setWinnerCard(firstWinner?.card?.length ? firstWinner.card : null);
        setWinnerName(
          firstWinner?.firstName || firstWinner?.username || "Winner",
        );
        setWinnerAmount(Number(firstWinner?.winAmount || 0));
      }

      // ----------------------------------------------------------
      // IMPORTANT
      //
      // If server already says LIVE, never try to auto join
      // from the frontend timer.
      // ----------------------------------------------------------
    },
    [updateRoundId, updateServerTimer],
  );

  // ============================================================
  // SOCKET EVENTS
  // ============================================================

  useEffect(() => {
    const initData = window?.Telegram?.WebApp?.initData;
    if (initData) authenticateTelegram(initData);

    const handleConnect = () => {
      console.log("✅ Bingo socket connected");
      socket.emit("bingo:getCurrentRound", {
        roomId: "default-bingo-room",
      });
    };

    const handleConnectError = (error) => {
      console.error("❌ Bingo socket error:", error);
      if (error?.message === "CHEATING_IS_BAD") {
        setIsBlocked(true);
        onBlocked?.();
        socket.disconnect();
      }
    };

    // ==========================================================
    // ROUND STATE
    // ==========================================================

    const handleRoundState = (payload) => {
      refreshWalletBalance(payload?.gameId);
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

      if (payload.selectionEndsAt) {
        setSelectionEndsAt(payload.selectionEndsAt);
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
    };

    // ==========================================================
    // PLAYER CARD
    // ==========================================================

    const handlePlayerCard = (payload) => {
      if (!payload) {
        return;
      }

      const playerCards = Array.isArray(payload.playerCards)
        ? payload.playerCards
            .filter(
              (entry) =>
                String(entry.telegramId) === String(authUser?.telegramId),
            )
            .flatMap((entry) =>
              Array.isArray(entry.cards)
                ? entry.cards
                : entry.card
                  ? [entry.card]
                  : [],
            )
        : [];

      const nextCards =
        playerCards.length > 0
          ? playerCards
          : Array.isArray(payload.cards)
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
        const announcementKey = `${payload.gameId || roundIdRef.current || "round"}:${payload.number}`;
        if (announcedNumberRef.current !== announcementKey) {
          announcedNumberRef.current = announcementKey;
          setCurrentNumber(payload.number);
          if (soundEnabledRef.current) speakCalledNumber(payload.number);
        }
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

      if (payload?.prizePool !== undefined) {
        setPrizePool(Number(payload.prizePool) || 0);
      }

      setSelectionEndsAt(null);
    };

    // ==========================================================
    // ROUND RESET
    // ==========================================================

    const handleRoundReset = (payload) => {
      console.log("🔄 ROUND RESET:", payload);

      refreshWalletBalance(payload?.gameId);

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

      setPrizePool(0);

      setSpectatorCount(0);

      setSelectedNumbersGlobal([]);

      setSelectionEndsAt(payload?.selectionEndsAt || null);

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

      setIsSpectator(false);

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

      const normalizedWinner = {
        ...winnerData,
        card: winnerData.card || payload.winnerCard || [],
        bingoResult: winnerData.bingoResult || payload.bingoResult || null,
      };
      const normalizedWinners = Array.isArray(payload.winners)
        ? payload.winners.map((entry) => ({
            ...entry,
            card: entry.card || [],
            bingoResult: entry.bingoResult || null,
          }))
        : [normalizedWinner];

      winnerRef.current = normalizedWinner;

      setWinner(normalizedWinner);
      setWinners(normalizedWinners);

      setWinnerName(
        payload.winnerName ||
          normalizedWinner.firstName ||
          normalizedWinner.username ||
          "Winner",
      );

      setWinnerCard(
        normalizedWinner.card?.length ? normalizedWinner.card : null,
      );

      setWinnerAmount(payload.winAmount ?? normalizedWinner.winAmount ?? 0);

      if (Array.isArray(payload.calledNumbers)) {
        setCalledNumbers(payload.calledNumbers);
      }

      setRoundStatus("FINISHED");

      roundStatusRef.current = "FINISHED";

      setPhase("finished");

      updateServerTimer(0);

      if (soundEnabledRef.current) speakWinner();
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

      refreshWalletBalance(payload?.gameId);

      winnerRef.current = null;

      setWinner(null);
      setWinners([]);

      setWinnerCard(null);

      setWinnerName("");

      setWinnerAmount(0);

      setMySelections([]);

      mySelectionsRef.current = [];

      setCards([]);

      setCalledNumbers([]);

      setCurrentNumber(null);

      setSelectedNumbersGlobal([]);

      setSelectionEndsAt(payload?.selectionEndsAt || null);

      setParticipantCount(0);

      setSpectatorCount(0);

      setIsSpectator(false);

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

    socket.on("bingo:numberSelected", (payload) => {
      if (!payload) return;
      const globalSelections =
        payload.selectedNumbersGlobal || payload.selectedNumbers;

      if (Array.isArray(globalSelections)) {
        setSelectedNumbersGlobal(globalSelections);
      }

      if (
        String(payload.telegramId) === String(authUser?.telegramId) &&
        Array.isArray(payload.selectedNumbers)
      ) {
        mySelectionsRef.current = payload.selectedNumbers;
        setMySelections(payload.selectedNumbers);
      }

      if (typeof payload.playerCount === "number") {
        setParticipantCount(payload.playerCount);
      }
    });

    socket.on("bingo:selectionUpdated", (payload) => {
      if (!payload) return;

      if (Array.isArray(payload.selectedNumbers)) {
        setSelectedNumbersGlobal(payload.selectedNumbers);
      }

      if (
        String(payload.telegramId) === String(authUser?.telegramId) &&
        Array.isArray(payload.mySelections)
      ) {
        mySelectionsRef.current = payload.mySelections;
        setMySelections(payload.mySelections);
      }
    });

    socket.on("bingo:playerCards", handlePlayerCard);

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

    if (socket.connected) {
      handleConnect();
    } else {
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

      socket.off("bingo:numberSelected");

      socket.off("bingo:selectionUpdated");

      socket.off("bingo:playerCards", handlePlayerCard);

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
    authUser?.telegramId,
    refreshWalletBalance,
    syncRoundState,
    updateRoundId,
    updateServerTimer,
  ]);

  // ============================================================
  // SELECT / DESELECT LUCKY NUMBER
  // ============================================================

  const toggleLuckyNumber = useCallback(
    (number) => {
      console.log("🎯 SELECT NUMBER:", number);
      setSelectionError("");

      // --------------------------------------------------------
      // ROUND MUST BE WAITING
      // --------------------------------------------------------

      if (roundStatusRef.current !== "WAITING") {
        console.log("❌ Selection phase closed.");
        setSelectionError("Number selection is not open for this round yet.");

        return;
      }

      // --------------------------------------------------------
      // SERVER TIMER
      // --------------------------------------------------------

      if (remainingSecondsRef.current <= 0) {
        console.log("❌ Selection timer expired.");
        setSelectionError(
          "The selection timer has expired. Please wait for the next round.",
        );

        return;
      }

      // --------------------------------------------------------
      // AUTH
      // --------------------------------------------------------

      if (!authUser?.telegramId) {
        console.warn("❌ Telegram user not authenticated.");
        setSelectionError(
          "Please log in with Telegram before selecting a number.",
        );

        return;
      }

      // --------------------------------------------------------
      // GAME ID
      // --------------------------------------------------------

      if (!roundIdRef.current) {
        console.warn("❌ No active Bingo game.");
        setSelectionError("No active Bingo round is available.");

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

        socket.emit(
          "deselectLuckyNumber",
          {
            gameId: roundIdRef.current,
            telegramId: authUser.telegramId,
            number,
          },
          (response) => {
            if (!response?.success) {
              console.error("❌ Number deselection failed:", response?.message);
              return;
            }

            const confirmedSelections = Array.isArray(response.selectedNumbers)
              ? response.selectedNumbers
              : nextSelections;

            mySelectionsRef.current = confirmedSelections;
            setMySelections(confirmedSelections);

            if (typeof response.balance === "number") {
              updateUserBalance(response.balance);
            }
          },
        );

        return;
      }

      // --------------------------------------------------------
      // MAX 3
      // --------------------------------------------------------

      if (currentSelections.length >= MAX_LUCKY_NUMBERS) {
        console.log(`❌ Maximum ${MAX_LUCKY_NUMBERS} numbers allowed.`);

        return;
      }

      if (Number(authUser.balance ?? 0) < Number(stakeAmount)) {
        showToast("Insufficient balance");
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
            if (
              response?.code === "INSUFFICIENT_BALANCE" ||
              response?.message?.toLowerCase().includes("insufficient")
            ) {
              showToast("Insufficient balance");
            }
            setSelectionError(
              response?.message || "The server rejected this number.",
            );

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

          if (Array.isArray(response.selectedNumbersGlobal)) {
            setSelectedNumbersGlobal(response.selectedNumbersGlobal);
          }

          if (typeof response.balance === "number") {
            updateUserBalance(response.balance);
          }

          console.log("✅ Lucky number selected:", number);
        },
      );
    },
    [
      authUser,
      selectedNumbersGlobal,
      showToast,
      stakeAmount,
      updateUserBalance,
    ],
  );

  // ============================================================
  // DERIVED VALUES
  // ============================================================

  const canSelectMore =
    roundStatus === "WAITING" &&
    remainingSeconds > 0 &&
    mySelections.length < MAX_LUCKY_NUMBERS;

  const isWinningCell = (rowIndex, columnIndex) => {
    const result = winner?.bingoResult;
    const position = result?.position ?? result?.index;

    if (!result?.bingo) return false;
    if (result.type === "row") return rowIndex === position;
    if (result.type === "column") return columnIndex === position;
    if (result.type === "diagonal") {
      const direction = result.direction?.replaceAll(" ", "-");
      return direction === "top-left-to-bottom-right"
        ? rowIndex === columnIndex
        : rowIndex + columnIndex === 4;
    }

    return false;
  };

  // ============================================================
  // UI
  // ============================================================

  if (isBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div>
          <div className="mb-4 text-5xl">🚫</div>
          <h1 className="text-2xl font-bold">Cheating is bad!</h1>
          <p className="mt-2 text-slate-400">
            Your account has been blocked and the game has been closed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 to-slate-900 flex flex-col">
      {toastMessage && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-rose-400/40 bg-rose-950 px-4 py-3 text-sm font-semibold text-rose-100 shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* ======================================================
          HEADER
      ====================================================== */}

      {roundStatus === "WAITING" ? (
        <Header
          gameType="selection"
          timeLeft={Math.max(0, remainingSeconds)}
          stake={stakeAmount}
          balance={authUser?.balance ?? 0}
          selectionEndsAt={selectionEndsAt}
          selectedCardsCount={mySelections.length}
        />
      ) : (
        <Header
          gameType="live"
          players={participantCount}
          called={calledNumbers.length}
          derash={prizePool}
          round="LIVE"
          stake={stakeAmount}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
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
            selectionEndsAt={selectionEndsAt}
            calledNumbers={calledNumbers}
            selectedNumbersGlobal={selectedNumbersGlobal}
            mySelections={mySelections}
            canSelectMore={canSelectMore}
            showSelectionPanel={
              roundStatus === "WAITING" && remainingSeconds > 0
            }
            toggleLuckyNumber={toggleLuckyNumber}
            selectionError={selectionError}
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
          <div className="min-h-75 flex items-center justify-center text-white">
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

                  <div className="inline-grid grid-cols-5 gap-1 mb-1 w-full max-w-xs">
                    {["B", "I", "N", "G", "O"].map((letter) => (
                      <div
                        key={letter}
                        className="text-center text-xs font-bold text-emerald-300"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  <div className="inline-grid grid-cols-5 gap-1">
                    {winnerCard.flat().map((number, index) => {
                      const rowIndex = Math.floor(index / 5);
                      const columnIndex = index % 5;
                      const value = number?.value ?? number;
                      const isCalled =
                        value !== 0 && calledNumbers.includes(Number(value));

                      return (
                        <div
                          key={`${value}-${index}`}
                          className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold ${
                            isWinningCell(rowIndex, columnIndex)
                              ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-200"
                              : isCalled
                                ? "bg-sky-500 text-white ring-2 ring-sky-200"
                                : value === 0
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-800 text-white"
                          }`}
                        >
                          {value === 0 ? "★" : value}
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-3 max-w-xs mx-auto text-sm leading-6 text-slate-400">
                    Winning card numbers:{" "}
                    {winnerCard
                      .flat()
                      .map((number) => {
                        const value = number?.value ?? number;
                        return value === 0 ? "FREE" : value;
                      })
                      .join(", ")}
                  </p>
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
        open={Boolean(winner) && phase === "finished"}
        winner={winner || "Unknown Player"}
        winners={winners}
        isCurrentUserWinner={winners.some(
          (entry) => String(entry?.telegramId) === String(authUser?.telegramId),
        )}
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
