import { Player, GameState, PlayerActionType, HandRank } from '../types/poker';
import { evaluateHand } from './poker';
import { calculateEquity } from './probability';

export const getAiAction = (
  player: Player,
  gameState: GameState
): { action: PlayerActionType; amount?: number } => {
  const { communityCards, currentBet, pot, bigBlind, minRaise } = gameState;
  const toCall = currentBet - player.currentBet;
  const activeOpponents = gameState.players.filter(p => p.isActive && p.id !== player.id).length;
  const maxChips = player.chips + player.currentBet;

  const safeRaise = (targetAmount: number): { action: PlayerActionType; amount?: number } => {
      if (targetAmount >= maxChips) {
          return { action: 'all-in' };
      }
      return { action: 'raise', amount: targetAmount };
  };

  // Safety check
  if (!player.holeCards || player.holeCards.length < 2) {
    return { action: 'fold' };
  }

  // --- Random Strategy (R) ---
  if (player.aiStrategy === 'random') {
    const validActions: PlayerActionType[] = [];
    if (toCall === 0) validActions.push('check');
    else validActions.push('fold', 'call');
    
    // Allow raise if have chips
    if (player.chips > minRaise) {
        validActions.push('raise');
    }
    // Allow all-in
    validActions.push('all-in');

    // Weighted Random Selection
    // All-in: 2%
    // Others: Distributed evenly among remaining 98%
    const rand = Math.random();
    
    // Check if All-in is selected (2% chance)
    if (rand < 0.02) {
        return { action: 'all-in' };
    }
    
    // Remove all-in from valid actions for the remaining distribution
    const otherActions = validActions.filter(a => a !== 'all-in');
    const actionIndex = Math.floor(Math.random() * otherActions.length);
    const selectedAction = otherActions[actionIndex];
    
    if (selectedAction === 'raise') {
        const maxRaise = player.chips + player.currentBet;
        const minR = currentBet + minRaise;
        
        if (maxRaise < minR) return { action: 'all-in' }; // Not enough to min raise
        
        const randRaise = Math.random();
        let raiseAmount = minR;

        // Determine Min-Raise probability based on Pot Size
        // If currentBet is large (> 20BB), discourage Min-Raise to avoid infinite loops
        const isHighStakes = currentBet > bigBlind * 10;
        
        if (randRaise < 0.5) {
            // 50% chance: Minimum amount (or Pot/2 if high stakes)
             if (isHighStakes) {
                 raiseAmount = Math.max(minR, Math.floor(pot / 2));
             } else {
                 raiseAmount = minR;
             }
        } else if (randRaise < 0.75) {
            // 25% chance: 2x Minimum amount (or Pot Size if high stakes)
            if (isHighStakes) {
                 raiseAmount = Math.max(minR * 2, pot);
            } else {
                raiseAmount = minR * 2;
            }
        } else {
             // 25% chance: Random amount
             if (maxRaise > minR) {
                 raiseAmount = Math.floor(Math.random() * (maxRaise - minR + 1)) + minR;
             }
        }
        
        // Cap at maxRaise
        if (raiseAmount > maxRaise) {
            raiseAmount = maxRaise;
        }

        return { action: 'raise', amount: Math.floor(raiseAmount) };
    }
    
    return { action: selectedAction };
  }

  // --- Pro Strategy (H) ---
  if (player.aiStrategy === 'pro') {
    const { winRate } = calculateEquity(player.holeCards, communityCards, activeOpponents, 1000); // Higher iterations
    const equity = winRate / 100;
    
    // EV Calculation
    // EV = (%Win * PotAfterCall) - CallAmount
    const potAfterCall = pot + toCall;
    const ev = (equity * potAfterCall) - toCall;

    if (toCall === 0) {
        if (equity > 0.6) {
             // Value bet
             return safeRaise(currentBet + minRaise);
        }
        return { action: 'check' };
    }

    if (ev > 0) {
        // Positive EV
        if (equity > 0.75) {
             // Strong value raise
             return safeRaise(currentBet + minRaise * 2);
        }
        return { action: 'call' };
    } else {
        // Negative EV
        // Bluff opportunity? Pro might bluff with blockers (simulated by small random chance if EV is close)
        // If EV is slightly negative (e.g. > -1BB), maybe float
        if (ev > -bigBlind && Math.random() < 0.1) {
             return safeRaise(currentBet + minRaise);
        }
        return { action: 'fold' };
    }
  }

  // --- Heuristic Evaluation for Beginner/Veteran ---
  const handEval = evaluateHand(player.holeCards, communityCards);
  const isPreflop = communityCards.length === 0;
  
  // --- Veteran Strategy (M) ---
  if (player.aiStrategy === 'veteran') {
      if (isPreflop) {
          const c1 = player.holeCards[0];
          const c2 = player.holeCards[1];
          const isPair = c1.rank === c2.rank;
          const isHigh = c1.rank >= 10 && c2.rank >= 10;
          const isSuited = c1.suit === c2.suit;
          const isConnected = Math.abs(c1.rank - c2.rank) === 1;
          
          // Tight range: Pairs 7+, High Cards, Suited Connectors
          const strong = (isPair && c1.rank >= 7) || (c1.rank >= 12 && c2.rank >= 12); // 77+, QQ+
          const decent = isHigh || (isSuited && isConnected) || isPair;
          
          if (toCall > 0) {
              if (strong) return safeRaise(currentBet + minRaise);
              if (decent) return { action: 'call' };
              return { action: 'fold' };
          } else {
              if (strong) return safeRaise(currentBet + minRaise);
              return { action: 'check' };
          }
      } else {
          // Postflop: Fit or Fold
          const rank = handEval.rank;
          
          if (rank >= HandRank.TwoPair) {
              // Strong -> Raise
               return safeRaise(currentBet + minRaise);
          }
          if (rank === HandRank.Pair) {
              // Pair -> Call
              if (toCall > 0) return { action: 'call' };
              return { action: 'check' };
          }
          
          // No pair -> Fold to bet
          if (toCall === 0) return { action: 'check' };
          return { action: 'fold' };
      }
  }

  // --- Beginner Strategy (L) ---
  // Loose-Passive / Calling Station
  if (player.aiStrategy === 'beginner' || !player.aiStrategy) {
      if (isPreflop) {
          // Plays 70% of hands
          if (Math.random() < 0.7) {
              if (toCall > 0) return { action: 'call' };
              return { action: 'check' };
          } else {
              if (toCall > 0) return { action: 'fold' };
              return { action: 'check' };
          }
      } else {
          // Postflop: Chases everything
          const rank = handEval.rank;
          if (rank >= HandRank.Pair) {
              // Always call with any pair
              if (toCall > 0) return { action: 'call' };
              // Random min-bet
              if (Math.random() < 0.2) return safeRaise(currentBet + minRaise);
              return { action: 'check' };
          }
          
          // Even with High Card, calls often
          if (toCall > 0) {
              if (Math.random() < 0.6) return { action: 'call' }; // Calls 60% of time with air
              return { action: 'fold' };
          }
          return { action: 'check' };
      }
  }

  return { action: 'check' };
};
