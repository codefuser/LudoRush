import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Copy, Check, Gamepad2 } from 'lucide-react';
import { sounds } from '../../game/soundEffects.js';

interface HeaderProps {
  roomCode?: string;
  connected: boolean;
  onLeave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomCode, connected, onLeave }) => {
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
    <header className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between z-20">
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
          <Gamepad2 size={18} />
        </div>
        <span className="font-extrabold text-base tracking-tight text-white font-display hidden sm:inline">
          Ludo <span className="text-cyan-400">Rush</span>
        </span>
      </div>

      {/* Center Room Code Pill if inside a room */}
      {roomCode && (
        <button
          onClick={copyCode}
          title="Click to copy room code"
          className="glass-pill px-3 py-1 flex items-center gap-2 text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
        >
          <span className="text-[10px] text-slate-400 uppercase font-sans">Room:</span>
          <span className="text-cyan-400 tracking-wider">{roomCode}</span>
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      )}

      {/* Controls & Connection Status */}
      <div className="flex items-center gap-2">
        {/* Connection status indicator */}
        <span
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full glass-pill"
          style={{ color: connected ? '#10B981' : '#F59E0B' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: connected ? '#10B981' : '#F59E0B' }}
          />
          <span className="hidden sm:inline">{connected ? 'Online' : 'Connecting...'}</span>
        </span>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white transition-colors"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
            className="p-2 rounded-xl glass-pill text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
