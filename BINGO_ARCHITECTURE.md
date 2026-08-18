# Bingo Round Manager - Architecture Guide

## Overview

The **BingoRoundManager** is the new centralized round management system that ensures:

✅ **Server-controlled timers** - All timing is managed by the server, not the browser
✅ **Consistent status values** - Always use uppercase: `WAITING`, `PLAYING`, `FINISHED`
✅ **Synchronized round flow** - All clients stay in sync with server state
✅ **Proper phase transitions** - SELECTION → NO_SELECTIONS_WAIT → SELECTION (retry) OR SELECTION → LIVE

---

## Architecture Overview

### Problem Statement (Before)

1. **Local Browser Timers**: Each browser maintained its own 30-second countdown, causing desynchronization
2. **Inconsistent Statuses**: Backend used `"waiting"`, `"active"`, `"completed"` while frontend expected `"WAITING"`, `"PLAYING"`, `"FINISHED"`
3. **Missing Socket Handlers**: `bingoSocket.js` only had service functions, no actual socket event handlers

### Solution (After)

```
┌─────────────────────────────────────────────────────────────┐
│                    BINGO ROUND MANAGER                       │
│                  (Server-Side Single Source                  │
│                      of Truth)                               │
├─────────────────────────────────────────────────────────────┤
│ • Manages ALL timers server-side                             │
│ • Sends remaining seconds with each state emission          │
│ • Normalizes statuses (WAITING, PLAYING, FINISHED)          │
│ • Handles phase transitions automatically                   │
│ • Detects 0 selections and triggers retry                   │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│              Updated bingoSocket.js Handlers                │
│ • initBingoSocket(io) - Entry point for all connections    │
│ • createRoom - Starts new game & selection phase            │
│ • joinRoom - Player selects lucky number                   │
│ • markNumber - Player marks called numbers                  │
│ • disconnect - Cleanup                                      │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Bingo.jsx)                      │
│ • Uses remainingSeconds from server (NOT local)             │
│ • Normalizes statuses (WAITING, PLAYING, FINISHED)          │
│ • Follows server state as single source of truth            │
└─────────────────────────────────────────────────────────────┘
```

---

## Round Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ROUND START                              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
        ┌─────────────────────────────────┐
        │   30-SECOND SELECTION TIMER     │
        │  (SERVER-CONTROLLED, SYNCED)    │
        │  Status: WAITING                │
        └────────┬────────────────────────┘
                 ▼
        ┌─────────────────────────────────┐
        │  Timer Reaches 0                │
        └────────┬────────────────────────┘
                 ▼
        ┌─────────────────────────────────┐
        │  Check: Did 1+ players select?  │
        └────┬──────────────────────┬─────┘
             │ NO SELECTIONS        │ YES (1+ SELECTED)
             ▼                      ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  WAIT 30 SECONDS │  │  START LIVE      │
    │  Before Retry    │  │  Status: PLAYING │
    │                  │  │                  │
    │  Check each      │  │  • Call numbers  │
    │  second if anyone│  │  • Auto-mark     │
    │  selects         │  │  • Detect bingo  │
    │                  │  │                  │
    │  YES = Go live   │  │                  │
    │  NO = Retry sel. │  │                  │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
             └──────────┬──────────┘
                        ▼
             ┌──────────────────────┐
             │   ROUND FINISHED     │
             │  Status: FINISHED    │
             │  Announce Winner     │
             └──────────┬───────────┘
                        ▼
             ┌──────────────────────┐
             │   WAIT 8 SECONDS     │
             └──────────┬───────────┘
                        ▼
             ┌──────────────────────┐
             │  Create New Game &   │
             │  Return to START     │
             └──────────────────────┘
```

---

## Key Classes & Functions

### BingoRoundManager

**Main functions:**

| Function                                               | Purpose                                       | Emits                                         |
| ------------------------------------------------------ | --------------------------------------------- | --------------------------------------------- |
| `startSelectionPhase(io, gameId, roomId)`              | Start 30-sec selection countdown              | `bingo:roundState` (every 1s)                 |
| `startNoSelectionsWaitPhase(io, gameId, roomId, game)` | Wait 30s before retry if 0 selections         | `bingo:noSelections`                          |
| `startLivePhase(io, gameId, roomId, game)`             | Begin calling numbers                         | `bingo:roundState` (PLAYING)                  |
| `startNumberCalling(io, gameId, roomId)`               | Call numbers every 5 seconds                  | `bingo:numberCalled`                          |
| `finishRound(io, gameId, roomId)`                      | End round, announce winner                    | `bingo:roundState` (FINISHED)                 |
| `normalizeStatus(status)`                              | Convert any status to UPPERCASE               | Returns: `WAITING` \| `PLAYING` \| `FINISHED` |
| `getRemainingSeconds(endTime)`                         | Calculate remaining time from server end time | Returns: number                               |
| `emitRoundState(io, roomId, game, extra)`              | Emit state to all clients in room             | `bingo:roundState`                            |

---

## Status Normalization

**Backend (bingoSocket.js):**

- Always uses: `WAITING`, `PLAYING`, `FINISHED` (uppercase)
- Before: used `"waiting"`, `"active"`, `"completed"` (inconsistent)

**Frontend (Bingo.jsx):**

- Expects: `WAITING`, `PLAYING`, `FINISHED` (uppercase)
- Uses `normalizeStatus()` from sync state handler

**Mapping (Old → New):**

```
"waiting"   → "WAITING"
"active"    → "PLAYING"
"active"    → "PLAYING"
"completed" → "FINISHED"
```

---

## Server Time Synchronization

### Problem (Before)

```javascript
// ❌ WRONG - Each browser has its own timer
const [selectionCountdown, setSelectionCountdown] = useState(30);

