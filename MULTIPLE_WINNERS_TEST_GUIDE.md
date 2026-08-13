# Multiple Winners Implementation - Test Guide

## Overview

This document outlines how to test the multiple simultaneous winners feature in the Bingo game.

## Implementation Summary

### What Changed

1. **Server-side Number Calling**: Now checks ALL players for Bingo after each number is called
2. **Winner Detection**: Collects all simultaneous winners instead of stopping at first
3. **Winner Broadcast**: Sends all winners to clients with `bingo:winner` event
4. **UI Display**: WinnerModal now displays multiple winners in a list
5. **Waiting Period**: 30-second wait before next round starts

### Key Code Changes

#### Backend (bingoService.js)

- `callNumber()` now iterates through ALL players
- Automatically marks called numbers for each player
- Returns array of all simultaneous winners
- Updates all winners' user balances and tickets

#### Backend (bingoSocket.js)

- Checks for `gameEnded && winners.length > 0`
- Broadcasts winners via "bingo:winner" event
- Waits 30 seconds before starting next round

#### Frontend (Bingo.jsx)

- `bingo:winner` listener handles array of winners
- Determines if current user is among winners via telegramId

#### Frontend (WinnerModal.jsx)

- Accepts both string and array of winners
- Displays all winners in list format
- Shows customized messages for single vs multiple wins

## Testing Scenarios

### Scenario 1: Single Winner (Regression Test)

**Objective**: Verify single winner cases still work correctly

1. Start a game with 2+ players
2. Have one player get Bingo first
3. Verify:
   - ✓ Winner modal appears immediately
   - ✓ Winner's name is displayed
   - ✓ Winner receives correct amount (betAmount × 5)
   - ✓ Game transitions to waiting phase after 30 seconds
   - ✓ New round countdown appears

### Scenario 2: Simultaneous Two Winners

**Objective**: Verify two players winning on same number works

**Setup**:

1. Start game with 3-4 players
2. Get all players to have 4 marked numbers (same 4 numbers)
3. Manually design cards so two players need same number for 5-in-a-row

**Expected Behavior**:

1. When that final number is called:
   - ✓ Both players' cards should auto-mark
   - ✓ Both should be detected as winners
   - ✓ Modal shows "You are one of 2 winners!" for each winner
   - ✓ Modal shows "2 players won the game!" for losers
   - ✓ Both winners' usernames appear in list
   - ✓ Both winners receive winnings
2. After modal closes:
   - ✓ Game status changes to "finished"
   - ✓ Waiting for new round countdown (30 seconds)
   - ✓ After 30s, new game starts with waiting phase

### Scenario 3: Multiple Winners (3+)

**Objective**: Verify system handles 3+ simultaneous winners

**Setup**:

1. Start game with 4-5 players
2. Design scenario where 3+ players need same final number for Bingo

**Expected Behavior**:

1. When final number called:
   - ✓ All 3+ winners detected
   - ✓ Modal displays all winners with names
   - ✓ Current user sees "You are one of X winners!"
   - ✓ Each winner receives correct winnings
   - ✓ All non-winners see "X players won the game!"
2. Database updates:
   - ✓ All winners have `bingoWins` incremented
   - ✓ All winners have balance increased
   - ✓ All BingoTickets marked as `isWinner: true`
   - ✓ Game status is "completed"

### Scenario 4: Edge Cases

#### 4A: Winner immediately after joining

- Player joins, doesn't select lucky numbers, gets Bingo
- ✓ Should still be detected as winner
- ✓ Receives winnings (0 × 5 = 0 if betAmount is 0)

#### 4B: Multiple winners with different card patterns

- Winners from different bingo patterns (row, column, diagonal)
- ✓ All patterns recognized
- ✓ All winners detected regardless of pattern

#### 4C: Player rejoin after winners detected

- Player disconnects during winner modal
- ✓ Should see bingo:nextRound event
- ✓ UI resets to selection phase
- ✓ Can rejoin new game

## How to Manually Test

### Quick Test (2-3 Players)

1. Open game in 2-3 browser windows
2. Have each player select 1 lucky number (or random)
3. Wait for live phase
4. Manually trace through game:
   - Numbers will be called every 5 seconds
   - Watch if multiple players get Bingo at same time
   - Verify both see modal with correct info

### Automated Testing (Development)

To simulate multiple winners quickly:

1. Modify frontend debug to force Bingo state:
   - Edit Bingo.jsx `checkBingo` logic
   - Set cards to require only 2 numbers for testing
2. Or modify backend in callNumber():
   - Log: `console.log(`Players checked: ${game.players.length}, Winners found: ${winners.length}`);`
   - Verify logs show multiple winners being detected

### Database Verification

After a multiple-winner game:

```javascript
// Check the game record
db.bingogames.findOne({ gameId: "YOUR_GAME_ID" });
// Verify:
// - status: "completed"
// - winner: { first winner object }
// - players: all have hasBingo: true for winners

// Check user records
db.users.find({ telegramId: { $in: [WINNER_IDS] } });
// Verify all winners have incremented bingoWins and updated balance

// Check tickets
db.bingotickets.find({ gameId: "YOUR_GAME_ID", isWinner: true });
// Should see multiple tickets marked as winners
```

## Debugging

### Enable Logging

Add these to bingoService.js:

```javascript
console.log(`[callNumber] Checking ${game.players.length} players for bingo`);
console.log(
  `[callNumber] Winners found: ${winners.length}`,
  winners.map((w) => w.player.username),
);
```

Add these to bingoSocket.js:

```javascript
console.log(`[bingo:winner] Broadcasting ${result.winners.length} winners`);
```

Add these to Bingo.jsx:

```javascript
socket.on("bingo:winner", (d) => {
  console.log(`[bingo:winner received] ${d.winners?.length || 0} winners`, d);
  // ... rest of handler
});
```

### Common Issues

**Issue**: Only one winner showing even when 2+ should win

- **Cause**: callNumber not checking all players
- **Fix**: Verify loop through all `game.players`
- **Check**: Line 462-481 in bingoService.js

**Issue**: Winners not received on frontend

- **Cause**: Socket event name mismatch or listener not attached
- **Fix**: Check "bingo:winner" event name matches everywhere
- **Check**: bingoSocket.js line 695 and Bingo.jsx line 651

**Issue**: User balance not updated for all winners

- **Cause**: User.findOne failing or save not awaited
- **Fix**: Verify User model query works
- **Check**: Line 523-527 in bingoService.js

**Issue**: Game not transitioning to next round

- **Cause**: startNextRoundCountdown not called or failing
- **Fix**: Check both callNumber return and socket emit
- **Check**: bingoSocket.js lines 696-706

## Success Criteria

✅ All criteria below must pass:

1. **Single Winner Cases**:
   - Single winners still work as before
   - User receives correct winnings

2. **Multiple Winners**:
   - 2+ simultaneous winners detected
   - All winners receive correct winnings
   - All players see correct winner list

3. **Game Flow**:
   - After winners detected, game stops calling numbers
   - 30-second countdown before next round
   - New round starts with waiting phase

4. **Database**:
   - All winners have records updated
   - bingoWins incremented for all
   - Balance updated for all
   - Game marked as "completed"

5. **UI**:
   - WinnerModal displays all winners
   - Current user correctly identified in list
   - Modal auto-closes after 5 seconds
   - Next round countdown visible

## Notes

- The implementation maintains backwards compatibility with single-winner scenarios
- The `game.winner` field still stores the first winner for legacy tracking
- The new `winners` array in the socket event is the source of truth
- 30-second wait allows late joiners to reconnect before next round
