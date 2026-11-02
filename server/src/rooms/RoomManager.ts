import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Room } from './Room.js';
import { RoomSettings } from '@ludo/shared';

export class RoomManager {
  private roomsById: Map<string, Room> = new Map();
  private roomsByCode: Map<string, Room> = new Map();
  private io: Server;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    // Periodic sweep for abandoned rooms (every 5 minutes)
    this.cleanupInterval = setInterval(() => this.sweepInactiveRooms(), 5 * 60 * 1000);
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let attempts = 0; attempts < 1000; attempts++) {
      code = '';
      for (let i = 0; i < 6; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        code += chars[idx];
      }
      if (!this.roomsByCode.has(code)) {
        return code;
      }
    }
    return uuidv4().substring(0, 6).toUpperCase();
  }

  public createRoom(
    hostPlayerId: string,
    settings?: Partial<RoomSettings>
  ): Room {
    const roomId = uuidv4();
    const code = this.generateRoomCode();
    const room = new Room(roomId, code, hostPlayerId, this.io, settings);

    this.roomsById.set(roomId, room);
    this.roomsByCode.set(code, room);
    return room;
  }

  public getRoomById(roomId: string): Room | undefined {
    return this.roomsById.get(roomId);
  }

  public getRoomByCode(code: string): Room | undefined {
    return this.roomsByCode.get(code.trim().toUpperCase());
  }

  public getRoomForSocket(socketId: string): { room: Room; playerId: string } | null {
    for (const room of this.roomsById.values()) {
      const part = room.getParticipantBySocket(socketId);
      if (part) {
        return { room, playerId: part.player.id };
      }
    }
    return null;
  }

  public removeRoom(roomId: string): void {
    const room = this.roomsById.get(roomId);
    if (room) {
      room.cleanup();
      this.roomsByCode.delete(room.code);
      this.roomsById.delete(roomId);
    }
  }

  private sweepInactiveRooms(): void {
    const now = Date.now();
    const INACTIVE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    for (const [id, room] of this.roomsById.entries()) {
      const players = room.getPlayers();
      const connectedCount = players.filter((p) => p.isConnected).length;

      if (connectedCount === 0 && now - room.lastActiveAt > INACTIVE_TIMEOUT_MS) {
        this.removeRoom(id);
      }
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    for (const room of this.roomsById.values()) {
      room.cleanup();
    }
    this.roomsById.clear();
    this.roomsByCode.clear();
  }
}
