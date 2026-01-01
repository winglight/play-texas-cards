# Implementation Plan: Texas Hold'em Session & History Features

I will implement the requested features to track game sessions ("Rounds"), action history, and statistics, ensuring all data persists locally.

## 1. Type Definitions (`src/types/poker.ts`)
Update interfaces to support history and sessions.
- **Update `Player`**: Add `lastAction` (string) to persist action names across betting streets.
- **New `HandHistoryEntry`**: Defines structure for a single action log (player, action, amount, win rate, timestamp).
- **New `HandResult`**: Defines structure for the outcome of a single hand (winners, PnL per player).
- **New `Session`**: Defines a "Round" containing multiple hands, start/end time.

## 2. State Management (`src/store/gameStore.ts`)
Refactor the store to handle sessions and persistence.
- **Persistence**: Wrap the store with `persist` middleware to save to `localStorage`.
- **Session State**: Add `currentSessionId`, `sessions` map, and `currentHandHistory`.
- **Logic Updates**:
    - `initGame`: Automatically start a new session if needed.
    - `playerAction`: Calculate win rate (Equity) for the acting player and record a `HandHistoryEntry`. Update `lastAction`.
    - `startNewHand`: Reset `currentHandHistory` but preserve `lastAction` context where appropriate.
    - `endHand` (Internal logic): When a hand finishes, calculate PnL for all players and append a `HandResult` to the current `Session`.
- **New Actions**:
    - `startNewSession`: Archive current and start fresh.
    - `loadSession`: Switch view to a historical session (read-only mode or just viewing stats).

## 3. UI Components

### New Component: `src/components/HistoryLog.tsx`
- **Location**: "Deck right top" (Top-right area of the green table).
- **Features**: Scrollable list of actions in the current hand.
- **Display**: Player name, Action, Amount, Win Rate.
- **Styling**: Special colors for names, amounts, and profit/loss.

### New Component: `src/components/SessionStats.tsx`
- **Location**: "Deck right bottom" (Bottom-right area of the green table).
- **Features**:
    - **Hand History List**: Scrollable list of past hands in the current session with PnL.
    - **Leaderboard**: Ranked list of players by total PnL in the current session.

### New Component: `src/components/SessionControls.tsx`
- **Location**: Top-right of the screen (outside the table).
- **Features**: Combobox to filter and select historical sessions by date.

### Update `src/components/Player.tsx`
- Use the new `lastAction` field to ensure the action badge ("CHECK", "RAISE") remains visible until the player acts again or the hand ends, fulfilling the "last operation name" requirement.

### Update `src/components/Table.tsx`
- Integrate `HistoryLog` and `SessionStats` into the table layout.
- Add `SessionControls` to the page layout.
- Add "End Round" button (likely in the top control bar or near the stats) to manually finalize the current session.

## 4. Verification
- **Manual Test**: Play through a few hands.
- **Verify History**: Check if the top-right log updates with actions and win rates.
- **Verify Stats**: Check if the bottom-right stats update after each hand.
- **Verify Persistence**: Reload the page and ensure the current session and history are restored.
- **Verify New Round**: Click "End Round" and verify a new session starts.
- **Verify History Loading**: Select an old session and verify stats are displayed.
