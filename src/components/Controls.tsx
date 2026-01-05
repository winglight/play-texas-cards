import React, { useState, useEffect } from 'react';
import { PlayerActionType } from '../types/poker';

interface ControlsProps {
  onAction: (action: PlayerActionType, amount?: number) => void;
  toCall: number; // Amount needed to match current highest bet
  minRaise: number; // Minimum additional amount to raise
  chips: number; // Player's remaining chips
  currentBet: number; // Amount player already bet in this round
  bigBlind: number;
  maxRaiseToCap?: number;
}

export const Controls: React.FC<ControlsProps> = ({
  onAction,
  toCall,
  minRaise,
  chips,
  currentBet,
  bigBlind,
  maxRaiseToCap
}) => {
  // Slider value represents the total ADDITIONAL amount to put in? 
  // Or the total bet amount?
  // Let's make slider represent the RAISE TO amount (Total bet in this round)
  
  // Minimum raise-to amount: currentBet + toCall + minRaise
  // But if toCall is 0, min raise is bigBlind usually.
  
  const currentTotalPotBet = currentBet + toCall; // The current high bet on table
  const minRaiseTo = currentTotalPotBet + Math.max(minRaise, bigBlind);
  const baseMaxRaiseTo = currentBet + chips; // All-in amount
  const maxRaiseTo = maxRaiseToCap ? Math.min(baseMaxRaiseTo, maxRaiseToCap) : baseMaxRaiseTo;

  const [raiseAmount, setRaiseAmount] = useState(minRaiseTo);

  useEffect(() => {
    setRaiseAmount(Math.min(minRaiseTo, maxRaiseTo));
  }, [minRaiseTo, maxRaiseTo]);

  const handleRaise = () => {
    onAction('raise', raiseAmount);
  };

  const handleAllIn = () => {
    onAction('all-in', baseMaxRaiseTo);
  };

  const canCheck = toCall === 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 p-2 border-t border-gray-700 text-white flex flex-col items-center gap-2">
      {/* Bet Slider (only show if we can raise) */}
      {maxRaiseTo >= minRaiseTo && (
        <div className="w-full max-w-md flex items-center gap-4">
          <span className="text-sm font-mono">${minRaiseTo}</span>
          <input
            type="range"
            min={minRaiseTo}
            max={maxRaiseTo}
            step={bigBlind} // Step by BB
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono">${maxRaiseTo}</span>
          <div className="font-bold text-yellow-400 w-16 text-right">${raiseAmount}</div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onAction('fold')}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-bold shadow-lg transition-colors text-sm"
        >
          Fold
        </button>

        {canCheck ? (
          <button
            onClick={() => onAction('check')}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-bold shadow-lg transition-colors text-sm"
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => onAction('call')}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-bold shadow-lg transition-colors flex items-center gap-1 text-sm"
          >
            <span>Call</span>
            <span className="opacity-80">${toCall}</span>
          </button>
        )}

        {maxRaiseTo >= minRaiseTo && (
          <button
            onClick={handleRaise}
            className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 font-bold shadow-lg transition-colors flex items-center gap-1 text-sm"
          >
            <span>Raise to</span>
            <span className="opacity-80">${raiseAmount}</span>
          </button>
        )}
        
        <button
            onClick={handleAllIn}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 font-bold shadow-lg transition-colors text-sm"
        >
            All In
        </button>
      </div>
    </div>
  );
};
