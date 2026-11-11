export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type TokenState = 'BASE' | 'TRACK' | 'HOME_STRETCH' | 'FINISHED';

export interface GridCoord {
  x: number; // 0 to 14 (col)
  y: number; // 0 to 14 (row)
}

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  state: TokenState;
  /**
   * step along player's personal path:
   * -1: in BASE
   * 0..50: on outer track (0 is player's start square, 50 is cell just before home entrance)
   * 51..55: on player's colored home stretch (5 cells)
   * 56: FINISHED in home triangle
   */
  step: number;
  gridX: number;
  gridY: number;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isBot?: boolean;
  tokens: Token[];
  rank?: number; // 1 for 1st place, 2 for 2nd, etc.
}

export interface RoomSettings {
  maxPlayers: 2 | 3 | 4;
  turnTimerSeconds: number; // 0 for disabled, 15, 30, 45
  threeSixesCancel: boolean; // 3 consecutive sixes cancel turn
  captureBonus: boolean; // bonus roll on capture
  finishBonus: boolean; // bonus roll on token reaching home
  roomName?: string;
  isPrivate?: boolean;
}

export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export interface GameState {
  roomId: string;
  roomCode: string;
  status: GameStatus;
  players: Player[];
  activePlayerIndex: number;
  currentRoll: number | null;
  consecutiveSixes: number;
  awaitingMove: boolean;
  legalTokenIndices: number[]; // indices 0..3 of the active player's tokens that can legally move
  turnTimeRemaining: number;
  winner: PlayerColor | null;
  standings: PlayerColor[];
  turnVersion: number;
  lastActionMessage: string | null;
  settings: RoomSettings;
}

export interface RoomSummary {
  id: string;
  code: string;
  playerCount: number;
  maxPlayers: number;
  status: GameStatus;
}
