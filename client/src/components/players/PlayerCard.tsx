import React, { useState } from 'react';
import { Player, PlayerColor, COLOR_CONFIG } from '@ludo/shared';
import { Crown, Smile, Bot } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  isLocal: boolean;
  turnTimeRemaining?: number;
  maxTurnTime?: number;
  onReactToPlayer?: (targetColor: PlayerColor, emoji: string) => void;
}

const QUICK_EMOJIS = ['🔥', '😂', '👏', '👑', '😱'];

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isActive,
  isLocal,
  turnTimeRemaining = 30,
  maxTurnTime = 30,
  onReactToPlayer,
}) => {
  const config = COLOR_CONFIG[player.color];
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    if (onReactToPlayer) {
      onReactToPlayer(player.color, emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div
      style={{
        height: '42px',
        minHeight: '42px',
        maxHeight: '42px',
      }}
      className={`w-full flex items-center justify-between px-2.5 py-1 rounded-xl transition-all duration-300 relative select-none ${
        isActive
          ? 'bg-slate-800/90 ring-2 ring-white/30 shadow-md'
          : 'bg-slate-900/40 hover:bg-slate-800/50'
      }`}
    >
      {/* Left: Avatar + Name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow transition-transform ${
              !player.isConnected && !player.isBot ? 'opacity-50 grayscale' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${config.lightHex}, ${config.hex})`,
              boxShadow: isActive ? `0 0 10px ${config.hex}` : undefined,
            }}
          >
            {player.isBot ? <Bot size={15} /> : player.name.charAt(0).toUpperCase()}
          </div>
          {player.isHost && !player.isBot && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md border border-slate-900 shrink-0"
              style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }}
              title="Room Host"
            >
              <Crown size={9} strokeWidth={3} className="text-slate-950" />
            </span>
          )}
        </div>

        {/* Player Name */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`font-bold text-xs sm:text-sm truncate ${
              isActive ? 'text-white' : 'text-slate-300'
            }`}
          >
            {player.name}
          </span>
          {isLocal && (
            <span className="text-[10px] font-bold text-cyan-400 shrink-0">
              (You)
            </span>
          )}
          {!player.isConnected && !player.isBot && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 shrink-0">
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Right: Timer OR Opponent React Button */}
      <div className="flex items-center gap-1 shrink-0">
        {!isLocal && onReactToPlayer && (
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title={`React to ${player.name}`}
            className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-amber-300 transition-colors"
          >
            <Smile size={14} />
          </button>
        )}

        {isActive && maxTurnTime > 0 && (
          <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md text-amber-300 bg-amber-950/70 border border-amber-500/40 shadow-sm shrink-0 animate-pulse">
            {turnTimeRemaining}s
          </span>
        )}
      </div>

      {/* Floating Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          className="absolute -top-10 left-2 z-50 flex items-center gap-1 bg-slate-900/95 border border-slate-700/80 p-1 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => handleEmojiClick(e, emoji)}
              className="w-7 h-7 flex items-center justify-center text-sm hover:scale-130 active:scale-95 transition-transform"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowEmojiPicker(false)}
            className="w-5 h-5 flex items-center justify-center text-[10px] text-slate-400 hover:text-white ml-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
