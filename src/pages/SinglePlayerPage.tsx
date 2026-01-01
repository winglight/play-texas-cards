import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Table } from '../components/Table';
import { ProbabilityCalculator } from '../components/ProbabilityCalculator';
import { GameSettings } from '../components/GameSettings';
import { useNavigate } from 'react-router-dom';
import { getAiAction } from '../utils/ai';

export const SinglePlayerPage: React.FC = () => {
  const navigate = useNavigate();
  const gameState = useGameStore();
  const { 
    initGame, 
    players, 
    communityCards,
    currentTurn, 
    playerAction, 
    stage, 
    winners,
    settings,
    resetGame,
    startNewHand // Import startNewHand
  } = gameState;

  const user = players[0];
  const activeOpponents = players.filter(p => p.isActive && p.id !== user?.id).length;

  const handleContinue = () => {
      startNewHand();
  };

  const handleEndSession = () => {
      resetGame();
      navigate('/');
  };

  // Auto-end round if user is bankrupt (This is now handled by gameStore logic mostly, 
  // but we keep this for UI reaction if needed, though gameStore now sets stage to showdown automatically)
  useEffect(() => {
    if (stage === 'showdown' && user?.chips === 0) {
      // setRoundEnded(true); 
    }
  }, [stage, user?.chips]);

  // AI Logic
  useEffect(() => {
    if (currentTurn !== -1 && players[currentTurn] && players[currentTurn].isAi && stage !== 'showdown') {
      const timer = setTimeout(() => {
        const player = players[currentTurn];
        const { action, amount } = getAiAction(player, gameState);
        playerAction(action, amount);
      }, 1000); // 1 second delay for realism

      return () => clearTimeout(timer);
    }
  }, [currentTurn, players, stage, playerAction, gameState]);

  if (!settings && players.length === 0) {
      return (
          <div className="relative w-full h-screen bg-gray-900">
               {/* Back Button */}
              <button 
                onClick={() => navigate('/')}
                className="absolute top-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Back
              </button>
              <GameSettings onStart={initGame} />
          </div>
      );
  }

  // Auto-advance if everyone is all-in or no one can act? 
  // For now let's stick to manual or turn-based.

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* Top Right Controls - Moved down to avoid overlap with SessionControls */}
      {/* Removed End Session button from here as it is now in SessionControls */}

      <Table />
      
      {/* Probability Calculator */}
      <ProbabilityCalculator 
        heroCards={user?.holeCards || []}
        communityCards={communityCards}
        activeOpponentsCount={activeOpponents}
      />

      {/* Showdown / Round End Overlay */}
      {stage === 'showdown' && (
        <div className="absolute inset-0 z-40 bg-black bg-opacity-50 flex flex-col items-center justify-center pointer-events-auto">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-lg">
            <h2 className="text-3xl font-bold mb-4 text-green-700">Hand Completed</h2>
            
            <div className="mb-6 space-y-2">
              {winners.map((winner, i) => {
                const player = players.find(p => p.id === winner.playerId);
                return (
                  <div key={i} className="text-lg">
                    <span className="font-bold">{player?.name}</span> won 
                    <span className="text-yellow-600 font-bold"> ${winner.amount}</span>
                    {winner.hand && (
                      <span className="text-gray-600"> with {winner.hand.name}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center">
              {/* Only show Continue if user has chips */}
              {user?.chips > 0 && (
                <button 
                  onClick={handleContinue}
                  className="px-8 py-3 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 shadow-lg transform hover:scale-105 transition-all"
                >
                  Continue
                </button>
              )}
              
              <button 
                onClick={handleEndSession}
                className="px-8 py-3 bg-red-600 text-white text-xl font-bold rounded-lg hover:bg-red-700 shadow-lg transform hover:scale-105 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
