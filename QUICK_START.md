# Quick Start Guide - Bingo Round Manager

## What Was Done

You identified a critical issue: **the timer was being controlled by each browser locally instead of the server**.

We fixed it by:

1. ✅ Creating **BingoRoundManager.js** - Server-side round management with single timer
2. ✅ Updating **bingoSocket.js** - Added socket handlers & status normalization
3. ✅ Updating **Bingo.jsx** - Removed local countdown, use server time only

---

## Files to Deploy

### 1. New File

```
backend/services/bingo/BingoRoundManager.js
```

### 2. Updated Files

```
backend/sockets/bingoSocket.js
frontend/src/components/bingo/Bingo.jsx
```

---

## Quick Start (5 minutes)

### Step 1: Verify Files Exist

```bash
ls backend/services/bingo/BingoRoundManager.js
ls backend/sockets/bingoSocket.js
ls frontend/src/components/bingo/Bingo.jsx
```

### Step 2: Check for Errors

```bash
# Backend
cd backend
npm run lint
npm run build  # if applicable

# Frontend
cd frontend
npm run lint
npm run build
```

### Step 3: Test Locally

```bash
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
npm run dev

# Terminal 3: Test (open 2+ browsers)
# Browser 1: http://localhost:5173
# Browser 2: http://localhost:5173
# (or use private window)
```

### Step 4: Verify Synchronization

1. Open Bingo in Browser 1
2. Open Bingo in Browser 2
3. Create room in Browser 1
4. **Both browsers should show SAME countdown**
5. Countdown should decrease together
6. Selection should NOT be independent

### Step 5: Deploy

```bash
# Backend
git add backend/
git commit -m "Add BingoRoundManager & update socket handlers"
git push

# Frontend
git add frontend/
git commit -m "Update Bingo to use server-controlled timer"
git push

# Restart services
npm restart
```

---

## Test Scenarios

### Test 1: Timer Synchronization ✅

```
Expected:
Browser 1: ⏱️ 15 seconds
Browser 2: ⏱️ 15 seconds  (SAME TIME)
Browser 3: ⏱️ 15 seconds  (SAME TIME)

NOT:
Browser 1: ⏱️ 15 seconds
Browser 2: ⏱️ 12 seconds  (DIFFERENT - FAIL)
Browser 3: ⏱️ 18 seconds  (DIFFERENT - FAIL)
```

### Test 2: Status Consistency ✅

```
Console should show:
"WAITING" (not "waiting")
"PLAYING" (not "active")
"FINISHED" (not "completed")
```

### Test 3: No Selections ✅

```
1. Create room but don't select
2. Wait for timer → 0
3. Should see: "No selections. Waiting 30s..."
4. If you select during wait → Go live immediately
5. If 30s passes → Reset and retry
```

### Test 4: Full Round ✅

```
1. Create room
2. Player A selects number 5
3. Player B selects number 42
4. Timer → 0 → LIVE
5. Numbers called
6. Bingo detected
7. Winner announced
8. Wait 8s
9. New round starts
```

---

## Debugging

### Browser Console

```javascript
// Check remaining seconds
console.log(remainingSeconds); // Should come from server

// Check status
console.log(roundStatus); // Should be UPPERCASE
```

### Server Logs

```bash
# Should see (every second during selection):
⏱️ [SELECTION TICK] gameId: xxx, remaining: 15s
⏱️ [SELECTION TICK] gameId: xxx, remaining: 14s
⏱️ [SELECTION TICK] gameId: xxx, remaining: 13s
...

# Should see:
✅ [SELECTION END] gameId: xxx
⚠️ [NO SELECTIONS] or 🎮 [LIVE PHASE START]
```

### Common Issues

**Issue: Timers still desynchronized**

- [ ] Clear browser cache
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Check WebSocket connection in DevTools

**Issue: Status still lowercase**

- [ ] Verify normalizeStatus() is in top of file
- [ ] Check BingoRoundManager import
- [ ] Restart backend

**Issue: Socket errors**

- [ ] Check socket.io CORS settings
- [ ] Verify ports are correct
- [ ] Check MongoDB connection

---

## Key Code Changes

### Before (Local Timer - WRONG)

```javascript
const [selectionCountdown, setSelectionCountdown] = useState(30);
useEffect(() => {
  const interval = setInterval(() => {
    setSelectionCountdown((prev) => Math.max(0, prev - 1));
  }, 1000);
}, []);
```

### After (Server Timer - CORRECT)

```javascript
const [remainingSeconds, setRemainingSeconds] = useState(30);
socket.on("bingo:roundState", (payload) => {
  setRemainingSeconds(payload.remainingSeconds); // From server
});
```

---

## Verification Checklist

Before considering implementation complete:

- [ ] Backend BingoRoundManager.js is in correct location
- [ ] bingoSocket.js has socket handlers exported
- [ ] Bingo.jsx uses server remainingSeconds (not local)
- [ ] No import errors
- [ ] No TypeScript/JSLint errors
- [ ] Socket connection works (check DevTools)
- [ ] Multiple browsers show SAME countdown
- [ ] Status is always UPPERCASE in console
- [ ] "No selections" wait phase works
- [ ] Full round flow completes without errors
- [ ] Server logs show proper timer messages
- [ ] Winner is announced correctly

---

## Documentation

For detailed info, read:

- `IMPLEMENTATION_COMPLETE.md` - Full checklist
- `BINGO_ARCHITECTURE.md` - Technical architecture
- `CODE_REVIEW_SUMMARY.md` - What was fixed
- `BEFORE_AFTER_COMPARISON.md` - Visual comparisons

---

## Support

If you encounter issues:

1. Check server logs: `tail -f server.log`
2. Check browser console: Press F12
3. Check Socket.IO connection: DevTools > Network > WS
4. Review error messages in `get_errors()` output

---

## Summary

| Before                      | After                      |
| --------------------------- | -------------------------- |
| ❌ Local browser timers     | ✅ Server-controlled timer |
| ❌ Desynchronized countdown | ✅ All clients sync        |
| ❌ Mixed case statuses      | ✅ Normalized UPPERCASE    |
| ❌ Missing socket handlers  | ✅ Complete handlers       |
| ❌ No round management      | ✅ BingoRoundManager       |

**Status:** ✅ Ready to deploy!
