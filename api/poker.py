from enum import IntEnum
from typing import List, Optional, Tuple, Dict
import random
from pydantic import BaseModel

class Suit(str):
    HEARTS = 'hearts'
    DIAMONDS = 'diamonds'
    CLUBS = 'clubs'
    SPADES = 'spades'

class HandRank(IntEnum):
    HIGH_CARD = 0
    PAIR = 1
    TWO_PAIR = 2
    THREE_OF_A_KIND = 3
    STRAIGHT = 4
    FLUSH = 5
    FULL_HOUSE = 6
    FOUR_OF_A_KIND = 7
    STRAIGHT_FLUSH = 8
    ROYAL_FLUSH = 9

class Card(BaseModel):
    suit: str
    rank: int # 2-14

    def __str__(self):
        ranks = {14: 'A', 13: 'K', 12: 'Q', 11: 'J'}
        r = ranks.get(self.rank, str(self.rank))
        return f"{r}-{self.suit}"

class HandEvaluation(BaseModel):
    rank: HandRank
    score: int
    name: str
    cards: List[Card]

SUITS = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES]
RANKS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]

def create_deck() -> List[Card]:
    deck = [Card(suit=s, rank=r) for s in SUITS for r in RANKS]
    random.shuffle(deck)
    return deck

def get_score(rank: HandRank, cards: List[Card]) -> int:
    score = rank.value * 1000000
    power = 4
    for card in cards:
        score += card.rank * (16 ** power)
        power -= 1
    return score

def evaluate_hand(hole_cards: List[Card], community_cards: List[Card]) -> HandEvaluation:
    all_cards = hole_cards + community_cards
    if not all_cards:
        return HandEvaluation(rank=HandRank.HIGH_CARD, score=0, name="Empty", cards=[])

    all_cards.sort(key=lambda c: c.rank, reverse=True)

    # Flush
    suit_counts: Dict[str, List[Card]] = {}
    for c in all_cards:
        if c.suit not in suit_counts:
            suit_counts[c.suit] = []
        suit_counts[c.suit].append(c)
    
    flush_suit = None
    flush_cards = []
    for s, cards in suit_counts.items():
        if len(cards) >= 5:
            flush_suit = s
            flush_cards = cards
            break
    
    # Straight
    unique_rank_cards = []
    seen_ranks = set()
    for c in all_cards:
        if c.rank not in seen_ranks:
            seen_ranks.add(c.rank)
            unique_rank_cards.append(c)
            
    straight_cards = get_straight_cards(unique_rank_cards)

    # Straight Flush
    straight_flush_cards = None
    if flush_suit:
        # Get unique ranks for flush cards
        unique_flush_cards = []
        seen_flush_ranks = set()
        for c in flush_cards:
            if c.rank not in seen_flush_ranks:
                seen_flush_ranks.add(c.rank)
                unique_flush_cards.append(c)
        straight_flush_cards = get_straight_cards(unique_flush_cards)

    if straight_flush_cards:
        rank = HandRank.ROYAL_FLUSH if straight_flush_cards[0].rank == 14 else HandRank.STRAIGHT_FLUSH
        return HandEvaluation(
            rank=rank,
            score=get_score(rank, straight_flush_cards),
            name="Royal Flush" if rank == HandRank.ROYAL_FLUSH else "Straight Flush",
            cards=straight_flush_cards
        )

    # Four of a Kind
    quads = get_n_of_a_kind(all_cards, 4)
    if quads:
        return HandEvaluation(
            rank=HandRank.FOUR_OF_A_KIND,
            score=get_score(HandRank.FOUR_OF_A_KIND, quads),
            name="Four of a Kind",
            cards=quads
        )

    # Full House
    full_house = get_full_house(all_cards)
    if full_house:
        return HandEvaluation(
            rank=HandRank.FULL_HOUSE,
            score=get_score(HandRank.FULL_HOUSE, full_house),
            name="Full House",
            cards=full_house
        )

    # Flush
    if flush_cards:
        best_flush = flush_cards[:5]
        return HandEvaluation(
            rank=HandRank.FLUSH,
            score=get_score(HandRank.FLUSH, best_flush),
            name="Flush",
            cards=best_flush
        )

    # Straight
    if straight_cards:
        return HandEvaluation(
            rank=HandRank.STRAIGHT,
            score=get_score(HandRank.STRAIGHT, straight_cards),
            name="Straight",
            cards=straight_cards
        )

    # Three of a Kind
    trips = get_n_of_a_kind(all_cards, 3)
    if trips:
        return HandEvaluation(
            rank=HandRank.THREE_OF_A_KIND,
            score=get_score(HandRank.THREE_OF_A_KIND, trips),
            name="Three of a Kind",
            cards=trips
        )

    # Two Pair
    two_pair = get_two_pair(all_cards)
    if two_pair:
        return HandEvaluation(
            rank=HandRank.TWO_PAIR,
            score=get_score(HandRank.TWO_PAIR, two_pair),
            name="Two Pair",
            cards=two_pair
        )

    # Pair
    pair = get_n_of_a_kind(all_cards, 2)
    if pair:
        return HandEvaluation(
            rank=HandRank.PAIR,
            score=get_score(HandRank.PAIR, pair),
            name="Pair",
            cards=pair
        )

    # High Card
    high_card = all_cards[:5]
    return HandEvaluation(
        rank=HandRank.HIGH_CARD,
        score=get_score(HandRank.HIGH_CARD, high_card),
        name="High Card",
        cards=high_card
    )

