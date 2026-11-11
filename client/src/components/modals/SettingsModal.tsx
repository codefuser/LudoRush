import React from 'react';
import { X, Volume2, VolumeX, Sparkles, BookOpen, Shield, Zap, Trophy } from 'lucide-react';
import { PlayerProfile } from '../../hooks/usePlayerProfile.js';

interface SettingsModalProps {
  profile: PlayerProfile;
  onToggleSound: () => void;
  onToggleParticles: () => void;
  initialShowRules?: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  onToggleSound,
  onToggleParticles,
  initialShowRules = false,
  onClose,
}) => {
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
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {initialShowRules ? 'How to Play & Settings' : 'Game Settings'}
            </h2>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
              Audio preferences, visual effects &amp; official rules
            </p>
          </div>
          <button
            type="button"
            className="lr-icon-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <button
            type="button"
            className="lr-rule-toggle"
            onClick={onToggleSound}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: profile.soundEnabled
                    ? 'rgba(34, 211, 238, 0.16)'
                    : 'rgba(100, 116, 139, 0.16)',
                  color: profile.soundEnabled ? '#22D3EE' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {profile.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                  Sound Effects
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  Dice clicks, hops, captures &amp; victory chimes
                </div>
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 800,
                background: profile.soundEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                color: profile.soundEnabled ? '#34D399' : '#94A3B8',
                border: profile.soundEnabled
                  ? '1px solid rgba(16, 185, 129, 0.45)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              {profile.soundEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            className="lr-rule-toggle"
            onClick={onToggleParticles}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: profile.particlesEnabled
                    ? 'rgba(168, 85, 247, 0.18)'
                    : 'rgba(100, 116, 139, 0.16)',
                  color: profile.particlesEnabled ? '#C084FC' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                  Ambient Arena Glow
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  Floating cosmic particles &amp; animated grid
                </div>
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 800,
                background: profile.particlesEnabled ? 'rgba(168, 85, 247, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                color: profile.particlesEnabled ? '#D8B4FE' : '#94A3B8',
                border: profile.particlesEnabled
                  ? '1px solid rgba(168, 85, 247, 0.45)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              {profile.particlesEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Official Ludo Rules */}
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            background: 'rgba(8, 13, 25, 0.85)',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              fontWeight: 800,
              color: '#67E8F9',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 10,
            }}
          >
            <BookOpen size={14} />
            <span>Official Ludo Rush Rules</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#CBD5E1', lineHeight: 1.45 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Zap size={14} color="#FBBF24" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong style={{ color: '#FFFFFF' }}>Roll a 6:</strong> Move a coin out of your home yard onto your colored start square &amp; earn a bonus roll. (Three consecutive 6s forfeit your turn.)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Shield size={14} color="#34D399" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong style={{ color: '#FFFFFF' }}>Safe Squares:</strong> Colored start squares and ★ Star tiles protect coins from being captured.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Trophy size={14} color="#F472B6" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong style={{ color: '#FFFFFF' }}>Captures &amp; Victory:</strong> Landing on an opponent on an unsafe tile sends them back to yard &amp; grants a bonus roll. First player to get all 4 coins into the center Home triangle wins!
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="lr-btn lr-btn-blue"
          style={{ padding: '12px 16px', fontSize: 14 }}
          onClick={onClose}
        >
          Got It
        </button>
      </div>
    </div>
  );
};

