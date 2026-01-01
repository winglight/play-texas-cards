from typing import List, Optional, Dict
from pydantic import BaseModel
from api.poker import Card, create_deck, evaluate_hand, HandEvaluation

class Player(BaseModel):
    id: str
    name: str
    chips: int
    hole_cards: List[Card] = []
    position: int
    is_active: bool = True
    is_all_in: bool = False
    current_bet: int = 0
    total_bet: int = 0
    action: Optional[str] = None

class WinnerInfo(BaseModel):
    player_id: str
    amount: int
    hand: Optional[HandEvaluation]

class GameState(BaseModel):
    room_id: str
    players: List[Player] = []
    community_cards: List[Card] = []
    pot: int = 0
    current_bet: int = 0
    dealer_position: int = 0
    current_turn: int = 0
    stage: str = 'waiting' # waiting, preflop, flop, turn, river, showdown
    deck: List[Card] = []
    small_blind: int = 10
    big_blind: int = 20
    min_raise: int = 20
    winners: List[WinnerInfo] = []

    def add_player(self, player_id: str, name: str, chips: int):
        position = len(self.players)
        player = Player(id=player_id, name=name, chips=chips, position=position)
        self.players.append(player)
        return player

    def start_hand(self):
        if len(self.players) < 2:
            return
        
        # Reset players
        active_players = []
        for p in self.players:
            if p.chips > 0:
                p.is_active = True
                p.is_all_in = False
                p.current_bet = 0
                p.total_bet = 0
                p.hole_cards = []
                p.action = None
                active_players.append(p)
            else:
                p.is_active = False
        
        if len(active_players) < 2:
            return

        # Move dealer
        self.dealer_position = (self.dealer_position + 1) % len(self.players)
        while not self.players[self.dealer_position].is_active:
            self.dealer_position = (self.dealer_position + 1) % len(self.players)

        # Blinds
        sb_pos = (self.dealer_position + 1) % len(self.players)
        while not self.players[sb_pos].is_active: sb_pos = (sb_pos + 1) % len(self.players)
        
        bb_pos = (sb_pos + 1) % len(self.players)
        while not self.players[bb_pos].is_active: bb_pos = (bb_pos + 1) % len(self.players)

        sb_player = self.players[sb_pos]
        bb_player = self.players[bb_pos]

        sb_amount = min(sb_player.chips, self.small_blind)
        sb_player.chips -= sb_amount
        sb_player.current_bet = sb_amount
        sb_player.total_bet = sb_amount

        bb_amount = min(bb_player.chips, self.big_blind)
        bb_player.chips -= bb_amount
        bb_player.current_bet = bb_amount
        bb_player.total_bet = bb_amount

        # Deal cards
        self.deck = create_deck()
        for p in self.players:
            if p.is_active:
                p.hole_cards = [self.deck.pop(), self.deck.pop()]

        # Set turn
        self.current_turn = (bb_pos + 1) % len(self.players)
        while not self.players[self.current_turn].is_active:
            self.current_turn = (self.current_turn + 1) % len(self.players)

        self.community_cards = []
        self.pot = sb_amount + bb_amount
        self.current_bet = self.big_blind
        self.min_raise = self.big_blind
        self.stage = 'preflop'
        self.winners = []

    def handle_action(self, player_id: str, action: str, amount: int = 0):
        current_p = self.players[self.current_turn]
        if current_p.id != player_id:
            return False # Not your turn

        if action == 'fold':
            current_p.is_active = False
            current_p.action = 'fold'
        elif action == 'call':
            call_amount = self.current_bet - current_p.current_bet
            actual_call = min(current_p.chips, call_amount)
            current_p.chips -= actual_call
            current_p.current_bet += actual_call
            current_p.total_bet += actual_call
            self.pot += actual_call
            if current_p.chips == 0:
                current_p.is_all_in = True
            current_p.action = 'call'
        elif action == 'check':
            current_p.action = 'check'
        elif action == 'raise':
            needed = amount - current_p.current_bet
            increase = amount - self.current_bet
            if increase > 0:
                self.min_raise = increase
            
            current_p.chips -= needed
            current_p.current_bet = amount
            current_p.total_bet += needed
            self.pot += needed
            self.current_bet = amount
            
            if current_p.chips == 0:
                current_p.is_all_in = True
            current_p.action = 'raise'
            
            # Reset actions
            for p in self.players:
                if p.id != current_p.id and p.is_active and not p.is_all_in:
                    p.action = None
        
        elif action == 'all-in':
             # Simplified all-in logic similar to raise
             all_in_amt = current_p.chips + current_p.current_bet
             needed = current_p.chips
             increase = all_in_amt - self.current_bet
             if increase > 0 and increase >= self.min_raise:
                 self.min_raise = increase
                 for p in self.players:
                    if p.id != current_p.id and p.is_active and not p.is_all_in:
                        p.action = None

             if all_in_amt > self.current_bet:
                 self.current_bet = all_in_amt

             current_p.chips = 0
             current_p.current_bet = all_in_amt
             current_p.total_bet += needed
             self.pot += needed
             current_p.is_all_in = True
             current_p.action = 'all-in'

        # Check Round Complete
        active_non_allin = [p for p in self.players if p.is_active and not p.is_all_in]
        
        # Check Winner (only 1 left)
        active_count = len([p for p in self.players if p.is_active])
        if active_count == 1:
            winner = next(p for p in self.players if p.is_active)
            winner.chips += self.pot
            self.winners = [WinnerInfo(player_id=winner.id, amount=self.pot, hand=None)]
            self.pot = 0
            self.stage = 'showdown'
            return True

        all_matched = all(p.current_bet == self.current_bet for p in active_non_allin)
        all_acted = all(p.action is not None for p in active_non_allin)
        
        if (not active_non_allin) or (all_matched and all_acted):
            self.next_stage()
        else:
            self.next_turn()
        
        return True

    def next_turn(self):
        self.current_turn = (self.current_turn + 1) % len(self.players)
        loop_count = 0
        while (not self.players[self.current_turn].is_active or self.players[self.current_turn].is_all_in) and loop_count < len(self.players):
            self.current_turn = (self.current_turn + 1) % len(self.players)
            loop_count += 1

    def next_stage(self):
        stages = ['preflop', 'flop', 'turn', 'river', 'showdown']
        try:
            current_idx = stages.index(self.stage)
            next_s = stages[current_idx + 1]
        except:
            next_s = 'showdown'
            
        self.stage = next_s
        
        # Reset bets
        for p in self.players:
            p.current_bet = 0
            p.action = None
        
        self.current_bet = 0
        self.min_raise = self.big_blind

        if next_s == 'flop':
            self.community_cards.extend([self.deck.pop() for _ in range(3)])
        elif next_s in ['turn', 'river']:
            self.community_cards.append(self.deck.pop())
        elif next_s == 'showdown':
            self.resolve_showdown()
            return

        # Next turn starts from SB (or first active after Dealer)
        self.current_turn = (self.dealer_position + 1) % len(self.players)
        while not self.players[self.current_turn].is_active or self.players[self.current_turn].is_all_in:
             self.current_turn = (self.current_turn + 1) % len(self.players)
             # If everyone is all in, logic might need to loop? 
             # For backend, if everyone all in, we can just run to showdown immediately?
             # Let's keep it simple for now.

    def resolve_showdown(self):
        active = [p for p in self.players if p.is_active]
        evals = []
        for p in active:
            ev = evaluate_hand(p.hole_cards, self.community_cards)
            evals.append({'player': p, 'eval': ev})
        
        evals.sort(key=lambda x: (x['eval'].rank, x['eval'].score), reverse=True)
        
        if not evals: return

        best_score = evals[0]['eval'].score
        winners = [e for e in evals if e['eval'].score == best_score]
        
        win_amount = self.pot // len(winners)
        remainder = self.pot % len(winners)
        
        self.winners = []
        for i, w in enumerate(winners):
            amt = win_amount + (1 if i < remainder else 0)
            w['player'].chips += amt
            self.winners.append(WinnerInfo(
                player_id=w['player'].id,
                amount=amt,
                hand=w['eval']
            ))
        
        self.pot = 0
