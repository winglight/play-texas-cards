import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const SessionControls: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, currentSessionId, loadSession, resetGame } = useGameStore();
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
  const [sessionEnded, setSessionEnded] = useState(false);

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
      if (!sessionEnded) {
          setSessionEnded(true);
      } else {
          resetGame();
          navigate('/');
      }
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
                onChange={(e) => {
                    loadSession(e.target.value);
                    setSessionEnded(false);
                }}
            >
                {filteredSessions.map(s => (
                    <option key={s.id} value={s.id}>
                        {new Date(s.startTime).toLocaleTimeString()} ({s.hands.length})
                    </option>
                ))}
            </select>
        </div>
        <button 
          onClick={handleEndSession}
          className={clsx(
              "text-white px-2 py-1 rounded text-xs font-bold border shadow-lg h-[26px] whitespace-nowrap transition-colors",
              sessionEnded 
                ? "bg-blue-600 border-blue-700 hover:bg-blue-500" 
                : "bg-red-800 border-red-900 hover:bg-red-700"
          )}
        >
          {sessionEnded ? "New Session" : "End Session"}
        </button>
    </div>
  );
};
