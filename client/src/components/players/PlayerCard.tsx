import React from 'react';
import { Player, COLOR_CONFIG } from '@ludo/shared';
import { Crown } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  isLocal: boolean;
  turnTimeRemaining?: number;
  maxTurnTime?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isActive,
  isLocal,
  turnTimeRemaining = 30,
  maxTurnTime = 30,
}) => {
  const config = COLOR_CONFIG[player.color];

  return (
    <div
      style={{
        height: '44px',
        minHeight: '44px',
        maxHeight: '44px',
      }}
      className={`w-full flex items-center justify-between px-2.5 py-1 rounded-xl transition-all duration-300 relative select-none ${
        isActive
          ? 'bg-slate-800/80 ring-2 ring-white/30 shadow-md'
          : 'bg-transparent opacity-75'
      }`}
    >
      {/* Left: Avatar + Name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow transition-transform"
            style={{
              background: `linear-gradient(135deg, ${config.lightHex}, ${config.hex})`,
              boxShadow: isActive ? `0 0 10px ${config.hex}` : undefined,
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          {player.isHost && (
            <span
              className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-0.5 shadow"
              title="Room Host"
            >
              <Crown size={9} strokeWidth={3} />
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
            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
              You
            </span>
          )}
        </div>
      </div>

      {/* Right: Active turn countdown timer */}
      {isActive && maxTurnTime > 0 && (
        <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md text-amber-300 bg-amber-950/70 border border-amber-500/40 shadow-sm shrink-0 animate-pulse">
          {turnTimeRemaining}s
        </span>
      )}
    </div>
  );
};
