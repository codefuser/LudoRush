import { PlayerColor, RoomSettings } from './types.js';

export const COLOR_CONFIG = {
  red: {
    hex: '#F51F2B',
    darkHex: '#B9121B',
    lightHex: '#FF7079',
    bgGlow: 'rgba(245, 31, 43, 0.25)',
    name: 'Red',
    startTrackIndex: 0,
    startGrid: { x: 1, y: 6 },
    homeEntranceStep: 51,
  },
  green: {
    hex: '#08B84B',
    darkHex: '#058334',
    lightHex: '#52DF87',
    bgGlow: 'rgba(8, 184, 75, 0.25)',
    name: 'Green',
    startTrackIndex: 13,
    startGrid: { x: 8, y: 1 },
    homeEntranceStep: 51,
  },
  yellow: {
    hex: '#FFD817',
    darkHex: '#C9A700',
    lightHex: '#FFE972',
    bgGlow: 'rgba(255, 216, 23, 0.25)',
    name: 'Yellow',
    startTrackIndex: 26,
    startGrid: { x: 13, y: 8 },
    homeEntranceStep: 51,
  },
  blue: {
    hex: '#087CF0',
    darkHex: '#055BB5',
    lightHex: '#64B2FF',
    bgGlow: 'rgba(8, 124, 240, 0.25)',
    name: 'Blue',
    startTrackIndex: 39,
    startGrid: { x: 6, y: 13 },
    homeEntranceStep: 51,
  },
} as const;

export const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 4,
  turnTimerSeconds: 30,
  threeSixesCancel: true,
  captureBonus: true,
  finishBonus: true,
};

export const TRACK_LENGTH = 52;
export const HOME_STRETCH_LENGTH = 5;
export const FINISH_STEP = 56; // 0..50 (51 track cells) + 5 home stretch (51..55) + 1 finish (56)

/**
 * 8 Safe cell indices on global 52-cell track:
 * - Player starting cells: 0 (Red), 13 (Green), 26 (Yellow), 39 (Blue)
 * - Star cells on each arm: 8 (Top arm), 21 (Right arm), 34 (Bottom arm), 47 (Left arm)
 */
export const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];
