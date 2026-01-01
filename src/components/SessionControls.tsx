import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

export const SessionControls: React.FC = () => {
  const { sessions, currentSessionId, loadSession, endRound } = useGameStore();
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

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-50 pointer-events-auto">
        <div className="bg-gray-800 rounded p-1 flex items-center gap-2 border border-gray-600 shadow-lg">
            <span className="text-gray-400 text-xs px-2">History:</span>
            <input 
                type="date" 
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
            />
            <select 
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 w-48"
                value={currentSessionId}
                onChange={(e) => loadSession(e.target.value)}
            >
                {filteredSessions.map(s => (
                    <option key={s.id} value={s.id}>
                        {new Date(s.startTime).toLocaleString()} ({s.hands.length} hands)
                    </option>
                ))}
            </select>
        </div>
    </div>
  );
};
