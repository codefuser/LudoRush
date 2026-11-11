import React, { useState } from 'react';
import { ArrowLeft, User, Users, Timer, Cpu, Play } from 'lucide-react';
import { COLOR_CONFIG, PLAYER_COLORS, PlayerColor } from '@ludo/shared';
import { BotDifficulty } from '../../game/botAI.js';

interface VsComputerScreenProps {
  defaultName: string;
  onNamePersist: (name: string) => void;
  onBack: () => void;
  onStartBotGame: (
    playerName: string,
    totalPlayers: 2 | 3 | 4,
    humanColor: PlayerColor,
    turnTimerSeconds: number,
    difficulty: BotDifficulty
  ) => void;
}

const DIFFICULTIES: { id: BotDifficulty; label: string; desc: string; className: string }[] = [
  { id: 'easy', label: 'Easy', desc: 'Casual moves', className: 'is-easy' },
  { id: 'medium', label: 'Medium', desc: 'Smart plays', className: 'is-medium' },
  { id: 'hard', label: 'Hard', desc: 'Tactical pro', className: 'is-hard' },
];

export const VsComputerScreen: React.FC<VsComputerScreenProps> = ({
  defaultName,
  onNamePersist,
  onBack,
  onStartBotGame,
}) => {
  const [playerName, setPlayerName] = useState(defaultName);
  const [humanColor, setHumanColor] = useState<PlayerColor>('red');
  const [totalPlayers, setTotalPlayers] = useState<2 | 3 | 4>(4);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [turnTimer, setTurnTimer] = useState<number>(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim() || 'Player';
    onNamePersist(cleanName);
    onStartBotGame(cleanName, totalPlayers, humanColor, turnTimer, difficulty);
  };

  return (
    <div className="lr-page-container lr-screen-enter">
      {/* Top Bar */}
      <div className="lr-topbar-nav">
        <button type="button" onClick={onBack} className="lr-back-btn cursor-pointer">
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#6EE7B7', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Solo AI Match
        </span>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="lr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px' }}>
            Play vs Computer
          </h1>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
            Test your strategy offline against adaptive AI opponents.
          </p>
        </div>

        {/* Name */}
        <div className="lr-field-group">
          <label className="lr-field-label" htmlFor="lr-bot-name">
            <User size={13} color="#34D399" />
            <span>Your Name</span>
          </label>
          <input
            id="lr-bot-name"
            type="text"
            maxLength={18}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="e.g. Strategist"
            className="lr-input"
          />
        </div>

        {/* Color Selector */}
        <div className="lr-field-group">
          <span className="lr-field-label">Choose Your Color</span>
          <div className="lr-color-grid">
            {PLAYER_COLORS.map((color) => {
              const cfg = COLOR_CONFIG[color];
              const selected = humanColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setHumanColor(color)}
                  className={`lr-color-btn cursor-pointer ${selected ? 'is-selected' : ''}`}
                  style={
                    selected
                      ? {
                          borderColor: cfg.hex,
                          boxShadow: `0 0 18px ${cfg.bgGlow}`,
                        }
                      : undefined
                  }
                >
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '9999px',
                      backgroundColor: cfg.hex,
                      boxShadow: `0 0 8px ${cfg.hex}`,
                    }}
                  />
                  <span>{cfg.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Difficulty */}
        <div className="lr-field-group">
          <span className="lr-field-label">
            <Cpu size={13} color="#22D3EE" />
            <span>AI Difficulty</span>
          </span>
          <div className="lr-diff-grid">
            {DIFFICULTIES.map((diff) => {
              const active = difficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`lr-diff-card cursor-pointer ${active ? diff.className : ''}`}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: active ? '#FFFFFF' : '#CBD5E1',
                    }}
                  >
                    {diff.label}
                  </span>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                    {diff.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Total Players & Turn Timer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <div className="lr-field-group">
            <span className="lr-field-label">
              <Users size={13} color="#34D399" />
              <span>Players</span>
            </span>
            <div className="lr-chip-row">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTotalPlayers(count)}
                  className={`lr-chip cursor-pointer ${
                    totalPlayers === count ? 'is-active-emerald' : ''
                  }`}
                >
                  {count}P
                </button>
              ))}
            </div>
          </div>

          <div className="lr-field-group">
            <span className="lr-field-label">
              <Timer size={13} color="#FBBF24" />
              <span>Turn Timer</span>
            </span>
            <div className="lr-chip-row">
              {[0, 15, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTurnTimer(sec)}
                  className={`lr-chip cursor-pointer ${
                    turnTimer === sec ? 'is-active-emerald' : ''
                  }`}
                >
                  {sec === 0 ? 'Off' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="lr-btn lr-btn-emerald cursor-pointer">
          <Play size={18} fill="currentColor" />
          <span>Play vs Computer</span>
        </button>
      </form>
    </div>
  );
};

