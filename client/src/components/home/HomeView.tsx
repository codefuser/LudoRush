import React, { useState, useEffect } from 'react';
import { RoomSettings, PlayerColor, PLAYER_COLORS, COLOR_CONFIG } from '@ludo/shared';
import {
  Gamepad2,
  Users,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Trophy,
  User,
  Hash,
  Dice5,
  Bot,
  Smartphone,
  Globe,
} from 'lucide-react';

interface HomeViewProps {
  onCreateRoom: (playerName: string, settings?: Partial<RoomSettings>) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onStartBotGame: (
    playerName: string,
    totalPlayers: 2 | 3 | 4,
    humanColor: PlayerColor,
    turnTimerSeconds: number
  ) => void;
  onStartLocalGame: (
    playerNames: string[],
    totalPlayers: 2 | 3 | 4,
    turnTimerSeconds: number
  ) => void;
  initialRoomCode?: string;
  lastRoomCode?: string;
  connected?: boolean;
}

function sanitizeRoomCode(raw: string): string {
  const urlMatch = raw.match(/[?&]room=([a-zA-Z0-9]{4,8})/i);
  if (urlMatch) {
    return urlMatch[1].toUpperCase().slice(0, 6);
  }
  const stripped = raw.replace(/^room:\s*/i, '').replace(/[^a-zA-Z0-9]/g, '');
  return stripped.toUpperCase().slice(0, 6);
}

