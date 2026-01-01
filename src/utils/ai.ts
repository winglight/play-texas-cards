import { Player, GameState, PlayerActionType } from '../types/poker';
import { evaluateHand } from './poker';
import { calculateEquity } from './probability';

export const getAiAction = (
  player: Player,
  gameState: GameState
): { action: PlayerActionType; amount?: number } => {
  const { communityCards, currentBet, pot, bigBlind, minRaise } = gameState;
  const toCall = currentBet - player.currentBet;
  const activeOpponents = gameState.players.filter(p => p.isActive && p.id !== player.id).length;

  // Safety check
  if (!player.holeCards || player.holeCards.length < 2) {
    return { action: 'fold' };
  }

  // 1. Evaluate Hand Strength (0-1 score roughly)
  // For Preflop: High cards are good.
  // For Postflop: Hand Rank.

  // Calculative Strategy uses Equity
  if (player.aiStrategy === 'calculative') {
    const { winRate } = calculateEquity(player.holeCards, communityCards, activeOpponents, 500);
    const equity = winRate / 100;
    
    // Pot Odds
    // Amount to call / (Total Pot + Amount to call)
    const potOdds = toCall / (pot + toCall);
    
    if (toCall === 0) {
        return { action: 'check' };
    }

    if (equity > potOdds) {
        // Positive EV
        if (equity > 0.7) {
             // Strong hand, raise
             return { action: 'raise', amount: currentBet + minRaise };
        }
        return { action: 'call' };
    } else {
        // Negative EV, but maybe bluff?
        return { action: 'fold' };
    }
  }

  // Conservative & Aggressive use heuristics
  const handEval = evaluateHand(player.holeCards, communityCards);
  let strength = 0; // 0 to 10

  if (communityCards.length === 0) {
      // Preflop
      const c1 = player.holeCards[0];
      const c2 = player.holeCards[1];
      const pair = c1.rank === c2.rank;
      const suited = c1.suit === c2.suit;
      const highCards = c1.rank >= 10 && c2.rank >= 10;
      
      if (pair) strength += 5 + (c1.rank / 14) * 2;
      if (highCards) strength += 3;
      if (suited) strength += 1;
      if (c1.rank + c2.rank > 20) strength += 2;
  } else {
      // Postflop
      strength = handEval.rank * 2 + (handEval.score % 1000000) / 1000000;
      // Pair is rank 1. So strength >= 2.
      // High card is rank 0.
  }

  if (player.aiStrategy === 'conservative') {
      if (toCall === 0) return { action: 'check' };
      
      // Only call/raise if strength is decent
      if (strength >= 4 || (communityCards.length === 0 && strength >= 3)) {
          return { action: 'call' };
      }
      return { action: 'fold' };
  }

  if (player.aiStrategy === 'aggressive') {
      if (toCall === 0) {
          // Bet if strength ok
          if (strength >= 2) return { action: 'raise', amount: currentBet + bigBlind };
          return { action: 'check' };
      }
      
      if (strength >= 3) {
          // Raise
          return { action: 'raise', amount: currentBet + minRaise };
      }
      if (strength >= 1) {
          return { action: 'call' };
      }
      // Bluff chance
      if (Math.random() > 0.8) return { action: 'raise', amount: currentBet + minRaise };
      
      return { action: 'fold' };
  }

  // Fallback
  return { action: 'check' };
};
