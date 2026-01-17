import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { logEvent, CATEGORY, ACTION } from '../utils/analytics';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { resetGame } = useGameStore();

  const handleStartSinglePlayer = () => {
    logEvent(CATEGORY.NAVIGATION, ACTION.START_GAME, 'Single Player');
    resetGame();
    navigate('/single-player');
  };

  const handleStartMultiplayer = () => {
    logEvent(CATEGORY.NAVIGATION, ACTION.START_GAME, 'Multiplayer');
    navigate('/multiplayer');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-serif text-yellow-500 mb-12 tracking-wider">
        TEXAS HOLD'EM
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Single Player Card */}
        <div 
          onClick={handleStartSinglePlayer}
          className="bg-green-800 rounded-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:bg-green-700 shadow-2xl border-4 border-transparent hover:border-yellow-400 group"
        >
          <div className="text-4xl mb-4">🃏</div>
          <h2 className="text-2xl font-bold text-white mb-2">Single Player</h2>
          <p className="text-green-200">
            Practice against AI bots. Perfect your strategy with real-time probability analysis.
          </p>
          <div className="mt-6 flex items-center text-yellow-400 font-bold group-hover:translate-x-2 transition-transform">
            Start Game →
          </div>
        </div>

        {/* Multiplayer Card */}
        <div 
          onClick={handleStartMultiplayer}
          className="bg-blue-900 rounded-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:bg-blue-800 shadow-2xl border-4 border-transparent hover:border-yellow-400 group"
        >
          <div className="text-4xl mb-4">🌍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Multiplayer</h2>
          <p className="text-blue-200">
            Create rooms and play with friends online.
          </p>
          <div className="mt-6 flex items-center text-yellow-400 font-bold group-hover:translate-x-2 transition-transform">
            Join Room →
          </div>
        </div>
      </div>
    </div>
  );
};
