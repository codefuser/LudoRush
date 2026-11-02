import React from 'react';
import { Player, COLOR_CONFIG } from '@ludo/shared';
import { Crown, Wifi, WifiOff } from 'lucide-react';

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
  const finishedCount = player.tokens.filter((t) => t.state === 'FINISHED').length;
  const progressPercent = maxTurnTime > 0 ? (turnTimeRemaining / maxTurnTime) * 100 : 100;

  return (
    <div
      style={{
        borderColor: isActive ? config.hex : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isActive
          ? `0 0 16px ${config.bgGlow}, 0 4px 12px rgba(0,0,0,0.4)`
          : '0 2px 6px rgba(0,0,0,0.25)',
      }}
      className={`glass-panel p-2.5 sm:p-3 flex items-center justify-between gap-2 transition-all duration-300 relative overflow-hidden ${
        isActive ? 'scale-[1.02] bg-slate-900/95 ring-2 ring-white/20' : 'opacity-85'
      }`}
    >
      {/* Left: Avatar + Details */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        {/* Avatar */}
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md relative shrink-0"
          style={{
            background: `linear-gradient(135deg, ${config.lightHex}, ${config.hex})`,
          }}
        >
          {player.name.charAt(0).toUpperCase()}
          {player.isHost && (
            <span
              className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-0.5 shadow"
              title="Host"
            >
              <Crown size={11} strokeWidth={3} />
            </span>
          )}
        </div>

        {/* Name and Badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs sm:text-sm truncate text-white">
              {player.name}
            </span>
            {isLocal && (
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-bold px-1.5 py-0.2 rounded border border-cyan-700/50">
                YOU
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 font-semibold" style={{ color: config.hex }}>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: config.hex }}
              />
              {config.name}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-300">
              🏠 {finishedCount}/4 Home
            </span>
          </div>
        </div>
      </div>

      {/* Right: Timer & Wifi */}
      <div className="flex flex-col items-end shrink-0 gap-1">
        <span
          className="flex items-center gap-1 text-[10px]"
          style={{ color: player.isConnected ? '#10B981' : '#EF4444' }}
        >
          {player.isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
        </span>

        {isActive && maxTurnTime > 0 && (
          <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
            {turnTimeRemaining}s
          </span>
        )}
      </div>

      {/* Turn Countdown Progress Line */}
      {isActive && maxTurnTime > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: config.hex,
            }}
          />
        </div>
      )}
    </div>
  );
};
