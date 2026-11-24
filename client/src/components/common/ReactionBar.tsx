import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const EMOJIS = ['🔥', '😂', '🎲', '👑', '😱', '👏'];

const QUICK_TAUNTS = [
  '👏 Good Move!',
  '🎲 Roll a 6!',
  '⏰ Hurry Up!',
  '😅 Oops!',
  '🔥 On Fire!',
  '👑 Well Played!',
  '🎯 Target Locked!',
  '🤝 Good Game!',
];

export const ReactionBar: React.FC<ReactionBarProps> = ({ onReact }) => {
  const [showChat, setShowChat] = useState(false);

  const handleSelectTaunt = (taunt: string) => {
    onReact(taunt);
    setShowChat(false);
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Floating Quick Chat Popover */}
      {showChat && (
        <div
          className="absolute bottom-11 left-1/2 -translate-x-1/2 z-50 p-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{ width: '280px', maxWidth: '90vw' }}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <MessageSquare size={13} /> Quick Chat Taunts
            </span>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_TAUNTS.map((taunt) => (
              <button
                key={taunt}
                onClick={() => handleSelectTaunt(taunt)}
                className="text-left px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 hover:border-cyan-400/50 border border-slate-700/60 text-[11px] font-bold text-slate-200 hover:text-white transition-all truncate"
              >
                {taunt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Bar */}
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

        <div className="w-px h-5 bg-slate-700/60 mx-0.5" />

        <button
          onClick={() => setShowChat(!showChat)}
          title="Quick Chat Phrases"
          className="px-2 py-1 rounded-full flex items-center gap-1 text-[11px] font-extrabold text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
        >
          <MessageSquare size={13} />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>
    </div>
  );
};
