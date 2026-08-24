import BingoGame from "../../models/BingoGame.js";
import {
  SELECTION_TIME_SECONDS,
  startGame,
  resetEmptyRound,
  createBingoGame,
  callNumber,
} from "../../services/bingo/bingoService.js";

const selectionTimers = new Map();
const callingTimers = new Map();

const emitState = (io, game) => {
  const remainingSeconds = game.selectionEndsAt
    ? Math.min(
        SELECTION_TIME_SECONDS,
        Math.max(
          0,
          Math.ceil(
            (new Date(game.selectionEndsAt).getTime() - Date.now()) / 1000,
          ),
        ),
      )
    : 0;

  io.to(`bingo:${game.gameId}`).emit("bingo:roundState", {
    gameId: game.gameId,

    status:
      game.status === "waiting"
        ? "WAITING"
        : game.status === "active"
          ? "PLAYING"
          : "FINISHED",

    playerCount: game.players.filter((p) => !p.isSpectator).length,

    spectatorCount: game.players.filter((p) => p.isSpectator).length,

    selectedNumbers: game.selectedNumbers || [],

    calledNumbers: game.calledNumbers || [],

    currentNumber: game.currentNumber || null,

    winner: game.winner || null,

    remainingSeconds,

    selectionEndsAt: game.selectionEndsAt,

    roundNumber: game.roundNumber,
  });
};

/*
|--------------------------------------------------------------------------
| Start global selection timer
|--------------------------------------------------------------------------
*/

export const startSelectionTimer = async (io, gameId) => {
  /*
  | Clear previous timer
  */

  if (selectionTimers.has(gameId)) {
    clearInterval(selectionTimers.get(gameId));
  }

  const timer = setInterval(async () => {
    try {
      const game = await BingoGame.findOne({
        gameId,
      });

      if (!game) {
        clearInterval(timer);
        selectionTimers.delete(gameId);
        return;
      }

      /*
        | Game no longer waiting
        */

      if (game.status !== "waiting") {
        clearInterval(timer);
        selectionTimers.delete(gameId);
        return;
      }

      const remaining = Math.min(
        SELECTION_TIME_SECONDS,
        Math.max(
          0,
          Math.ceil(
            (new Date(game.selectionEndsAt).getTime() - Date.now()) / 1000,
          ),
        ),
      );

      /*
        | Send countdown to EVERYONE
        */

      io.to(`bingo:${gameId}`).emit("bingo:selectionTick", {
        gameId,

        remainingSeconds: remaining,
      });

      /*
        | Timer finished
        */

      if (remaining <= 0) {
        clearInterval(timer);

        selectionTimers.delete(gameId);

        /*
          | Nobody joined
          */

        const realPlayers = game.players.filter(
          (player) => !player.isSpectator,
        );

        if (realPlayers.length === 0) {
          const resetGame = await resetEmptyRound(gameId);

          io.to(`bingo:${gameId}`).emit("bingo:roundReset", {
            gameId,

            message: "No players joined. New round started.",

            remainingSeconds: SELECTION_TIME_SECONDS,

            selectionEndsAt: resetGame.selectionEndsAt,

            playerCount: 0,

            selectedNumbers: [],

            calledNumbers: [],

            currentNumber: null,

            winner: null,

            status: "WAITING",
          });

          /*
            | START NEW 30 SECOND TIMER
            */

          await startSelectionTimer(io, gameId);

          return;
        }

        /*
          | At least one player joined
          | → START LIVE GAME
          */

        const result = await startGame(gameId);

        if (result.noPlayers) {
          return;
        }

        const liveGame = result.game;

        io.to(`bingo:${gameId}`).emit("bingo:gameStarted", {
          gameId,

          status: "PLAYING",

          playerCount: liveGame.players.filter((p) => !p.isSpectator).length,

          calledNumbers: liveGame.calledNumbers,

          currentNumber: null,

          remainingSeconds: 0,
        });

        /*
          | Start automatic number calling
          */

        startCallingNumbers(io, gameId);
      }
    } catch (error) {
      console.error("Selection timer error:", error);
    }
  }, 1000);

  selectionTimers.set(gameId, timer);
};

