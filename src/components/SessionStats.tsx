import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';
import { PlayCircle } from 'lucide-react';
import { Session } from '../types/poker';

export const SessionStats: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  const { currentSessionId, sessions, players, startReplay, stage, winners } = useGameStore();
  const [activeTab, setActiveTab] = useState<'hands' | 'leaderboard'>('hands');
  
  const session = sessions[currentSessionId];

  // Determine if replay is allowed
  // Allow replay if:
  // 1. It is a historical session (not the latest one)
  // 2. The current live hand is finished (winners exist or showdown)
  // 3. The game is in waiting state
  const canReplay = useMemo(() => {
    if (!session) return false;
    
    const sortedSessions = (Object.values(sessions) as Session[]).sort((a, b) => b.startTime - a.startTime);
    const latestSession = sortedSessions[0];
    const isHistoricalSession = latestSession && latestSession.id !== currentSessionId;
    
    return isHistoricalSession || winners.length > 0 || stage === 'showdown' || stage === 'waiting';
  }, [sessions, currentSessionId, winners.length, stage, session]);

  if (!session) return null;

  // Calculate Leaderboard
  const playerTotals: Record<string, number> = {};
  session.hands.forEach(hand => {
      Object.entries(hand.playerPnLs).forEach(([pid, pnl]) => {
          playerTotals[pid] = (playerTotals[pid] || 0) + pnl;
      });
  });

  const sortedPlayers = Object.entries(playerTotals)
      .map(([pid, total]) => {
          const p = players.find(pl => pl.id === pid);
          return {
              id: pid,
              name: p ? p.name : pid,
              total
          };
      })
      .sort((a, b) => b.total - a.total);

  return (
    <div 
      className={clsx("flex flex-col overflow-hidden bg-black bg-opacity-70 rounded-lg border border-gray-600 pointer-events-auto", className)}
      style={style}
    >
       <div className="flex border-b border-gray-600">
           <button 
             className={clsx("flex-1 py-1 text-xs font-bold", activeTab === 'hands' ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700")}
             onClick={() => setActiveTab('hands')}
           >
               HANDS
           </button>
           <button 
             className={clsx("flex-1 py-1 text-xs font-bold", activeTab === 'leaderboard' ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700")}
             onClick={() => setActiveTab('leaderboard')}
           >
               LEADERBOARD
           </button>
       </div>

       <div className="flex-1 overflow-y-auto p-2 text-xs font-mono">
           {activeTab === 'hands' ? (
               <div className="space-y-2">
                  {session.hands.length === 0 && <div className="text-gray-500 text-center mt-4">No hands played yet</div>}
                  {session.hands.slice().reverse().map((hand, idx) => {
                      const hasHistory = hand.history && hand.history.length > 0;
                      const isClickable = canReplay && hasHistory;

                      return (
                      <div 
                        key={hand.id} 
                        className={clsx(
                            "border-b border-gray-700 pb-1 last:border-0 transition-colors rounded p-1",
                            isClickable ? "hover:bg-gray-800 cursor-pointer group" : "opacity-70 cursor-not-allowed"
                        )}
                        onClick={() => isClickable && startReplay(hand.id)}
                        title={!canReplay ? "Wait for round end to replay" : !hasHistory ? "No history available" : "Click to Replay"}
                      >
                          <div className="text-gray-400 mb-1 flex justify-between items-center">
                              <span>Hand #{session.hands.length - idx} - {new Date(hand.timestamp).toLocaleTimeString()}</span>
                              {isClickable && <PlayCircle size={14} className="opacity-0 group-hover:opacity-100 text-yellow-500" />}
                          </div>
                          <div className="space-y-0.5">
                              {Object.entries(hand.playerPnLs).map(([pid, pnl]) => {
                                  if (pnl === 0) return null; // Skip break-even? Or show?
                                  const p = players.find(pl => pl.id === pid);
                                  const name = p ? p.name : pid;
                                  return (
                                      <div key={pid} className="flex justify-between">
                                          <span className="text-gray-300 truncate w-24">{name}</span>
                                          <span className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                                              {pnl > 0 ? '+' : ''}{pnl}
                                          </span>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                      );
                  })}
              </div>
           ) : (
               <div className="space-y-1">
                   {sortedPlayers.length === 0 && <div className="text-gray-500 text-center mt-4">No data</div>}
                   {sortedPlayers.map((p, idx) => (
                       <div key={p.id} className="flex justify-between items-center border-b border-gray-700 pb-1 last:border-0">
                           <div className="flex items-center gap-2">
                               <span className="text-gray-500 w-4 text-right">{idx + 1}.</span>
                               <span className="text-white font-bold truncate w-24">{p.name}</span>
                           </div>
                           <span className={clsx("font-bold", p.total >= 0 ? "text-green-400" : "text-red-400")}>
                               {p.total > 0 ? '+' : ''}{p.total}
                           </span>
                       </div>
                   ))}
               </div>
           )}
       </div>
    </div>
  );
};
