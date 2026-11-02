import React, { useState, useEffect } from 'react';
import { PlayerColor } from '@ludo/shared';
import { COLOR_CONFIG } from '@ludo/shared';
import { sounds } from '../../game/soundEffects.js';

interface DiceProps {
  color: PlayerColor;
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  size?: number;
}

export const Dice: React.FC<DiceProps> = ({
  color,
  value,
  isRolling,
  canRoll,
  onRoll,
  size = 56,
}) => {
  const config = COLOR_CONFIG[color];
  const [rollingPip, setRollingPip] = useState<number>(6);

  // Rapidly cycle faces while rolling to create realistic 3D tumbling effect
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setRollingPip(Math.floor(Math.random() * 6) + 1);
      }, 45);
      return () => clearInterval(interval);
    }
  }, [isRolling]);

  const pipMap: Record<number, Array<[number, number]>> = {
    1: [[1, 1]],
    2: [
      [0, 2],
      [2, 0],
    ],
    3: [
      [0, 2],
      [1, 1],
      [2, 0],
    ],
    4: [
      [0, 0],
      [0, 2],
      [2, 0],
      [2, 2],
    ],
    5: [
      [0, 0],
      [0, 2],
      [1, 1],
      [2, 0],
      [2, 2],
    ],
    6: [
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 2],
      [2, 0],
      [2, 2],
    ],
  };

  const activeFace = isRolling ? rollingPip : value || 6;
  const pips = pipMap[activeFace] || pipMap[6];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canRoll && !isRolling) {
      sounds.playDiceClick();
      onRoll();
    }
  };

  return (
    <div
      onClick={handleClick}
      title={canRoll ? 'Tap to Roll Dice!' : `${config.name} Dice`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        cursor: canRoll && !isRolling ? 'pointer' : 'default',
        boxShadow: canRoll
          ? `0 0 20px ${config.hex}, 0 6px 16px rgba(0,0,0,0.6)`
          : '0 3px 10px rgba(0,0,0,0.35)',
      }}
      className={`relative select-none rounded-2xl flex items-center justify-center transition-all duration-200 border-2 ${
        isRolling ? 'animate-dice-roll scale-105' : ''
      } ${
        canRoll
          ? 'hover:scale-110 active:scale-95 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
          : 'opacity-90'
      }`}
    >
      {/* 3D Dice Face */}
      <div
        className="w-full h-full rounded-2xl flex flex-col justify-between p-2.5 shadow-inner relative"
        style={{
          background: `linear-gradient(145deg, #FFFFFF, #E8EDF3)`,
          borderColor: config.hex,
        }}
      >
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-1">
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const hasPip = pips.some(([pr, pc]) => pr === r && pc === c);
              return (
                <div key={`${r}-${c}`} className="flex items-center justify-center">
                  {hasPip && (
                    <div
                      style={{
                        backgroundColor: config.hex,
                        width: `${Math.max(7, Math.round(size * 0.19))}px`,
                        height: `${Math.max(7, Math.round(size * 0.19))}px`,
                      }}
                      className="rounded-full shadow-inner"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Prominent "TAP TO ROLL" Pill */}
      {canRoll && !isRolling && !value && (
        <span
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg text-white animate-bounce pointer-events-none"
          style={{ backgroundColor: config.hex }}
        >
          ROLL 🎲
        </span>
      )}
    </div>
  );
};
