import React, { useEffect, useState } from 'react';
import { Card, HandEvaluation } from '../types/poker';
import { calculateEquity } from '../utils/probability';
import { evaluateHand } from '../utils/poker';

interface ProbabilityCalculatorProps {
  heroCards: Card[];
  communityCards: Card[];
  activeOpponentsCount: number;
}

export const ProbabilityCalculator: React.FC<ProbabilityCalculatorProps> = ({
  heroCards,
  communityCards,
  activeOpponentsCount,
}) => {
  const [equity, setEquity] = useState({ winRate: 0, tieRate: 0 });
  const [currentHand, setCurrentHand] = useState<HandEvaluation | null>(null);

  useEffect(() => {
    if (heroCards.length !== 2) return;

    // Calculate Current Hand
    const evaluation = evaluateHand(heroCards, communityCards);
    setCurrentHand(evaluation);

    // Calculate Equity (Debounce slightly or just run)
    // Run in timeout to not block render
    const timer = setTimeout(() => {
        const result = calculateEquity(heroCards, communityCards, activeOpponentsCount, 1000);
        setEquity(result);
    }, 10);

    return () => clearTimeout(timer);
  }, [heroCards, communityCards, activeOpponentsCount]);

  if (heroCards.length !== 2) return null;

  return (
    <div className="absolute bottom-[140px] right-4 bg-black bg-opacity-70 p-4 rounded-lg text-white text-sm border border-gray-600 shadow-xl pointer-events-none z-40">
      <h3 className="font-bold text-gray-300 mb-2 uppercase text-xs tracking-wider">Probability</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Win Rate:</span>
          <span className="font-mono font-bold text-green-400">{equity.winRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Tie Rate:</span>
          <span className="font-mono font-bold text-blue-400">{equity.tieRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-400 mb-1">Current Hand</div>
        <div className="font-bold text-yellow-500">{currentHand?.name}</div>
      </div>
    </div>
  );
};
