import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Sparkles,
  Users,
  Timer,
  Lock,
  Globe,
  ShieldCheck,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import { RoomSettings } from '@ludo/shared';

interface CreateRoomScreenProps {
  defaultName: string;
  onNamePersist: (name: string) => void;
  onBack: () => void;
  onCreateRoom: (
    playerName: string,
    settings: Partial<RoomSettings>
  ) => Promise<{ success: boolean; roomCode?: string; error?: string }>;
}

export const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({
  defaultName,
  onNamePersist,
  onBack,
  onCreateRoom,
}) => {
  const [playerName, setPlayerName] = useState(defaultName);
  const [roomName, setRoomName] = useState('Royal Arena');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [threeSixesCancel, setThreeSixesCancel] = useState<boolean>(true);
  const [captureBonus, setCaptureBonus] = useState<boolean>(true);
  const [finishBonus, setFinishBonus] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter your display name.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    onNamePersist(cleanName);

    const res = await onCreateRoom(cleanName, {
      roomName: roomName.trim() || 'Royal Arena',
      maxPlayers,
      turnTimerSeconds: turnTimer,
      isPrivate,
      threeSixesCancel,
      captureBonus,
      finishBonus,
    });

    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Could not create room. Please try again.');
    }
  };

  return (
    <div className="lr-page-container lr-screen-enter">
      {/* Top Bar */}
      <div className="lr-topbar-nav">
        <button type="button" onClick={onBack} className="lr-back-btn cursor-pointer">
          <ArrowLeft size={16} />
          <span>Online Mode</span>
        </button>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#67E8F9', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Create Room
        </span>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="lr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px' }}>
            Host Multiplayer Room
          </h1>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
            Customize your arena settings before inviting players.
          </p>
        </div>

        {/* Display Name & Room Name */}
        <div className="lr-field-group">
          <label className="lr-field-label" htmlFor="lr-create-name">
            <User size={13} color="#22D3EE" />
            <span>Your Display Name</span>
          </label>
          <input
            id="lr-create-name"
            type="text"
            maxLength={18}
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="e.g. KingJoseph"
            className="lr-input"
            autoFocus
          />
        </div>

        <div className="lr-field-group">
          <label className="lr-field-label" htmlFor="lr-create-roomname">
            <Sparkles size={13} color="#A855F7" />
            <span>Room Name</span>
          </label>
          <input
            id="lr-create-roomname"
            type="text"
            maxLength={24}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Friday Ludo Night"
            className="lr-input"
          />
        </div>

        {/* Players & Privacy */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          <div className="lr-field-group">
            <span className="lr-field-label">
              <Users size={13} color="#22D3EE" />
              <span>Max Players</span>
            </span>
            <div className="lr-chip-row">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMaxPlayers(count)}
                  className={`lr-chip cursor-pointer ${maxPlayers === count ? 'is-active' : ''}`}
                >
                  {count}P
                </button>
              ))}
            </div>
          </div>

          <div className="lr-field-group">
            <span className="lr-field-label">
              {isPrivate ? <Lock size={13} color="#A855F7" /> : <Globe size={13} color="#10B981" />}
              <span>Room Access</span>
            </span>
            <div className="lr-chip-row">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`lr-chip cursor-pointer ${isPrivate ? 'is-active' : ''}`}
              >
                <Lock size={13} />
                <span>Private</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`lr-chip cursor-pointer ${!isPrivate ? 'is-active-emerald' : ''}`}
              >
                <Globe size={13} />
                <span>Public</span>
              </button>
            </div>
          </div>
        </div>

        {/* Turn Timer */}
        <div className="lr-field-group">
          <span className="lr-field-label">
            <Timer size={13} color="#FBBF24" />
            <span>Turn Timer</span>
          </span>
          <div className="lr-chip-row">
            {[0, 15, 30, 45].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setTurnTimer(sec)}
                className={`lr-chip cursor-pointer ${turnTimer === sec ? 'is-active' : ''}`}
              >
                {sec === 0 ? 'Off' : `${sec}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Rule Toggles */}
        <div className="lr-field-group">
          <span className="lr-field-label">
            <ShieldCheck size={13} color="#34D399" />
            <span>Game Rules</span>
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="lr-rule-toggle">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
                Bonus Roll on Capture
              </span>
              <input
                type="checkbox"
                checked={captureBonus}
                onChange={(e) => setCaptureBonus(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: '#22D3EE', cursor: 'pointer' }}
              />
            </label>
            <label className="lr-rule-toggle">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
                Bonus Roll on Token Finish
              </span>
              <input
                type="checkbox"
                checked={finishBonus}
                onChange={(e) => setFinishBonus(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: '#22D3EE', cursor: 'pointer' }}
              />
            </label>
            <label className="lr-rule-toggle">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
                Cancel Turn on Three Consecutive 6s
              </span>
              <input
                type="checkbox"
                checked={threeSixesCancel}
                onChange={(e) => setThreeSixesCancel(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: '#22D3EE', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(244, 63, 94, 0.14)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#FDA4AF',
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !playerName.trim()}
          className="lr-btn lr-btn-blue cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Creating Arena...</span>
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              <span>Create Room &amp; Enter Lobby</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

