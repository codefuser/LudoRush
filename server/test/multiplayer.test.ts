import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { RoomManager } from '../src/rooms/RoomManager.js';
import { registerSocketHandlers } from '../src/sockets/socketHandler.js';
import { ClientToServerEvents, ServerToClientEvents } from '@ludo/shared';

describe('Real-Time Multiplayer Integration', () => {
  let server: http.Server;
  let io: Server;
  let roomManager: RoomManager;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: '*' } });
    roomManager = new RoomManager(io);
    registerSocketHandlers(io, roomManager);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    roomManager.destroy();
    io.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('supports room creation, joining, start game, and authoritative roll', async () => {
    // 1. Connect Client 1 (Host)
    const hostSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );

    // 2. Connect Client 2 (Guest)
    const guestSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );

    await new Promise<void>((resolve) => {
      let count = 0;
      const onConnect = () => {
        count++;
        if (count === 2) resolve();
      };
      hostSocket.on('connect', onConnect);
      guestSocket.on('connect', onConnect);
    });

    // 3. Host creates room
    let roomCode = '';
    let roomId = '';

    await new Promise<void>((resolve) => {
      hostSocket.emit(
        'room:create',
        { playerName: 'HostPlayer', settings: { maxPlayers: 2, turnTimerSeconds: 0 } },
        (res) => {
          expect(res.success).toBe(true);
          expect(res.roomCode).toBeDefined();
          roomCode = res.roomCode!;
          roomId = res.roomId!;
          resolve();
        }
      );
    });

    expect(roomCode.length).toBe(6);

    // 4. Guest joins room with roomCode
    await new Promise<void>((resolve) => {
      guestSocket.emit(
        'room:join',
        { roomCode, playerName: 'GuestPlayer', preferredColor: 'green' },
        (res) => {
          expect(res.success).toBe(true);
          resolve();
        }
      );
    });

    // 5. Host starts game
    const gameStartPromise = new Promise<void>((resolve) => {
      guestSocket.on('game:started', ({ state }) => {
        expect(state.status).toBe('PLAYING');
        expect(state.players.length).toBe(2);
        resolve();
      });
    });

    hostSocket.emit('room:start');
    await gameStartPromise;

    // 6. Host rolls dice (it is Red's turn first)
    const diceRollPromise = new Promise<void>((resolve) => {
      guestSocket.on('game:dice-rolled', ({ roll, playerColor }) => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
        expect(playerColor).toBe('red');
        resolve();
      });
    });

    hostSocket.emit('game:roll');
    await diceRollPromise;

    hostSocket.disconnect();
    guestSocket.disconnect();
  });
});
