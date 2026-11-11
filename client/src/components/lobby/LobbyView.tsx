import React, { useState } from 'react';
import {
  Copy,
  Check,
  Crown,
  Play,
  Users,
  Settings,
  ShieldAlert,
  Share2,
  CheckCircle2,
  Clock,
  Lock,
  Globe,
  LogOut,
  UserPlus,
} from 'lucide-react';
import {
  COLOR_CONFIG,
  PLAYER_COLORS,
  GameState,
  Player,
  PlayerColor,
  RoomSettings,
} from '@ludo/shared';

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
  const allReady = gameState.players.every((p) => p.isReady || p.isHost);
  const canStart = gameState.players.length >= 2 && allReady;
  const takenColors = new Set(gameState.players.map((p) => p.color));
  const emptySeatsCount = Math.max(0, gameState.settings.maxPlayers - gameState.players.length);
  const roomDisplayTitle = gameState.settings.roomName?.trim() || 'Multiplayer Arena';
  const isPrivateRoom = gameState.settings.isPrivate ?? true;

  const inviteUrl = `${window.location.origin}?room=${gameState.roomCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleShareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomDisplayTitle} on Ludo Rush`,
          text: `Join my Ludo Rush room! Code: ${gameState.roomCode}`,
          url: inviteUrl,
        });
        return;
      } catch {
        // Fallback to copying link
      }
    }
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="lr-page-wide lr-screen-enter" style={{ maxWidth: 680 }}>
      {/* Room Hero Header Card */}
      <div className="lr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: isPrivateRoom
                    ? 'rgba(168, 85, 247, 0.14)'
                    : 'rgba(16, 185, 129, 0.14)',
                  color: isPrivateRoom ? '#D8B4FE' : '#6EE7B7',
                  border: isPrivateRoom
                    ? '1px solid rgba(168, 85, 247, 0.35)'
                    : '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                {isPrivateRoom ? <Lock size={11} /> : <Globe size={11} />}
                <span>{isPrivateRoom ? 'Private Room' : 'Public Room'}</span>
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: 10,
                  fontWeight: 800,
                  background: 'rgba(34, 211, 238, 0.12)',
                  color: '#67E8F9',
                  border: '1px solid rgba(34, 211, 238, 0.25)',
                }}
              >
                {gameState.players.length}/{gameState.settings.maxPlayers} Joined
              </span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              {roomDisplayTitle}
            </h1>
          </div>

          {/* Room Code Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 16,
              background: 'rgba(6, 10, 20, 0.9)',
              border: '1.5px solid rgba(34, 211, 238, 0.35)',
              boxShadow: '0 0 24px rgba(34, 211, 238, 0.12)',
            }}
          >
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Room Code
              </div>
              <div
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: '0.18em',
                  color: '#22D3EE',
                  lineHeight: 1.15,
                }}
              >
                {gameState.roomCode}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="lr-icon-btn cursor-pointer"
              title="Copy room code"
              style={{ height: 36 }}
            >
              {copiedCode ? <Check size={15} color="#34D399" /> : <Copy size={15} color="#22D3EE" />}
            </button>

            <button
              type="button"
              onClick={handleShareInvite}
              className="lr-icon-btn cursor-pointer"
              title="Share invite link"
              style={{
                height: 36,
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                borderColor: 'rgba(34, 211, 238, 0.35)',
                color: '#E0F2FE',
              }}
            >
              {copiedLink ? <Check size={14} color="#34D399" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Copied' : 'Invite'}</span>
            </button>
          </div>
        </div>

        {/* Joined Players & Empty Seats */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span className="lr-field-label">
              <Users size={13} color="#22D3EE" />
              <span>
                Players in Arena ({gameState.players.length}/{gameState.settings.maxPlayers})
              </span>
            </span>

            {emptySeatsCount > 0 ? (
              <span
                className="animate-pulse"
                style={{ fontSize: 11, fontWeight: 700, color: '#67E8F9' }}
              >
                Waiting for {emptySeatsCount} more {emptySeatsCount === 1 ? 'player' : 'players'}...
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399' }}>
                Arena Full
              </span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 10,
            }}
          >
            {gameState.players.map((p) => {
              const cfg = COLOR_CONFIG[p.color];
              const isMe = p.id === localPlayer?.id;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: isMe ? 'rgba(30, 41, 59, 0.92)' : 'rgba(8, 13, 25, 0.85)',
                    border: isMe
                      ? `1.5px solid ${cfg.hex}`
                      : '1.5px solid rgba(148, 163, 184, 0.16)',
                    boxShadow: isMe ? `0 0 18px ${cfg.bgGlow}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        backgroundColor: cfg.hex,
                        color: p.color === 'yellow' ? '#0F172A' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 14,
                        boxShadow: `0 4px 14px ${cfg.bgGlow}`,
                        flexShrink: 0,
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: '#FFFFFF',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.name}
                        </span>
                        {isMe && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: '#22D3EE',
                              padding: '1px 6px',
                              borderRadius: 9999,
                              background: 'rgba(34, 211, 238, 0.14)',
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: cfg.lightHex,
                        }}
                      >
                        {cfg.name} Corner
                      </span>
                    </div>
                  </div>

                  <div>
                    {p.isHost ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 9px',
                          borderRadius: 9999,
                          background: 'rgba(245, 158, 11, 0.16)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#FDE047',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <Crown size={12} />
                        <span>Host</span>
                      </span>
                    ) : p.isReady ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 9px',
                          borderRadius: 9999,
                          background: 'rgba(16, 185, 129, 0.16)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#6EE7B7',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 9px',
                          borderRadius: 9999,
                          background: 'rgba(51, 65, 85, 0.5)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          color: '#CBD5E1',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        <Clock size={12} />
                        <span>Waiting</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {Array.from({ length: emptySeatsCount }).map((_, idx) => (
              <div key={`empty-${idx}`} className="lr-empty-seat">
                <UserPlus size={16} color="#64748B" />
                <span>Waiting for challenger...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="lr-field-group">
          <span className="lr-field-label">Select Your Corner Color</span>
          <div className="lr-color-grid">
            {PLAYER_COLORS.map((color) => {
              const cfg = COLOR_CONFIG[color];
              const isMine = localPlayer?.color === color;
              const isTaken = takenColors.has(color) && !isMine;
              const owner = gameState.players.find((p) => p.color === color);

              return (
                <button
                  key={color}
                  type="button"
                  disabled={isTaken}
                  onClick={() => onSelectColor(color)}
                  className={`lr-color-btn ${isTaken ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                    isMine ? 'is-selected' : ''
                  }`}
                  style={{
                    opacity: isTaken ? 0.45 : 1,
                    borderColor: isMine ? cfg.hex : undefined,
                    boxShadow: isMine ? `0 0 18px ${cfg.bgGlow}` : undefined,
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '9999px',
                        backgroundColor: cfg.hex,
                        boxShadow: `0 0 8px ${cfg.hex}`,
                      }}
                    />
                    <span>{cfg.name}</span>
                  </div>
                  {isTaken && owner && (
                    <span
                      style={{
                        fontSize: 9,
                        color: '#64748B',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {owner.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Room Settings (Host editable, Guest read-only) */}
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background: 'rgba(8, 13, 25, 0.72)',
            border: '1px solid rgba(148, 163, 184, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lr-field-label">
              <Settings size={13} color="#22D3EE" />
              <span>Match Rules &amp; Settings</span>
            </span>
            {!isHost && (
              <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>
                Managed by Host
              </span>
            )}
          </div>

          {isHost ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <div className="lr-field-group">
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>
                    Max Players
                  </span>
                  <div className="lr-chip-row">
                    {([2, 3, 4] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        disabled={gameState.players.length > cnt}
                        onClick={() => onUpdateSettings({ maxPlayers: cnt })}
                        className={`lr-chip cursor-pointer ${
                          gameState.settings.maxPlayers === cnt ? 'is-active' : ''
                        }`}
                        style={{ padding: '7px 8px', fontSize: 12 }}
                      >
                        {cnt}P
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lr-field-group">
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>
                    Turn Timer
                  </span>
                  <div className="lr-chip-row">
                    {[0, 15, 30, 45].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => onUpdateSettings({ turnTimerSeconds: sec })}
                        className={`lr-chip cursor-pointer ${
                          gameState.settings.turnTimerSeconds === sec ? 'is-active' : ''
                        }`}
                        style={{ padding: '7px 8px', fontSize: 12 }}
                      >
                        {sec === 0 ? 'Off' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 14,
                  paddingTop: 4,
                  fontSize: 12,
                  color: '#CBD5E1',
                }}
              >
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={gameState.settings.threeSixesCancel}
                    onChange={(e) => onUpdateSettings({ threeSixesCancel: e.target.checked })}
                    style={{ accentColor: '#22D3EE' }}
                  />
                  <span>3 Sixes Penalty</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={gameState.settings.captureBonus}
                    onChange={(e) => onUpdateSettings({ captureBonus: e.target.checked })}
                    style={{ accentColor: '#22D3EE' }}
                  />
                  <span>Capture Bonus</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={gameState.settings.finishBonus}
                    onChange={(e) => onUpdateSettings({ finishBonus: e.target.checked })}
                    style={{ accentColor: '#22D3EE' }}
                  />
                  <span>Finish Bonus</span>
                </label>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, fontWeight: 700 }}>
              <span className="lr-status-pill">
                Timer:{' '}
                <strong style={{ color: '#22D3EE' }}>
                  {gameState.settings.turnTimerSeconds === 0
                    ? 'Off'
                    : `${gameState.settings.turnTimerSeconds}s`}
                </strong>
              </span>
              <span className="lr-status-pill">
                3 Sixes:{' '}
                <strong style={{ color: '#FFFFFF' }}>
                  {gameState.settings.threeSixesCancel ? 'Cancel' : 'Allowed'}
                </strong>
              </span>
              <span className="lr-status-pill">
                Capture Bonus:{' '}
                <strong style={{ color: '#FFFFFF' }}>
                  {gameState.settings.captureBonus ? 'Yes' : 'No'}
                </strong>
              </span>
              <span className="lr-status-pill">
                Finish Bonus:{' '}
                <strong style={{ color: '#FFFFFF' }}>
                  {gameState.settings.finishBonus ? 'Yes' : 'No'}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="lr-btn lr-btn-secondary cursor-pointer"
            style={{ flex: 1, minWidth: 130, padding: '13px 16px' }}
          >
            <LogOut size={16} />
            <span>Leave</span>
          </button>

          {!isHost ? (
            <button
              type="button"
              onClick={() => onToggleReady(!(localPlayer?.isReady ?? false))}
              className={`lr-btn cursor-pointer ${
                localPlayer?.isReady ? 'lr-btn-secondary' : 'lr-btn-emerald'
              }`}
              style={{ flex: 2.2, minWidth: 200 }}
            >
              {localPlayer?.isReady ? (
                <>
                  <CheckCircle2 size={18} color="#34D399" />
                  <span>Ready! Waiting for Host...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Mark Ready</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canStart}
              onClick={onStartGame}
              className="lr-btn lr-btn-blue cursor-pointer"
              style={{ flex: 2.2, minWidth: 200 }}
            >
              {canStart ? (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Start Match ({gameState.players.length} Players)</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  <span>
                    {gameState.players.length < 2
                      ? 'Need at least 2 players'
                      : 'Waiting for Ready'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
