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
          <div className="lr-mode-card-content">
            <div className="lr-mode-card-header">
              <div
                className="lr-mode-icon-wrap"
                style={{
                  background: 'linear-gradient(135deg, #06B6D4, #2563EB)',
                  boxShadow: '0 6px 18px rgba(6, 182, 212, 0.35)',
                }}
              >
                <Globe size={22} />
              </div>
              <div className="lr-mode-text-block">
                <div className="lr-mode-title-row">
                  <h2 className="lr-mode-title">Play Online</h2>
                  <span className="lr-mode-badge lr-mode-badge-cyan">
                    {connected ? 'Live' : 'Connecting'}
                  </span>
                </div>
                <p className="lr-mode-desc">
                  Create custom rooms or join friends with a 6-digit code.
                </p>
              </div>
            </div>

            <div className="lr-mode-action-link" style={{ color: '#67E8F9' }}>
              <span>Enter Hub</span>
              <ArrowRight size={15} />
            </div>
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
          <div className="lr-mode-card-content">
            <div className="lr-mode-card-header">
              <div
                className="lr-mode-icon-wrap"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #0D9488)',
                  boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Bot size={22} />
              </div>
              <div className="lr-mode-text-block">
                <div className="lr-mode-title-row">
                  <h2 className="lr-mode-title">vs Computer</h2>
                  <span className="lr-mode-badge lr-mode-badge-emerald">
                    Solo AI
                  </span>
                </div>
                <p className="lr-mode-desc">
                  Play offline with smart bots across Easy, Medium, and Hard.
                </p>
              </div>
            </div>

            <div className="lr-mode-action-link" style={{ color: '#34D399' }}>
              <span>Play AI</span>
              <ArrowRight size={15} />
            </div>
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
          <div className="lr-mode-card-content">
            <div className="lr-mode-card-header">
              <div
                className="lr-mode-icon-wrap"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                  boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
                }}
              >
                <Users size={22} />
              </div>
              <div className="lr-mode-text-block">
                <div className="lr-mode-title-row">
                  <h2 className="lr-mode-title">Pass &amp; Play</h2>
                  <span className="lr-mode-badge lr-mode-badge-amber">
                    2–4 Players
                  </span>
                </div>
                <p className="lr-mode-desc">
                  Gather friends on one device for classic offline Ludo.
                </p>
              </div>
            </div>

            <div className="lr-mode-action-link" style={{ color: '#FBBF24' }}>
              <span>Pass &amp; Play</span>
              <ArrowRight size={15} />
            </div>
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
          gap: 8,
          marginTop: 2,
        }}
      >
        <button
          type="button"
          onClick={onOpenRules}
          className="lr-icon-btn cursor-pointer"
          style={{ height: 32, padding: '0 12px', borderRadius: 9999, fontSize: 12 }}
        >
          <BookOpen size={14} color="#22D3EE" />
          <span>Rules</span>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="lr-icon-btn cursor-pointer"
          style={{ height: 32, padding: '0 12px', borderRadius: 9999, fontSize: 12 }}
        >
          <Trophy size={14} color="#FBBF24" />
          <span>
            {profile.wins}W / {profile.gamesPlayed}G
          </span>
        </button>
      </div>
    </div>
  );
};

