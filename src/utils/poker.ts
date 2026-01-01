import { Card, HandEvaluation, HandRank, Rank, Suit } from '../types/poker';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const formatRank = (rank: Rank): string => {
  switch (rank) {
    case 14: return 'A';
    case 13: return 'K';
    case 12: return 'Q';
    case 11: return 'J';
    default: return rank.toString();
  }
};

export const evaluateHand = (holeCards: Card[], communityCards: Card[]): HandEvaluation => {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length === 0) {
    return { rank: HandRank.HighCard, score: 0, name: 'Empty', cards: [] };
  }
  
  // Sort by rank descending
  allCards.sort((a, b) => b.rank - a.rank);

  // Check Flush
  const flushSuit = getFlushSuit(allCards);
  const flushCards = flushSuit ? allCards.filter(c => c.suit === flushSuit) : [];

  // Check Straight
  const straightCards = getStraightCards(allCards);

  // Check Straight Flush
  let straightFlushCards: Card[] | null = null;
  if (flushSuit && flushCards.length >= 5) {
     straightFlushCards = getStraightCards(flushCards);
  }

  if (straightFlushCards) {
    return {
      rank: straightFlushCards[0].rank === 14 ? HandRank.RoyalFlush : HandRank.StraightFlush,
      score: getScore(HandRank.StraightFlush, straightFlushCards),
      name: straightFlushCards[0].rank === 14 ? 'Royal Flush' : 'Straight Flush',
      cards: straightFlushCards
    };
  }

  // Four of a Kind
  const fourKind = getNOfAKind(allCards, 4);
  if (fourKind) {
    return {
      rank: HandRank.FourOfAKind,
      score: getScore(HandRank.FourOfAKind, fourKind),
      name: 'Four of a Kind',
      cards: fourKind
    };
  }

  // Full House
  const fullHouse = getFullHouse(allCards);
  if (fullHouse) {
    return {
      rank: HandRank.FullHouse,
      score: getScore(HandRank.FullHouse, fullHouse),
      name: 'Full House',
      cards: fullHouse
    };
  }

  // Flush
  if (flushCards.length >= 5) {
    const bestFlush = flushCards.slice(0, 5);
    return {
      rank: HandRank.Flush,
      score: getScore(HandRank.Flush, bestFlush),
      name: 'Flush',
      cards: bestFlush
    };
  }

  // Straight
  if (straightCards) {
    return {
      rank: HandRank.Straight,
      score: getScore(HandRank.Straight, straightCards),
      name: 'Straight',
      cards: straightCards
    };
  }

  // Three of a Kind
  const threeKind = getNOfAKind(allCards, 3);
  if (threeKind) {
    return {
      rank: HandRank.ThreeOfAKind,
      score: getScore(HandRank.ThreeOfAKind, threeKind),
      name: 'Three of a Kind',
      cards: threeKind
    };
  }

  // Two Pair
  const twoPair = getTwoPair(allCards);
  if (twoPair) {
    return {
      rank: HandRank.TwoPair,
      score: getScore(HandRank.TwoPair, twoPair),
      name: 'Two Pair',
      cards: twoPair
    };
  }

  // Pair
  const pair = getNOfAKind(allCards, 2);
  if (pair) {
    return {
      rank: HandRank.Pair,
      score: getScore(HandRank.Pair, pair),
      name: 'Pair',
      cards: pair
    };
  }

  // High Card
  const highCard = allCards.slice(0, 5);
  return {
    rank: HandRank.HighCard,
    score: getScore(HandRank.HighCard, highCard),
    name: 'High Card',
    cards: highCard
  };
};

// Helper functions

const getFlushSuit = (cards: Card[]): Suit | null => {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    counts[card.suit] = (counts[card.suit] || 0) + 1;
    if (counts[card.suit] >= 5) return card.suit;
  }
  return null;
};

