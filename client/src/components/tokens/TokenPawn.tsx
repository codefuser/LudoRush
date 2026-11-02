import React from 'react';
import { PlayerColor } from '@ludo/shared';
import { COLOR_CONFIG } from '@ludo/shared';

export interface TokenPawnProps {
  id: number;
  color: PlayerColor;
  isLegal: boolean;
  isMoving?: boolean;
  onClick?: () => void;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const TokenPawn: React.FC<TokenPawnProps> = ({
  id,
  color,
  isLegal,
  isMoving = false,
  onClick,
  size = 28,
  style = {},
  className = '',
}) => {
  const config = COLOR_CONFIG[color];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (isLegal && onClick) {
          onClick();
        }
      }}
      style={{
        width: `${size}px`,
        height: `${Math.round(size * 1.15)}px`,
        cursor: isLegal ? 'pointer' : 'default',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        ...style,
      }}
      className={`relative select-none flex items-center justify-center ${
        isLegal ? 'token-movable' : ''
      } ${className}`}
      title={`${config.name} Pawn #${id + 1}${isLegal ? ' (Tap to Move)' : ''}`}
    >
      <svg
        viewBox="0 0 100 115"
        className="w-full h-full select-none overflow-visible"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
        }}
      >
        <defs>
          {/* Main Pawn Radial 3D Sphere Gradient */}
          <radialGradient
            id={`pawn-sphere-${color}-${id}`}
            cx="32%"
            cy="28%"
            r="68%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="25%" stopColor={config.lightHex} />
            <stop offset="70%" stopColor={config.hex} />
            <stop offset="100%" stopColor={config.darkHex} />
          </radialGradient>

          {/* Pedestal Base Gradient */}
          <linearGradient
            id={`pawn-base-${color}-${id}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={config.lightHex} />
            <stop offset="50%" stopColor={config.hex} />
            <stop offset="100%" stopColor={config.darkHex} />
          </linearGradient>

          {/* Collar Ring Metallic Gradient */}
          <linearGradient
            id={`pawn-collar-${color}-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={config.darkHex} />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor={config.darkHex} />
          </linearGradient>
        </defs>

        {/* 1. Realistic Soft Ground Contact Shadow (Centered) */}
        <ellipse
          cx="50"
          cy="90"
          rx="30"
          ry="7"
          fill="#000000"
          opacity="0.32"
        />

        {/* 2. Pawn Bottom Pedestal Base Ring */}
        <ellipse
          cx="50"
          cy="83"
          rx="28"
          ry="8"
          fill={config.darkHex}
        />
        <ellipse
          cx="50"
          cy="81"
          rx="26"
          ry="7"
          fill={`url(#pawn-base-${color}-${id})`}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
        />

        {/* 3. Flared Stem / Waist */}
        <path
          d="M 30 78 C 36 62, 38 48, 50 48 C 62 48, 64 62, 70 78 Z"
          fill={`url(#pawn-sphere-${color}-${id})`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
        />

        {/* 4. Collar Ring */}
        <ellipse
          cx="50"
          cy="46"
          rx="16"
          ry="4"
          fill={`url(#pawn-collar-${color}-${id})`}
          stroke={config.darkHex}
          strokeWidth="0.8"
        />

        {/* 5. Spherical Head (Globe) */}
        <circle
          cx="50"
          cy="26"
          r="19"
          fill={`url(#pawn-sphere-${color}-${id})`}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
        />

        {/* 6. Realistic Specular Glint on Top-Left */}
        <ellipse
          cx="43"
          cy="20"
          rx="5.5"
          ry="3"
          fill="#FFFFFF"
          opacity="0.85"
          transform="rotate(-30 43 20)"
        />

        {/* 7. Clean Circular Active Halo (Zero box, pure round circle) */}
        {isLegal && (
          <g>
            <ellipse
              cx="50"
              cy="84"
              rx="31"
              ry="9.5"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              opacity="0.95"
            />
            <circle
              cx="50"
              cy="26"
              r="6"
              fill="#FFFFFF"
              opacity="0.85"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
