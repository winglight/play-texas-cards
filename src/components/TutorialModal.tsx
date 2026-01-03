import React from 'react';
import { X, BookOpen, ChevronRight, HelpCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const TutorialModal: React.FC = () => {
  const { setTutorialSeen } = useGameStore();

  const handleClose = () => {
    setTutorialSeen(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 border-2 border-yellow-600 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <BookOpen className="text-yellow-500 w-8 h-8" />
            <h2 className="text-3xl font-serif font-bold text-white tracking-wide">
              Texas Hold'em Guide
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Introduction */}
          <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-500/30">
            <h3 className="text-xl font-bold text-blue-300 mb-2 flex items-center gap-2">
              <HelpCircle size={20} />
              Welcome to the Table!
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Your goal is to win chips by creating the best 5-card poker hand using your 2 private cards ("Hole Cards") and the 5 community cards on the table.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Game Stages */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-yellow-500 border-b border-gray-700 pb-2">
                Game Stages
              </h3>
              
              <div className="space-y-4">
                <StageItem 
                  title="1. Pre-Flop" 
                  desc="You receive 2 hole cards. Betting starts immediately based on these cards alone."
                />
                <StageItem 
                  title="2. Flop" 
                  desc="3 community cards are dealt face up. Everyone can use these to build their hand."
                />
                <StageItem 
                  title="3. Turn" 
                  desc="A 4th community card is dealt. Another round of betting ensues."
                />
                <StageItem 
                  title="4. River" 
                  desc="The 5th and final community card is dealt. The last betting round takes place."
                />
                <StageItem 
                  title="5. Showdown" 
                  desc="Remaining players reveal their cards. The best hand takes the pot!"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-green-500 border-b border-gray-700 pb-2">
                Your Actions
              </h3>
              
              <div className="grid gap-4">
                <ActionItem 
                  name="Check" 
                  desc="Pass the action to the next player without betting anything. Only possible if no one has bet yet."
                  color="bg-gray-700"
                />
                <ActionItem 
                  name="Call" 
                  desc="Match the current highest bet to stay in the hand."
                  color="bg-blue-600"
                />
                <ActionItem 
                  name="Raise" 
                  desc="Increase the current bet. Opponents must match your raise or fold."
                  color="bg-green-600"
                />
                <ActionItem 
                  name="Fold" 
                  desc="Discard your hand and forfeit the pot. You lose any chips you've already bet."
                  color="bg-red-600"
                />
                <ActionItem 
                  name="All-in" 
                  desc="Bet all your remaining chips. You can't be forced out of the hand, but can only win up to what you bet."
                  color="bg-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800 flex justify-end">
          <button 
            onClick={handleClose}
            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center gap-2"
          >
            I'm Ready to Play
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const StageItem: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="flex gap-4 group">
    <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border border-gray-600 group-hover:border-yellow-500 transition-colors">
      <span className="text-yellow-500 font-bold text-lg">{title.split('.')[0]}</span>
    </div>
    <div>
      <h4 className="font-bold text-white text-lg group-hover:text-yellow-400 transition-colors">{title.split('. ')[1]}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ActionItem: React.FC<{ name: string; desc: string; color: string }> = ({ name, desc, color }) => (
  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
    <div className="flex items-center gap-3 mb-2">
      <span className={`px-3 py-1 rounded text-xs font-bold text-white uppercase tracking-wider ${color}`}>
        {name}
      </span>
    </div>
    <p className="text-gray-400 text-sm">{desc}</p>
  </div>
);
