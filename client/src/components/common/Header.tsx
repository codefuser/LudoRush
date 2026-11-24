import React, { useState } from 'react';
import {
  Dices,
  Volume2,
  VolumeX,
  LogOut,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Settings,
  Gamepad2,
} from 'lucide-react';
import { PlayerProfile } from '../../hooks/usePlayerProfile.js';
import { AvatarBadge } from './AvatarBadge.js';

interface HeaderProps {
  roomCode?: string;
  modeLabel?: string;
  connected: boolean;
  isInGame?: boolean;
  profile: PlayerProfile;
  onToggleSound: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogoClick?: () => void;
  onLeave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  modeLabel,
  connected,
  isInGame = false,
  profile,
  onToggleSound,
  onOpenProfile,
  onOpenSettings,
  onLogoClick,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <header className="lr-header">
      {/* Logo / Brand */}
      <button
        type="button"
        onClick={onLogoClick}
        className="lr-logo-btn cursor-pointer"
        title={isInGame ? 'Return to menu' : 'Ludo Rush Home'}
      >
        <div className="lr-logo-icon">
          <Dices size={18} strokeWidth={2.4} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.05 }}>
          <span
            className="lr-logo-text-title"
            style={{
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
            }}
          >
            LUDO <span style={{ color: '#22D3EE' }}>RUSH</span>
          </span>
          {!isInGame && (
            <span
              className="lr-logo-text-sub"
              style={{ fontSize: 9, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Multiplayer Arena
            </span>
          )}
        </div>
      </button>

      {/* Center Room Code or Offline Mode Badge */}
      {roomCode ? (
        <button
          type="button"
          onClick={handleCopyCode}
          className="lr-status-pill cursor-pointer"
          title="Click to copy Room Code"
          style={{
            borderColor: 'rgba(34, 211, 238, 0.35)',
            background: 'rgba(8, 15, 32, 0.85)',
          }}
        >
          <span className="hidden sm:inline" style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700 }}>ROOM</span>
          <span
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              fontWeight: 900,
              color: '#22D3EE',
              letterSpacing: '0.1em',
            }}
          >
            {roomCode}
          </span>
          {copied ? <Check size={12} color="#34D399" /> : <Copy size={11} color="#94A3B8" />}
        </button>
      ) : modeLabel ? (
        <div
          className="lr-status-pill"
          style={{
            borderColor: 'rgba(245, 158, 11, 0.35)',
            color: '#FDE047',
          }}
        >
          <Gamepad2 size={12} color="#FBBF24" />
          <span style={{ letterSpacing: '0.04em' }}>{modeLabel}</span>
        </div>
      ) : null}

      {/* Right Utility Cluster */}
      <div className="lr-header-actions">
        {!modeLabel && !isInGame && (
          <div className="lr-status-pill lr-live-status-pill" title={connected ? 'Server connected' : 'Connecting to server'}>
            {connected ? (
              <>
                <Wifi size={11} color="#34D399" />
                <span style={{ color: '#6EE7B7' }}>Live</span>
              </>
            ) : (
              <>
                <WifiOff size={11} color="#FBBF24" />
                <span style={{ color: '#FDE047' }}>Connecting</span>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onToggleSound}
          className="lr-icon-btn cursor-pointer"
          title={profile.soundEnabled ? 'Mute sound' : 'Unmute sound'}
          aria-label="Toggle sound"
        >
          {profile.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} color="#64748B" />}
        </button>

        {!isInGame && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="lr-icon-btn cursor-pointer"
            title="Player Profile & Stats"
            style={{ padding: '0 6px 0 3px' }}
          >
            <AvatarBadge avatar={profile.avatar} size="xs" />
            <span
              className="lr-profile-btn-name"
              style={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {profile.name.trim() || 'Profile'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          className="lr-icon-btn cursor-pointer"
          title="Settings & Rules"
          aria-label="Settings"
        >
          <Settings size={14} />
        </button>

        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="lr-icon-btn cursor-pointer"
            title="Leave match"
            aria-label="Leave match"
            style={{
              borderColor: 'rgba(244, 63, 94, 0.32)',
              color: '#FDA4AF',
            }}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </header>
  );
};
