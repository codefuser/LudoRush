import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Crown, Share2, Check, Sparkles } from 'lucide-react';
import { COLOR_CONFIG, FINISH_STEP, GameState, Player } from '@ludo/shared';

interface GameOverModalProps {
  gameState: GameState;
  localPlayer: Player | null;
  allowRematch?: boolean;
  onRematch: () => void;
  onReturnHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  localPlayer,
  allowRematch = true,
  onRematch,
  onReturnHome,
}) => {
  const [sharedCopied, setSharedCopied] = useState(false);

  const winnerColor = gameState.winner || gameState.standings[0];
  const winner = gameState.players.find((p) => p.color === winnerColor);
  const winnerCfg = winner ? COLOR_CONFIG[winner.color] : COLOR_CONFIG.red;
  const isLocalWinner = localPlayer?.color === winner?.color;

  useEffect(() => {
    const end = Date.now() + 2600;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const rankedPlayers = [...gameState.players].sort((a, b) => {
    const rankA = a.rank ?? (gameState.standings.includes(a.color) ? gameState.standings.indexOf(a.color) + 1 : undefined);
    const rankB = b.rank ?? (gameState.standings.includes(b.color) ? gameState.standings.indexOf(b.color) + 1 : undefined);
    if (rankA !== undefined && rankB !== undefined) {
      return rankA - rankB;
    }
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    const finishedA = a.tokens.filter((t) => t.step === FINISH_STEP).length;
    const finishedB = b.tokens.filter((t) => t.step === FINISH_STEP).length;
    if (finishedA !== finishedB) return finishedB - finishedA;
    const progressA = a.tokens.reduce((acc, t) => acc + Math.max(0, t.step), 0);
    const progressB = b.tokens.reduce((acc, t) => acc + Math.max(0, t.step), 0);
    return progressB - progressA;
  });

  const handleShareResult = async () => {
    const summaryLines = rankedPlayers.map((p, idx) => {
      const homeCount = p.tokens.filter((t) => t.step === FINISH_STEP).length;
      return `${idx + 1}. ${p.name} (${homeCount}/4 Home)`;
    });
    const shareText = `🏆 ${winner?.name || 'Winner'} won on Ludo Rush!\n${summaryLines.join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ludo Rush Match Result',
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const rankLabels = ['1st', '2nd', '3rd', '4th'];

  return (
    <div className="lr-modal-overlay">
      <div
        className="lr-modal-box lr-screen-enter"
        style={{
          maxWidth: 440,
          borderColor: `${winnerCfg.hex}88`,
          boxShadow: `0 30px 75px rgba(0,0,0,0.88), 0 0 55px ${winnerCfg.bgGlow}`,
        }}
      >
        {/* Top Radial Highlight */}
        <div
          style={{
            position: 'absolute',
            top: -70,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 240,
            height: 180,
            borderRadius: '9999px',
            background: `radial-gradient(circle, ${winnerCfg.hex}44, transparent 70%)`,
            filter: 'blur(26px)',
            pointerEvents: 'none',
          }}
        />

        {/* Trophy & Champion Header */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 20 }}>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 24,
              margin: '0 auto 14px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.25))',
              border: '2px solid rgba(251, 191, 36, 0.65)',
              boxShadow: '0 0 34px rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Trophy size={40} color="#FBBF24" />
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 26,
                height: 26,
                borderRadius: '9999px',
                background: winnerCfg.hex,
                border: '2px solid #0B1120',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={13} color={winner?.color === 'yellow' ? '#0F172A' : '#FFFFFF'} />
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 9999,
              background: 'rgba(251, 191, 36, 0.14)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              color: '#FDE047',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            <Sparkles size={11} />
            <span>Match Complete</span>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px' }}>
            {isLocalWinner ? 'VICTORY!' : `${winner?.name || 'Player'} Wins!`}
          </h2>
          <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>
            <strong style={{ color: winnerCfg.lightHex }}>{winner?.name}</strong> conquered the board!
          </p>
        </div>

        {/* Ranked Standings */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 20,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {rankedPlayers.map((player, idx) => {
            const pCfg = COLOR_CONFIG[player.color];
            const homeTokens = player.tokens.filter((t) => t.step === FINISH_STEP).length;
            const isChampion = idx === 0;
            const isMe = player.id === localPlayer?.id;

            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: isChampion ? 'rgba(245, 158, 11, 0.12)' : 'rgba(8, 13, 25, 0.85)',
                  border: isChampion
                    ? '1.5px solid rgba(251, 191, 36, 0.5)'
                    : '1px solid rgba(148, 163, 184, 0.16)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 30,
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 900,
                      color: isChampion ? '#FBBF24' : '#94A3B8',
                    }}
                  >
                    {rankLabels[idx] || `#${idx + 1}`}
                  </span>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '9999px',
                      backgroundColor: pCfg.hex,
                      boxShadow: `0 0 8px ${pCfg.hex}`,
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                    {player.name}
                  </span>
                  {isMe && (
                    <span
                      style={{
                        fontSize: 9,
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isChampion && <Crown size={14} color="#FBBF24" />}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: homeTokens === 4 ? '#34D399' : '#94A3B8',
                    }}
                  >
                    {homeTokens}/4 Home
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {allowRematch && (
              <button
                type="button"
                onClick={onRematch}
                className="lr-btn lr-btn-blue cursor-pointer"
                style={{ flex: 1.4, padding: '13px 16px' }}
              >
                <RotateCcw size={17} />
                <span>Play Again</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleShareResult}
              className="lr-btn lr-btn-secondary cursor-pointer"
              style={{ flex: 1, padding: '13px 14px', fontSize: 13 }}
            >
              {sharedCopied ? <Check size={16} color="#34D399" /> : <Share2 size={16} color="#22D3EE" />}
              <span>{sharedCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onReturnHome}
            className="lr-btn lr-btn-secondary cursor-pointer"
            style={{ padding: '12px 16px', fontSize: 13 }}
          >
            <Home size={16} />
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
