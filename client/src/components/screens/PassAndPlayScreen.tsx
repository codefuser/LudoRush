import React, { useState } from 'react';
import { ArrowLeft, Users, Timer, Play, RefreshCw } from 'lucide-react';
import { COLOR_CONFIG, PLAYER_COLORS, PlayerColor } from '@ludo/shared';

interface PassAndPlayScreenProps {
  defaultFirstPlayerName?: string;
  onBack: () => void;
  onStartLocalGame: (
    playerNames: string[],
    totalPlayers: 2 | 3 | 4,
    turnTimerSeconds: number,
    customColors: PlayerColor[]
  ) => void;
}

export const PassAndPlayScreen: React.FC<PassAndPlayScreenProps> = ({
  defaultFirstPlayerName,
  onBack,
  onStartLocalGame,
}) => {
  const [totalPlayers, setTotalPlayers] = useState<2 | 3 | 4>(4);
  const [turnTimer, setTurnTimer] = useState<number>(0);
  const [names, setNames] = useState<string[]>([
    defaultFirstPlayerName?.trim() || 'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);
  const [seatColors, setSeatColors] = useState<PlayerColor[]>([
    'red',
    'green',
    'yellow',
    'blue',
  ]);

  const handleCycleSeatColor = (seatIdx: number) => {
    setSeatColors((prev) => {
      const next = [...prev];
      const currentColor = next[seatIdx];
      const currentColorPos = PLAYER_COLORS.indexOf(currentColor);
      const targetColor = PLAYER_COLORS[(currentColorPos + 1) % PLAYER_COLORS.length];
      const swapIdx = next.indexOf(targetColor);
      if (swapIdx !== -1) {
        next[swapIdx] = currentColor;
      }
      next[seatIdx] = targetColor;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeNames = names
      .slice(0, totalPlayers)
      .map((name, idx) => name.trim() || `Player ${idx + 1}`);
    const activeColors = seatColors.slice(0, totalPlayers);
    onStartLocalGame(activeNames, totalPlayers, turnTimer, activeColors);
  };

  return (
    <div className="lr-page-container lr-screen-enter">
      {/* Top Bar */}
      <div className="lr-topbar-nav">
        <button type="button" onClick={onBack} className="lr-back-btn cursor-pointer">
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#FDE047',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Offline Multiplayer
        </span>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="lr-card"
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px' }}>
            Pass &amp; Play Arena
          </h1>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
            Share one device with friends &amp; family — no internet needed.
          </p>
        </div>

        {/* Players & Timer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <div className="lr-field-group">
            <span className="lr-field-label">
              <Users size={13} color="#FBBF24" />
              <span>Players</span>
            </span>
            <div className="lr-chip-row">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTotalPlayers(count)}
                  className={`lr-chip cursor-pointer ${
                    totalPlayers === count ? 'is-active-amber' : ''
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
                    turnTimer === sec ? 'is-active-amber' : ''
                  }`}
                >
                  {sec === 0 ? 'Off' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Slots */}
        <div className="lr-field-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lr-field-label">Player Seats &amp; Colors</span>
            <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>
              Tap color dot to swap
            </span>
          </div>

          <div className="lr-players-inputs-grid">
            {Array.from({ length: totalPlayers }).map((_, idx) => {
              const color = seatColors[idx];
              const cfg = COLOR_CONFIG[color];
              return (
                <div key={idx} className="lr-player-input-card">
                  <button
                    type="button"
                    onClick={() => handleCycleSeatColor(idx)}
                    title={`${cfg.name} corner — click to swap color`}
                    className="cursor-pointer shrink-0"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9,
                      background: cfg.hex,
                      border: '2px solid rgba(255,255,255,0.45)',
                      boxShadow: `0 0 10px ${cfg.bgGlow}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RefreshCw size={11} color="#FFFFFF" />
                  </button>

                  <input
                    type="text"
                    maxLength={14}
                    value={names[idx]}
                    onChange={(e) => {
                      const next = [...names];
                      next[idx] = e.target.value;
                      setNames(next);
                    }}
                    placeholder={`Player ${idx + 1}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button type="submit" className="lr-btn lr-btn-amber cursor-pointer">
          <Play size={18} fill="currentColor" />
          <span>Start Pass &amp; Play ({totalPlayers} Players)</span>
        </button>
      </form>
    </div>
  );
};

