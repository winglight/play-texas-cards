import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';
import { Play, Pause, SkipBack, SkipForward, Square } from 'lucide-react';

export const HistoryLog: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  const { 
      currentHandHistory, 
      winners, 
      replayState,
      sessions,
      currentSessionId,
      nextReplayStep,
      prevReplayStep,
      toggleReplay,
      stopReplay
  } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentHandHistory, winners, replayState.currentStep]);

  // Replay Auto-play logic
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (replayState.isActive && replayState.isPlaying) {
          interval = setInterval(() => {
              nextReplayStep();
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [replayState.isActive, replayState.isPlaying, nextReplayStep]);

  // Determine what to show
  let displayHistory = currentHandHistory;
  let isReplayMode = replayState.isActive && replayState.handId;

  if (isReplayMode) {
      const session = sessions[currentSessionId];
      const hand = session?.hands.find(h => h.id === replayState.handId);
      if (hand && hand.history) {
          // Slice history up to current step
          displayHistory = hand.history.slice(0, replayState.currentStep + 1);
      }
  }

  return (
    <div 
      className={clsx("flex flex-col overflow-hidden bg-black bg-opacity-70 rounded-lg border border-gray-600 pointer-events-auto", className)}
      style={style}
    >
      <div className="bg-gray-800 px-3 py-1 text-xs font-bold text-gray-300 border-b border-gray-600 flex justify-between items-center">
        <span>{isReplayMode ? 'REPLAY MODE' : 'HAND HISTORY'}</span>
        
        {isReplayMode && (
            <div className="flex items-center space-x-1">
                <button onClick={prevReplayStep} className="p-0.5 hover:text-white" title="Previous Step">
                    <SkipBack size={12} />
                </button>
                <button onClick={toggleReplay} className="p-0.5 hover:text-white" title={replayState.isPlaying ? "Pause" : "Play"}>
                    {replayState.isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button onClick={stopReplay} className="p-0.5 hover:text-red-400" title="Stop Replay">
                    <Square size={12} />
                </button>
                <button onClick={nextReplayStep} className="p-0.5 hover:text-white" title="Next Step">
                    <SkipForward size={12} />
                </button>
            </div>
        )}
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono"
      >
        {displayHistory.map((entry, idx) => (
          <div key={idx} className="flex flex-col border-b border-gray-700 pb-1 mb-1 last:border-0">
            <div className="flex justify-between items-baseline">
              <span className="text-blue-400 font-bold truncate max-w-[80px]">
                {entry.playerName}
              </span>
              <span className="text-gray-400 text-[10px]">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between">
               <span className={clsx(
                   "font-bold",
                   entry.action === 'FOLD' && "text-gray-500",
                   entry.action === 'CHECK' && "text-yellow-200",
                   entry.action === 'CALL' && "text-yellow-400",
                   entry.action === 'RAISE' && "text-red-400",
                   entry.action === 'ALL-IN' && "text-red-600 animate-pulse",
               )}>
                   {entry.action}
               </span>
               {entry.amount && (
                   <span className="text-red-300">
                       ${entry.amount}
                   </span>
               )}
            </div>
            {entry.winRate !== undefined && (
                <div className="text-[10px] text-green-300/70 italic">
                    Win Rate: {entry.winRate.toFixed(1)}%
                </div>
            )}
          </div>
        ))}
        
        {/* Show Winners if round ended (only in live mode or if replay reached end) */}
        {(!isReplayMode && winners.length > 0) && (
            <div className="mt-2 pt-2 border-t border-yellow-600">
                {winners.map((w, i) => {
                    const player = useGameStore.getState().players.find(p => p.id === w.playerId);
                    return (
                        <div key={i} className="text-yellow-400 font-bold">
                            🏆 {player?.name || w.playerId} won <span className="text-green-400">+${w.amount}</span>
                            {w.hand && <div className="text-[10px] text-gray-300 font-normal">{w.hand.name}</div>}
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};
