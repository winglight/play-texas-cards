from typing import Dict
from fastapi import WebSocket
from api.game_state import GameState

class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, GameState] = {}
        # room_id -> {player_id: WebSocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, player_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][player_id] = websocket

    def disconnect(self, room_id: str, player_id: str):
        if room_id in self.active_connections:
            if player_id in self.active_connections[room_id]:
                del self.active_connections[room_id][player_id]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_state(self, room_id: str):
        if room_id not in self.rooms: return
        game = self.rooms[room_id]
        
        if room_id in self.active_connections:
            # Game state dict
            base_state = game.dict()
            base_state['deck'] = [] # Always hide deck
            
            for pid, ws in self.active_connections[room_id].items():
                try:
                    # Create personalized state
                    # Deep copy needed? dict() returns basic types usually, but nested objects might need care.
                    # Pydantic .dict() is recursive.
                    
                    player_state = base_state.copy()
                    player_state['players'] = []
                    
                    for p in base_state['players']:
                        p_copy = p.copy()
                        # Hide cards if:
                        # 1. Not me AND
                        # 2. (Not showdown OR Player not active)
                        # Actually at showdown, active players show cards. Folded players usually muck.
                        
                        should_hide = False
                        if p['id'] != pid:
                            if game.stage != 'showdown':
                                should_hide = True
                            elif not p['is_active']:
                                should_hide = True
                        
                        if should_hide:
                            p_copy['hole_cards'] = []
                        
                        player_state['players'].append(p_copy)
                    
                    await ws.send_json({"type": "state", "data": player_state})
                except Exception as e:
                    print(f"Error broadcasting to {pid}: {e}")