export const HomeView: React.FC<HomeViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartBotGame,
  onStartLocalGame,
  initialRoomCode = '',
  lastRoomCode = '',
  connected = true,
}) => {
  const [playMode, setPlayMode] = useState<'online' | 'bot' | 'local'>('online');
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ludo_player_name') || '';
  });
  const [roomCode, setRoomCode] = useState(() =>
    sanitizeRoomCode(initialRoomCode || lastRoomCode)
  );
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [turnTimer, setTurnTimer] = useState<number>(30);

  // vs Computer options
  const [botTotalPlayers, setBotTotalPlayers] = useState<2 | 3 | 4>(2);
  const [botHumanColor, setBotHumanColor] = useState<PlayerColor>('red');
  const [botTimer, setBotTimer] = useState<number>(30);

  // Same-Phone Pass & Play options
  const [localTotalPlayers, setLocalTotalPlayers] = useState<2 | 3 | 4>(4);
  const [localNames, setLocalNames] = useState<string[]>([
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);
  const [localTimer, setLocalTimer] = useState<number>(0);

  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setPlayMode('online');
      setRoomCode(sanitizeRoomCode(initialRoomCode));
      setTab('join');
    } else if (lastRoomCode) {
      setRoomCode((prev) => prev || sanitizeRoomCode(lastRoomCode));
    }
  }, [initialRoomCode, lastRoomCode]);

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
    const cleanCode = sanitizeRoomCode(roomCode);
    if (cleanCode) {
      onJoinRoom(cleanCode, cleanName);
    }
  };

  const handleStartBot = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim() || 'You';
    onStartBotGame(cleanName, botTotalPlayers, botHumanColor, botTimer);
  };

  const handleStartLocal = (e: React.FormEvent) => {
    e.preventDefault();
    onStartLocalGame(localNames, localTotalPlayers, localTimer);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-2 sm:pt-4 pb-6 flex flex-col items-center">
      {/* Brand Logo & Title with 4 Ludo Colors */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className="relative mb-3">
          <div className="ludo-brand-badge">
            <div className="ludo-brand-badge-inner">
              <div className="ludo-brand-dot" style={{ backgroundColor: '#F51F2B', boxShadow: '0 0 10px rgba(245,31,43,0.8)' }} />
              <div className="ludo-brand-dot" style={{ backgroundColor: '#08B84B', boxShadow: '0 0 10px rgba(8,184,75,0.8)' }} />
              <div className="ludo-brand-dot" style={{ backgroundColor: '#087CF0', boxShadow: '0 0 10px rgba(8,124,240,0.8)' }} />
              <div className="ludo-brand-dot" style={{ backgroundColor: '#FFD817', boxShadow: '0 0 10px rgba(255,216,23,0.8)' }} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
          LUDO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">RUSH</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs font-medium">
          Play Online with friends, vs Computer, or Offline together.
        </p>
      </div>

      {/* Main Action Card */}
      <div className="w-full ludo-hero-card p-5 sm:p-6">
        {/* Game Mode Selector */}
        <div className="ludo-mode-bar mb-5">
          <button
            type="button"
            onClick={() => setPlayMode('online')}
            className={`ludo-mode-tab ${playMode === 'online' ? 'active-online' : ''}`}
          >
            <Globe size={14} /> <span>Online</span>
          </button>
          <button
            type="button"
            onClick={() => setPlayMode('bot')}
            className={`ludo-mode-tab ${playMode === 'bot' ? 'active-bot' : ''}`}
          >
            <Bot size={14} /> <span>Computer</span>
          </button>
          <button
            type="button"
            onClick={() => setPlayMode('local')}
            className={`ludo-mode-tab ${playMode === 'local' ? 'active-local' : ''}`}
          >
            <Users size={14} /> <span>Pass & Play</span>
          </button>
        </div>

        <div
          key={playMode === 'online' ? `online-${tab}` : playMode}
          className="tab-panel-animate"
        >
          {playMode === 'online' ? (
            <>
              {/* Create / Join Sub-Tab Switcher */}
              <div className="ludo-tab-bar mb-5">
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
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                      <User size={13} className="text-cyan-400" /> Your Display Name
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                        <Users size={13} className="text-cyan-400" /> Players
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
                        <Clock size={13} className="text-cyan-400" /> Timer
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
                    disabled={!connected}
                    className={`mt-2 ludo-cta-button flex items-center justify-center gap-2 ${!connected ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {connected ? (
                      <>
                        <Sparkles size={17} /> <span>Create Private Room</span>
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1" />
                        <span>Connecting to Server...</span>
                      </>
                    )}
                  </button>
                  {!connected && (
                    <p className="text-[11px] text-amber-400/90 text-center font-medium animate-pulse">
                      Connecting to multiplayer backend...
                    </p>
                  )}
                </form>
              ) : (
                <form onSubmit={handleJoin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                      <User size={13} className="text-cyan-400" /> Your Display Name
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                      <Hash size={13} className="text-cyan-400" /> 6-Digit Room Code
                    </label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(sanitizeRoomCode(e.target.value))}
                      placeholder="e.g. 7A9BK2"
                      className="ludo-input-field text-center font-mono tracking-widest text-lg font-bold uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!connected || !roomCode.trim()}
                    className={`mt-2 ludo-cta-button flex items-center justify-center gap-2 ${!connected || !roomCode.trim() ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {connected ? (
                      <>
                        <span>Join Game</span> <ArrowRight size={17} />
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1" />
                        <span>Connecting to Server...</span>
                      </>
                    )}
                  </button>
                  {!connected && (
                    <p className="text-[11px] text-amber-400/90 text-center font-medium animate-pulse">
                      Connecting to multiplayer backend...
                    </p>
                  )}
                </form>
              )}
            </>
          ) : playMode === 'bot' ? (
            <form onSubmit={handleStartBot} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <User size={13} className="text-emerald-400" /> Your Name
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={playerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Champion"
                  className="ludo-input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Choose Your Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PLAYER_COLORS.map((color) => {
                    const cfg = COLOR_CONFIG[color];
                    const selected = botHumanColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBotHumanColor(color)}
                        className={`ludo-color-pill ${selected ? 'selected' : ''}`}
                        style={
                          selected
                            ? {
                                borderColor: cfg.hex,
                                boxShadow: `0 0 14px ${cfg.hex}66`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cfg.hex }}
                        />
                        <span>{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <Users size={13} className="text-emerald-400" /> Players
                  </label>
                  <div className="ludo-chip-group">
                    {[2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBotTotalPlayers(num as 2 | 3 | 4)}
                        className={`ludo-chip ${botTotalPlayers === num ? 'active' : ''}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock size={13} className="text-emerald-400" /> Timer
                  </label>
                  <div className="ludo-chip-group">
                    {[0, 15, 30].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setBotTimer(sec)}
                        className={`ludo-chip ${botTimer === sec ? 'active' : ''}`}
                      >
                        {sec === 0 ? 'Off' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 ludo-cta-button flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #0D9488)',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                }}
              >
                <Bot size={18} /> <span>Play vs Computer</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleStartLocal} className="flex flex-col gap-3.5">
              <div className="flex items-center justify-center gap-2 text-xs text-amber-300 font-semibold bg-amber-950/40 border border-amber-900/40 rounded-xl px-3 py-2">
                <Smartphone size={14} className="shrink-0" />
                <span>Play offline together on this device (2–4 Friends)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <Users size={13} className="text-amber-400" /> Players
                  </label>
                  <div className="ludo-chip-group">
                    {[2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLocalTotalPlayers(num as 2 | 3 | 4)}
                        className={`ludo-chip ${localTotalPlayers === num ? 'active' : ''}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-400" /> Timer
                  </label>
                  <div className="ludo-chip-group">
                    {[0, 15, 30].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setLocalTimer(sec)}
                        className={`ludo-chip ${localTimer === sec ? 'active' : ''}`}
                      >
                        {sec === 0 ? 'Off' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {PLAYER_COLORS.slice(0, localTotalPlayers).map((color, idx) => {
                  const cfg = COLOR_CONFIG[color];
                  return (
                    <div key={color} className="ludo-player-box">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: cfg.hex,
                          boxShadow: `0 0 8px ${cfg.hex}88`,
                        }}
                      />
                      <input
                        type="text"
                        maxLength={14}
                        value={localNames[idx]}
                        onChange={(e) => {
                          const updated = [...localNames];
                          updated[idx] = e.target.value;
                          setLocalNames(updated);
                        }}
                        placeholder={`Player ${idx + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="mt-1 ludo-cta-button flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                  boxShadow: '0 10px 25px rgba(245, 158, 11, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                }}
              >
                <Users size={17} /> <span>Start Offline Game ({localTotalPlayers} Players)</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Quick Rules Modal Button */}
      <button
        onClick={() => setShowRules(!showRules)}
        className="mt-6 ludo-pill-btn"
      >
        <HelpCircle size={15} className="text-cyan-400" /> How to Play & Rules
      </button>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
