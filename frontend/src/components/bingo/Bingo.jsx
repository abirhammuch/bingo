import React, { useEffect, useRef, useState } from "react";

import Header from "./Header";
import SelectionPage from "./SelectionPage";
import LivePage from "./LivePage";
import WinnerModal from "./WinnerModal";

import socket from "../../socket/socket";
import { useAuth } from "../../context/AuthContext";

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
  // This comes ONLY from the backend.
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  const [participantCount, setParticipantCount] = useState(0);

  const [spectatorCount, setSpectatorCount] = useState(0);

  const [selectedNumbersGlobal, setSelectedNumbersGlobal] = useState([]);

  const [calledNumbers, setCalledNumbers] = useState([]);

  const [currentNumber, setCurrentNumber] = useState(null);

  const [winner, setWinner] = useState(null);

  const [roundId, setRoundId] = useState(null);

  // Numbers selected by THIS user.
  const [mySelections, setMySelections] = useState([]);

  // User's cards.
  const [cards, setCards] = useState([]);

  // Whether current user is spectator.
  const [isSpectator, setIsSpectator] = useState(false);

  // Whether current user has actually joined this round.
  const [hasJoinedRound, setHasJoinedRound] = useState(false);

  // Winner card.
  const [winnerCard, setWinnerCard] = useState(null);

  // Winner name.
  const [winnerName, setWinnerName] = useState("");

  // Winner amount.
  const [winnerAmount, setWinnerAmount] = useState(0);

  const [noSelectionsMessage, setNoSelectionsMessage] = useState(null);

  // ============================================================
  // REFS
  // ============================================================

  const roundStatusRef = useRef("WAITING");
  const roundIdRef = useRef(null);
  const winnerRef = useRef(null);

  // Prevent duplicate join requests.
  const joiningRef = useRef(false);

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

  // ============================================================
  // SERVER ROUND STATE
  // ============================================================

  const syncRoundState = (payload) => {
    if (!payload) return;

    console.log("🎮 [ROUND STATE]", payload);

    const status = String(payload.status || "WAITING").toUpperCase();

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    setRoundStatus(status);

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
    // GLOBAL TIMER
    // ----------------------------------------------------------

    const seconds =
      typeof payload.remainingSeconds === "number"
        ? payload.remainingSeconds
        : 0;

    setRemainingSeconds(Math.max(0, seconds));

    // ----------------------------------------------------------
    // PLAYERS
    // ----------------------------------------------------------

    const players =
      payload.playerCount ??
      payload.participantCount ??
      payload.players?.length ??
      payload.participants ??
      0;

    setParticipantCount(Number(players) || 0);

    // ----------------------------------------------------------
    // SPECTATORS
    // ----------------------------------------------------------

    if (typeof payload.spectatorCount === "number") {
      setSpectatorCount(payload.spectatorCount);
    }

    // ----------------------------------------------------------
    // SELECTED NUMBERS
    // ----------------------------------------------------------

    setSelectedNumbersGlobal(
      Array.isArray(payload.selectedNumbers) ? payload.selectedNumbers : [],
    );

    // ----------------------------------------------------------
    // CALLED NUMBERS
    // ----------------------------------------------------------

    setCalledNumbers(
      Array.isArray(payload.calledNumbers) ? payload.calledNumbers : [],
    );

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

    // ----------------------------------------------------------
    // IMPORTANT
    // If server says LIVE, local selection UI must disappear.
    // ----------------------------------------------------------

    if (status === "PLAYING" || status === "ACTIVE" || status === "LIVE") {
      setNoSelectionsMessage(null);
    }
  };

  // ============================================================
  // SOCKET CONNECTION
  // ============================================================

  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Bingo socket connected");
    };

    const handleConnectError = (error) => {
      console.error("❌ Bingo socket error:", error);
    };

    // ----------------------------------------------------------
    // GLOBAL ROUND STATE
    // ----------------------------------------------------------

    const handleRoundState = (payload) => {
      syncRoundState(payload);
    };

    // ----------------------------------------------------------
    // SELECTION TIMER
    // ----------------------------------------------------------

    const handleSelectionTick = (payload) => {
      if (!payload) return;

      if (typeof payload.remainingSeconds === "number") {
        setRemainingSeconds(Math.max(0, payload.remainingSeconds));
      }

      // The timer is GLOBAL.
      // Do not calculate it locally.
      if (payload.gameId) {
        setRoundId(payload.gameId);
        roundIdRef.current = payload.gameId;
      }
    };

    // ----------------------------------------------------------
    // PLAYER / SPECTATOR JOIN
    // ----------------------------------------------------------

    const handleJoinedRoom = (payload) => {
      console.log("👤 [JOINED ROOM]", payload);

      if (!payload?.success) return;

      joiningRef.current = false;

      setHasJoinedRound(true);

      setIsSpectator(Boolean(payload.isSpectator));

      // --------------------------------------------------------
      // PLAYER CARD
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
        // Spectators NEVER get a card.
        setCards([]);
      }

      // --------------------------------------------------------
      // SERVER CONFIRMED SELECTIONS
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
      // ROUND ID
      // --------------------------------------------------------

      if (payload.gameId) {
        setRoundId(payload.gameId);
        roundIdRef.current = payload.gameId;
      }

      // --------------------------------------------------------
      // IMPORTANT
      // If joined as spectator, they can watch LIVE.
      // --------------------------------------------------------

      if (payload.isSpectator) {
        console.log("👀 Joined as spectator");
      } else {
        console.log("🎮 Joined as player");
      }
    };

    // ----------------------------------------------------------
    // PLAYER CARD
    // ----------------------------------------------------------

    const handlePlayerCard = (payload) => {
      if (!payload) return;

      // Never show card to spectator.
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

    // ----------------------------------------------------------
    // NUMBER CALLED
    // ----------------------------------------------------------

    const handleNumberCalled = (payload) => {
      if (!payload) return;

      if (typeof payload.number === "number") {
        setCurrentNumber(payload.number);
      }

      if (Array.isArray(payload.calledNumbers)) {
        setCalledNumbers(payload.calledNumbers);
      }
    };

    // ----------------------------------------------------------
    // GAME STARTED
    // ----------------------------------------------------------

    const handleGameStarted = (payload) => {
      console.log("🚀 [GAME STARTED]", payload);

      setRoundStatus("PLAYING");
      setPhase("live");
      setRemainingSeconds(0);

      setNoSelectionsMessage(null);

      if (Array.isArray(payload.calledNumbers)) {
        setCalledNumbers(payload.calledNumbers);
      }

      setCurrentNumber(payload.currentNumber ?? null);

      if (typeof payload.playerCount === "number") {
        setParticipantCount(payload.playerCount);
      }
    };

    // ----------------------------------------------------------
    // NO PLAYERS
    // ----------------------------------------------------------

    const handleRoundReset = (payload) => {
      console.log("🔄 [ROUND RESET]", payload);

      setRoundStatus("WAITING");
      setPhase("selection");

      setRemainingSeconds(
        typeof payload?.remainingSeconds === "number"
          ? payload.remainingSeconds
          : 30,
      );

      setParticipantCount(Number(payload?.playerCount || 0));

      setSelectedNumbersGlobal([]);

      setCalledNumbers([]);

      setCurrentNumber(null);

      setWinner(null);

      setWinnerCard(null);

      setWinnerName("");

      setWinnerAmount(0);

      setMySelections([]);

      setCards([]);

      setHasJoinedRound(false);

      setIsSpectator(false);

      joiningRef.current = false;

      setNoSelectionsMessage({
        message:
          payload?.message ||
          "No players selected a card. Starting a new selection round.",
        remainingSeconds: payload?.remainingSeconds ?? 30,
      });

      if (payload?.gameId) {
        setRoundId(payload.gameId);
        roundIdRef.current = payload.gameId;
      }
    };

    // ----------------------------------------------------------
    // NO SELECTIONS
    // ----------------------------------------------------------

    const handleNoSelections = (payload) => {
      console.log("⚠️ [NO SELECTIONS]", payload);

      setNoSelectionsMessage({
        message: payload?.message || "No players selected cards.",
        remainingSeconds: payload?.remainingSeconds ?? 30,
      });
    };

    // ----------------------------------------------------------
    // WINNER
    // ----------------------------------------------------------

    const handleWinner = (payload) => {
      console.log("🏆 [WINNER]", payload);

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
      setPhase("finished");

      setRemainingSeconds(0);
    };

    // ----------------------------------------------------------
    // ROUND FINISHED
    // ----------------------------------------------------------

    const handleRoundFinished = (payload) => {
      console.log("🏁 [ROUND FINISHED]", payload);

      if (payload?.winner) {
        handleWinner(payload);
      } else {
        setRoundStatus("FINISHED");
        setPhase("finished");
        setRemainingSeconds(0);
      }
    };

    // ----------------------------------------------------------
    // NEXT ROUND
    // ----------------------------------------------------------

    const handleNextRound = (payload) => {
      console.log("🔄 [NEXT ROUND]", payload);

      // Reset everything from previous round.

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

      joiningRef.current = false;

      setNoSelectionsMessage(null);

      // New round ID.

      if (payload?.gameId) {
        setRoundId(payload.gameId);
        roundIdRef.current = payload.gameId;
      }

      // New global selection timer.

      setRoundStatus("WAITING");

      setPhase("selection");

      setRemainingSeconds(
        typeof payload?.remainingSeconds === "number"
          ? payload.remainingSeconds
          : 30,
      );
    };

    // ----------------------------------------------------------
    // REGISTER EVENTS
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // CONNECT
    // ----------------------------------------------------------

    if (!socket.connected) {
      socket.connect();
    }

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

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
  }, [isSpectator]);

  // ============================================================
  // SELECT LUCKY NUMBER
  // ============================================================

  const toggleLuckyNumber = (number) => {
    // ----------------------------------------------------------
    // ONLY WAITING
    // ----------------------------------------------------------

    if (roundStatusRef.current !== "WAITING") {
      console.log("❌ Selection is closed.");
      return;
    }

    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    if (!authUser?.telegramId) {
      console.warn("❌ No authenticated Telegram user.");
      return;
    }

    // ----------------------------------------------------------
    // GAME ID
    // ----------------------------------------------------------

    if (!roundIdRef.current) {
      console.warn("❌ No active game ID.");
      return;
    }

    // ----------------------------------------------------------
    // MAX 2 SELECTIONS
    // ----------------------------------------------------------

    if (mySelections.length >= 2) {
      console.log("❌ Maximum 2 selections reached.");
      return;
    }

    // ----------------------------------------------------------
    // DUPLICATE
    // ----------------------------------------------------------

    if (mySelections.includes(number)) {
      return;
    }

    // ----------------------------------------------------------
    // GLOBAL NUMBER ALREADY SELECTED
    // ----------------------------------------------------------

    if (selectedNumbersGlobal.includes(number)) {
      console.log("❌ Number already selected globally.");
      return;
    }

    // ----------------------------------------------------------
    // SOCKET
    // ----------------------------------------------------------

    if (!socket.connected) {
      socket.connect();
    }

    /*
     * IMPORTANT:
     *
     * Do NOT immediately assume the selection succeeded.
     *
     * The backend should confirm the join.
     */

    if (joiningRef.current) {
      return;
    }

    joiningRef.current = true;

    socket.emit(
      "joinRoom",
      {
        gameId: roundIdRef.current,

        telegramId: authUser.telegramId,

        betAmount: 1,

        luckyNumber: number,
      },
      (response) => {
        joiningRef.current = false;

        if (!response?.success) {
          console.error("❌ Selection failed:", response?.message);

          return;
        }

        console.log("✅ Selection confirmed by server", response);

        // Only update local selection AFTER server confirmation.

        setMySelections((previous) => {
          if (previous.includes(number)) {
            return previous;
          }

          return [...previous, number];
        });

        // Update global selected numbers.

        if (Array.isArray(response.selectedNumbers)) {
          setSelectedNumbersGlobal(response.selectedNumbers);
        }

        setHasJoinedRound(true);

        setIsSpectator(false);

        // Card received from server.

        if (response.card) {
          setCards([response.card]);
        }

        if (Array.isArray(response.cards)) {
          setCards(response.cards);
        }
      },
    );
  };

  // ============================================================
  // JOIN AS PLAYER
  // ============================================================

  const handleJoin = () => {
    if (!authUser?.telegramId) {
      console.warn("❌ User is not authenticated.");
      return;
    }

    if (roundStatusRef.current !== "WAITING") {
      return;
    }

    if (!roundIdRef.current) {
      console.warn("❌ No active round.");
      return;
    }

    if (joiningRef.current) {
      return;
    }

    joiningRef.current = true;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "joinRoom",
      {
        gameId: roundIdRef.current,

        telegramId: authUser.telegramId,

        betAmount: 1,

        luckyNumber: mySelections[0] ?? null,
      },
      (response) => {
        joiningRef.current = false;

        if (!response?.success) {
          console.error("❌ Join failed:", response?.message);

          return;
        }

        setHasJoinedRound(true);

        setIsSpectator(Boolean(response.isSpectator));

        if (Array.isArray(response.selectedNumbers)) {
          setSelectedNumbersGlobal(response.selectedNumbers);
        }

        if (typeof response.playerCount === "number") {
          setParticipantCount(response.playerCount);
        }

        if (response.card) {
          setCards([response.card]);
        }

        if (Array.isArray(response.cards)) {
          setCards(response.cards);
        }
      },
    );
  };

  // ============================================================
  // JOIN AS SPECTATOR
  // ============================================================

  const handleJoinAsSpectator = () => {
    if (!authUser?.telegramId) {
      console.warn("❌ Authentication required.");

      return;
    }

    if (!roundIdRef.current) {
      console.warn("❌ No round available.");

      return;
    }

    if (joiningRef.current) {
      return;
    }

    joiningRef.current = true;

    if (!socket.connected) {
      socket.connect();
    }

    /*
     * Send NO bet.
     *
     * Backend should recognize this as spectator.
     */

    socket.emit(
      "joinRoom",
      {
        gameId: roundIdRef.current,

        telegramId: authUser.telegramId,

        betAmount: 0,

        luckyNumber: null,
      },
      (response) => {
        joiningRef.current = false;

        if (!response?.success) {
          console.error("❌ Spectator join failed:", response?.message);

          return;
        }

        setHasJoinedRound(true);

        setIsSpectator(true);

        // Spectators don't have cards.

        setCards([]);

        if (typeof response.playerCount === "number") {
          setParticipantCount(response.playerCount);
        }
      },
    );
  };

  // ============================================================
  // AUTO SPECTATOR
  //
  // If user is already on the page when game becomes LIVE
  // and they did not select a card, they become a spectator.
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
  // WINNER CLEANUP
  // ============================================================

  useEffect(() => {
    if (!winner) {
      return;
    }

    const timeout = setTimeout(() => {
      /*
       * Do not immediately destroy the winner data
       * if you want WinnerModal to stay visible.
       *
       * The nextRound event will reset everything.
       */

      console.log("🏆 Winner display timeout");
    }, 8000);

    return () => {
      clearTimeout(timeout);
    };
  }, [winner]);

  // ============================================================
  // DERIVED VALUES
  // ============================================================

  const canSelectMore = roundStatus === "WAITING" && mySelections.length < 2;

  const joinButtonDisabled =
    roundStatus !== "WAITING" || mySelections.length >= 2;

  const selectionNumbers = mySelections;

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
            showSelectionPanel={true}
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
            /*
             * Spectators receive [].
             * Players receive their card.
             */

            cards={isSpectator ? [] : cards}
            selectionNumbers={selectionNumbers}
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

              {/* Winner card preview */}

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
