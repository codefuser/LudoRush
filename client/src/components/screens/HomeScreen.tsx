import React from 'react';
import { Globe, Bot, Users, ArrowRight, Sparkles, BookOpen, Trophy } from 'lucide-react';
import { COLOR_CONFIG, PLAYER_COLORS } from '@ludo/shared';
import { PlayerProfile } from '../../hooks/usePlayerProfile.js';
import { AvatarBadge } from '../common/AvatarBadge.js';

interface HomeScreenProps {
  profile: PlayerProfile;
  connected: boolean;
  onSelectOnline: () => void;
  onSelectVsComputer: () => void;
  onSelectPassAndPlay: () => void;
  onOpenProfile: () => void;
  onOpenRules: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  connected,
  onSelectOnline,
  onSelectVsComputer,
  onSelectPassAndPlay,
  onOpenProfile,
  onOpenRules,
}) => {
  const displayName = profile.name.trim() || 'Challenger';

  return (
    <div className="lr-page-wide lr-screen-enter">
      {/* Hero Banner */}
      <div className="lr-home-hero">
        <button
          type="button"
          onClick={onOpenProfile}
          className="lr-welcome-pill cursor-pointer"
          title="Edit profile & avatar"
        >
          <AvatarBadge avatar={profile.avatar} size="xs" />
          <span>Welcome back, {displayName}</span>
          <Sparkles size={13} />
        </button>

        <h1 className="lr-hero-title">
          LUDO{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #22D3EE 0%, #3B82F6 50%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            RUSH
          </span>
        </h1>

        <p
          style={{
            maxWidth: 480,
            fontSize: 14,
            lineHeight: 1.5,
            color: '#94A3B8',
            margin: 0,
          }}
        >
          Fast-paced multiplayer Ludo with live rooms, intelligent AI opponents, and instant pass-and-play arenas.
        </p>

        {/* 4 Color Token Crest Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {PLAYER_COLORS.map((c) => (
            <span
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: '9999px',
                backgroundColor: COLOR_CONFIG[c].hex,
                boxShadow: `0 0 10px ${COLOR_CONFIG[c].hex}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 3 Dedicated Mode Cards */}
      <div className="lr-modes-grid">
        {/* Card 1: Play Online */}
        <button
          type="button"
          onClick={onSelectOnline}
          className="lr-mode-card is-online cursor-pointer"
        >
          <div
            className="lr-mode-glow"
            style={{ background: 'radial-gradient(circle, #22D3EE, transparent)' }}
          />
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div
                className="lr-mode-icon-wrap"
                style={{
                  background: 'linear-gradient(135deg, #06B6D4, #2563EB)',
                  boxShadow: '0 8px 22px rgba(6, 182, 212, 0.35)',
                }}
              >
                <Globe size={26} />
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: connected ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: connected ? '#34D399' : '#FBBF24',
                  border: connected
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                {connected ? 'Live Arena' : 'Connecting'}
              </span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
              Play Online
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.45, margin: 0 }}>
              Create a custom room or join friends worldwide with a 6-digit invite code.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 13,
              fontWeight: 800,
              color: '#67E8F9',
            }}
          >
            <span>Enter Online Hub</span>
            <ArrowRight size={16} />
          </div>
        </button>

        {/* Card 2: vs Computer */}
        <button
          type="button"
          onClick={onSelectVsComputer}
          className="lr-mode-card is-bot cursor-pointer"
        >
          <div
            className="lr-mode-glow"
            style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
          />
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div
                className="lr-mode-icon-wrap"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #0D9488)',
                  boxShadow: '0 8px 22px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Bot size={26} />
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: '#6EE7B7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Solo AI
              </span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
              vs Computer
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.45, margin: 0 }}>
              Battle smart CPU bots with Easy, Medium, and Hard difficulty levels.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 13,
              fontWeight: 800,
              color: '#34D399',
            }}
          >
            <span>Configure Match</span>
            <ArrowRight size={16} />
          </div>
        </button>

        {/* Card 3: Pass & Play */}
        <button
          type="button"
          onClick={onSelectPassAndPlay}
          className="lr-mode-card is-local cursor-pointer"
        >
          <div
            className="lr-mode-glow"
            style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }}
          />
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div
                className="lr-mode-icon-wrap"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                  boxShadow: '0 8px 22px rgba(245, 158, 11, 0.35)',
                }}
              >
                <Users size={26} />
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(245, 158, 11, 0.14)',
                  color: '#FDE047',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                2–4 Players
              </span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
              Pass &amp; Play
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.45, margin: 0 }}>
              Gather around one device for classic offline Ludo — no internet required.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 13,
              fontWeight: 800,
              color: '#FBBF24',
            }}
          >
            <span>Setup Offline Game</span>
            <ArrowRight size={16} />
          </div>
        </button>
      </div>

      {/* Bottom Utility Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginTop: 4,
        }}
      >
        <button
          type="button"
          onClick={onOpenRules}
          className="lr-icon-btn cursor-pointer"
          style={{ height: 38, padding: '0 16px', borderRadius: 9999 }}
        >
          <BookOpen size={15} color="#22D3EE" />
          <span>How to Play &amp; Rules</span>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="lr-icon-btn cursor-pointer"
          style={{ height: 38, padding: '0 16px', borderRadius: 9999 }}
        >
          <Trophy size={15} color="#FBBF24" />
          <span>
            Career: {profile.wins} {profile.wins === 1 ? 'Win' : 'Wins'} / {profile.gamesPlayed}{' '}
            {profile.gamesPlayed === 1 ? 'Game' : 'Games'}
          </span>
        </button>
      </div>
    </div>
  );
};

