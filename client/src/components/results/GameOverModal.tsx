import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameState, Player, COLOR_CONFIG, PlayerColor } from '@ludo/shared';
import { Trophy, RotateCcw, Home, Crown, Medal } from 'lucide-react';

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
  allowRematch = false,
  onRematch,
  onReturnHome,
}) => {
  const winnerColor = gameState.winner;
  const winnerConfig = winnerColor ? COLOR_CONFIG[winnerColor] : null;
  const winnerPlayer = gameState.players.find((p) => p.color === winnerColor);
  const isHost = allowRematch || (localPlayer?.isHost ?? false);

  useEffect(() => {
    // Blast victory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    } catch (e) {
      // Ignored if canvas-confetti unavailable
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden border-2 border-slate-700">
        {/* Glow backdrop behind crown */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ backgroundColor: winnerConfig?.hex || '#F59E0B' }}
        />

        <div className="relative mb-3 flex justify-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl text-white"
            style={{
              background: `linear-gradient(135deg, ${winnerConfig?.lightHex || '#F59E0B'}, ${
                winnerConfig?.hex || '#D97706'
              })`,
            }}
          >
            <Trophy size={42} strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mb-1">
          {winnerPlayer?.name || 'Winner'} Wins!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mb-6 flex items-center justify-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: winnerConfig?.hex }}
          />
          {winnerConfig?.name} team finished all tokens first!
        </p>

        {/* Standings List */}
        <div className="bg-slate-900/80 rounded-xl p-3 mb-6 border border-slate-800 text-left">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2 px-1">
            Final Standings
          </span>
          <div className="space-y-1.5">
            {gameState.players
              .slice()
              .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
              .map((p, idx) => {
                const conf = COLOR_CONFIG[p.color];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400 w-4">
                        #{p.rank ?? idx + 1}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: conf.hex }}
                      />
                      <span className="font-semibold text-slate-200">
                        {p.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      {p.rank === 1 ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Crown size={12} /> Winner
                        </span>
                      ) : (
                        <span>
                          {p.tokens.filter((t) => t.state === 'FINISHED').length}/4 Tokens Home
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {isHost ? (
            <button
              onClick={onRematch}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw size={16} /> Play Rematch
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 italic">
              Waiting for host to start a rematch...
            </div>
          )}

          <button
            onClick={onReturnHome}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={16} /> Home
          </button>
        </div>
      </div>
    </div>
  );
};
