import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';

export const SessionControls: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, currentSessionId, loadSession, resetGame } = useGameStore();
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD

  const sortedSessions = useMemo(() => {
      return Object.values(sessions).sort((a, b) => b.startTime - a.startTime);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
      if (!filterDate) return sortedSessions;
      return sortedSessions.filter(s => {
          const d = new Date(s.startTime);
          const dateStr = d.toISOString().split('T')[0];
          return dateStr === filterDate;
      });
  }, [sortedSessions, filterDate]);

  const handleEndSession = () => {
      resetGame();
      navigate('/');
  };

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-50 pointer-events-auto">
        <div className="bg-gray-800 rounded p-1 flex items-center gap-2 border border-gray-600 shadow-lg">
            <input 
                type="date" 
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
            />
            <select 
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 w-40"
                value={currentSessionId}
                onChange={(e) => loadSession(e.target.value)}
            >
                {filteredSessions.map(s => (
                    <option key={s.id} value={s.id}>
                        {new Date(s.startTime).toLocaleTimeString()} ({s.hands.length}) - {s.playerCount || 6}/{s.totalSeats || (s.playerCount === 9 ? 9 : 6)}
                    </option>
                ))}
            </select>
        </div>
        <button 
          onClick={handleEndSession}
          className="bg-red-800 text-white px-2 py-1 rounded hover:bg-red-700 text-xs font-bold border border-red-900 shadow-lg h-[26px] whitespace-nowrap"
        >
          End Session
        </button>
    </div>
  );
};