/*
|--------------------------------------------------------------------------
| Automatic number calling
|--------------------------------------------------------------------------
*/

export const startCallingNumbers = (io, gameId) => {
  if (callingTimers.has(gameId)) {
    return;
  }

  /*
  | Call one number every 3 seconds.
  | Change this to 2, 4, 5 etc. as desired.
  */

  const timer = setInterval(async () => {
    try {
      const game = await BingoGame.findOne({
        gameId,
      });

      if (!game) {
        clearInterval(timer);
        callingTimers.delete(gameId);
        return;
      }

      /*
        | Stop after winner
        */

      if (game.status !== "active") {
        clearInterval(timer);
        callingTimers.delete(gameId);
        return;
      }

      /*
        | Maximum 75
        */

      if (game.calledNumbers.length >= 75) {
        clearInterval(timer);
        callingTimers.delete(gameId);

        return;
      }

      const result = await callNumber(gameId);

      /*
        | Number called
        */

      io.to(`bingo:${gameId}`).emit("bingo:numberCalled", {
        gameId,

        number: result.number,

        calledNumbers: result.calledNumbers,

        gameEnded: result.gameEnded,
      });

      /*
        | Winner
        */

      if (result.gameEnded && result.winner) {
        clearInterval(timer);

        callingTimers.delete(gameId);

        /*
          | SEND WINNER TO EVERYONE
          */

        io.to(`bingo:${gameId}`).emit("bingo:winner", {
          gameId,

          winner: result.winner,

          winners: result.winners,

          totalPot: result.game?.totalPot,

          commissionAmount: result.game?.commissionAmount,

          prizePool: result.game?.prizePool,

          winners: result.winners,

          winnerName: result.winner.firstName || result.winner.username,

          winnerCard: result.winner.card,

          winAmount: result.winner.winAmount,

          bingoResult: result.winner.bingoResult,

          calledNumbers: result.calledNumbers,
        });

        /*
          | Start next round after 8 seconds
          */

        setTimeout(() => createNextRound(io, game), 8000);
      }
    } catch (error) {
      console.error("Calling number error:", error);
    }
  }, 3000);

  callingTimers.set(gameId, timer);
};

/*
|--------------------------------------------------------------------------
| Create next round
|--------------------------------------------------------------------------
*/

const createNextRound = async (io, oldGame) => {
  try {
    const newGame = await createBingoGame(
      oldGame.roomId,
      oldGame.maxPlayers,
      oldGame.minBet,
      oldGame.maxBet,
    );

    /*
    | Everyone connected to the room
    | moves to the new game.
    */

    io.to(`bingo:${oldGame.gameId}`).emit("bingo:nextRound", {
      gameId: newGame.gameId,

      status: "WAITING",

      remainingSeconds: SELECTION_TIME_SECONDS,

      selectionEndsAt: newGame.selectionEndsAt,

      playerCount: 0,

      selectedNumbers: [],

      calledNumbers: [],

      currentNumber: null,

      winner: null,

      roundNumber: newGame.roundNumber,
    });

    /*
    | Automatically start selection
    */

    await startSelectionTimer(io, newGame.gameId);
  } catch (error) {
    console.error("Create next Bingo round error:", error);
  }
};

/*
|--------------------------------------------------------------------------
| Stop timers
|--------------------------------------------------------------------------
*/

export const stopBingoTimers = (gameId) => {
  if (selectionTimers.has(gameId)) {
    clearInterval(selectionTimers.get(gameId));

    selectionTimers.delete(gameId);
  }

  if (callingTimers.has(gameId)) {
    clearInterval(callingTimers.get(gameId));

    callingTimers.delete(gameId);
  }
};
