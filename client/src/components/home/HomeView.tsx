import React, { useState, useEffect } from 'react';
import { RoomSettings } from '@ludo/shared';
import {
  Gamepad2,
  Users,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Trophy,
} from 'lucide-react';

interface HomeViewProps {
  onCreateRoom: (playerName: string, settings?: Partial<RoomSettings>) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  initialRoomCode?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = '',
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ludo_player_name') || '';
  });
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setTab('join');
    }
  }, [initialRoomCode]);

  const handleNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('ludo_player_name', name);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim() || 'Player';
    onCreateRoom(cleanName, {
      maxPlayers,
      turnTimerSeconds: turnTimer,
      threeSixesCancel: true,
      captureBonus: true,
      finishBonus: true,
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim() || 'Guest';
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode) {
      onJoinRoom(cleanCode, cleanName);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[85vh]">
      {/* Brand Logo & Title with 4 Ludo Colors */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-3xl p-1 bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 shadow-xl shadow-cyan-500/25 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
              <div className="grid grid-cols-2 gap-2 p-3">
                <div className="w-4 h-4 rounded-full bg-[#F51F2B] shadow-sm shadow-red-500/80 animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-[#08B84B] shadow-sm shadow-green-500/80" />
                <div className="w-4 h-4 rounded-full bg-[#087CF0] shadow-sm shadow-blue-500/80" />
                <div className="w-4 h-4 rounded-full bg-[#FFD817] shadow-sm shadow-yellow-500/80" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-display">
          LUDO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">RUSH</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xs font-medium">
          Real-time multiplayer board game. Play instantly with friends on any device.
        </p>
      </div>

      {/* Main Action Card */}
      <div className="w-full ludo-hero-card p-6 sm:p-8">
        {/* Tab Switcher */}
        <div className="ludo-tab-bar mb-6">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`ludo-tab-item ${tab === 'create' ? 'active' : ''}`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`ludo-tab-item ${tab === 'join' ? 'active' : ''}`}
          >
            Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                maxLength={18}
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. MasterRoller"
                className="ludo-input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Users size={14} className="text-cyan-400" /> Players
                </label>
                <div className="ludo-chip-group">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxPlayers(num as 2 | 3 | 4)}
                      className={`ludo-chip ${maxPlayers === num ? 'active' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-cyan-400" /> Turn Timer
                </label>
                <div className="ludo-chip-group">
                  {[0, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTurnTimer(sec)}
                      className={`ludo-chip ${turnTimer === sec ? 'active' : ''}`}
                    >
                      {sec === 0 ? 'Off' : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 ludo-cta-button"
            >
              <Sparkles size={18} /> Create Private Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                maxLength={18}
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. LuckyLudo"
                className="ludo-input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                6-Digit Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7A9BK2"
                className="ludo-input-field text-center font-mono tracking-widest text-lg font-bold uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={!roomCode.trim()}
              className="mt-2 ludo-cta-button"
            >
              Join Game <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>

      {/* Quick Rules Modal Button */}
      <button
        onClick={() => setShowRules(!showRules)}
        className="mt-6 ludo-pill-btn"
      >
        <HelpCircle size={16} className="text-cyan-400" /> How to Play & Rules
      </button>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" /> Classic Ludo Rules
              </h3>
              <button
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <strong className="text-cyan-300 block mb-1">🎲 Rolling a 6:</strong>
                Releases a token from BASE to the track. Grants an immediate extra turn!
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <strong className="text-emerald-300 block mb-1">⭐ Safe Star Cells:</strong>
                Tokens on the 8 star squares cannot be captured by opponent tokens.
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <strong className="text-rose-300 block mb-1">⚔️ Capturing:</strong>
                Landing on an opponent on an unsafe square captures them back to BASE and awards you a bonus roll!
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <strong className="text-amber-300 block mb-1">🏆 Winning:</strong>
                Navigate all 4 tokens around the board and into your home center triangle with exact rolls.
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Got it, let's play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
