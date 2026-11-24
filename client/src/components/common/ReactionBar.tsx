import React from 'react';

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const EMOJIS = ['🔥', '😂', '🎲', '👑', '😱', '👏'];

export const ReactionBar: React.FC<ReactionBarProps> = ({ onReact }) => {
  return (
    <div className="glass-panel px-2 py-0.5 sm:px-3 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 shadow-lg border border-slate-700/60 rounded-full">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-base sm:text-lg hover:scale-125 active:scale-95 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
