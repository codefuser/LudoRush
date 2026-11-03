import { GridCoord, PlayerColor, Token } from './types.js';
import { COLOR_CONFIG, FINISH_STEP } from './constants.js';

/**
 * Canonical 52 cells of the outer Ludo track in clockwise order.
 * Index 0 is Red's start square (x=1, y=6).
 */
export const GLOBAL_TRACK_COORDS: GridCoord[] = [
  // Left arm top row, moving right (5 cells)
  { x: 1, y: 6 }, // 0: Red Start
  { x: 2, y: 6 }, // 1
  { x: 3, y: 6 }, // 2
  { x: 4, y: 6 }, // 3
  { x: 5, y: 6 }, // 4
  // Top arm left column, moving up (6 cells)
  { x: 6, y: 5 }, // 5
  { x: 6, y: 4 }, // 6
  { x: 6, y: 3 }, // 7
  { x: 6, y: 2 }, // 8: Safe Star
  { x: 6, y: 1 }, // 9
  { x: 6, y: 0 }, // 10
  // Top arm top row, moving right (2 cells)
  { x: 7, y: 0 }, // 11: Green Home Entrance
  { x: 8, y: 0 }, // 12
  // Top arm right column, moving down (5 cells)
  { x: 8, y: 1 }, // 13: Green Start
  { x: 8, y: 2 }, // 14
  { x: 8, y: 3 }, // 15
  { x: 8, y: 4 }, // 16
  { x: 8, y: 5 }, // 17
  // Right arm top row, moving right (6 cells)
  { x: 9, y: 6 },  // 18
  { x: 10, y: 6 }, // 19
  { x: 11, y: 6 }, // 20
  { x: 12, y: 6 }, // 21: Safe Star
  { x: 13, y: 6 }, // 22
  { x: 14, y: 6 }, // 23
  // Right arm right edge (2 cells)
  { x: 14, y: 7 }, // 24: Yellow Home Entrance
  { x: 14, y: 8 }, // 25
  // Right arm bottom row, moving left (5 cells)
  { x: 13, y: 8 }, // 26: Yellow Start
  { x: 12, y: 8 }, // 27
  { x: 11, y: 8 }, // 28
  { x: 10, y: 8 }, // 29
  { x: 9, y: 8 },  // 30
  // Bottom arm right column, moving down (6 cells)
  { x: 8, y: 9 },  // 31
  { x: 8, y: 10 }, // 32
  { x: 8, y: 11 }, // 33
  { x: 8, y: 12 }, // 34: Safe Star
  { x: 8, y: 13 }, // 35
  { x: 8, y: 14 }, // 36
  // Bottom arm bottom edge (2 cells)
  { x: 7, y: 14 }, // 37: Blue Home Entrance
  { x: 6, y: 14 }, // 38
  // Bottom arm left column, moving up (5 cells)
  { x: 6, y: 13 }, // 39: Blue Start
  { x: 6, y: 12 }, // 40
  { x: 6, y: 11 }, // 41
  { x: 6, y: 10 }, // 42
  { x: 6, y: 9 },  // 43
  // Left arm bottom row, moving left (6 cells)
  { x: 5, y: 8 }, // 44
  { x: 4, y: 8 }, // 45
  { x: 3, y: 8 }, // 46
  { x: 2, y: 8 }, // 47: Safe Star
  { x: 1, y: 8 }, // 48
  { x: 0, y: 8 }, // 49
  // Left arm left edge (2 cells)
  { x: 0, y: 7 }, // 50: Red Home Entrance
  { x: 0, y: 6 }, // 51
];

/**
 * 5 home stretch cells for each color leading to center finish.
 */
export const HOME_STRETCH_COORDS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 5, y: 7 },
  ],
  green: [
    { x: 7, y: 1 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 7, y: 4 },
    { x: 7, y: 5 },
  ],
  yellow: [
    { x: 13, y: 7 },
    { x: 12, y: 7 },
    { x: 11, y: 7 },
    { x: 10, y: 7 },
    { x: 9, y: 7 },
  ],
  blue: [
    { x: 7, y: 13 },
    { x: 7, y: 12 },
    { x: 7, y: 11 },
    { x: 7, y: 10 },
    { x: 7, y: 9 },
  ],
};

