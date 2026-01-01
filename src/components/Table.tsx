import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Player } from './Player';
import { Card } from './Card';
import { Controls } from './Controls';
import { HistoryLog } from './HistoryLog';
import { SessionStats } from './SessionStats';
import { SessionControls } from './SessionControls';
import clsx from 'clsx';

// Pre-defined positions for 9 players
// [top%, left%]
const PLAYER_POSITIONS = [
  { bottom: '18%', left: '50%', transform: 'translateX(-50%)' }, // User (Bottom Center) - Moved down closer to controls
  { bottom: '25%', left: '5%', transform: 'translate(0, 0)' }, // Bottom Left
  { top: '40%', left: '5%', transform: 'translate(0, -50%)' }, // Left
  { top: '5%', left: '20%', transform: 'translate(-50%, 0)' }, // Top Left
  { top: '5%', left: '40%', transform: 'translate(-50%, 0)' }, // Top Center Left
  { top: '5%', left: '60%', transform: 'translate(-50%, 0)' }, // Top Center Right
  { top: '15%', left: '80%', transform: 'translate(-50%, 0)' }, // Top Right
  { top: '40%', right: '5%', transform: 'translate(0, -50%)' }, // Right
  { bottom: '25%', right: '10%', transform: 'translate(50%, 0)' }, // Bottom Right
];

export const Table: React.FC = () => {
  const { 
    players, 
    communityCards, 
    pot, 
    currentBet, 
    dealerPosition, 
    smallBlindPosition,
    bigBlindPosition,
    currentTurn,
    playerAction,
    bigBlind,
    minRaise,
    stage
  } = useGameStore();

  const userIndex = 0; // Assuming user is always index 0 for now
  const user = players[userIndex];
  
  if (!user) return <div className="flex items-center justify-center h-screen text-white">Loading Table...</div>;

  // Need to call amount calculation
  const toCall = currentBet - user.currentBet;

  return (
    <div className="relative w-full h-screen bg-green-900 overflow-hidden flex items-center justify-center font-sans">
      <SessionControls />
      {/* Table Surface */}
      <div className="relative w-[90vw] h-[60vh] md:w-[80vw] md:h-[70vh] bg-[#0F4C0F] rounded-[200px] border-[16px] border-[#3e2723] shadow-2xl flex flex-col items-center justify-center">
        {/* Table Logo / Pattern */}
        <div className="absolute opacity-10 text-yellow-500 font-serif text-6xl tracking-widest pointer-events-none select-none">
          TEXAS HOLD'EM
        </div>

        {/* Community Cards */}
        <div className="flex gap-2 mb-8 z-10 min-h-[96px]">
          {communityCards.map((card, i) => (
            <Card key={i} card={card} size="md" />
          ))}
          {/* Placeholders for cards to come? Maybe not needed */}
        </div>

        {/* Pot */}
        <div className="bg-black bg-opacity-40 px-6 py-2 rounded-full text-white font-mono text-xl border border-yellow-500 shadow-inner z-10">
          Pot: <span className="text-yellow-400">${pot}</span>
        </div>
        
        <HistoryLog />
        <SessionStats />
      </div>

      {/* Players */}
      {players.map((player, index) => {
        // Calculate position relative to user (if we rotate table)
        // But for single player, user is always at bottom.
        // Just map index to position slots.
        const posStyle = PLAYER_POSITIONS[index % PLAYER_POSITIONS.length];

        return (
          <div 
            key={player.id} 
            className="absolute"
            style={posStyle}
          >
            <Player 
              player={player} 
              isCurrentUser={index === userIndex}
              isCurrentTurn={index === currentTurn}
              isDealer={index === dealerPosition}
              roleLabel={index === smallBlindPosition ? 'SB' : index === bigBlindPosition ? 'BB' : undefined}
              playOrder={index + 1}
              showCards={stage === 'showdown'}
            />
          </div>
        );
      })}

      {/* Controls (Only if it's user's turn) */}
      {currentTurn === userIndex && user.isActive && !user.isAllIn && (
        <Controls
          onAction={playerAction}
          toCall={toCall}
          minRaise={minRaise}
          chips={user.chips}
          currentBet={user.currentBet}
          bigBlind={bigBlind}
        />
      )}
    </div>
  );
};
