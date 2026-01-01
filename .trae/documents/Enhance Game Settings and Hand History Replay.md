# Game Features Enhancement Plan

## 1. Game Settings & Configuration
### New Components & Types
- **`types/poker.ts`**:
  - Add `TableType` ('nl' | 'pl' | 'fl').
  - Add `GameSettings` interface.
  - Add `tableSettings` to `GameState`.
- **`components/GameSettings.tsx`**:
  - Create a new form component for:
    - Table Type (No-Limit, Pot-Limit, Fixed-Limit).
    - Player Count (6 or 9).
    - Big Blind Amount.
    - Max Buy-in (BB Multiplier).
    - Starting Chips.

### Logic Integration
- **`store/gameStore.ts`**:
  - Update `initGame` to accept `GameSettings`.
  - Store `settings` in `GameState`.
  - Use `settings.smallBlind` (derived from BB) and `settings.startingChips` during initialization.
- **`pages/SinglePlayerPage.tsx`**:
  - Add logic to display `GameSettings` form before the game starts.

## 2. Hand History & Replay
### Data Persistence
- **`types/poker.ts`**:
  - Update `HandResult` to include `history: HandHistoryEntry[]`.
- **`store/gameStore.ts`**:
  - Add `replayState` to `GameState` (tracks active replay hand, step index, playback status).
  - Update `playerAction` logic (where hand ends) to save the full `currentHandHistory` into the `HandResult`.
  - Add actions: `startReplay(handId)`, `nextReplayStep`, `prevReplayStep`, `toggleReplay`, `stopReplay`.

### UI Implementation
- **`components/HistoryLog.tsx`**:
  - Add Replay Mode header with controls:
    - **Previous / Next** buttons (step-by-step).
    - **Play / Stop** buttons (auto-playback).
  - When in Replay Mode, render the history up to `currentReplayStep` instead of the live `currentHandHistory`.
- **`components/SessionStats.tsx`**:
  - Make past hand items clickable.
  - On click, trigger `startReplay` for that hand (only allowed if round is over).

## 3. UI Refinements
- **`components/Player.tsx`**:
  - Adjust Dealer Button ("D") positioning to be explicitly "next to" the player avatar (e.g., slightly offset outside the avatar circle) for better visibility.
- **Blinds Support**:
  - Verify that the new `GameSettings` correctly propagate to the game logic (already supported by `gameStore` but needs to be hooked up to the new UI).

## 4. Verification
- **Test Settings**: Start games with different player counts (6/9) and blind levels.
- **Test Replay**: Play a hand, finish it, then click the history item to verify the log replays correctly.
- **Test Persistence**: Ensure settings and history persist on reload (handled by existing `persist` middleware).
