import { GameState, RoomSettings } from '@ludo/shared';

export interface RoomRecord {
  id: string;
  code: string;
  hostPlayerId: string;
  status: string;
  settings: RoomSettings;
  createdAt: number;
}

export interface GameRecord {
  roomId: string;
  state: GameState;
  updatedAt: number;
}

export interface StorageAdapter {
  saveRoom(room: RoomRecord): Promise<void>;
  saveGameState(roomId: string, state: GameState): Promise<void>;
  getGameState(roomId: string): Promise<GameState | null>;
  recordGameHistory(gameRecord: {
    roomId: string;
    winner: string;
    standings: string[];
    completedAt: number;
  }): Promise<void>;
}

/**
 * Memory storage adapter for ultra-fast low-latency state retrieval.
 * Can be backed or swapped with Supabase PostgreSQL via SUPABASE_URL / SUPABASE_KEY.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private rooms: Map<string, RoomRecord> = new Map();
  private states: Map<string, GameState> = new Map();
  private history: Array<{
    roomId: string;
    winner: string;
    standings: string[];
    completedAt: number;
  }> = [];

  async saveRoom(room: RoomRecord): Promise<void> {
    this.rooms.set(room.id, room);
  }

  async saveGameState(roomId: string, state: GameState): Promise<void> {
    this.states.set(roomId, JSON.parse(JSON.stringify(state)));
  }

  async getGameState(roomId: string): Promise<GameState | null> {
    const s = this.states.get(roomId);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  async recordGameHistory(entry: {
    roomId: string;
    winner: string;
    standings: string[];
    completedAt: number;
  }): Promise<void> {
    this.history.push(entry);
  }
}

export const defaultStorage = new MemoryStorageAdapter();
