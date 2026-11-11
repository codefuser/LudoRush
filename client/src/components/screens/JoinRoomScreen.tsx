import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Hash, ClipboardPaste, ArrowRight, Loader2, RotateCcw } from 'lucide-react';

interface JoinRoomScreenProps {
  defaultName: string;
  initialRoomCode?: string;
  onNamePersist: (name: string) => void;
  onBack: () => void;
  onJoinRoom: (roomCode: string, playerName: string) => Promise<{ success: boolean; error?: string }>;
}

function extractRoomCode(raw: string): string {
  const trimmed = raw.trim();
  const queryMatch = trimmed.match(/room=([A-Za-z0-9]{4,8})/i);
  if (queryMatch) {
    return queryMatch[1].toUpperCase().slice(0, 6);
  }
  return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  defaultName,
  initialRoomCode = '',
  onNamePersist,
  onBack,
  onJoinRoom,
}) => {
  const [playerName, setPlayerName] = useState(defaultName);
  const [roomCode, setRoomCode] = useState(() => extractRoomCode(initialRoomCode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(extractRoomCode(initialRoomCode));
    }
  }, [initialRoomCode]);

  const handlePasteCode = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      const parsed = extractRoomCode(clip);
      if (parsed) {
        setRoomCode(parsed);
        setErrorMsg(null);
      } else {
        setErrorMsg('Clipboard did not contain a valid room code.');
      }
    } catch {
      setErrorMsg('Clipboard access blocked. Please paste directly into the code field.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanName) {
      setErrorMsg('Please enter your display name.');
      return;
    }
    if (cleanCode.length !== 6) {
      setErrorMsg('Room code must be 6 characters (e.g. 7A9BK2).');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    onNamePersist(cleanName);

    const res = await onJoinRoom(cleanCode, cleanName);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Unable to join room. Check the code and try again.');
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
        <span style={{ fontSize: 12, fontWeight: 800, color: '#D8B4FE', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Join Match
        </span>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="lr-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px' }}>
            Enter Room Code
          </h1>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
            Join a friend&apos;s lobby or paste their invite link to jump right in.
          </p>
        </div>

        {/* Display Name */}
        <div className="lr-field-group">
          <label className="lr-field-label" htmlFor="lr-join-name">
            <User size={13} color="#22D3EE" />
            <span>Your Display Name</span>
          </label>
          <input
            id="lr-join-name"
            type="text"
            maxLength={18}
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="e.g. KingJoseph"
            className="lr-input"
            autoFocus={!roomCode}
          />
        </div>

        {/* 6-Digit Room Code */}
        <div className="lr-field-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="lr-field-label" htmlFor="lr-join-code">
              <Hash size={13} color="#A855F7" />
              <span>6-Digit Room Code</span>
            </label>
            <button
              type="button"
              onClick={handlePasteCode}
              className="lr-icon-btn cursor-pointer"
              style={{ height: 26, fontSize: 11, padding: '0 10px' }}
            >
              <ClipboardPaste size={12} color="#D8B4FE" />
              <span>Paste</span>
            </button>
          </div>
          <input
            id="lr-join-code"
            type="text"
            maxLength={64}
            value={roomCode}
            onChange={(e) => {
              setRoomCode(extractRoomCode(e.target.value));
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="7A9BK2"
            className="lr-input lr-input-code"
            autoFocus={!!roomCode && !playerName}
          />
        </div>

        {/* Rejoin Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            fontSize: 11,
            color: '#CBD5E1',
            lineHeight: 1.45,
          }}
        >
          <RotateCcw size={14} color="#C084FC" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Got disconnected mid-game? Use the exact same <strong style={{ color: '#FFFFFF' }}>Display Name</strong> &amp; <strong style={{ color: '#FFFFFF' }}>Room Code</strong> to rejoin seamlessly.
          </span>
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
          disabled={isSubmitting || !playerName.trim() || roomCode.trim().length < 6}
          className="lr-btn lr-btn-purple cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Joining Match...</span>
            </>
          ) : (
            <>
              <span>Join Room</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

