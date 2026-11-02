import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  GameState,
  Player,
  Token,
  COLOR_CONFIG,
  getTokenGridPosition,
} from '@ludo/shared';
import { TokenPawn } from '../tokens/TokenPawn.js';
import { sounds } from '../../game/soundEffects.js';
import { PendingMoveAnimation } from '../../hooks/useMultiplayer.js';

interface LudoBoardProps {
  gameState: GameState;
  localPlayer: Player | null;
  pendingMove: PendingMoveAnimation | null;
  onMoveAnimationComplete: (finalState: GameState) => void;
  onMoveToken: (tokenId: number) => void;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  gameState,
  localPlayer,
  pendingMove,
  onMoveAnimationComplete,
  onMoveToken,
}) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = localPlayer ? activePlayer?.id === localPlayer.id : false;

  // Track rendered step and animation state for all tokens (key: "color-id")
  const [displaySteps, setDisplaySteps] = useState<Record<string, number>>({});
  const [movingTokenKey, setMovingTokenKey] = useState<string | null>(null);
  const currentAnimationRef = useRef<PendingMoveAnimation | null>(null);

  // Sync displaySteps with gameState when no animation is actively running
  useEffect(() => {
    if (!pendingMove) {
      const initial: Record<string, number> = {};
      for (const player of gameState.players) {
        for (const token of player.tokens) {
          initial[`${token.color}-${token.id}`] = token.step;
        }
      }
      setDisplaySteps(initial);
    }
  }, [gameState, pendingMove]);

  // Execute sequential animation when a pendingMove arrives
  useEffect(() => {
    if (!pendingMove) return;
    if (currentAnimationRef.current === pendingMove) return;
    currentAnimationRef.current = pendingMove;

    const {
      playerColor,
      tokenId,
      fromStep,
      toStep,
      isCapture,
      capturedColor,
      capturedTokenId,
      capturedFromStep,
      isFinished,
      state: finalState,
    } = pendingMove;

    const attackerKey = `${playerColor}-${tokenId}`;
    const victimKey =
      isCapture && capturedColor && capturedTokenId !== undefined
        ? `${capturedColor}-${capturedTokenId}`
        : null;

    // Keep victim token on its track step while attacker approaches
    if (victimKey && capturedFromStep !== undefined) {
      setDisplaySteps((prev) => ({
        ...prev,
        [victimKey]: capturedFromStep,
      }));
    }

    // Forward hopping for attacker (1 hop at a time)
    let currStep = fromStep;
    setDisplaySteps((prev) => ({ ...prev, [attackerKey]: currStep }));
    setMovingTokenKey(attackerKey);

    const hopInterval = setInterval(() => {
      currStep++;
      sounds.playStep();
      setDisplaySteps((prev) => ({ ...prev, [attackerKey]: currStep }));

      if (currStep >= toStep) {
        clearInterval(hopInterval);

        // Attacker has arrived at target cell!
        if (victimKey && capturedFromStep !== undefined && capturedFromStep >= 0) {
          // Play capture sound on impact!
          sounds.playCapture();
          setMovingTokenKey(victimKey);

          // Rewind victim token backward along its track into base pit
          let victimCurr = capturedFromStep;
          const rewindInterval = setInterval(() => {
            victimCurr--;
            sounds.playStep();
            setDisplaySteps((prev) => ({ ...prev, [victimKey]: victimCurr }));

            if (victimCurr <= 0) {
              clearInterval(rewindInterval);
              // Drop into base socket
              setDisplaySteps((prev) => ({ ...prev, [victimKey]: -1 }));
              setMovingTokenKey(null);
              currentAnimationRef.current = null;
              onMoveAnimationComplete(finalState);
            }
          }, 38);
        } else {
          // Normal move finish
          setMovingTokenKey(null);
          if (isFinished) {
            sounds.playFinish();
          }
          currentAnimationRef.current = null;
          onMoveAnimationComplete(finalState);
        }
      }
    }, 110);

    return () => {
      clearInterval(hopInterval);
    };
  }, [pendingMove, onMoveAnimationComplete]);

  // Compute tokens on the board with their rendered coordinates
  const tokensList = useMemo(() => {
    const list: Array<{
      token: Token;
      player: Player;
      isLegal: boolean;
      isMoving: boolean;
      renderX: number;
      renderY: number;
      key: string;
    }> = [];

    for (const player of gameState.players) {
      const isPlayerActive = player.color === activePlayer?.color;
      for (const token of player.tokens) {
        const key = `${token.color}-${token.id}`;
        const isLegal =
          isMyTurn &&
          isPlayerActive &&
          gameState.awaitingMove &&
          gameState.legalTokenIndices.includes(token.id) &&
          !pendingMove;

        const isMoving = movingTokenKey === key;
        const currentStep =
          displaySteps[key] !== undefined ? displaySteps[key] : token.step;

        const virtualToken: Token = {
          ...token,
          step: currentStep,
          state:
            currentStep < 0
              ? 'BASE'
              : currentStep >= 56
              ? 'FINISHED'
              : currentStep >= 51
              ? 'HOME_STRETCH'
              : 'TRACK',
        };

        const coord = getTokenGridPosition(virtualToken);

        list.push({
          token,
          player,
          isLegal,
          isMoving,
          renderX: coord.x,
          renderY: coord.y,
          key,
        });
      }
    }
    return list;
  }, [gameState, activePlayer, isMyTurn, displaySteps, movingTokenKey, pendingMove]);

  // Group stationary tokens by cell coordinate to keep them strictly inside the cell
  const cellGroups = useMemo(() => {
    const map = new Map<string, typeof tokensList>();
    for (const item of tokensList) {
      if (item.isMoving) continue;
      const cellKey = `${item.renderX.toFixed(1)}_${item.renderY.toFixed(1)}`;
      if (!map.has(cellKey)) map.set(cellKey, []);
      map.get(cellKey)!.push(item);
    }
    return map;
  }, [tokensList]);

  const CELL_PERCENT = 100 / 15; // 6.666666%

  // Safe star positions (col x, row y)
  const safeStars = [
    { x: 1, y: 6 },
    { x: 6, y: 2 },
    { x: 8, y: 1 },
    { x: 12, y: 6 },
    { x: 13, y: 8 },
    { x: 8, y: 12 },
    { x: 6, y: 13 },
    { x: 2, y: 8 },
  ];

  return (
    <div className="board-container select-none">
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4"
        style={{
          borderColor: '#1E293B',
          background: '#0F172A',
        }}
      >
        {/* SVG Board Rendering */}
        <svg
          viewBox="0 0 1500 1500"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="cell-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.15" />
            </filter>
            <filter id="plate-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Board Background */}
          <rect x="0" y="0" width="1500" height="1500" fill="#FAFCFE" />

          {/* 1. FOUR HOME QUADRANTS (6x6 cells = 600x600 px) */}

          {/* TOP-LEFT: RED (#F51F2B) */}
          <g>
            <rect x="0" y="0" width="600" height="600" fill={COLOR_CONFIG.red.hex} />
            <rect
              x="80"
              y="80"
              width="440"
              height="440"
              rx="36"
              fill="#FFFFFF"
              filter="url(#plate-shadow)"
              stroke={COLOR_CONFIG.red.darkHex}
              strokeWidth="4"
            />
            {/* 4 Exact Token sockets (mathematically co-aligned with x=1.5, 3.5; y=1.5, 3.5) */}
            {[
              { cx: 200, cy: 200 },
              { cx: 400, cy: 200 },
              { cx: 200, cy: 400 },
              { cx: 400, cy: 400 },
            ].map((pt, i) => (
              <g key={`r-socket-${i}`}>
                <circle cx={pt.cx} cy={pt.cy} r="52" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                <circle cx={pt.cx} cy={pt.cy} r="46" fill="#FFFFFF" stroke={COLOR_CONFIG.red.hex} strokeWidth="3" />
                <circle cx={pt.cx} cy={pt.cy} r="20" fill={COLOR_CONFIG.red.lightHex} opacity="0.25" />
              </g>
            ))}
          </g>

          {/* TOP-RIGHT: GREEN (#08B84B) */}
          <g>
            <rect x="900" y="0" width="600" height="600" fill={COLOR_CONFIG.green.hex} />
            <rect
              x="980"
              y="80"
              width="440"
              height="440"
              rx="36"
              fill="#FFFFFF"
              filter="url(#plate-shadow)"
              stroke={COLOR_CONFIG.green.darkHex}
              strokeWidth="4"
            />
            {/* 4 Exact Token sockets (x=10.5, 12.5; y=1.5, 3.5) */}
            {[
              { cx: 1100, cy: 200 },
              { cx: 1300, cy: 200 },
              { cx: 1100, cy: 400 },
              { cx: 1300, cy: 400 },
            ].map((pt, i) => (
              <g key={`g-socket-${i}`}>
                <circle cx={pt.cx} cy={pt.cy} r="52" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                <circle cx={pt.cx} cy={pt.cy} r="46" fill="#FFFFFF" stroke={COLOR_CONFIG.green.hex} strokeWidth="3" />
                <circle cx={pt.cx} cy={pt.cy} r="20" fill={COLOR_CONFIG.green.lightHex} opacity="0.25" />
              </g>
            ))}
          </g>

          {/* BOTTOM-RIGHT: YELLOW (#FFD817) */}
          <g>
            <rect x="900" y="900" width="600" height="600" fill={COLOR_CONFIG.yellow.hex} />
            <rect
              x="980"
              y="980"
              width="440"
              height="440"
              rx="36"
              fill="#FFFFFF"
              filter="url(#plate-shadow)"
              stroke={COLOR_CONFIG.yellow.darkHex}
              strokeWidth="4"
            />
            {/* 4 Exact Token sockets (x=10.5, 12.5; y=10.5, 12.5) */}
            {[
              { cx: 1100, cy: 1100 },
              { cx: 1300, cy: 1100 },
              { cx: 1100, cy: 1300 },
              { cx: 1300, cy: 1300 },
            ].map((pt, i) => (
              <g key={`y-socket-${i}`}>
                <circle cx={pt.cx} cy={pt.cy} r="52" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                <circle cx={pt.cx} cy={pt.cy} r="46" fill="#FFFFFF" stroke={COLOR_CONFIG.yellow.hex} strokeWidth="3" />
                <circle cx={pt.cx} cy={pt.cy} r="20" fill={COLOR_CONFIG.yellow.lightHex} opacity="0.25" />
              </g>
            ))}
          </g>

          {/* BOTTOM-LEFT: BLUE (#087CF0) */}
          <g>
            <rect x="0" y="900" width="600" height="600" fill={COLOR_CONFIG.blue.hex} />
            <rect
              x="80"
              y="980"
              width="440"
              height="440"
              rx="36"
              fill="#FFFFFF"
              filter="url(#plate-shadow)"
              stroke={COLOR_CONFIG.blue.darkHex}
              strokeWidth="4"
            />
            {/* 4 Exact Token sockets (x=1.5, 3.5; y=10.5, 12.5) */}
            {[
              { cx: 200, cy: 1100 },
              { cx: 400, cy: 1100 },
              { cx: 200, cy: 1300 },
              { cx: 400, cy: 1300 },
            ].map((pt, i) => (
              <g key={`b-socket-${i}`}>
                <circle cx={pt.cx} cy={pt.cy} r="52" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                <circle cx={pt.cx} cy={pt.cy} r="46" fill="#FFFFFF" stroke={COLOR_CONFIG.blue.hex} strokeWidth="3" />
                <circle cx={pt.cx} cy={pt.cy} r="20" fill={COLOR_CONFIG.blue.lightHex} opacity="0.25" />
              </g>
            ))}
          </g>

          {/* 2. TRACK CELLS & HOME LANES (3 arms of 3x6 cells each) */}

          {/* Top Arm (cols 6, 7, 8; rows 0..5) */}
          {Array.from({ length: 6 }).map((_, r) =>
            [6, 7, 8].map((c) => {
              const isHomeLane = c === 7 && r > 0;
              const fill = isHomeLane ? COLOR_CONFIG.green.hex : '#FAFCFE';
              return (
                <rect
                  key={`top-${r}-${c}`}
                  x={c * 100}
                  y={r * 100}
                  width="100"
                  height="100"
                  fill={fill}
                  stroke="#1E293B"
                  strokeWidth="2.5"
                />
              );
            })
          )}

          {/* Bottom Arm (cols 6, 7, 8; rows 9..14) */}
          {Array.from({ length: 6 }).map((_, idx) => {
            const r = 9 + idx;
            return [6, 7, 8].map((c) => {
              const isHomeLane = c === 7 && r < 14;
              const fill = isHomeLane ? COLOR_CONFIG.blue.hex : '#FAFCFE';
              return (
                <rect
                  key={`bot-${r}-${c}`}
                  x={c * 100}
                  y={r * 100}
                  width="100"
                  height="100"
                  fill={fill}
                  stroke="#1E293B"
                  strokeWidth="2.5"
                />
              );
            });
          })}

          {/* Left Arm (rows 6, 7, 8; cols 0..5) */}
          {[6, 7, 8].map((r) =>
            Array.from({ length: 6 }).map((_, c) => {
              const isHomeLane = r === 7 && c > 0;
              const fill = isHomeLane ? COLOR_CONFIG.red.hex : '#FAFCFE';
              return (
                <rect
                  key={`left-${r}-${c}`}
                  x={c * 100}
                  y={r * 100}
                  width="100"
                  height="100"
                  fill={fill}
                  stroke="#1E293B"
                  strokeWidth="2.5"
                />
              );
            })
          )}

          {/* Right Arm (rows 6, 7, 8; cols 9..14) */}
          {[6, 7, 8].map((r) =>
            Array.from({ length: 6 }).map((_, idx) => {
              const c = 9 + idx;
              const isHomeLane = r === 7 && c < 14;
              const fill = isHomeLane ? COLOR_CONFIG.yellow.hex : '#FAFCFE';
              return (
                <rect
                  key={`right-${r}-${c}`}
                  x={c * 100}
                  y={r * 100}
                  width="100"
                  height="100"
                  fill={fill}
                  stroke="#1E293B"
                  strokeWidth="2.5"
                />
              );
            })
          )}

          {/* 3. CENTER FINISH (3x3 = 600..900, 600..900) */}
          <g>
            <polygon
              points="600,600 900,600 750,750"
              fill={COLOR_CONFIG.green.hex}
              stroke="#1E293B"
              strokeWidth="2.5"
            />
            <polygon
              points="900,600 900,900 750,750"
              fill={COLOR_CONFIG.yellow.hex}
              stroke="#1E293B"
              strokeWidth="2.5"
            />
            <polygon
              points="900,900 600,900 750,750"
              fill={COLOR_CONFIG.blue.hex}
              stroke="#1E293B"
              strokeWidth="2.5"
            />
            <polygon
              points="600,600 600,900 750,750"
              fill={COLOR_CONFIG.red.hex}
              stroke="#1E293B"
              strokeWidth="2.5"
            />
          </g>

          {/* 4. SAFE CELL STARS & ARROWS */}
          {safeStars.map(({ x, y }, i) => (
            <g key={`star-${i}`} transform={`translate(${x * 100 + 50}, ${y * 100 + 50})`}>
              <path
                d="M 0,-30 L 8,-8 L 30,-8 L 12,6 L 18,28 L 0,14 L -18,28 L -12,6 L -30,-8 L -8,-8 Z"
                fill="#64748B"
                opacity="0.85"
              />
            </g>
          ))}

          {/* 4 Starting Arrows */}
          <g transform="translate(750, 50)">
            <path d="M 0,22 L -18,-14 L 18,-14 Z" fill={COLOR_CONFIG.green.hex} />
          </g>
          <g transform="translate(1450, 750)">
            <path d="M -22,0 L 14,-18 L 14,18 Z" fill={COLOR_CONFIG.yellow.hex} />
          </g>
          <g transform="translate(750, 1450)">
            <path d="M 0,-22 L -18,14 L 18,14 Z" fill={COLOR_CONFIG.blue.hex} />
          </g>
          <g transform="translate(50, 750)">
            <path d="M 22,0 L -14,-18 L -14,18 Z" fill={COLOR_CONFIG.red.hex} />
          </g>

          {/* Outer Border */}
          <rect
            x="0"
            y="0"
            width="1500"
            height="1500"
            fill="none"
            stroke="#0F172A"
            strokeWidth="8"
          />
        </svg>

        {/* 5. TOKENS LAYER OVER BOARD */}
        <div className="absolute inset-0 pointer-events-none">
          {tokensList.map((item) => {
            const cellKey = `${item.renderX.toFixed(1)}_${item.renderY.toFixed(1)}`;
            const group = cellGroups.get(cellKey) || [item];
            const groupIndex = group.indexOf(item);
            const totalInCell = group.length;

            let size = 26;
            let dx = 0;
            let dy = 0;

            if (item.isMoving) {
              size = 30;
              dx = 0;
              dy = -4;
            } else if (totalInCell === 2) {
              size = 18;
              dx = groupIndex === 0 ? -4 : 4;
              dy = groupIndex === 0 ? -4 : 4;
            } else if (totalInCell === 3) {
              size = 16;
              const offsets = [
                { dx: -4, dy: -4 },
                { dx: 4, dy: -4 },
                { dx: 0, dy: 4 },
              ];
              dx = offsets[groupIndex]?.dx ?? 0;
              dy = offsets[groupIndex]?.dy ?? 0;
            } else if (totalInCell >= 4) {
              size = 15;
              const offsets = [
                { dx: -4, dy: -4 },
                { dx: 4, dy: -4 },
                { dx: -4, dy: 4 },
                { dx: 4, dy: 4 },
              ];
              dx = offsets[groupIndex]?.dx ?? 0;
              dy = offsets[groupIndex]?.dy ?? 0;
            }

            const leftPercent = (item.renderX + 0.5) * CELL_PERCENT;
            const topPercent = (item.renderY + 0.5) * CELL_PERCENT;

            return (
              <div
                key={`pawn-anchor-${item.key}`}
                className="absolute pointer-events-auto flex items-center justify-center"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: `translate(-50%, -65%) translate(${dx}px, ${dy}px) ${
                    item.isMoving ? 'scale(1.18)' : ''
                  }`,
                  zIndex: item.isMoving ? 60 : item.isLegal ? 40 : 10 + (groupIndex >= 0 ? groupIndex : 0),
                  transition: item.isMoving ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out',
                }}
              >
                <TokenPawn
                  id={item.token.id}
                  color={item.token.color}
                  isLegal={item.isLegal}
                  isMoving={item.isMoving}
                  onClick={() => onMoveToken(item.token.id)}
                  size={size}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
