I will implement the requested features for Single Player mode.

### Plan

1.  **Refactor `gameStore.ts`**
    *   Extract the showdown evaluation and hand completion logic from `playerAction` into a reusable internal helper (e.g., `handleShowdown`).
    *   Modify `playerAction` to check if the current player is the Human player (in Single Player mode) and if their chips have dropped to 0 (All-In).
    *   If the Human player is All-In, immediately trigger the `handleShowdown` logic:
        *   Deal any remaining Community Cards (Flop/Turn/River) to reach 5 cards.
        *   Perform hand evaluation and determine winners.
        *   Update game stage to `showdown`.

2.  **Update `SinglePlayerPage.tsx`**
    *   Modify the "Hand Completed" modal logic.
    *   Introduce a local state `readyForNewRound` to track the button state.
    *   Implement the two-step "END ROUND" -> "NEW ROUND" flow:
        *   **Initial State**: Button displays "END ROUND".
        *   **First Click**: Updates button text to "NEW ROUND" (sets `readyForNewRound` to true).
        *   **Second Click**: Calls `initGame(settings)` to reset the game with original settings and start a fresh hand.
    *   Ensure `resetGame` is used correctly to support the full reset requirement.

3.  **Verify Home Page Navigation**
    *   Confirm `Home.tsx` correctly calls `resetGame()` before navigating to Single Player, ensuring the Settings page always appears on entry.

### Verification
*   Start a Single Player game.
*   Go All-In as the human player and verify the round ends immediately with results.
*   At the end of a round, verify the button says "END ROUND".
*   Click "END ROUND" and verify it changes to "NEW ROUND" without starting the game.
*   Click "NEW ROUND" and verify the game resets (chips restored) and a new hand starts.
*   Go back to Home and re-enter Single Player to verify the Settings page appears.