/**
 * Center finish triangle locations and individual token slots.
 */
export const FINISH_SLOTS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { x: 5.8, y: 6.7 },
    { x: 5.8, y: 7.3 },
    { x: 6.3, y: 6.8 },
    { x: 6.3, y: 7.2 },
  ],
  green: [
    { x: 6.7, y: 5.8 },
    { x: 7.3, y: 5.8 },
    { x: 6.8, y: 6.3 },
    { x: 7.2, y: 6.3 },
  ],
  yellow: [
    { x: 8.2, y: 6.7 },
    { x: 8.2, y: 7.3 },
    { x: 7.7, y: 6.8 },
    { x: 7.7, y: 7.2 },
  ],
  blue: [
    { x: 6.7, y: 8.2 },
    { x: 7.3, y: 8.2 },
    { x: 6.8, y: 7.7 },
    { x: 7.2, y: 7.7 },
  ],
};

export const FINISH_COORDS: Record<PlayerColor, GridCoord> = {
  red: { x: 6.0, y: 7.0 },
  green: { x: 7.0, y: 6.0 },
  yellow: { x: 8.0, y: 7.0 },
  blue: { x: 7.0, y: 8.0 },
};

/**
 * Base token resting slots for each color (4 per color).
 */
export const BASE_TOKEN_COORDS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { x: 1.5, y: 1.5 },
    { x: 3.5, y: 1.5 },
    { x: 1.5, y: 3.5 },
    { x: 3.5, y: 3.5 },
  ],
  green: [
    { x: 10.5, y: 1.5 },
    { x: 12.5, y: 1.5 },
    { x: 10.5, y: 3.5 },
    { x: 12.5, y: 3.5 },
  ],
  yellow: [
    { x: 10.5, y: 10.5 },
    { x: 12.5, y: 10.5 },
    { x: 10.5, y: 12.5 },
    { x: 12.5, y: 12.5 },
  ],
  blue: [
    { x: 1.5, y: 10.5 },
    { x: 3.5, y: 10.5 },
    { x: 1.5, y: 12.5 },
    { x: 3.5, y: 12.5 },
  ],
};

/**
 * Returns grid coordinates for any token given its state and step.
 */
export function getTokenGridPosition(token: Token): GridCoord {
  if (token.state === 'BASE' || token.step < 0) {
    return BASE_TOKEN_COORDS[token.color][token.id];
  }

  if (token.state === 'FINISHED' || token.step >= FINISH_STEP) {
    return FINISH_SLOTS[token.color]?.[token.id] || FINISH_COORDS[token.color];
  }

  if (token.state === 'HOME_STRETCH' || token.step >= 51) {
    const stretchIdx = token.step - 51;
    const coords = HOME_STRETCH_COORDS[token.color];
    if (stretchIdx >= 0 && stretchIdx < coords.length) {
      return coords[stretchIdx];
    }
    return FINISH_COORDS[token.color];
  }

  // Token is on outer track (step 0..50)
  const startTrackIdx = COLOR_CONFIG[token.color].startTrackIndex;
  const globalIdx = (startTrackIdx + token.step) % GLOBAL_TRACK_COORDS.length;
  return GLOBAL_TRACK_COORDS[globalIdx];
}

/**
 * Given a token on outer track, returns its 0..51 global track index.
 * Returns null if token is in BASE, HOME_STRETCH, or FINISHED.
 */
export function getGlobalTrackIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  const startIdx = COLOR_CONFIG[color].startTrackIndex;
  return (startIdx + step) % GLOBAL_TRACK_COORDS.length;
}

/**
 * Checks if a grid coordinate is an authoritative safe cell.
 * Safe cells include the 4 start cells and the 4 star cells.
 */
export function isGridCellSafe(x: number, y: number): boolean {
  const safePositions: GridCoord[] = [
    { x: 1, y: 6 },  // Red start
    { x: 6, y: 2 },  // Top star
    { x: 8, y: 1 },  // Green start
    { x: 12, y: 6 }, // Right star
    { x: 13, y: 8 }, // Yellow start
    { x: 8, y: 12 }, // Bottom star
    { x: 6, y: 13 }, // Blue start
    { x: 2, y: 8 },  // Left star
  ];

  return safePositions.some((pos) => pos.x === x && pos.y === y);
}
