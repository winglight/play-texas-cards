import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Table } from '../components/Table';
import { ProbabilityCalculator } from '../components/ProbabilityCalculator';
import { GameSettings } from '../components/GameSettings';
import { useNavigate } from 'react-router-dom';
import { getAiAction } from '../utils/ai';
import { logEvent, CATEGORY, ACTION } from '../utils/analytics';
import { GameSettings as GameSettingsType } from '../types/poker';

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
  } = gameState;

  const handleStartGame = (settings: GameSettingsType) => {
    logEvent(CATEGORY.GAME, ACTION.START_GAME, `Type: ${settings.tableType}, Chips: ${settings.startingChips}`);
    initGame(settings);
  };

  const handleBack = () => {
    logEvent(CATEGORY.NAVIGATION, 'Click Back', 'From Single Player Settings');
    navigate('/');
  };

  const user = players[0];
  const activeOpponents = players.filter(p => p.isActive && p.id !== user?.id).length;



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

  // Auto-advance if everyone is all-in or no one can act
  useEffect(() => {
    if (currentTurn === -1 && stage !== 'showdown' && stage !== 'waiting' && winners.length === 0) {
        const timer = setTimeout(() => {
            gameState.nextStage();
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [currentTurn, stage, winners.length, gameState]);

  if (!settings && players.length === 0) {
      return (
          <div className="relative w-full h-screen bg-gray-900">
               {/* Back Button */}
              <button 
                onClick={handleBack}
                className="absolute top-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Back
              </button>
              <GameSettings onStart={handleStartGame} />
          </div>
      );
  }

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

      {/* Showdown / Round End Overlay removed per user request */}
    </div>
  );
};
