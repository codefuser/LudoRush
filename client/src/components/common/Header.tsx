import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Copy, Check, Gamepad2 } from 'lucide-react';
import { sounds } from '../../game/soundEffects.js';

interface HeaderProps {
  roomCode?: string;
  modeLabel?: string;
  connected: boolean;
  onLeave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomCode, modeLabel, connected, onLeave }) => {
  const [muted, setMuted] = useState(!sounds.enabled);
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setMuted(!sounds.enabled);
  };

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto px-3 py-2 flex items-center justify-between z-20 shrink-0">
      {/* Brand logo */}
      <div className="flex items-center gap-2 select-none">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 border border-cyan-300/30">
          <Gamepad2 size={18} className="text-white drop-shadow" />
        </div>
        <span className="font-black text-sm sm:text-base tracking-tight text-white font-display">
          Ludo <span className="text-cyan-400">Rush</span>
        </span>
      </div>

      {/* Center Mode Badge or Copyable Room Code Pill */}
      {modeLabel ? (
        <div className="glass-pill px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-cyan-300">
          <span>{modeLabel}</span>
        </div>
      ) : roomCode ? (
        <button
          onClick={copyCode}
          title="Click to copy room code"
          className="glass-pill px-2.5 py-1 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
        >
          <span className="text-[9px] text-slate-400 uppercase font-sans">Room:</span>
          <span className="text-cyan-400 tracking-wider font-extrabold">{roomCode}</span>
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
        </button>
      ) : null}

      {/* Controls & Connection Status */}
      <div className="flex items-center gap-1.5">
        {/* Connection status indicator */}
        <span
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full glass-pill"
          style={{ color: modeLabel || connected ? '#10B981' : '#F59E0B' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: modeLabel || connected ? '#10B981' : '#F59E0B' }}
          />
          <span className="hidden sm:inline">
            {modeLabel ? 'Local' : connected ? 'Online' : 'Connecting...'}
          </span>
        </span>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-1.5 rounded-lg glass-pill text-slate-300 hover:text-white transition-colors"
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Leave Room Button */}
        {onLeave && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to leave the game?')) {
                onLeave();
              }
            }}
            title="Leave Room"
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
