export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
}

export enum HandRank {
  HighCard = 0,
  Pair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export interface HandEvaluation {
  rank: HandRank;
  score: number; // For breaking ties
  name: string;
  cards: Card[]; // The best 5 cards
}

export type GameStage = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PlayerActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface Player {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  position: number; // 0-based index relative to button? Or absolute seat index
  isActive: boolean; // Not folded
  isAllIn: boolean;
  currentBet: number; // Bet in current round
  totalBet: number; // Total bet in hand
  isAi: boolean;
  aiStrategy?: 'beginner' | 'veteran' | 'pro' | 'random';
  action?: PlayerActionType; // Current round action
  lastAction?: string; // Persistent last action description
}

export interface PlayerSnapshot {
  id: string;
  name: string;
  chips: number;
  currentBet: number;
  totalBet: number;
  isActive: boolean;
  isAllIn: boolean;
  action?: PlayerActionType;
  holeCards: Card[];
}

export interface GameSnapshot {
  pot: number;
  communityCards: Card[];
  players: PlayerSnapshot[];
}

export interface HandHistoryEntry {
  playerId: string;
  playerName: string;
  action: string;
  amount?: number;
  potSize: number;
  winRate?: number;
  timestamp: number;
  description: string;
  snapshot?: GameSnapshot;
}

export interface HandResult {
  id: string;
  timestamp: number;
  winners: { playerId: string; amount: number; hand?: HandEvaluation }[];
  playerPnLs: Record<string, number>;
  history: HandHistoryEntry[]; // Full action history for replay
  initialDeck?: Card[];
}

export type TableType = 'nl' | 'pl' | 'fl';

export interface GameSettings {
  tableType: TableType;
  playerCount: 6 | 9;
  bigBlind: number;
  maxBuyInBB: number; // Max buy-in in BBs
  startingChips: number;
}

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  hands: HandResult[];
  playerCount?: number;
  totalSeats?: number;
}

export interface GameState {
  roomID?: string;
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentBet: number; // Current highest bet in the round
  dealerPosition: number;
  smallBlindPosition?: number;
  bigBlindPosition?: number;
  currentTurn: number; // Index of player whose turn it is
  stage: GameStage;
  deck: Card[];
  initialDeck?: Card[]; // Store initial deck for replay
  smallBlind: number;
  bigBlind: number;
  minRaise: number;
  winners: { playerId: string; amount: number; hand?: HandEvaluation }[];
  
  // History & Session
  currentSessionId: string;
  sessions: Record<string, Session>;
  currentHandHistory: HandHistoryEntry[];

  // Settings & Replay
  settings?: GameSettings;
  replayState: {
    isActive: boolean;
    handId: string | null;
    currentStep: number;
    isPlaying: boolean;
  };
}
