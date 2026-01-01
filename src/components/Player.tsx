import React from 'react';
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

export const Player: React.FC<PlayerProps> = ({ 
  player, 
  isCurrentUser, 
  isCurrentTurn, 
  isDealer,
  roleLabel,
  playOrder,
  showCards = false 
}) => {
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

      {/* Seat Order Info - Top Center (or maybe move to top left if crowded?) */}
      {/* User asked to keep Seat info. Let's keep it centered above for now, or move to top-left? */}
      {/* The screenshot showed Seat:X above the cards. User didn't complain about Seat position, only "SB, BB, D" */}
      {/* But wait, user said "Seat 1's avatar is covered... move to right of cards OR move whole thing above controls" */}
      {/* And "SB, BB, D... put them on the top right of the player avatar" */}
      
      {playOrder !== undefined && (
         <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
            <span className="text-[10px] text-white bg-black/70 px-1.5 py-0.5 rounded font-mono shadow-sm border border-white/20">
                Seat:{playOrder}
            </span>
         </div>
      )}

      {/* Cards */}
      <div className="flex -space-x-4 mb-2">
        {player.holeCards.map((card, i) => (
          <Card 
            key={i} 
            card={card} 
            hidden={!showCards && !isCurrentUser && !player.isAllIn} // Reveal all in or user
            // Actually, logic for revealing should be passed in. For now, hide unless currentUser or showCards
            // showCards usually true at Showdown
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
           // Placeholder for empty hand if active (shouldn't happen usually)
           <div className="w-16 h-24"></div>
        )}
      </div>

      {/* Dealer Button - Moved slightly outside */}
      {/* Handled above */}

      {/* Avatar & Info */}
      <div className={clsx(
        "relative w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center bg-gray-800 text-white shadow-lg z-10",
        isCurrentTurn ? "border-yellow-400 animate-pulse" : "border-gray-600",
        !player.isActive && "grayscale"
      )}>
        <div className="text-sm font-bold truncate max-w-[90%]">{player.name}</div>
        <div className="text-xs text-yellow-300">
            ${player.chips}
        </div>

        {/* Action Badge */}
        {(player.action || player.lastAction) && (
          <div className={clsx(
            "absolute -bottom-3 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shadow-sm",
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
