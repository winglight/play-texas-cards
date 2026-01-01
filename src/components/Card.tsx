import React from 'react';
import clsx from 'clsx';
import { Card as CardType } from '../types/poker';
import { formatRank } from '../utils/poker';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<string, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
  spades: 'text-black',
};

export const Card: React.FC<CardProps> = ({ card, hidden, className, size = 'md' }) => {
  if (hidden) {
    return (
      <div
        className={clsx(
          'rounded-lg border-2 border-white bg-blue-800 shadow-md flex items-center justify-center',
          {
            'w-12 h-16': size === 'sm',
            'w-16 h-24': size === 'md',
            'w-24 h-36': size === 'lg',
          },
          className
        )}
      >
        <div className="w-full h-full bg-opacity-20 bg-pattern flex items-center justify-center">
          <div className="w-3/4 h-3/4 border border-blue-400 rounded opacity-50"></div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div
      className={clsx(
        'rounded-lg bg-white shadow-md relative flex flex-col justify-between p-1 select-none',
        {
          'w-12 h-16 text-sm': size === 'sm',
          'w-16 h-24 text-base': size === 'md',
          'w-24 h-36 text-xl': size === 'lg',
        },
        suitColors[card.suit],
        className
      )}
    >
      <div className="font-bold leading-none">
        {formatRank(card.rank)}
        <div className="text-[0.6em]">{suitSymbols[card.suit]}</div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">
        {suitSymbols[card.suit]}
      </div>

      <div className="font-bold leading-none transform rotate-180 self-end">
        {formatRank(card.rank)}
        <div className="text-[0.6em]">{suitSymbols[card.suit]}</div>
      </div>
    </div>
  );
};
