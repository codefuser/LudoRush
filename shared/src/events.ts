import { GameState, Player, PlayerColor, RoomSettings } from './types.js';

export interface ClientToServerEvents {
  'room:create': (
    payload: {
      playerName: string;
      settings?: Partial<RoomSettings>;
    },
    callback: (response: { success: boolean; roomId?: string; roomCode?: string; error?: string }) => void
  ) => void;

  'room:join': (
    payload: {
      roomCode: string;
      playerName: string;
      preferredColor?: PlayerColor;
    },
    callback: (response: { success: boolean; roomId?: string; error?: string }) => void
  ) => void;

  'room:leave': () => void;

  'room:ready': (payload: { isReady: boolean }) => void;

  'room:select-color': (payload: { color: PlayerColor }) => void;

  'room:update-settings': (payload: { settings: Partial<RoomSettings> }) => void;

  'room:start': () => void;

  'game:roll': () => void;

  'game:move': (payload: { tokenId: number }) => void;

  'game:rematch': () => void;

  'game:reaction': (payload: { emoji: string; targetColor?: PlayerColor }) => void;

  'session:reconnect': (
    payload: {
      roomId: string;
      playerId: string;
      sessionToken: string;
    },
    callback: (response: { success: boolean; state?: GameState; player?: Player; error?: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  'session:init': (payload: { playerId: string; sessionToken: string }) => void;
  'room:joined': (payload: { roomId: string; roomCode: string; player: Player; state: GameState }) => void;
  'room:updated': (payload: { state: GameState }) => void;
  'room:error': (payload: { message: string; code?: string }) => void;
  'game:started': (payload: { state: GameState }) => void;
  'game:state': (payload: { state: GameState }) => void;
  'game:dice-rolled': (payload: {
    playerColor: PlayerColor;
    roll: number;
    legalTokens: number[];
    hasMoves: boolean;
  }) => void;
  'game:move-accepted': (payload: {
    playerColor: PlayerColor;
    tokenId: number;
    fromStep: number;
    toStep: number;
    isCapture: boolean;
    capturedColor?: PlayerColor;
    capturedTokenId?: number;
    capturedFromStep?: number;
    isFinished: boolean;
    state: GameState;
  }) => void;
  'game:token-captured': (payload: {
    capturedColor: PlayerColor;
    capturedTokenId: number;
    capturedFromStep?: number;
    byColor: PlayerColor;
  }) => void;
  'game:turn-changed': (payload: {
    activePlayerColor: PlayerColor;
    timeRemaining: number;
  }) => void;
  'game:turn-expired': (payload: { playerColor: PlayerColor }) => void;
  'game:finished': (payload: {
    winner: PlayerColor;
    standings: PlayerColor[];
    state: GameState;
  }) => void;
  'game:reaction': (payload: {
    playerId: string;
    playerName: string;
    playerColor: PlayerColor;
    emoji: string;
    targetColor?: PlayerColor;
  }) => void;
  'player:connected': (payload: { playerId: string; color: PlayerColor }) => void;
  'player:disconnected': (payload: { playerId: string; color: PlayerColor }) => void;
}
