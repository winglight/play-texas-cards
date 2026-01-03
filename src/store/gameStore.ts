import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, GameState, Player, PlayerActionType, GameStage, HandEvaluation, HandHistoryEntry, Session, HandResult, GameSettings } from '../types/poker';
import { createDeck, evaluateHand } from '../utils/poker';
import { calculateEquity } from '../utils/probability';

interface GameStore extends GameState {
  mode: 'single' | 'multi';
  socket: WebSocket | null;
  // Actions
  setMode: (mode: 'single' | 'multi') => void;
  setSocket: (socket: WebSocket | null) => void;
  updateState: (newState: Partial<GameState>) => void;
  
  initGame: (settings: GameSettings) => void;
  startNewHand: () => void;
  playerAction: (action: PlayerActionType, amount?: number) => void;
  resetGame: () => void;

  // Session Actions
  startNewSession: () => void;
  endRound: () => void;
  loadSession: (sessionId: string) => void;

  // Replay Actions
  startReplay: (handId: string) => void;
  stopReplay: () => void;
  nextReplayStep: () => void;
  prevReplayStep: () => void;
  toggleReplay: () => void;
}

const INITIAL_STATE: Omit<GameState, 'players'> & { mode: 'single' | 'multi'; socket: WebSocket | null } = {
  mode: 'single',
  socket: null,
  communityCards: [],
  pot: 0,
  currentBet: 0,
  dealerPosition: 0,
  smallBlindPosition: undefined,
  bigBlindPosition: undefined,
  currentTurn: 0,
  stage: 'preflop',
  deck: [],
  smallBlind: 10,
  bigBlind: 20,
  minRaise: 20,
  winners: [],
  
  currentSessionId: '',
  sessions: {},
  currentHandHistory: [],
  
  settings: undefined,
  replayState: {
    isActive: false,
    handId: null,
    currentStep: 0,
    isPlaying: false
  }
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      players: [],

      setMode: (mode) => set({ mode }),
      setSocket: (socket) => set({ socket }),
      updateState: (newState) => set((state) => ({ ...state, ...newState })),

      startNewSession: () => {
        const { currentSessionId, sessions } = get();
        
        // If current session exists and has no hands, reuse it
        if (currentSessionId && sessions[currentSessionId] && sessions[currentSessionId].hands.length === 0) {
             set(state => ({
                 sessions: {
                     ...state.sessions,
                     [currentSessionId]: { 
                         ...state.sessions[currentSessionId], 
                         startTime: Date.now() 
                     }
                 }
             }));
             return;
        }

        const sessionId = Date.now().toString();
        const newSession: Session = {
            id: sessionId,
            startTime: Date.now(),
            hands: []
        };
        set(state => ({
            currentSessionId: sessionId,
            sessions: { ...state.sessions, [sessionId]: newSession },
            currentHandHistory: [],
        }));
      },

      endRound: () => {
          // Starts a new round/session
          get().startNewSession();
      },

      loadSession: (sessionId) => {
          if (get().sessions[sessionId]) {
              set({ currentSessionId: sessionId });
          }
      },

      startReplay: (handId) => {
          const { sessions, currentSessionId } = get();
          const session = sessions[currentSessionId];
          if (!session) return;
          const hand = session.hands.find(h => h.id === handId);
          if (!hand || !hand.history || hand.history.length === 0) return;

          set({
              replayState: {
                  isActive: true,
                  handId,
                  currentStep: 0,
                  isPlaying: false
              }
          });
      },

      stopReplay: () => {
          set({
              replayState: {
                  isActive: false,
                  handId: null,
                  currentStep: 0,
                  isPlaying: false
              }
          });
      },

      nextReplayStep: () => {
          const { replayState, sessions, currentSessionId } = get();
          if (!replayState.isActive || !replayState.handId) return;
          
          const session = sessions[currentSessionId];
          const hand = session.hands.find(h => h.id === replayState.handId);
          if (!hand || !hand.history) return;

          if (replayState.currentStep < hand.history.length - 1) {
              set({
                  replayState: {
                      ...replayState,
                      currentStep: replayState.currentStep + 1
                  }
              });
          } else {
              // End of replay, stop playing
               set({
                  replayState: {
                      ...replayState,
                      isPlaying: false
                  }
              });
          }
      },

      prevReplayStep: () => {
          const { replayState } = get();
          if (!replayState.isActive || replayState.currentStep <= 0) return;
          
          set({
              replayState: {
                  ...replayState,
                  currentStep: replayState.currentStep - 1
              }
          });
      },

      toggleReplay: () => {
          const { replayState } = get();
          set({
              replayState: {
                  ...replayState,
                  isPlaying: !replayState.isPlaying
              }
          });
      },

      initGame: (settings) => {
        const { playerCount, startingChips, bigBlind } = settings;
        const smallBlind = bigBlind / 2;

        // Strategy Distribution
        let strategies: ('beginner' | 'veteran' | 'pro' | 'random')[] = [];
        if (playerCount === 6) {
            // 5 bots: 1H, 1M, 1L, 2R
            strategies = ['pro', 'veteran', 'beginner', 'random', 'random'];
        } else if (playerCount === 9) {
            // 8 bots: 2H, 2M, 2L, 2R
            strategies = ['pro', 'pro', 'veteran', 'veteran', 'beginner', 'beginner', 'random', 'random'];
        } else {
             // Fallback
             const count = playerCount - 1;
             strategies = Array(count).fill('beginner');
        }

        // Shuffle strategies
        for (let i = strategies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [strategies[i], strategies[j]] = [strategies[j], strategies[i]];
        }

        const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
          id: `player-${i}`,
          name: i === 0 ? 'You' : `Bot ${i}`,
          chips: startingChips,
          holeCards: [],
          position: i,
          isActive: true,
          isAllIn: false,
          currentBet: 0,
          totalBet: 0,
          isAi: i !== 0,
          aiStrategy: i === 0 ? undefined : strategies[i - 1],
        }));
        
        // Check if we need a new session
        let { currentSessionId, sessions } = get();
        // If no session exists or ID is empty, create one
        if (!currentSessionId || !sessions[currentSessionId]) {
             const sessionId = Date.now().toString();
             currentSessionId = sessionId;
             sessions = { ...sessions, [sessionId]: { id: sessionId, startTime: Date.now(), hands: [] } };
        }

        set({
          ...INITIAL_STATE,
          players,
          smallBlind,
          bigBlind,
          minRaise: bigBlind,
          dealerPosition: Math.floor(Math.random() * playerCount),
          currentSessionId,
          sessions,
          settings
        });
        
        get().startNewHand();
      },

      startNewHand: () => {
        const { players, dealerPosition, smallBlind, bigBlind } = get();
        
        // Reset player states for new hand
        const activePlayers = players.map(p => ({
          ...p,
          holeCards: [],
          isActive: p.chips > 0,
          isAllIn: false,
          currentBet: 0,
          totalBet: 0,
          action: undefined,
          // DO NOT RESET lastAction here if we want to preserve history? 
          // Actually, for a new hand, "last action" from previous hand is irrelevant.
          // But user said "Every game each player displays the last operation name".
          // I'll keep it undefined initially for new hand or maybe clear it?
          // Let's clear it for a clean slate per hand.
          lastAction: undefined 
        }));

        if (activePlayers.filter(p => p.isActive).length < 2) {
          // Game Over check could go here
          return;
        }

        // Move dealer button
        let nextDealer = (dealerPosition + 1) % players.length;
        while (!activePlayers[nextDealer].isActive) {
          nextDealer = (nextDealer + 1) % players.length;
        }

        // Blinds
        let sbPos = (nextDealer + 1) % players.length;
        while (!activePlayers[sbPos].isActive) sbPos = (sbPos + 1) % players.length;
        
        let bbPos = (sbPos + 1) % players.length;
        while (!activePlayers[bbPos].isActive) bbPos = (bbPos + 1) % players.length;

        // Post blinds
        const sbAmount = Math.min(activePlayers[sbPos].chips, smallBlind);
        activePlayers[sbPos].chips -= sbAmount;
        activePlayers[sbPos].currentBet = sbAmount;
        activePlayers[sbPos].totalBet = sbAmount;
        if (activePlayers[sbPos].chips === 0) {
            activePlayers[sbPos].isAllIn = true;
            activePlayers[sbPos].lastAction = 'SB (All-in)';
        } else {
            activePlayers[sbPos].lastAction = 'SB';
        }

        const bbAmount = Math.min(activePlayers[bbPos].chips, bigBlind);
        activePlayers[bbPos].chips -= bbAmount;
        activePlayers[bbPos].currentBet = bbAmount;
        activePlayers[bbPos].totalBet = bbAmount;
        if (activePlayers[bbPos].chips === 0) {
            activePlayers[bbPos].isAllIn = true;
            activePlayers[bbPos].lastAction = 'BB (All-in)';
        } else {
            activePlayers[bbPos].lastAction = 'BB';
        }

        // Deal cards
        const deck = createDeck();
        for (const player of activePlayers) {
          if (player.isActive) {
            player.holeCards = [deck.pop()!, deck.pop()!];
          }
        }

        // First to act is player after BB
        let currentTurn = (bbPos + 1) % players.length;
        while (!activePlayers[currentTurn].isActive) currentTurn = (currentTurn + 1) % players.length;

        set({
          players: activePlayers,
          deck,
          communityCards: [],
          pot: sbAmount + bbAmount,
          currentBet: bigBlind,
          dealerPosition: nextDealer,
          smallBlindPosition: sbPos,
          bigBlindPosition: bbPos,
          currentTurn,
          stage: 'preflop',
          minRaise: bigBlind,
          winners: [],
          currentHandHistory: [], // Reset history for new hand
        });
      },

      playerAction: (action, amount) => {
        const { players, currentTurn, currentBet, pot, stage, deck, communityCards, dealerPosition, minRaise, bigBlind, currentHandHistory } = get();
        // Safety check
        if (!players[currentTurn]) return;

        const newPlayers = players.map(p => ({ ...p }));
        const currentPlayer = newPlayers[currentTurn];

        let nextPot = pot;
        let nextBet = currentBet;
        let nextMinRaise = minRaise;
        
        // Calculate Equity for History Log
        // Note: For bots, this reveals info, but it's a requested feature.
        const equity = calculateEquity(
            currentPlayer.holeCards, 
            communityCards, 
            newPlayers.filter(p => p.isActive && p.id !== currentPlayer.id).length
        );
        const winRate = equity.winRate;

        // Create History Entry
        const historyEntry: HandHistoryEntry = {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            action: action.toUpperCase(),
            potSize: pot,
            winRate: winRate,
            timestamp: Date.now(),
            description: `${action.toUpperCase()} (Win: ${winRate.toFixed(1)}%)`
        };

        // Process action
        if (action === 'fold') {
          currentPlayer.isActive = false;
          currentPlayer.action = 'fold';
          currentPlayer.lastAction = 'FOLD';
        } else if (action === 'call') {
          const callAmount = currentBet - currentPlayer.currentBet;
          const actualCall = Math.min(currentPlayer.chips, callAmount);
          currentPlayer.chips -= actualCall;
          currentPlayer.currentBet += actualCall;
          currentPlayer.totalBet += actualCall;
          nextPot += actualCall;
          if (currentPlayer.chips === 0) currentPlayer.isAllIn = true;
          currentPlayer.action = 'call';
          currentPlayer.lastAction = 'CALL';
          historyEntry.amount = actualCall;
          historyEntry.description = `CALL $${actualCall} (Win: ${winRate.toFixed(1)}%)`;
        } else if (action === 'check') {
          currentPlayer.action = 'check';
          currentPlayer.lastAction = 'CHECK';
        } else if (action === 'raise' && amount) {
          const raiseTo = amount;
          const needed = raiseTo - currentPlayer.currentBet;
          const increase = raiseTo - currentBet;
          if (increase > 0) {
              nextMinRaise = increase;
          }
          currentPlayer.chips -= needed;
          currentPlayer.currentBet = raiseTo;
          currentPlayer.totalBet += needed;
          nextPot += needed;
          nextBet = raiseTo;
          if (currentPlayer.chips === 0) currentPlayer.isAllIn = true;
          currentPlayer.action = 'raise';
          currentPlayer.lastAction = 'RAISE';
          historyEntry.amount = needed;
          historyEntry.description = `RAISE to $${raiseTo} (Win: ${winRate.toFixed(1)}%)`;

          for (const p of newPlayers) {
            if (p.id !== currentPlayer.id && p.isActive && !p.isAllIn) {
                p.action = undefined;
            }
          }
        } else if (action === 'all-in') {
            const allInAmount = currentPlayer.chips + currentPlayer.currentBet;
            const needed = currentPlayer.chips;
            const increase = allInAmount - currentBet;
            if (increase > 0 && increase >= minRaise) {
                nextMinRaise = increase;
                for (const p of newPlayers) {
                    if (p.id !== currentPlayer.id && p.isActive && !p.isAllIn) {
                        p.action = undefined;
                    }
                }
            }
            if (allInAmount > nextBet) {
                nextBet = allInAmount;
            }
            currentPlayer.chips = 0;
            currentPlayer.currentBet = allInAmount;
            currentPlayer.totalBet += needed;
            nextPot += needed;
            currentPlayer.isAllIn = true;
            currentPlayer.action = 'all-in';
            currentPlayer.lastAction = 'ALL-IN';
            historyEntry.amount = needed;
            historyEntry.description = `ALL-IN $${needed} (Win: ${winRate.toFixed(1)}%)`;
        }
        
        // Update history
        const newHistory = [...currentHandHistory, historyEntry];

        // Check if only one player left
        const activePlayersCount = newPlayers.filter(p => p.isActive).length;
        if (activePlayersCount === 1) {
            const winner = newPlayers.find(p => p.isActive)!;
            winner.chips += nextPot;
            
            const winnersList = [{ playerId: winner.id, amount: nextPot }];
            
            const { currentSessionId, sessions } = get();
            const { sessionUpdates, updates } = completeShowdown(
                newPlayers,
                0, // Pot is 0 because we added it to winner manually? Wait, existing logic does winner.chips += nextPot.
                // The existing logic for "Fold to winner" is slightly different from Showdown.
                // Existing logic:
                // winner.chips += nextPot;
                // set({ players: newPlayers, pot: 0, ... })
                // It records history but maybe doesn't use the full Showdown logic because there are no cards to evaluate.
                // So I will leave this "Fold Winner" block ALONE.
                [], // No community cards needed for fold winner? 
                newHistory,
                currentSessionId,
                sessions,
                winnersList
            );
            
            set({ ...updates, sessions: sessionUpdates });
            return;
        }

        // Check for Human All-In in Single Player
        // Requirement: If human player chips empty, automatically end current round.
        if (get().mode === 'single' && currentPlayer.id === players[0].id && currentPlayer.chips === 0) {
             const newDeck = [...deck];
             const newCommunityCards = [...communityCards];
             
             // Deal remaining community cards until 5
             while (newCommunityCards.length < 5) {
                 if (newDeck.length > 0) {
                    newCommunityCards.push(newDeck.pop()!);
                 } else {
                    break; // Should not happen in standard deck
                 }
             }

             const { currentSessionId, sessions } = get();
             const { sessionUpdates, updates } = completeShowdown(
                 newPlayers,
                 nextPot,
                 newCommunityCards,
                 newHistory,
                 currentSessionId,
                 sessions
             );

             set({ ...updates, sessions: sessionUpdates, deck: newDeck });
             return;
        }

        // Check if round complete
        const activeNonAllIn = newPlayers.filter(p => p.isActive && !p.isAllIn);
        const allMatched = activeNonAllIn.every(p => p.currentBet === nextBet);
        const allActed = activeNonAllIn.every(p => p.action !== undefined);
        const roundComplete = (activeNonAllIn.length === 0) || (allMatched && allActed);

        if (roundComplete) {
            const nextStage = getNextStage(stage);
            newPlayers.forEach(p => {
                p.currentBet = 0;
                p.action = undefined;
            });

            const newDeck = [...deck];
            const newCommunityCards = [...communityCards];

            if (nextStage === 'flop') {
                newCommunityCards.push(newDeck.pop()!, newDeck.pop()!, newDeck.pop()!);
            } else if (nextStage === 'turn' || nextStage === 'river') {
                newCommunityCards.push(newDeck.pop()!);
            } else if (nextStage === 'showdown') {
                const { currentSessionId, sessions } = get();
                const { sessionUpdates, updates } = completeShowdown(
                    newPlayers,
                    nextPot,
                    communityCards, // use current community cards
                    newHistory,
                    currentSessionId,
                    sessions
                );
                set({ ...updates, sessions: sessionUpdates });
                return;
            }

            let nextTurn = (dealerPosition + 1) % newPlayers.length;
            while (!newPlayers[nextTurn].isActive || newPlayers[nextTurn].isAllIn) {
                nextTurn = (nextTurn + 1) % newPlayers.length;
                if (activeNonAllIn.length === 0) break; 
            }

            set({
                players: newPlayers,
                pot: nextPot,
                currentBet: 0,
                minRaise: bigBlind,
                communityCards: newCommunityCards,
                stage: nextStage,
                deck: newDeck,
                currentTurn: activeNonAllIn.length > 0 ? nextTurn : -1,
                currentHandHistory: newHistory
            });

        } else {
            let nextTurn = (currentTurn + 1) % newPlayers.length;
            while (!newPlayers[nextTurn].isActive || newPlayers[nextTurn].isAllIn) {
                nextTurn = (nextTurn + 1) % newPlayers.length;
            }

            set({
                players: newPlayers,
                pot: nextPot,
                currentBet: nextBet,
                currentTurn: nextTurn,
                minRaise: nextMinRaise,
                currentHandHistory: newHistory
            });
        }
      },

      resetGame: () => {
          // Keep sessions, but reset everything else to INITIAL_STATE
          const { sessions } = get();
          set({
              ...INITIAL_STATE,
              players: [], // Explicitly clear players because INITIAL_STATE does not include it
              sessions,
              // Do NOT preserve currentSessionId. Let it reset to '' from INITIAL_STATE.
              // This ensures next game starts a fresh session.
          });
      },
    }),
    {
      name: 'texas-holdem-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

const getNextStage = (stage: GameStage): GameStage => {
    switch (stage) {
        case 'preflop': return 'flop';
        case 'flop': return 'turn';
        case 'turn': return 'river';
        case 'river': return 'showdown';
        default: return 'showdown';
    }
};

const completeShowdown = (
    players: Player[],
    pot: number,
    communityCards: Card[],
    history: HandHistoryEntry[],
    currentSessionId: string,
    sessions: Record<string, Session>,
    precalculatedWinners?: { playerId: string; amount: number; hand?: HandEvaluation }[]
): { sessionUpdates: Record<string, Session>; updates: Partial<GameState> } => {
    
    let winnerInfo = precalculatedWinners;
    
    if (!winnerInfo) {
        // Calculate Winner
        const activePlayers = players.filter(p => p.isActive);
        const evaluations = activePlayers.map(p => ({
            player: p,
            eval: evaluateHand(p.holeCards, communityCards)
        }));
        
        evaluations.sort((a, b) => {
            if (b.eval.rank !== a.eval.rank) return b.eval.rank - a.eval.rank;
            return b.eval.score - a.eval.score;
        });

        const bestScore = evaluations[0].eval.score;
        const winners = evaluations.filter(e => e.eval.score === bestScore);
        const winAmount = Math.floor(pot / winners.length);
        const remainder = pot % winners.length;
        winnerInfo = [];
        
        winners.forEach((w, idx) => {
            const amount = winAmount + (idx < remainder ? 1 : 0);
            w.player.chips += amount;
            winnerInfo!.push({
                playerId: w.player.id,
                amount,
                hand: w.eval
            });
        });
    }

    // Record Hand Result
    let sessionUpdates = sessions;
    const session = sessions[currentSessionId];
    if (session) {
        const pnl: Record<string, number> = {};
        players.forEach(p => {
            const won = winnerInfo!.find(w => w.playerId === p.id);
            const amountWon = won ? won.amount : 0;
            pnl[p.id] = amountWon - p.totalBet;
        });
        
        const handResult: HandResult = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            winners: winnerInfo!,
            playerPnLs: pnl,
            history: history
        };
        
        const updatedSession = {
            ...session,
            hands: [...session.hands, handResult]
        };
        
        sessionUpdates = { ...sessions, [currentSessionId]: updatedSession };
    }

    return {
        sessionUpdates,
        updates: {
            players,
            pot: 0, // Pot is cleared
            communityCards,
            stage: 'showdown',
            winners: winnerInfo!,
            currentTurn: -1,
            currentHandHistory: history
        }
    };
};
