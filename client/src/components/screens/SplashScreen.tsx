import React, { useEffect } from 'react';
import { Dices, Sparkles } from 'lucide-react';
import { COLOR_CONFIG, PLAYER_COLORS } from '@ludo/shared';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = window.setTimeout(onFinish, 1550);
    return () => window.clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className="lr-splash-screen"
      onClick={onFinish}
      role="button"
      tabIndex={0}
      aria-label="Enter Ludo Rush"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFinish();
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          width: 320,
          height: 320,
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.22), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Animated Ludo Cube Emblem */}
      <div className="lr-splash-emblem">
        <div className="lr-splash-emblem-inner">
          <Dices size={48} color="#22D3EE" strokeWidth={2.2} />
        </div>
      </div>

      {/* Brand Wordmark */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.28)',
            color: '#67E8F9',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          <Sparkles size={12} />
          Multiplayer Arena
        </div>

        <h1
          style={{
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            margin: 0,
            color: '#FFFFFF',
          }}
        >
          LUDO{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #22D3EE, #3B82F6, #A855F7)',
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
            marginTop: 8,
            fontSize: 13,
            fontWeight: 500,
            color: '#94A3B8',
            letterSpacing: '0.02em',
          }}
        >
          Real-Time Online • Smart AI • Pass &amp; Play
        </p>
      </div>

      {/* 4 Ludo Color Indicators */}
      <div className="lr-splash-dots">
        {PLAYER_COLORS.map((c, idx) => (
          <span
            key={c}
            className="lr-splash-dot"
            style={{
              backgroundColor: COLOR_CONFIG[c].hex,
              boxShadow: `0 0 14px ${COLOR_CONFIG[c].hex}`,
              animationDelay: `${idx * 0.16}s`,
            }}
          />
        ))}
      </div>

      {/* Loading Progress Bar */}
      <div className="lr-splash-progress-track">
        <div className="lr-splash-progress-fill" />
      </div>

      <span
        style={{
          marginTop: 14,
          fontSize: 11,
          fontWeight: 600,
          color: '#64748B',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Loading Arena • Tap anywhere to enter
      </span>
    </div>
  );
};

