I will align the implementation with the correct "Hand" vs "Session" terminology and logic.

### Plan

1.  **Refactor Storage Persistence (`gameStore.ts`)**
    *   Configure `persist` to **only** save `sessions` (history).
    *   Exclude `players`, `settings`, `pot`, etc., ensuring that reloading or re-entering the game always starts fresh (Settings page).

2.  **Update Showdown/Result Modal (`SinglePlayerPage.tsx`)**
    *   Replace the "END ROUND/NEW ROUND" toggle with two distinct actions:
        *   **Continue**: Calls `startNewHand()`. This starts the next hand in the current session (preserving chips and positions).
        *   **End Session**: Clears the current game state (`resetGame()`) and navigates back to the Home page.
    *   **Bankruptcy Handling**: If the human player has 0 chips, only show the **End Session** (or "Game Over") button, effectively enforcing the "auto-end on bankruptcy" rule by preventing continuation.

3.  **Verify Flow**
    *   **Hand**: Play a hand -> Click **Continue** -> Verify next hand starts with current chip stacks.
    *   **Session**: Click **End Session** -> Verify return to Home and data cleared.
    *   **History**: Check that the session history is preserved after ending.
    *   **Bankruptcy**: Lose all chips -> Verify only "End Session" option is available.