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
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[85vh]">
      {/* Brand Logo & Title */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-emerald-500 to-rose-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Gamepad2 size={34} className="text-white" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Ludo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Rush</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
          Real-time multiplayer board game. Play instantly with friends on any device.
        </p>
      </div>

      {/* Main Action Card */}
      <div className="w-full glass-panel p-6 sm:p-8 shadow-2xl rounded-3xl">
        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-900/90 p-1.5 mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              tab === 'create'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              tab === 'join'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                maxLength={18}
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. MasterRoller"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Users size={14} className="text-cyan-400" /> Players
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxPlayers(num as 2 | 3 | 4)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        maxPlayers === num
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-cyan-400" /> Turn Timer
                </label>
                <div className="flex gap-2">
                  {[0, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTurnTimer(sec)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        turnTimer === sec
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec === 0 ? 'Off' : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles size={18} /> Create Private Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                maxLength={18}
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. LuckyLudo"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                6-Digit Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7A9BK2"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-center font-mono tracking-widest text-lg uppercase font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!roomCode.trim()}
              className={`mt-2 w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                roomCode.trim()
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              Join Game <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>

      {/* Quick Rules Modal / Accordion Button */}
      <button
        onClick={() => setShowRules(!showRules)}
        className="mt-6 px-5 py-2.5 rounded-full bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/60 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all"
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
