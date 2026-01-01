from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.room_manager import RoomManager
from api.game_state import GameState
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = RoomManager()

@app.get("/")
def read_root():
    return {"Hello": "Texas Holdem"}

@app.post("/api/rooms/create")
async def create_room(player_count: int = 6):
    room_id = str(uuid.uuid4())[:6].upper()
    game = GameState(room_id=room_id)
    manager.rooms[room_id] = game
    return {"room_id": room_id}

@app.post("/api/rooms/join")
async def join_room(room_id: str, username: str):
    room_id = room_id.upper()
    if room_id not in manager.rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    game = manager.rooms[room_id]
    
    # Check if game already started? For MVP allow join anytime before full
    if len(game.players) >= 9:
         raise HTTPException(status_code=400, detail="Room full")

    player_id = str(uuid.uuid4())
    game.add_player(player_id, username, 1000)
    
    return {"player_id": player_id, "room_id": room_id}

@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    room_id = room_id.upper()
    if room_id not in manager.rooms:
        await websocket.close(code=4000)
        return

    await manager.connect(websocket, room_id, player_id)
    
    try:
        # Broadcast initial state (new player joined)
        await manager.broadcast_state(room_id)
        
        while True:
            data = await websocket.receive_json()
            game = manager.rooms[room_id]
            
            if data['type'] == 'action':
                amount = data.get('amount', 0)
                if amount is None: amount = 0
                success = game.handle_action(player_id, data['action'], int(amount))
                if success:
                    await manager.broadcast_state(room_id)
            elif data['type'] == 'start':
                game.start_hand()
                await manager.broadcast_state(room_id)
                
    except WebSocketDisconnect:
        manager.disconnect(room_id, player_id)
        # Handle disconnect (maybe fold player?)
        # For now, just leave them as inactive or do nothing
    except Exception as e:
        print(f"Error: {e}")
        manager.disconnect(room_id, player_id)
