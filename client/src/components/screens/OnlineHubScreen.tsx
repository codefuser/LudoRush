import React from 'react';
import { ArrowLeft, PlusCircle, Hash, ArrowRight, Wifi, WifiOff } from 'lucide-react';

interface OnlineHubScreenProps {
  connected: boolean;
  onBack: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const OnlineHubScreen: React.FC<OnlineHubScreenProps> = ({
  connected,
  onBack,
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <div className="lr-page-wide lr-screen-enter" style={{ maxWidth: 680 }}>
      {/* Top Bar */}
      <div className="lr-topbar-nav">
        <button type="button" onClick={onBack} className="lr-back-btn cursor-pointer">
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>

        <div className="lr-status-pill">
          {connected ? (
            <>
              <Wifi size={13} color="#34D399" />
              <span style={{ color: '#6EE7B7' }}>Server Online</span>
            </>
          ) : (
            <>
              <WifiOff size={13} color="#FBBF24" />
              <span style={{ color: '#FDE047' }}>Waking Server...</span>
            </>
          )}
        </div>
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', margin: '4px 0' }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
          Online Multiplayer
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
          Host your own custom room or join a live match using a 6-digit code.
        </p>
      </div>

      {/* 2 Large Hub Cards */}
      <div className="lr-online-hub-grid">
        {/* Create Room */}
        <button
          type="button"
          onClick={onCreateRoom}
          className="lr-hub-card cursor-pointer"
          style={{
            borderColor: 'rgba(34, 211, 238, 0.25)',
          }}
        >
          <div
            className="lr-mode-glow"
            style={{ background: 'radial-gradient(circle, #22D3EE, transparent)' }}
          />
          <div>
            <div
              className="lr-mode-icon-wrap"
              style={{
                background: 'linear-gradient(135deg, #06B6D4, #2563EB)',
                boxShadow: '0 10px 26px rgba(6, 182, 212, 0.35)',
                marginBottom: 16,
              }}
            >
              <PlusCircle size={26} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
              Create Room
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              Set player capacity, turn clock, privacy, and house rules, then share your invite link.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 13,
              fontWeight: 800,
              color: '#67E8F9',
            }}
          >
            <span>Configure &amp; Host</span>
            <ArrowRight size={16} />
          </div>
        </button>

        {/* Join Room */}
        <button
          type="button"
          onClick={onJoinRoom}
          className="lr-hub-card cursor-pointer"
          style={{
            borderColor: 'rgba(168, 85, 247, 0.25)',
          }}
        >
          <div
            className="lr-mode-glow"
            style={{ background: 'radial-gradient(circle, #A855F7, transparent)' }}
          />
          <div>
            <div
              className="lr-mode-icon-wrap"
              style={{
                background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                boxShadow: '0 10px 26px rgba(168, 85, 247, 0.35)',
                marginBottom: 16,
              }}
            >
              <Hash size={26} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
              Join Room
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              Got a room code or link from a friend? Jump straight into the lobby or rejoin your match.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 13,
              fontWeight: 800,
              color: '#D8B4FE',
            }}
          >
            <span>Enter Room Code</span>
            <ArrowRight size={16} />
          </div>
        </button>
      </div>
    </div>
  );
};

