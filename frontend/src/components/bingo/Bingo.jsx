import React, { useEffect, useRef, useState } from "react";

import Header from "./Header";
import SelectionPage from "./SelectionPage";
import LivePage from "./LivePage";
import WinnerModal from "./WinnerModal";

import socket from "../../socket/socket";
import { useAuth } from "../../context/AuthContext";
import { post } from "../../utils/apiClient";

const createBingoGame = async (roomId = "default-room") => {
  try {
    const data = await post("/api/bingo/create", {
      roomId,
      maxPlayers: 100,
      minBet: 1,
      maxBet: 100,
    });

    if (!data.success) {
      console.error("❌ Failed to create bingo game:", data.message);
      return null;
    }

    console.log("✅ Bingo game created:", data.game.gameId);
    return data.game;
  } catch (error) {
    console.error("❌ Error creating bingo game:", error);
    return null;
  }
};

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

  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_SELECTION_TIME,
  );

  const [participantCount, setParticipantCount] = useState(0);

  const [spectatorCount, setSpectatorCount] = useState(0);

  // All players' selected numbers
  const [selectedNumbersGlobal, setSelectedNumbersGlobal] = useState([]);

  // Current user's selected numbers
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

  const winnerRef = useRef(null);

  const requestRef = useRef(false);

  const isSpectatorRef = useRef(false);

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
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    isSpectatorRef.current = isSpectator;
  }, [isSpectator]);

  // ============================================================
  // AUTO-CREATE GAME ON LOAD
  // ============================================================

  useEffect(() => {
    if (!authUser?.telegramId || roundId) {
      return; // User not authenticated or game already exists
    }

    const initializeGame = async () => {
      console.log(
        "🎮 [INIT] Creating new Bingo game for user:",
        authUser.telegramId,
      );

      const game = await createBingoGame("default-bingo-room");

      if (!game) {
        return;
      }

      const remainingSeconds = game.selectionEndsAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(game.selectionEndsAt).getTime() - Date.now()) / 1000,
            ),
          )
        : DEFAULT_SELECTION_TIME;

      syncRoundState({
        ...game,
        remainingSeconds,
      });
    };

    initializeGame();
  }, [authUser?.telegramId, roundId]);

  // ============================================================
  // SYNC ROUND STATE
  // ============================================================

  const syncRoundState = (payload) => {
    if (!payload) return;

    console.log("🎮 ROUND STATE:", payload);

    const status = String(payload.status || "WAITING").toUpperCase();

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    setRoundStatus(status);
    roundStatusRef.current = status;

    if (status === "WAITING" || status === "READY") {
      setPhase("selection");
    } else if (
      status === "PLAYING" ||
      status === "ACTIVE" ||
      status === "LIVE"
    ) {
      setPhase("live");
    } else if (status === "FINISHED" || status === "COMPLETED") {
      setPhase("finished");
    }

    // ----------------------------------------------------------
    // TIMER
    // ----------------------------------------------------------

    if (typeof payload.remainingSeconds === "number") {
      setRemainingSeconds(Math.max(0, Math.ceil(payload.remainingSeconds)));
    }

    // ----------------------------------------------------------
    // PLAYERS
    // ----------------------------------------------------------

    const players =
      payload.playerCount ??
      payload.participantCount ??
      payload.players?.length ??
      0;

    setParticipantCount(Number(players) || 0);

    // ----------------------------------------------------------
    // SPECTATORS
    // ----------------------------------------------------------

    if (typeof payload.spectatorCount === "number") {
      setSpectatorCount(payload.spectatorCount);
    }

    // ----------------------------------------------------------
    // GLOBAL SELECTED NUMBERS
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
      setRoundId(payload.gameId);
      roundIdRef.current = payload.gameId;
    }

    // ----------------------------------------------------------
    // WINNER
    // ----------------------------------------------------------

    if (payload.winner) {
      setWinner(payload.winner);
      winnerRef.current = payload.winner;
    }
  };

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
    // SELECTION TIMER
    // ==========================================================

    const handleSelectionTick = (payload) => {
      if (!payload) return;

      if (typeof payload.remainingSeconds === "number") {
        setRemainingSeconds(Math.max(0, Math.ceil(payload.remainingSeconds)));
      }

      if (payload.gameId) {
        setRoundId(payload.gameId);
        roundIdRef.current = payload.gameId;
      }
    };

    // ==========================================================
    // JOINED ROOM
    // ==========================================================

    const handleJoinedRoom = (payload) => {
      console.log("👤 JOINED ROOM:", payload);

      if (!payload?.success) return;

      requestRef.current = false;

      setHasJoinedRound(true);

      setIsSpectator(Boolean(payload.isSpectator));

      isSpectatorRef.current = Boolean(payload.isSpectator);

      // --------------------------------------------------------
      // CARDS
      // --------------------------------------------------------

      if (payload.isSpectator) {
        setCards([]);
      } else {
        const nextCards = Array.isArray(payload.cards)
          ? payload.cards
          : payload.card
            ? [payload.card]
            : [];

        if (nextCards.length > 0) {
          setCards(nextCards);
        }
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
        setRoundId(payload.gameId);
        roundIdRef.current = payload.gameId;
      }
    };

    // ==========================================================
    // PLAYER CARD
    // ==========================================================

    const handlePlayerCard = (payload) => {
      if (!payload) return;

      if (isSpectatorRef.current) {
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
      if (!payload) return;

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

      setRemainingSeconds(0);

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
          ? payload.remainingSeconds
          : DEFAULT_SELECTION_TIME,
      );

      setParticipantCount(0);

      setSpectatorCount(0);

      setSelectedNumbersGlobal([]);

      setMySelections([]);

      setCalledNumbers([]);

      setCurrentNumber(null);

      setWinner(null);

      setWinnerCard(null);

      setWinnerName("");

      setWinnerAmount(0);

      setCards([]);

      setHasJoinedRound(false);

      setIsSpectator(false);

      isSpectatorRef.current = false;

      requestRef.current = false;

      setNoSelectionsMessage(null);

      if (payload?.gameId) {
        setRoundId(payload.gameId);
        roundIdRef.current = payload.gameId;
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

      if (!payload) return;

      const winnerData = payload.winner || payload.winners?.[0] || null;

      if (!winnerData) return;

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

      setRemainingSeconds(0);
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

        setRemainingSeconds(0);
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

      setCards([]);

      setCalledNumbers([]);

      setCurrentNumber(null);

      setSelectedNumbersGlobal([]);

      setParticipantCount(0);

      setSpectatorCount(0);

      setHasJoinedRound(false);

      setIsSpectator(false);

      isSpectatorRef.current = false;

      requestRef.current = false;

      setNoSelectionsMessage(null);

      if (payload?.gameId) {
        setRoundId(payload.gameId);

        roundIdRef.current = payload.gameId;
      }

      setRoundStatus("WAITING");

      roundStatusRef.current = "WAITING";

      setPhase("selection");

      setRemainingSeconds(
        typeof payload?.remainingSeconds === "number"
          ? payload.remainingSeconds
          : DEFAULT_SELECTION_TIME,
      );
    };

    // ==========================================================
    // REGISTER
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
  }, []);

  // ============================================================
  // SELECT / DESELECT LUCKY NUMBER
  // ============================================================

  const toggleLuckyNumber = (number) => {
    console.log("🎯 NUMBER CLICKED:", number);

    // ----------------------------------------------------------
    // CHECK ROUND
    // ----------------------------------------------------------

    if (roundStatusRef.current !== "WAITING") {
      console.log("❌ Selection phase is closed.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK TIMER
    // ----------------------------------------------------------

    if (remainingSeconds <= 0) {
      console.log("❌ Selection timer expired.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK AUTH
    // ----------------------------------------------------------

    if (!authUser?.telegramId) {
      console.warn("❌ Telegram user not authenticated.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK GAME ID
    // ----------------------------------------------------------

    if (!roundIdRef.current) {
      console.warn("❌ No active Bingo game.");
      return;
    }

    // ----------------------------------------------------------
    // IS ALREADY MY NUMBER?
    // ----------------------------------------------------------

    const alreadySelected = mySelections.includes(number);

    // ==========================================================
    // DESELECT
    // ==========================================================

    if (alreadySelected) {
      console.log("↩️ Deselecting:", number);

      /*
       * Remove immediately from UI.
       *
       * This makes the interface responsive.
       */

      setMySelections((previous) => previous.filter((item) => item !== number));

      /*
       * Tell backend.
       *
       * Backend must implement this event.
       */

      socket.emit(
        "deselectLuckyNumber",
        {
          gameId: roundIdRef.current,

          telegramId: authUser.telegramId,

          number,
        },
        (response) => {
          console.log("↩️ Deselect response:", response);

          if (response?.success && Array.isArray(response.selectedNumbers)) {
            setSelectedNumbersGlobal(response.selectedNumbers);
          }
        },
      );

      return;
    }

    // ==========================================================
    // MAXIMUM
    // ==========================================================

    if (mySelections.length >= MAX_LUCKY_NUMBERS) {
      console.log(`❌ Maximum ${MAX_LUCKY_NUMBERS} numbers allowed.`);

      return;
    }

    // ==========================================================
    // SOCKET
    // ==========================================================

    if (!socket.connected) {
      socket.connect();
    }

    // ==========================================================
    // SELECT NUMBER
    // ==========================================================

    console.log("📤 Sending selectLuckyNumber:", number);

    socket.emit(
      "selectLuckyNumber",
      {
        gameId: roundIdRef.current,

        telegramId: authUser.telegramId,

        number,

        betAmount: 1,
      },
      (response) => {
        console.log("🎯 SELECT RESPONSE:", response);

        // ------------------------------------------------------
        // SERVER REJECTED
        // ------------------------------------------------------

        if (!response?.success) {
          console.error("❌ Number selection failed:", response?.message);

          return;
        }

        // ------------------------------------------------------
        // PERSONAL SELECTION
        // ------------------------------------------------------

        setMySelections((previous) => {
          if (previous.includes(number)) {
            return previous;
          }

          return [...previous, number];
        });

        // ------------------------------------------------------
        // GLOBAL SELECTION
        // ------------------------------------------------------

        if (Array.isArray(response.selectedNumbers)) {
          setSelectedNumbersGlobal(response.selectedNumbers);
        }

        console.log("✅ Lucky number selected:", number);
      },
    );
  };

  // ============================================================
  // JOIN GAME
  // ============================================================

  const handleJoin = () => {
    console.log("🎮 JOIN GAME");

    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    if (!authUser?.telegramId) {
      console.warn("❌ User is not authenticated.");
      return;
    }

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (roundStatusRef.current !== "WAITING") {
      console.log("❌ Game is no longer accepting players.");
      return;
    }

    // ----------------------------------------------------------
    // TIMER
    // ----------------------------------------------------------

    if (remainingSeconds <= 0) {
      console.warn("❌ Selection time expired.");
      return;
    }

    // ----------------------------------------------------------
    // GAME ID
    // ----------------------------------------------------------

    if (!roundIdRef.current) {
      console.warn("❌ No active round.");
      return;
    }

    // ----------------------------------------------------------
    // NUMBER REQUIRED
    // ----------------------------------------------------------

    if (mySelections.length === 0) {
      console.warn("❌ Select at least one lucky number first.");
      return;
    }

    // ----------------------------------------------------------
    // ALREADY JOINED
    // ----------------------------------------------------------

    if (hasJoinedRound) {
      console.log("⚠️ Already joined this round.");
      return;
    }

    // ----------------------------------------------------------
    // REQUEST LOCK
    // ----------------------------------------------------------

    if (requestRef.current) {
      return;
    }

    requestRef.current = true;

    if (!socket.connected) {
      socket.connect();
    }

    // ==========================================================
    // JOIN ROOM
    // ==========================================================

    socket.emit(
      "joinRoom",
      {
        gameId: roundIdRef.current,

        telegramId: authUser.telegramId,

        betAmount: 1,

        luckyNumbers: mySelections,
      },
      (response) => {
        requestRef.current = false;

        console.log("🎮 JOIN RESPONSE:", response);

        if (!response?.success) {
          console.error("❌ Join failed:", response?.message);

          return;
        }

        // ------------------------------------------------------
        // JOINED
        // ------------------------------------------------------

        setHasJoinedRound(true);

        setIsSpectator(false);

        isSpectatorRef.current = false;

        // ------------------------------------------------------
        // GLOBAL NUMBERS
        // ------------------------------------------------------

        if (Array.isArray(response.selectedNumbers)) {
          setSelectedNumbersGlobal(response.selectedNumbers);
          setMySelections(response.selectedNumbers);
        }

        // ------------------------------------------------------
        // PLAYER COUNT
        // ------------------------------------------------------

        if (typeof response.playerCount === "number") {
          setParticipantCount(response.playerCount);
        }

        // ------------------------------------------------------
        // CARD
        // ------------------------------------------------------

        if (response.card) {
          setCards([response.card]);
        }

        if (Array.isArray(response.cards)) {
          setCards(response.cards);
        }

        console.log("✅ Successfully joined Bingo game.");
      },
    );
  };

  // ============================================================
  // JOIN AS SPECTATOR
  // ============================================================

  const handleJoinAsSpectator = () => {
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
          console.error("❌ Spectator join failed:", response?.message);

          return;
        }

        setHasJoinedRound(true);

        setIsSpectator(true);

        isSpectatorRef.current = true;

        setCards([]);

        if (typeof response.playerCount === "number") {
          setParticipantCount(response.playerCount);
        }

        if (typeof response.spectatorCount === "number") {
          setSpectatorCount(response.spectatorCount);
        }
      },
    );
  };

  // ============================================================
  // AUTO SPECTATOR
  // ============================================================

  useEffect(() => {
    if (
      phase !== "live" ||
      hasJoinedRound ||
      !authUser?.telegramId ||
      !roundId
    ) {
      return;
    }

    handleJoinAsSpectator();
  }, [phase, hasJoinedRound, authUser?.telegramId, roundId]);

  // ============================================================
  // DERIVED VALUES
  // ============================================================

  const canSelectMore =
    roundStatus === "WAITING" &&
    remainingSeconds > 0 &&
    mySelections.length < MAX_LUCKY_NUMBERS;

  const joinButtonDisabled =
    roundStatus !== "WAITING" ||
    remainingSeconds <= 0 ||
    mySelections.length === 0 ||
    hasJoinedRound;

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
              roundStatus === "WAITING" &&
              remainingSeconds > 0 &&
              !hasJoinedRound
            }
            toggleLuckyNumber={toggleLuckyNumber}
            joinButtonDisabled={joinButtonDisabled}
            handleJoin={handleJoin}
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

              {/* ==================================================
                  WINNER CARD
              ================================================== */}

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
              Selection starts again in {noSelectionsMessage.remainingSeconds}s
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