def get_straight_cards(unique_rank_cards: List[Card]) -> Optional[List[Card]]:
    if len(unique_rank_cards) < 5:
        return None
        
    # Check normal straights
    for i in range(len(unique_rank_cards) - 4):
        chunk = unique_rank_cards[i:i+5]
        if chunk[0].rank - chunk[4].rank == 4:
            return chunk
            
    # Check A-5-4-3-2
    ranks = [c.rank for c in unique_rank_cards]
    if 14 in ranks and 5 in ranks and 4 in ranks and 3 in ranks and 2 in ranks:
        # Construct 5,4,3,2,A
        ace = next(c for c in unique_rank_cards if c.rank == 14)
        others = [c for c in unique_rank_cards if c.rank in [5,4,3,2]]
        # others is sorted desc: 5,4,3,2
        return others + [ace]
        
    return None

def get_n_of_a_kind(cards: List[Card], n: int) -> Optional[List[Card]]:
    counts = {}
    for c in cards:
        if c.rank not in counts:
            counts[c.rank] = []
        counts[c.rank].append(c)
    
    for rank in RANKS:
        if rank in counts and len(counts[rank]) == n:
            main_cards = counts[rank]
            kickers = [c for c in cards if c.rank != rank][:5-n]
            return main_cards + kickers
            
    return None

def get_full_house(cards: List[Card]) -> Optional[List[Card]]:
    counts = {}
    for c in cards:
        if c.rank not in counts:
            counts[c.rank] = []
        counts[c.rank].append(c)
        
    three = None
    two = None
    
    for rank in RANKS:
        if rank in counts and len(counts[rank]) >= 3:
            three = counts[rank][:3]
            break
            
    if three:
        for rank in RANKS:
            if rank in counts and len(counts[rank]) >= 2 and rank != three[0].rank:
                two = counts[rank][:2]
                break
                
    if three and two:
        return three + two
    return None

def get_two_pair(cards: List[Card]) -> Optional[List[Card]]:
    counts = {}
    for c in cards:
        if c.rank not in counts:
            counts[c.rank] = []
        counts[c.rank].append(c)
        
    pairs = []
    for rank in RANKS:
        if rank in counts and len(counts[rank]) >= 2:
            pairs.append(counts[rank][:2])
            
    if len(pairs) >= 2:
        best_pairs = pairs[0] + pairs[1]
        remaining = [c for c in cards if c.rank != pairs[0][0].rank and c.rank != pairs[1][0].rank]
        return best_pairs + [remaining[0]]
        
    return None
