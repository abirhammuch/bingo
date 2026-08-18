import { io } from "socket.io-client";

const normalizeUrl = (rawUrl = "") =>
  rawUrl
    .replace(/(^['"]|['"]$)/g, "")
    .replace(/\/+$/g, "")
    .trim();

const rawUrl = import.meta.env.VITE_API_URL;

const URL = rawUrl
  ? normalizeUrl(rawUrl)
  : typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5000";

const socket = io(URL, {
  autoConnect: false,

  transports: ["websocket", "polling"],

  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  withCredentials: true,

  timeout: 10000,
});

// ============================================================
// CONNECTION
// ============================================================

socket.on("connect", () => {
  console.log("✅ Bingo Socket connected");
  console.log("🆔 Socket ID:", socket.id);
  console.log("🌐 Server:", URL);
});

socket.on("connect_error", (error) => {
  console.error("❌ Bingo Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Bingo Socket disconnected:", reason);

  if (reason === "io server disconnect") {
    // Server intentionally disconnected us.
    // Reconnect manually.
    socket.connect();
  }
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log(`🔄 Bingo Socket reconnect attempt: ${attempt}`);
});

socket.io.on("reconnect", (attempt) => {
  console.log(`✅ Bingo Socket reconnected after ${attempt} attempt(s)`);
});

socket.io.on("reconnect_error", (error) => {
  console.error("❌ Bingo Socket reconnect error:", error.message);
});

socket.io.on("reconnect_failed", () => {
  console.error("❌ Bingo Socket reconnection failed");
});

// ============================================================
// BINGO EVENTS
// ============================================================

// Global 30-second selection timer
socket.on("bingo:selectionTick", (data) => {
  console.log("⏱️ Selection:", data.remainingSeconds);

  window.dispatchEvent(
    new CustomEvent("bingo:selectionTick", {
      detail: data,
    }),
  );
});

// No players selected → timer starts again
socket.on("bingo:roundReset", (data) => {
  console.log("🔄 Round reset:", data);

  window.dispatchEvent(
    new CustomEvent("bingo:roundReset", {
      detail: data,
    }),
  );
});

// Round state
socket.on("bingo:roundState", (data) => {
  console.log("🎮 Round state:", data);

  window.dispatchEvent(
    new CustomEvent("bingo:roundState", {
      detail: data,
    }),
  );
});

// Game starts LIVE
socket.on("bingo:gameStarted", (data) => {
  console.log("🔴 GAME LIVE:", data);

  window.dispatchEvent(
    new CustomEvent("bingo:gameStarted", {
      detail: data,
    }),
  );
});

// Number called
socket.on("bingo:numberCalled", (data) => {
  console.log("🎱 Number called:", data.number);

  window.dispatchEvent(
    new CustomEvent("bingo:numberCalled", {
      detail: data,
    }),
  );
});

// Winner
socket.on("bingo:winner", (data) => {
  console.log("🏆 WINNER:", data);

  window.dispatchEvent(
    new CustomEvent("bingo:winner", {
      detail: data,
    }),
  );
});

// Next round
socket.on("bingo:nextRound", (data) => {
  console.log("🔄 NEXT ROUND:", data);

  window.dispatchEvent(
    new CustomEvent("bingo:nextRound", {
      detail: data,
    }),
  );
});

// ============================================================
// AUTHENTICATION
// ============================================================

export const authenticateTelegram = (initData) => {
  if (!initData) {
    console.warn("⚠️ No Telegram initData found");
    return false;
  }

  try {
    const decodedInitData = decodeURIComponent(initData);

    console.log("📤 Sending Telegram authentication...");

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("auth", {
      initData: decodedInitData,
    });

    return true;
  } catch (error) {
    console.error("❌ Telegram authentication error:", error);
    return false;
  }
};

// ============================================================
// CONNECT
// ============================================================

export const connectSocket = () => {
  if (!socket.connected) {
    console.log("🔌 Connecting Bingo Socket...");
    socket.connect();
  }
};

// ============================================================
// DISCONNECT
// ============================================================

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("🔌 Disconnecting Bingo Socket...");
    socket.disconnect();
  }
};

// ============================================================
// JOIN BINGO ROOM
// ============================================================

export const joinBingoRoom = (
  gameId,
  telegramId,
  betAmount = null,
  luckyNumber = null,
) => {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "joinRoom",
      {
        gameId,
        telegramId,
        betAmount,
        luckyNumber,
      },
      (response) => {
        if (response?.success) {
          console.log("✅ Joined Bingo room:", response);
          resolve(response);
        } else {
          console.error("❌ Failed to join Bingo room:", response?.message);

          reject(new Error(response?.message || "Failed to join Bingo room"));
        }
      },
    );
  });
};

// ============================================================
// SELECT / MARK NUMBER
// ============================================================

export const markBingoNumber = (gameId, telegramId, number) => {
  if (!socket.connected) {
    console.warn("⚠️ Socket is not connected");
    return;
  }

  socket.emit("markNumber", {
    gameId,
    telegramId,
    number,
  });
};

// ============================================================
// GET GAME STATE
// ============================================================

export const getBingoGameState = (gameId) => {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("getGameState", {
    gameId,
  });
};

// ============================================================
// GET PLAYER CARD
// ============================================================

export const getBingoCard = (gameId, telegramId) => {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("getCard", {
    gameId,
    telegramId,
  });
};

// ============================================================
// LEAVE ROOM
// ============================================================

export const leaveBingoRoom = (roomId) => {
  if (!socket.connected) return;

  socket.emit("leaveRoom", {
    roomId,
  });
};

// ============================================================
// EXPORT
// ============================================================

export default socket;
