import React, { useState, useEffect, useRef } from 'react';
import { PlayerColor, COLOR_CONFIG } from '@ludo/shared';
import { sounds } from '../../game/soundEffects.js';

interface DiceProps {
  color: PlayerColor;
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  size?: number;
  align?: 'left' | 'right';
}

export const Dice: React.FC<DiceProps> = ({
  color,
  value,
  isRolling,
  canRoll,
  onRoll,
  size = 52,
  align = 'left',
}) => {
  const config = COLOR_CONFIG[color];
  const halfSize = size / 2;
  const pipSize = Math.max(7, Math.round(size * 0.19));

  // Cumulative rotation tracking so spins are natural and don't snap backwards
  const rollCountRef = useRef(0);
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [clickLocked, setClickLocked] = useState(false);

  // Map dice value (1..6) to rotation (rotateX, rotateY) to bring that face to the front
  const getFaceRotation = (val: number): { x: number; y: number } => {
    switch (val) {
      case 1:
        return { x: 0, y: 0 }; // Front face
      case 2:
        return { x: -90, y: 0 }; // Top face
      case 3:
        return { x: 0, y: -90 }; // Right face
      case 4:
        return { x: 0, y: 90 }; // Left face
      case 5:
        return { x: 90, y: 0 }; // Bottom face
      case 6:
      default:
        return { x: 0, y: 180 }; // Back face
    }
  };

  useEffect(() => {
    if (value && !isRolling) {
      rollCountRef.current += 1;
      const target = getFaceRotation(value);
      // Add full 360-degree spins to create a continuous dynamic tumble into place
      const spins = rollCountRef.current * 720;
      setRotation({
        x: spins + target.x,
        y: spins + target.y,
      });
    }
  }, [value, isRolling]);

  useEffect(() => {
    if (isRolling) {
      setClickLocked(true);
    } else if (canRoll && value === null) {
      const timer = setTimeout(() => setClickLocked(false), 120);
      return () => clearTimeout(timer);
    }
  }, [value, canRoll, isRolling]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canRoll && !isRolling && !clickLocked) {
      setClickLocked(true);
      sounds.playDiceClick();
      onRoll();
    }
  };

  // Render pips for any face
  const renderFacePips = (faceNumber: number) => {
    const pipCoordsMap: Record<number, Array<[number, number]>> = {
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

    const pips = pipCoordsMap[faceNumber] || pipCoordsMap[1];

    return (
      <>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const hasPip = pips.some(([pr, pc]) => pr === r && pc === c);
            return (
              <div key={`${r}-${c}`} className="flex items-center justify-center">
                {hasPip && (
                  <div
                    className="dice-pip"
                    style={{
                      width: `${pipSize}px`,
                      height: `${pipSize}px`,
                      backgroundColor: faceNumber === 1 ? config.hex : '#1E293B',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </>
    );
  };

  return (
    <div
      onClick={handleClick}
      title={canRoll && !clickLocked ? 'Click to Roll Dice!' : `${config.name} Dice`}
      className={`relative select-none inline-flex items-center gap-2.5 mx-2 ${
        align === 'right' ? 'flex-row-reverse' : 'flex-row'
      }`}
      style={{
        display: 'inline-flex',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        alignItems: 'center',
        cursor: canRoll && !isRolling && !clickLocked ? 'pointer' : 'default',
      }}
    >
      {/* 3D Scene Viewport */}
      <div
        className="dice-3d-scene shrink-0"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          filter: canRoll && !clickLocked
            ? `drop-shadow(0 0 10px ${config.hex}) drop-shadow(0 4px 8px rgba(0,0,0,0.5))`
            : 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
        }}
      >
        {/* 3D Cube with 6 real geometric faces */}
        <div
          className={`dice-3d-cube ${isRolling ? 'dice-rolling-3d' : ''}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: !isRolling
              ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
              : undefined,
          }}
        >
          {/* Face 1: Front */}
          <div
            className="dice-3d-face"
            style={{ transform: `rotateY(0deg) translateZ(${halfSize}px)` }}
          >
            {renderFacePips(1)}
          </div>

          {/* Face 2: Top */}
          <div
            className="dice-3d-face"
            style={{ transform: `rotateX(90deg) translateZ(${halfSize}px)` }}
          >
            {renderFacePips(2)}
          </div>

          {/* Face 3: Right */}
          <div
            className="dice-3d-face"
            style={{ transform: `rotateY(90deg) translateZ(${halfSize}px)` }}
          >
            {renderFacePips(3)}
          </div>

          {/* Face 4: Left */}
          <div
            className="dice-3d-face"
            style={{ transform: `rotateY(-90deg) translateZ(${halfSize}px)` }}
          >
            {renderFacePips(4)}
          </div>

          {/* Face 5: Bottom */}
          <div
            className="dice-3d-face"
            style={{ transform: `rotateX(-90deg) translateZ(${halfSize}px)` }}
          >
            {renderFacePips(5)}
          </div>

          {/* Face 6: Back */}
          <div
            className="dice-3d-face"
            style={{ transform: `rotateY(180deg) translateZ(${halfSize}px)` }}
          >
            {renderFacePips(6)}
          </div>
        </div>
      </div>

      {/* Side Prompt Pill (Placed beside dice - NEVER overlaps dice face!) */}
      {canRoll && !isRolling && !clickLocked && (
        <span
          className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white shadow-lg pointer-events-none whitespace-nowrap animate-pulse shrink-0"
          style={{
            backgroundColor: config.hex,
            boxShadow: `0 0 10px ${config.hex}`,
          }}
        >
          ROLL 🎲
        </span>
      )}

      {/* Rolled Value Pill (Clearly shows rolled number once dice lands, even on 1-5 no moves!) */}
      {value !== null && !isRolling && (!canRoll || clickLocked) && (
        <span
          className="text-[11px] font-black px-2.5 py-0.5 rounded-full text-white shadow-lg pointer-events-none whitespace-nowrap shrink-0 border border-white/25"
          style={{
            backgroundColor: `${config.hex}DD`,
            boxShadow: `0 0 10px ${config.hex}88`,
          }}
        >
          Rolled {value}
        </span>
      )}
    </div>
  );
};
