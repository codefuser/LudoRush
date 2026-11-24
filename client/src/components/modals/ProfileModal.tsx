import React, { useState } from 'react';
import { X, Trophy, Gamepad2, Percent, RotateCcw, Check, Palette, Dices } from 'lucide-react';
import {
  AvatarId,
  PlayerProfile,
  DiceSkin,
  BoardTheme,
  getLevelInfo,
} from '../../hooks/usePlayerProfile.js';
import { AVATAR_OPTIONS, AvatarBadge } from '../common/AvatarBadge.js';

interface ProfileModalProps {
  profile: PlayerProfile;
  onUpdateName: (name: string) => void;
  onUpdateAvatar: (avatar: AvatarId) => void;
  onUpdateDiceSkin?: (skin: DiceSkin) => void;
  onUpdateBoardTheme?: (theme: BoardTheme) => void;
  onResetStats: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onUpdateName,
  onUpdateAvatar,
  onUpdateDiceSkin,
  onUpdateBoardTheme,
  onResetStats,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.wins / profile.gamesPlayed) * 100)
      : 0;

  const levelInfo = getLevelInfo(profile.xp || 0);

  return (
    <div className="lr-modal-overlay" onClick={onClose}>
      <div className="lr-modal-box lr-screen-enter" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AvatarBadge avatar={profile.avatar} size="md" />
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Player Profile
              </h2>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                Customize your identity &amp; track career stats
              </p>
            </div>
          </div>
          <button
            type="button"
            className="lr-icon-btn"
            onClick={onClose}
            aria-label="Close profile"
          >
            <X size={16} />
          </button>
        </div>

        {/* Level & XP Progression Card */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(8, 13, 25, 0.95), rgba(15, 23, 42, 0.95))',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>{levelInfo.badge}</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#FDE047' }}>
                  Lv. {levelInfo.level} • {levelInfo.title}
                </span>
                <span style={{ display: 'block', fontSize: 10, color: '#94A3B8' }}>
                  Total XP: {profile.xp || 0}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#22D3EE' }}>
              {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: 6, borderRadius: 9999, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${levelInfo.progressPercent}%`,
                height: '100%',
                borderRadius: 9999,
                background: 'linear-gradient(90deg, #F59E0B 0%, #22D3EE 100%)',
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Career Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              padding: '12px 10px',
              borderRadius: 14,
              background: 'rgba(8, 13, 25, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: '#22D3EE' }}>
              <Gamepad2 size={15} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>
              {profile.gamesPlayed}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Matches
            </div>
          </div>

          <div
            style={{
              padding: '12px 10px',
              borderRadius: 14,
              background: 'rgba(8, 13, 25, 0.85)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: '#FBBF24' }}>
              <Trophy size={15} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FDE047' }}>
              {profile.wins}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Victories
            </div>
          </div>

          <div
            style={{
              padding: '12px 10px',
              borderRadius: 14,
              background: 'rgba(8, 13, 25, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: '#34D399' }}>
              <Percent size={15} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#6EE7B7' }}>
              {winRate}%
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Win Rate
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="lr-field-group" style={{ marginBottom: 16 }}>
          <label className="lr-field-label" htmlFor="lr-profile-name">
            Default Player Name
          </label>
          <input
            id="lr-profile-name"
            type="text"
            maxLength={18}
            value={profile.name}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="Enter your gaming nickname..."
            className="lr-input"
          />
        </div>

        {/* Avatar Grid */}
        <div className="lr-field-group" style={{ marginBottom: 20 }}>
          <span className="lr-field-label">Select Avatar Crest</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {AVATAR_OPTIONS.map((item) => {
              const selected = profile.avatar === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateAvatar(item.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 14,
                    background: selected ? 'rgba(34, 211, 238, 0.12)' : 'rgba(8, 13, 25, 0.82)',
                    border: selected
                      ? '1.5px solid #22D3EE'
                      : '1.5px solid rgba(148, 163, 184, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: selected ? '#FFFFFF' : '#94A3B8',
                    fontSize: 12,
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <AvatarBadge avatar={item.id} size="xs" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Dice Skins */}
        <div className="lr-field-group" style={{ marginBottom: 16 }}>
          <span className="lr-field-label">
            <Dices size={12} className="text-cyan-400" />
            3D Dice Skin
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[
              { id: 'neon', label: 'Cyber Neon', icon: '🎲' },
              { id: 'gold', label: 'Royal Gold', icon: '👑' },
              { id: 'wood', label: 'Classic Wood', icon: '🪵' },
            ].map((d) => {
              const selected = (profile.diceSkin || 'neon') === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onUpdateDiceSkin?.(d.id as DiceSkin)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 12,
                    background: selected ? 'rgba(34, 211, 238, 0.15)' : 'rgba(8, 13, 25, 0.82)',
                    border: selected ? '1.5px solid #22D3EE' : '1px solid rgba(148, 163, 184, 0.16)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    color: selected ? '#FFFFFF' : '#94A3B8',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{d.icon}</span>
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Board Halo Theme */}
        <div className="lr-field-group" style={{ marginBottom: 20 }}>
          <span className="lr-field-label">
            <Palette size={12} className="text-amber-400" />
            Board Halo Theme
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[
              { id: 'cyber', label: 'Cosmic Neon', icon: '🌌' },
              { id: 'luxury', label: 'Royal Gold', icon: '✨' },
              { id: 'wood', label: 'Vintage Wood', icon: '🌲' },
            ].map((b) => {
              const selected = (profile.boardTheme || 'cyber') === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onUpdateBoardTheme?.(b.id as BoardTheme)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 12,
                    background: selected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(8, 13, 25, 0.82)',
                    border: selected ? '1.5px solid #F59E0B' : '1px solid rgba(148, 163, 184, 0.16)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    color: selected ? '#FFFFFF' : '#94A3B8',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{b.icon}</span>
                  <span>{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {profile.gamesPlayed > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                } else {
                  onResetStats();
                  setConfirmReset(false);
                }
              }}
              className="lr-btn lr-btn-secondary"
              style={{ flex: 1, padding: '12px 14px', fontSize: 13 }}
            >
              <RotateCcw size={15} />
              <span>{confirmReset ? 'Confirm Reset' : 'Reset Stats'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="lr-btn lr-btn-blue"
            style={{ flex: 1.4, padding: '12px 16px', fontSize: 14 }}
          >
            <Check size={16} />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

