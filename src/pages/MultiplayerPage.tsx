import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Table } from '../components/Table';
import { useNavigate } from 'react-router-dom';
import { GameState, Player, Card } from '../types/poker';

const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000';

export const MultiplayerPage: React.FC = () => {
  const navigate = useNavigate();
  const { setMode, updateState, setSocket, socket, players, stage } = useGameStore();
  
  const [inRoom, setInRoom] = useState(false);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMode('multi');
    return () => {
        if (socket) socket.close();
        setMode('single');
        setSocket(null);
    };
  }, []);

  const handleCreateRoom = async () => {
    try {
        const res = await fetch(`${API_URL}/api/rooms/create`, { method: 'POST' });
        const data = await res.json();
        setRoomId(data.room_id);
        // Auto join
        await handleJoinRoom(data.room_id);
    } catch (e) {
        setError('Failed to create room');
    }
  };

  const handleJoinRoom = async (rid: string = roomId) => {
    if (!username) {
        setError('Please enter a username');
        return;
    }
    if (!rid) {
        setError('Please enter a room ID');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/rooms/join?room_id=${rid}&username=${username}`, { method: 'POST' });
        if (!res.ok) throw new Error('Join failed');
        const data = await res.json();
        setPlayerId(data.player_id);
        connectWs(rid, data.player_id);
        setInRoom(true);
    } catch (e) {
        setError('Failed to join room. Check ID.');
    }
  };

  const connectWs = (rid: string, pid: string) => {
      const ws = new WebSocket(`${WS_URL}/ws/${rid}/${pid}`);
      
      ws.onopen = () => {
          console.log('Connected');
          setSocket(ws);
      };

      ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state') {
              const serverState = msg.data;
              const converted = convertServerState(serverState, pid);
              updateState(converted);
          }
      };

      ws.onclose = () => {
          console.log('Disconnected');
          setError('Connection lost');
          setInRoom(false);
      };
  };

  const startGame = () => {
      socket?.send(JSON.stringify({ type: 'start' }));
  };

  if (!inRoom) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-yellow-500">Multiplayer Lobby</h2>
                
                {error && <div className="bg-red-600 p-2 rounded mb-4 text-center">{error}</div>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-gray-700 p-3 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="flex gap-4 items-end">
                         <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Room ID</label>
                            <input 
                                value={roomId}
                                onChange={e => setRoomId(e.target.value.toUpperCase())}
                                className="w-full bg-gray-700 p-3 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono"
                                placeholder="Enter Room ID"
                            />
                         </div>
                         <button 
                            onClick={() => handleJoinRoom()}
                            className="bg-blue-600 px-6 py-3 rounded font-bold hover:bg-blue-700"
                         >
                            Join
                         </button>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500">OR</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <button 
                        onClick={handleCreateRoom}
                        className="w-full bg-green-700 p-3 rounded font-bold hover:bg-green-600"
                    >
                        Create New Room
                    </button>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full text-gray-400 hover:text-white mt-4"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
       <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        Exit
      </button>

      <div className="absolute top-4 right-4 z-50 text-white bg-gray-800 px-4 py-2 rounded flex gap-4">
          <span>Room: <span className="font-mono text-yellow-400 font-bold">{roomId}</span></span>
          {stage === 'waiting' && players.length >= 2 && (
              <button onClick={startGame} className="bg-green-600 px-2 rounded hover:bg-green-500">Start Game</button>
          )}
      </div>

      <Table />
      
      {stage === 'waiting' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40">
              <div className="text-white text-2xl font-bold animate-pulse">
                  Waiting for players to start... ({players.length} joined)
              </div>
          </div>
      )}
    </div>
  );
};

// Convert snake_case from server to camelCase for frontend
const convertServerState = (s: any, myId: string): Partial<GameState> => {
    return {
        roomID: s.room_id,
        pot: s.pot,
        currentBet: s.current_bet,
        dealerPosition: s.dealer_position,
        currentTurn: s.current_turn,
        stage: s.stage,
        deck: [], // Server hides it anyway
        smallBlind: s.small_blind,
        bigBlind: s.big_blind,
        minRaise: s.min_raise,
        communityCards: s.community_cards.map(convertCard),
        players: s.players.map((p: any) => convertPlayer(p, myId)),
        winners: s.winners.map((w: any) => ({
            playerId: w.player_id,
            amount: w.amount,
            hand: w.hand ? {
                ...w.hand,
                cards: w.hand.cards.map(convertCard)
            } : undefined
        }))
    };
};

const convertPlayer = (p: any, myId: string): Player => {
    return {
        id: p.id,
        name: p.name,
        chips: p.chips,
        position: p.position,
        isActive: p.is_active,
        isAllIn: p.is_all_in,
        currentBet: p.current_bet,
        totalBet: p.total_bet,
        action: p.action,
        isAi: false, // Server doesn't distinguish AI flag for UI usually, or assume human
        holeCards: p.hole_cards.map(convertCard)
    };
};

const convertCard = (c: any): Card => {
    // Server: {suit: 'hearts', rank: 14}
    // Client: same
    return {
        suit: c.suit,
        rank: c.rank
    };
};
