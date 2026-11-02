import React from 'react';

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const EMOJIS = ['🔥', '😂', '🎲', '👑', '😱', '👏'];

export const ReactionBar: React.FC<ReactionBarProps> = ({ onReact }) => {
  return (
    <div className="glass-panel px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-slate-700/60 rounded-full">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