const getStraightCards = (cards: Card[]): Card[] | null => {
  const uniqueRankCards: Card[] = [];
  const seenRanks = new Set<number>();
  
  for (const card of cards) {
    if (!seenRanks.has(card.rank)) {
      seenRanks.add(card.rank);
      uniqueRankCards.push(card);
    }
  }

  // Check for 5-high straight (A-5-4-3-2)
  if (seenRanks.has(14) && seenRanks.has(2) && seenRanks.has(3) && seenRanks.has(4) && seenRanks.has(5)) {
    // Check if we have A, 5, 4, 3, 2 consecutive in uniqueRankCards (ignoring gaps)
    // Actually simpler: construct the straight
    const ace = uniqueRankCards.find(c => c.rank === 14)!;
    const five = uniqueRankCards.find(c => c.rank === 5)!;
    const four = uniqueRankCards.find(c => c.rank === 4)!;
    const three = uniqueRankCards.find(c => c.rank === 3)!;
    const two = uniqueRankCards.find(c => c.rank === 2)!;
    
    // Check normal straights first, as they are higher
    // But wait, A-2-3-4-5 is the lowest straight, so checking normal first covers higher ones.
  }

  for (let i = 0; i <= uniqueRankCards.length - 5; i++) {
    const chunk = uniqueRankCards.slice(i, i + 5);
    if (chunk[0].rank - chunk[4].rank === 4) {
      return chunk;
    }
  }

  // Special check for A-5-4-3-2
  if (seenRanks.has(14) && seenRanks.has(5) && seenRanks.has(4) && seenRanks.has(3) && seenRanks.has(2)) {
    const ace = uniqueRankCards.find(c => c.rank === 14)!;
    const others = uniqueRankCards.filter(c => [5, 4, 3, 2].includes(c.rank));
    return [ ...others, ace ]; // 5,4,3,2,A (technically 5 high straight)
  }

  return null;
};

const getNOfAKind = (cards: Card[], n: number): Card[] | null => {
  const counts: Record<number, Card[]> = {};
  for (const card of cards) {
    if (!counts[card.rank]) counts[card.rank] = [];
    counts[card.rank].push(card);
  }

  for (const rank of RANKS) { // Check from high to low
    if (counts[rank] && counts[rank].length === n) {
      const mainCards = counts[rank];
      const kickers = cards.filter(c => c.rank !== rank).slice(0, 5 - n);
      return [...mainCards, ...kickers];
    }
  }
  return null;
};

const getFullHouse = (cards: Card[]): Card[] | null => {
  const counts: Record<number, Card[]> = {};
  for (const card of cards) {
    if (!counts[card.rank]) counts[card.rank] = [];
    counts[card.rank].push(card);
  }

  let three: Card[] | null = null;
  let two: Card[] | null = null;

  for (const rank of RANKS) {
    if (counts[rank] && counts[rank].length >= 3) {
      three = counts[rank].slice(0, 3);
      break;
    }
  }

  if (three) {
    for (const rank of RANKS) {
      if (counts[rank] && counts[rank].length >= 2 && rank !== three[0].rank) {
        two = counts[rank].slice(0, 2);
        break;
      }
    }
  }

  if (three && two) {
    return [...three, ...two];
  }
  return null;
};

const getTwoPair = (cards: Card[]): Card[] | null => {
  const counts: Record<number, Card[]> = {};
  for (const card of cards) {
    if (!counts[card.rank]) counts[card.rank] = [];
    counts[card.rank].push(card);
  }

  const pairs: Card[][] = [];
  for (const rank of RANKS) {
    if (counts[rank] && counts[rank].length >= 2) {
      pairs.push(counts[rank].slice(0, 2));
    }
  }

  if (pairs.length >= 2) {
    const bestTwoPairs = [...pairs[0], ...pairs[1]];
    const remaining = cards.filter(c => c.rank !== pairs[0][0].rank && c.rank !== pairs[1][0].rank);
    return [...bestTwoPairs, remaining[0]];
  }
  return null;
};

const getScore = (rank: HandRank, cards: Card[]): number => {
  // Score = Rank * 1,000,000 + c1*16^4 + c2*16^3 + ...
  // Using base 16 (hex) for card ranks (2-14) fits nicely
  let score = rank * 1000000;
  let power = 4;
  for (const card of cards) {
    score += card.rank * Math.pow(16, power);
    power--;
  }
  return score;
};
