import { Card, HandRank } from '../types/poker';
import { createDeck, evaluateHand, shuffleDeck } from './poker';

export const calculateEquity = (
  heroCards: Card[],
  communityCards: Card[],
  opponentsCount: number,
  iterations: number = 1000
): { winRate: number; tieRate: number } => {
  if (heroCards.length !== 2) return { winRate: 0, tieRate: 0 };

  let wins = 0;
  let ties = 0;

  // Create base deck (full deck minus known cards)
  const fullDeck = createDeck();
  const knownCards = [...heroCards, ...communityCards];
  const deck = fullDeck.filter(
    c => !knownCards.some(k => k.suit === c.suit && k.rank === c.rank)
  );

  for (let i = 0; i < iterations; i++) {
    // Shuffle remaining deck
    const currentDeck = shuffleDeck([...deck]);
    
    // Deal to opponents
    const opponentHands: Card[][] = [];
    for (let j = 0; j < opponentsCount; j++) {
        opponentHands.push([currentDeck.pop()!, currentDeck.pop()!]);
    }

    // Deal remaining community cards
    const currentCommunity = [...communityCards];
    while (currentCommunity.length < 5) {
        currentCommunity.push(currentDeck.pop()!);
    }

    // Evaluate
    const heroEval = evaluateHand(heroCards, currentCommunity);
    const opponentEvals = opponentHands.map(h => evaluateHand(h, currentCommunity));

    // Compare
    let won = true;
    let tie = false;

    for (const oppEval of opponentEvals) {
        if (oppEval.rank > heroEval.rank) {
            won = false;
            break;
        } else if (oppEval.rank === heroEval.rank) {
            if (oppEval.score > heroEval.score) {
                won = false;
                break;
            } else if (oppEval.score === heroEval.score) {
                tie = true;
            }
        }
    }

    if (won && !tie) wins++;
    if (won && tie) ties++; // Strictly speaking, tie with best opponent
  }

  return {
    winRate: (wins / iterations) * 100,
    tieRate: (ties / iterations) * 100
  };
};
