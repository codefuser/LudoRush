import React, { useState } from 'react';
import {
  GameState,
  Player,
  PlayerColor,
  RoomSettings,
  COLOR_CONFIG,
  PLAYER_COLORS,
} from '@ludo/shared';
import {
  Copy,
  Check,
  Share2,
  Play,
  Settings,
  LogOut,
  Users,
  Clock,
  Swords,
  Crown,
} from 'lucide-react';

interface LobbyViewProps {
  gameState: GameState;
  localPlayer: Player | null;
  onSelectColor: (color: PlayerColor) => void;
  onToggleReady: (isReady: boolean) => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  localPlayer,
  onSelectColor,
  onToggleReady,
  onUpdateSettings,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const isHost = localPlayer?.isHost ?? false;
  const connectedPlayers = gameState.players.filter((p) => p.isConnected);
  const canStart = isHost && connectedPlayers.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Header Room Info Card */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Room Code
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-widest text-cyan-400 font-display">
            {gameState.roomCode}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copiedCode ? 'Copied Code!' : 'Copy Code'}
          </button>

          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-md"
          >
            {copiedLink ? <Check size={16} className="text-emerald-300" /> : <Share2 size={16} />}
            {copiedLink ? 'Link Copied!' : 'Share Link'}
          </button>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-display">
              Players ({connectedPlayers.length}/{gameState.settings.maxPlayers})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Min 2 players required to start
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gameState.players.map((player) => {
            const config = COLOR_CONFIG[player.color];
            const isMe = localPlayer?.id === player.id;

            return (
              <div
                key={player.id}
                style={{ borderColor: config.hex }}
                className="p-3.5 rounded-xl bg-slate-900/60 border flex items-center justify-between gap-3 relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md relative shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${config.lightHex}, ${config.hex})`,
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                    {player.isHost && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 rounded-full p-0.5">
                        <Crown size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-slate-100">
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.hex }}
                      />
                      {config.name}
                    </span>
                  </div>
                </div>

                {/* Ready Status or Toggle */}
                {isMe && !player.isHost ? (
                  <button
                    onClick={() => onToggleReady(!player.isReady)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      player.isReady
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {player.isReady ? 'READY ✓' : 'NOT READY'}
                  </button>
                ) : (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      player.isHost
                        ? 'text-amber-400 bg-amber-950/40 border border-amber-900/40'
                        : player.isReady
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/40'
                        : 'text-slate-400 bg-slate-800'
                    }`}
                  >
                    {player.isHost ? 'HOST' : player.isReady ? 'READY' : 'WAITING'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Color Switcher for Local Player */}
        {localPlayer && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-medium">
              Choose your color:
            </span>
            <div className="flex items-center gap-2">
              {PLAYER_COLORS.map((col) => {
                const config = COLOR_CONFIG[col];
                const isSelected = localPlayer.color === col;
                const isTaken = gameState.players.some(
                  (p) => p.color === col && p.id !== localPlayer.id
                );

                return (
                  <button
                    key={col}
                    disabled={isTaken}
                    onClick={() => onSelectColor(col)}
                    title={isTaken ? `${config.name} is taken` : `Select ${config.name}`}
                    style={{
                      backgroundColor: config.hex,
                      opacity: isTaken ? 0.35 : 1,
                    }}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-white ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''
                    } ${isTaken ? 'cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Room Settings Card */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-cyan-400" />
          <h2 className="text-lg font-bold text-white font-display">
            Room Rules & Settings
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Max Players */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Users size={14} /> Max Players
            </span>
            {isHost ? (
              <div className="flex gap-2">
                {[2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => onUpdateSettings({ maxPlayers: num as 2 | 3 | 4 })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      gameState.settings.maxPlayers === num
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {num} Players
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-200">
                {gameState.settings.maxPlayers} Players
              </div>
            )}
          </div>

          {/* Turn Timer */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Clock size={14} /> Turn Timer
            </span>
            {isHost ? (
              <div className="flex gap-2">
                {[0, 15, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => onUpdateSettings({ turnTimerSeconds: sec })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      gameState.settings.turnTimerSeconds === sec
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec === 0 ? 'Off' : `${sec}s`}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-200">
                {gameState.settings.turnTimerSeconds === 0
                  ? 'Disabled'
                  : `${gameState.settings.turnTimerSeconds} seconds`}
              </div>
            )}
          </div>

          {/* Bonus Rules */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isHost}
                checked={gameState.settings.threeSixesCancel}
                onChange={(e) => onUpdateSettings({ threeSixesCancel: e.target.checked })}
                className="rounded accent-cyan-500"
              />
              <span className="text-xs text-slate-300">3 Sixes Penalty</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isHost}
                checked={gameState.settings.captureBonus}
                onChange={(e) => onUpdateSettings({ captureBonus: e.target.checked })}
                className="rounded accent-cyan-500"
              />
              <span className="text-xs text-slate-300">Capture Bonus Turn</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isHost}
                checked={gameState.settings.finishBonus}
                onChange={(e) => onUpdateSettings({ finishBonus: e.target.checked })}
                className="rounded accent-cyan-500"
              />
              <span className="text-xs text-slate-300">Home Finish Bonus</span>
            </label>
          </div>
        </div>
      </div>

      {/* Host Start & Leave Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onLeaveRoom}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors text-sm font-semibold"
        >
          <LogOut size={16} /> Leave Room
        </button>

        {isHost ? (
          <button
            disabled={!canStart}
            onClick={onStartGame}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base shadow-lg transition-all ${
              canStart
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 hover:scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Play size={18} fill="currentColor" /> Start Game
          </button>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
};
