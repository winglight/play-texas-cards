import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Player } from './Player';
import { Card } from './Card';
import { Controls } from './Controls';
import { HistoryLog } from './HistoryLog';
import { SessionStats } from './SessionStats';
import { SessionControls } from './SessionControls';
import { List, X } from 'lucide-react';
import { TutorialModal } from './TutorialModal';

// Pre-defined positions for 9 players
// [top%, left%]
const PLAYER_POSITIONS = [
  { bottom: '18%', left: '50%', transform: 'translateX(-50%)' }, // User (Bottom Center) - Moved down closer to controls
  { bottom: '25%', left: '5%', transform: 'translate(0, 0)' }, // Bottom Left
  { top: '45%', left: '5%', transform: 'translate(0, -50%)' }, // Left
  { top: '15%', left: '17%', transform: 'translate(-50%, 0)' }, // Top Left
  { top: '15%', left: '42%', transform: 'translate(-50%, 0)' }, // Top Center Left
  { top: '15%', left: '67%', transform: 'translate(-50%, 0)' }, // Top Center Right
  { top: '18%', left: '90%', transform: 'translate(-50%, 0)' }, // Top Right
  { top: '45%', right: '5%', transform: 'translate(0, -50%)' }, // Right
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
    smallBlind,
    minRaise,
    stage,
    tutorialSeen,
    replayState,
    sessions,
    currentSessionId
  } = useGameStore();

  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Replay Logic
  let displayPlayers = players;
  let displayCommunityCards = communityCards;
  let displayPot = pot;
  let isReplay = false;
  let replayTurn = -1;
  let displayStage = stage;

  if (replayState.isActive && replayState.handId) {
      const session = sessions[currentSessionId];
      const hand = session?.hands.find(h => h.id === replayState.handId);
      if (hand && hand.history[replayState.currentStep]) {
          const step = hand.history[replayState.currentStep];
          if (step.snapshot) {
              isReplay = true;
              // Merge snapshot with static player info
              displayPlayers = step.snapshot.players.map(snap => {
                  const original = players.find(p => p.id === snap.id);
                  // Use type assertion to merge types
                  if (!original) return snap as unknown as typeof players[0];
                  return {
                      ...original,
                      ...snap
                  };
              });
              displayCommunityCards = step.snapshot.communityCards;
              displayPot = step.snapshot.pot;
              replayTurn = displayPlayers.findIndex(p => p.id === step.playerId);
              
              // Infer stage for display
              if (displayCommunityCards.length === 0) displayStage = 'preflop';
              else if (displayCommunityCards.length === 3) displayStage = 'flop';
              else if (displayCommunityCards.length === 4) displayStage = 'turn';
              else if (displayCommunityCards.length === 5) displayStage = 'river';
          }
      }
  }

  const activeTurn = isReplay ? replayTurn : currentTurn;

  const userIndex = 0; // Assuming user is always index 0 for now
  const user = displayPlayers[userIndex];
  
  if (!user) return <div className="flex items-center justify-center h-screen text-white">Loading Table...</div>;

  // Need to call amount calculation
  const toCall = currentBet - user.currentBet;

  return (
    <div className="relative w-full h-screen bg-green-900 overflow-hidden flex items-center justify-center font-sans">
      {!tutorialSeen && <TutorialModal />}
      <SessionControls />
      
      {/* Replay Indicator */}
      {isReplay && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-50 animate-pulse border-2 border-red-400">
              REPLAY MODE - Step {replayState.currentStep + 1}
          </div>
      )}

      {/* Info Panel Toggle */}
      <button 
        onClick={() => setShowInfoPanel(!showInfoPanel)}
        className="absolute top-[60px] right-4 z-50 bg-gray-800 text-white p-2 rounded border border-gray-600 hover:bg-gray-700 shadow-lg flex items-center gap-2"
        title="Toggle Info Panel"
      >
        {showInfoPanel ? <X size={20} /> : <List size={20} />}
        <span className="text-xs font-bold hidden md:inline">INFO</span>
      </button>

      {/* Info Panel Overlay */}
      {showInfoPanel && (
         <div className="absolute top-[100px] right-4 w-80 h-[400px] z-50 flex flex-col bg-gray-900 rounded-lg border border-gray-600 shadow-2xl overflow-hidden">
            <div className="flex-1 overflow-hidden relative p-0 bg-black/50 border-b border-gray-700">
                <HistoryLog className="w-full h-full !rounded-none !border-0" />
            </div>
            <div className="flex-1 overflow-hidden relative p-0 bg-black/50">
                <SessionStats className="w-full h-full !rounded-none !border-0" />
            </div>
         </div>
      )}

      {/* Table Surface */}
      <div className="relative w-[90vw] h-[60vh] md:w-[80vw] md:h-[70vh] bg-[#0F4C0F] rounded-[200px] border-[16px] border-[#3e2723] shadow-2xl flex flex-col items-center justify-center">
        {/* Table Logo / Pattern */}
        <div className="absolute opacity-10 text-yellow-500 font-serif text-6xl tracking-widest pointer-events-none select-none">
          TEXAS HOLD'EM
        </div>

        {/* Community Cards */}
        <div className="flex gap-2 mb-8 z-10 min-h-[96px] items-center justify-center">
          {(displayStage === 'preflop' || displayCommunityCards.length === 0) ? (
              <div className="text-yellow-500/50 font-serif text-lg text-center border border-yellow-500/30 rounded px-4 py-2 bg-black/20 animate-pulse">
                  <div className="font-bold tracking-widest">PRE-FLOP</div>
                  <div className="text-sm text-yellow-500/70">Blinds: {smallBlind}/{bigBlind}</div>
              </div>
          ) : (
            displayCommunityCards.map((card, i) => (
              <Card key={i} card={card} size="md" />
            ))
          )}
        </div>

        {/* Pot */}
        <div className="bg-black bg-opacity-40 px-6 py-2 rounded-full text-white font-mono text-xl border border-yellow-500 shadow-inner z-10">
          Pot: <span className="text-yellow-400">${displayPot}</span>
        </div>
      </div>

      {/* Players */}
      {displayPlayers.map((player, index) => {
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
              isCurrentTurn={index === activeTurn}
              isDealer={index === dealerPosition}
              roleLabel={index === smallBlindPosition ? 'SB' : index === bigBlindPosition ? 'BB' : undefined}
              playOrder={index + 1}
              showCards={displayStage === 'showdown' || isReplay}
            />
          </div>
        );
      })}

      {/* Controls (Only if it's user's turn) */}
      {!isReplay && currentTurn === userIndex && user.isActive && !user.isAllIn && (
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
