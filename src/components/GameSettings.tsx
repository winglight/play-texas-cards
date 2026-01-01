import React, { useState } from 'react';
import { GameSettings as GameSettingsType, TableType } from '../types/poker';

interface GameSettingsProps {
  onStart: (settings: GameSettingsType) => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({ onStart }) => {
  const [tableType, setTableType] = useState<TableType>('nl');
  const [playerCount, setPlayerCount] = useState<6 | 9>(6);
  const [bigBlind, setBigBlind] = useState<number>(20);
  const [maxBuyInBB, setMaxBuyInBB] = useState<number>(100);
  const [startingChips, setStartingChips] = useState<number>(2000);

  // Auto-update starting chips when BB or Buy-in changes
  const handleBuyInChange = (bb: number) => {
    setMaxBuyInBB(bb);
    setStartingChips(bigBlind * bb);
  };

  const handleBBChange = (amount: number) => {
    setBigBlind(amount);
    setStartingChips(amount * maxBuyInBB);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      tableType,
      playerCount,
      bigBlind,
      maxBuyInBB,
      startingChips
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-900 font-sans">
      <div className="bg-[#1a2e1a] p-8 rounded-xl shadow-2xl border-2 border-yellow-600 w-full max-w-md">
        <h2 className="text-3xl font-bold text-yellow-500 mb-6 text-center font-serif tracking-wide">Table Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Table Type */}
          <div className="space-y-2">
            <label className="block text-gray-300 font-semibold">Table Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['nl', 'pl', 'fl'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTableType(type)}
                  className={`py-2 rounded border font-bold transition-colors ${
                    tableType === type
                      ? 'bg-yellow-600 text-white border-yellow-400'
                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {type === 'nl' ? 'No-Limit' : type === 'pl' ? 'Pot-Limit' : 'Fixed'}
                </button>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="space-y-2">
            <label className="block text-gray-300 font-semibold">Players</label>
            <div className="flex space-x-4">
              {[6, 9].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPlayerCount(count as 6 | 9)}
                  className={`flex-1 py-2 rounded border font-bold transition-colors ${
                    playerCount === count
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {count}-Max
                </button>
              ))}
            </div>
          </div>

          {/* Big Blind */}
          <div className="space-y-2">
            <label className="block text-gray-300 font-semibold">
              Big Blind Amount: <span className="text-yellow-400">${bigBlind}</span>
            </label>
            <input
              type="range"
              min="2"
              max="100"
              step="2"
              value={bigBlind}
              onChange={(e) => handleBBChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$2</span>
              <span>$100</span>
            </div>
          </div>

          {/* Max Buy-in (BBs) */}
          <div className="space-y-2">
            <label className="block text-gray-300 font-semibold">
              Max Buy-in (BBs): <span className="text-yellow-400">{maxBuyInBB}BB</span>
            </label>
            <input
              type="range"
              min="50"
              max="200"
              step="10"
              value={maxBuyInBB}
              onChange={(e) => handleBuyInChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>50BB</span>
              <span>200BB</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-black/40 p-4 rounded-lg border border-gray-700 space-y-2">
             <div className="flex justify-between text-sm">
                <span className="text-gray-400">Small Blind:</span>
                <span className="text-white font-mono">${bigBlind / 2}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-400">Starting Chips:</span>
                <span className="text-yellow-400 font-mono font-bold">${startingChips}</span>
             </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-xl rounded-lg hover:from-yellow-500 hover:to-yellow-400 transform hover:scale-[1.02] transition-all shadow-lg"
          >
            Start Game
          </button>
        </form>
      </div>
    </div>
  );
};