useEffect(() => {
  const interval = setInterval(() => {
    setSelectionCountdown((prev) => Math.max(0, prev - 1));
  }, 1000);
  return () => clearInterval(interval);
}, []);

// Result: Browser 1 shows 15s, Browser 2 shows 12s, Browser 3 shows 18s
```

### Solution (After)

```javascript
// ✅ CORRECT - Use server-provided time
const [remainingSeconds, setRemainingSeconds] = useState(30);

const handleRoundState = (payload) => {
  // Server sends: { remainingSeconds: 15, status: "WAITING", ... }
  setRemainingSeconds(payload.remainingSeconds);

  // NO LOCAL COUNTDOWN - use server time only
  // Result: All browsers show SAME time
};

socket.on("bingo:roundState", handleRoundState);
```

---

## Socket Events Reference

### Client Receives (From Server)

| Event                | Payload                                   | Description                       |
| -------------------- | ----------------------------------------- | --------------------------------- |
| `bingo:roundState`   | `{gameId, status, remainingSeconds, ...}` | Round state update (sync for all) |
| `bingo:noSelections` | `{message, remainingSeconds}`             | No selections warning             |
| `bingo:numberCalled` | `{number, calledNumbers}`                 | Number called in live game        |
| `bingo:winner`       | `{winner, card, ...}`                     | Game ended, winner announced      |
| `bingo:nextRound`    | `{gameId, status}`                        | New round starting                |

### Client Sends (To Server)

| Event        | Payload                                        | Handler                        |
| ------------ | ---------------------------------------------- | ------------------------------ |
| `createRoom` | `{roomId}`                                     | Creates game, starts selection |
| `joinRoom`   | `{gameId, telegramId, betAmount, luckyNumber}` | Player joins & selects         |
| `markNumber` | `{gameId, telegramId, number}`                 | Player marks number            |

---

## Implementation Checklist

- [x] Create BingoRoundManager with server-side timers
- [x] Normalize all statuses to UPPERCASE
- [x] Update bingoSocket.js with socket handlers
- [x] Update frontend to use server remainingSeconds
- [x] Remove local browser countdown from frontend
- [x] Add "no selections" retry logic
- [x] Emit state every second during selection
- [x] Sync all clients to same countdown

---

## Testing the Implementation

### Test 1: Selection Phase Synchronization

1. Open game in 2 browsers
2. Verify both show SAME remaining seconds
3. Seconds should decrease together (not independently)

### Test 2: No Selections Handling

1. Create room but don't select any cards
2. Wait for countdown to 0
3. Should show "No selections" warning
4. Should wait 30s, then restart selection
5. If you select during wait → immediately go live

### Test 3: Status Consistency

1. Check browser console: should show `WAITING`, `PLAYING`, or `FINISHED`
2. Never lowercase versions
3. Status should update for all clients simultaneously

### Test 4: Live Phase

1. Have 1+ players select
2. Should immediately go to PLAYING status
3. Verify numbers are called
4. Winner should be announced with card

---

## Debugging Tips

**Check active timers:**

```javascript
// In browser console
console.log(BingoRoundManager.getActiveTimers());
```

**Monitor server logs:**

```
⏱️ [SELECTION START] gameId: xxx, roomId: yyy
⏱️ [SELECTION TICK] gameId: xxx, remaining: 25s
✅ [SELECTION END] gameId: xxx
⚠️ [NO SELECTIONS] No players selected...
✅ [LIVE PHASE START] gameId: xxx
```

**Force debug mode:**

```javascript
// bingoSocket.js
console.log("🎮 Round state:", state); // After every emit
```

---

## Migration Notes

**If upgrading from old system:**

1. Update all status checks: `"waiting"` → `"WAITING"`
2. Remove client-side countdown timers
3. Always use `payload.remainingSeconds` from server
4. Test synchronization with multiple clients
5. Verify "no selections" retry works correctly

---

## Future Enhancements

- [ ] Persistent timer state recovery (if server crashes)
- [ ] Round statistics & analytics
- [ ] Player statistics tracking
- [ ] Spectator support in live phase
- [ ] Multiple lucky number support (already in model)
- [ ] Custom bingo patterns (lines, diagonals, etc.)
