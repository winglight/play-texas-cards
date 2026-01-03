import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Player as PlayerType } from '../types/poker';
import { Card } from './Card';

interface PlayerProps {
  player: PlayerType;
  isCurrentUser: boolean;
  isCurrentTurn: boolean;
  isDealer: boolean;
  roleLabel?: string;
  playOrder?: number;
  showCards?: boolean;
}

const getStrategyInfo = (strategy?: string) => {
    switch (strategy) {
        case 'beginner': return { label: 'L', color: 'bg-green-500', name: 'Beginner (L)', desc: 'A loose-passive player who plays too many hands and calls often, ignoring pot odds.' };
        case 'veteran': return { label: 'M', color: 'bg-blue-500', name: 'Veteran (M)', desc: 'A tight-aggressive player who plays solid cards and understands basic board textures.' };
        case 'pro': return { label: 'H', color: 'bg-red-500', name: 'Pro (H)', desc: 'A master player who uses equity calculations and pot odds to make mathematically optimal decisions.' };
        case 'random': return { label: 'R', color: 'bg-purple-500', name: 'Random (R)', desc: 'A completely unpredictable player who makes random moves regardless of the game state.' };
        default: return null;
    }
};

export const Player: React.FC<PlayerProps> = ({ 
  player, 
  isCurrentUser, 
  isCurrentTurn, 
  isDealer,
  roleLabel,
  playOrder,
  showCards = false 
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const strategyInfo = getStrategyInfo(player.aiStrategy);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  return (
    <div className={clsx(
      "relative flex flex-col items-center",
      !player.isActive && "opacity-50"
    )}>
      {/* Dealer Button & Role Info - Top Right of Avatar */}
      <div className="absolute top-0 -right-6 flex flex-col items-center gap-1 z-30 pointer-events-none">
          {isDealer && (
            <div className="w-5 h-5 bg-white text-black rounded-full flex items-center justify-center font-bold border border-gray-400 shadow-md text-[10px]">
              D
            </div>
          )}
          {roleLabel && (
            <div className={clsx(
              "text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm whitespace-nowrap",
              roleLabel === 'SB' ? "bg-purple-600 text-white" :
              roleLabel === 'BB' ? "bg-orange-600 text-white" :
              "bg-gray-600 text-white"
            )}>
              {roleLabel}
            </div>
          )}
      </div>

      {/* Seat Order Info */}
      {playOrder !== undefined && (
         <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
            <span className="text-[10px] text-white bg-black/70 px-1.5 py-0.5 rounded font-mono shadow-sm border border-white/20">
                Seat:{playOrder}
            </span>
         </div>
      )}

      {/* Profile Popup */}
      {showProfile && strategyInfo && (
          <div 
            ref={profileRef}
            className="absolute bottom-full mb-4 z-50 w-64 bg-white text-black p-4 rounded-xl shadow-2xl border border-gray-200 animate-fade-in cursor-default"
            onClick={(e) => e.stopPropagation()} 
          >
              <div className="flex items-center gap-3 mb-2">
                  <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md", strategyInfo.color)}>
                      {strategyInfo.label}
                  </div>
                  <div>
                      <div className="font-bold text-lg leading-tight">{player.name}</div>
                      <div className="text-xs text-gray-500 font-medium">{strategyInfo.name}</div>
                  </div>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed border-t border-gray-100 pt-2 mt-1">
                  {strategyInfo.desc}
              </p>
              <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500 font-mono">
                  <span>Chips: ${player.chips}</span>
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowProfile(false);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                      CLOSE
                  </button>
              </div>
              
              {/* Arrow */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"></div>
          </div>
      )}

      {/* Cards */}
      <div className="flex -space-x-4 mb-2">
        {player.holeCards.map((card, i) => (
          <Card 
            key={i} 
            card={card} 
            hidden={!showCards && !isCurrentUser && !player.isAllIn} 
            className={clsx(
              "transform origin-bottom transition-transform",
              i === 0 && "-rotate-6",
              i === 1 && "rotate-6",
              isCurrentTurn && "translate-y-[-4px]"
            )}
            size="sm"
          />
        ))}
        {player.holeCards.length === 0 && player.isActive && (
           <div className="w-16 h-24"></div>
        )}
      </div>

      {/* Avatar & Info */}
      <div 
        onClick={(e) => {
            if (player.isAi) {
                e.stopPropagation();
                setShowProfile(!showProfile);
            }
        }}
        className={clsx(
        "relative w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center bg-gray-800 text-white shadow-lg z-10 transition-all",
        player.isAi ? "cursor-pointer hover:scale-105 hover:shadow-xl" : "",
        isCurrentTurn ? "border-yellow-400 animate-pulse" : "border-gray-600",
        !player.isActive && "grayscale"
      )}>
        {/* Strategy Badge */}
        {strategyInfo && (
            <div className={clsx(
                "absolute top-0 left-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-gray-800 shadow-md transform -translate-x-1 -translate-y-1 z-20",
                strategyInfo.color
            )}>
                {strategyInfo.label}
            </div>
        )}

        <div className="text-sm font-bold truncate max-w-[90%] pointer-events-none">{player.name}</div>
        <div className="text-xs text-yellow-300 pointer-events-none">
            ${player.chips}
        </div>

        {/* Action Badge */}
        {(player.action || player.lastAction) && (
          <div className={clsx(
            "absolute -bottom-3 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shadow-sm pointer-events-none",
            ((player.action || player.lastAction)?.toLowerCase() === 'fold') ? "bg-gray-600" :
            ((player.action || player.lastAction)?.toLowerCase() === 'check') ? "bg-yellow-600" :
            ((player.action || player.lastAction)?.toLowerCase() === 'call') ? "bg-blue-600" :
            ((player.action || player.lastAction)?.toLowerCase() === 'raise') ? "bg-red-600" :
            ((player.action || player.lastAction)?.toLowerCase() === 'all-in') ? "bg-red-800 animate-pulse" :
            "bg-blue-600"
          )}>
            {(player.action || player.lastAction)}
          </div>
        )}
      </div>

      {/* Current Bet */}
      {player.currentBet > 0 && (
        <div className="absolute top-24 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-mono">
          ${player.currentBet}
        </div>
      )}
    </div>
  );
};
