import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Copy, Check } from 'lucide-react';
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
    <header className="w-full max-w-5xl mx-auto px-3 py-2 flex items-center justify-between z-20 shrink-0">
      {/* Brand logo: 4 Ludo colored dots in rounded cube */}
      <div className="flex items-center gap-2 select-none">
        <div className="w-7 h-7 rounded-lg p-0.5 bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 shadow-md flex items-center justify-center">
          <div className="w-full h-full rounded-[6px] bg-slate-950 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1 p-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F51F2B]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#08B84B]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#087CF0]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD817]" />
            </div>
          </div>
        </div>
        <span className="font-black text-sm tracking-tight text-white font-display">
          LUDO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">RUSH</span>
        </span>
      </div>

      {/* Center Room Code Pill if inside a room */}
      {roomCode && (
        <button
          onClick={copyCode}
          title="Click to copy room code"
          className="glass-pill px-2.5 py-1 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
        >
          <span className="text-[9px] text-slate-400 uppercase font-sans">Room:</span>
          <span className="text-cyan-400 tracking-wider font-extrabold">{roomCode}</span>
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
        </button>
      )}

      {/* Controls & Connection Status */}
      <div className="flex items-center gap-1.5">
        {/* Connection status indicator */}
        <span
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full glass-pill"
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
