import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'node:crypto';
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

  it('allows leaving an active game and rejoining with the room code', async () => {
    const hostSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );
    const guestSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );

    await new Promise<void>((resolve) => {
      let count = 0;
      const check = () => {
        count++;
        if (count === 2) resolve();
      };
      hostSocket.on('connect', check);
      guestSocket.on('connect', check);
    });

    let roomCode = '';
    await new Promise<void>((resolve) => {
      hostSocket.emit(
        'room:create',
        { playerName: 'Joseph', settings: { maxPlayers: 2, turnTimerSeconds: 0 } },
        (res) => {
          expect(res.success).toBe(true);
          roomCode = res.roomCode!;
          resolve();
        }
      );
    });

    await new Promise<void>((resolve) => {
      guestSocket.emit(
        'room:join',
        { roomCode, playerName: 'Guru', preferredColor: 'green' },
        (res) => {
          expect(res.success).toBe(true);
          resolve();
        }
      );
    });

    const started = new Promise<void>((resolve) => {
      guestSocket.once('game:started', () => resolve());
    });
    hostSocket.emit('room:start');
    await started;

    // Guest leaves room cleanly
    guestSocket.emit('room:leave');
    await new Promise((r) => setTimeout(r, 80));

    // Guest rejoins from the same socket using roomCode
    const rejoinedStatePromise = new Promise<any>((resolve) => {
      guestSocket.once('room:joined', (payload) => resolve(payload));
    });
    await new Promise<void>((resolve) => {
      guestSocket.emit(
        'room:join',
        { roomCode, playerName: 'Guru' },
        (res) => {
          expect(res.success).toBe(true);
          resolve();
        }
      );
    });
    const rejoined = await rejoinedStatePromise;
    expect(rejoined.player.color).toBe('green');
    expect(rejoined.player.isConnected).toBe(true);
    expect(rejoined.state.status).toBe('PLAYING');

    // Guest leaves again and rejoins from a brand-new tab/socket even with different name
    guestSocket.emit('room:leave');
    await new Promise((r) => setTimeout(r, 80));

    const freshSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );
    await new Promise<void>((resolve) => freshSocket.on('connect', () => resolve()));

    const freshRejoinPromise = new Promise<any>((resolve) => {
      freshSocket.once('room:joined', (payload) => resolve(payload));
    });
    await new Promise<void>((resolve) => {
      freshSocket.emit(
        'room:join',
        { roomCode, playerName: 'Guest' },
        (res) => {
          expect(res.success).toBe(true);
          resolve();
        }
      );
    });
    const freshRejoined = await freshRejoinPromise;
    expect(freshRejoined.player.color).toBe('green');
    expect(freshRejoined.state.status).toBe('PLAYING');

    hostSocket.disconnect();
    guestSocket.disconnect();
    freshSocket.disconnect();
  });

  it('holds 1..5 no-move roll briefly so player sees rolled number, and auto-moves single legal token', async () => {
    const hostSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );
    const guestSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );

    await new Promise<void>((resolve) => {
      let count = 0;
      const check = () => {
        count++;
        if (count === 2) resolve();
      };
      hostSocket.on('connect', check);
      guestSocket.on('connect', check);
    });

    let roomCode = '';
    await new Promise<void>((resolve) => {
      hostSocket.emit(
        'room:create',
        { playerName: 'Alice', settings: { maxPlayers: 2, turnTimerSeconds: 0 } },
        (res) => {
          roomCode = res.roomCode!;
          resolve();
        }
      );
    });
    await new Promise<void>((resolve) => {
      guestSocket.emit(
        'room:join',
        { roomCode, playerName: 'Bob', preferredColor: 'green' },
        () => resolve()
      );
    });

    const started = new Promise<void>((resolve) => {
      hostSocket.once('game:started', () => resolve());
    });
    hostSocket.emit('room:start');
    await started;

    const spy = vi.spyOn(crypto, 'randomInt').mockImplementation((() => 4) as any);
    try {
      // 1) All tokens in base: roll 4 -> must hold turn on Red with currentRoll === 4 before advancing!
      const stateAfterNoMovePromise = new Promise<any>((resolve) => {
        hostSocket.once('game:state', ({ state }) => resolve(state));
      });
      hostSocket.emit('game:roll');
      const stateAfterNoMove = await stateAfterNoMovePromise;
      expect(stateAfterNoMove.currentRoll).toBe(4);
      expect(stateAfterNoMove.activePlayerIndex).toBe(0);

      // Even 1000ms later, dice number 4 should still be held on Red's turn
      await new Promise((r) => setTimeout(r, 1000));
      const room = roomManager.getRoomByCode(roomCode)!;
      expect(room.getGameState().activePlayerIndex).toBe(0);
      expect(room.getGameState().currentRoll).toBe(4);

      // Wait for advanceTurn at 2300ms -> now Green's turn
      const advancedPromise = new Promise<any>((resolve) => {
        hostSocket.once('game:state', ({ state }) => resolve(state));
      });
      const advancedState = await advancedPromise;
      expect(advancedState.activePlayerIndex).toBe(1);
      expect(advancedState.currentRoll).toBeNull();

      // 2) Green has 1 coin out on track (step 5) and rolls 3 -> must auto-move token 0 from 5 to 8!
      const engine = (room as any).engine;
      engine.state.players[1].tokens[0].state = 'TRACK';
      engine.state.players[1].tokens[0].step = 5;
      spy.mockImplementation((() => 3) as any);

      const autoMovePromise = new Promise<any>((resolve) => {
        guestSocket.once('game:move-accepted', (payload) => resolve(payload));
      });
      guestSocket.emit('game:roll');
      const movePayload = await autoMovePromise;
      expect(movePayload.playerColor).toBe('green');
      expect(movePayload.tokenId).toBe(0);
      expect(movePayload.fromStep).toBe(5);
      expect(movePayload.toStep).toBe(8);
    } finally {
      spy.mockRestore();
      hostSocket.disconnect();
      guestSocket.disconnect();
    }
  }, 10000);

  it('does not let connected player take repeated turns while opponent has exited; waits for rejoin', async () => {
    const hostSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );
    const guestSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents> = Client(
      `http://localhost:${port}`
    );

    await new Promise<void>((resolve) => {
      let count = 0;
      const check = () => {
        count++;
        if (count === 2) resolve();
      };
      hostSocket.on('connect', check);
      guestSocket.on('connect', check);
    });

    let roomCode = '';
    await new Promise<void>((resolve) => {
      hostSocket.emit(
        'room:create',
        { playerName: 'Joseph', settings: { maxPlayers: 2, turnTimerSeconds: 30 } },
        (res) => {
          roomCode = res.roomCode!;
          resolve();
        }
      );
    });
    await new Promise<void>((resolve) => {
      guestSocket.emit(
        'room:join',
        { roomCode, playerName: 'Guru', preferredColor: 'green' },
        () => resolve()
      );
    });

    const started = new Promise<void>((resolve) => {
      hostSocket.once('game:started', () => resolve());
    });
    hostSocket.emit('room:start');
    await started;

    const room = roomManager.getRoomByCode(roomCode)!;
    const engine = (room as any).engine;
    // Give both players 1 token out on track
    engine.state.players[0].tokens[0].state = 'TRACK';
    engine.state.players[0].tokens[0].step = 2;
    engine.state.players[1].tokens[0].state = 'TRACK';
    engine.state.players[1].tokens[0].step = 5;

    // Pass turn to Green (Guru)
    room.advanceTurn();
    expect(room.getGameState().activePlayerIndex).toBe(1);

    // Joseph (Red) exits the room!
    hostSocket.emit('room:leave');
    await new Promise((r) => setTimeout(r, 80));

    const spy = vi.spyOn(crypto, 'randomInt').mockImplementation((() => 3) as any);
    try {
      // Guru rolls 3 and token 0 auto-moves 5 -> 8
      const movePromise = new Promise<any>((resolve) => {
        guestSocket.once('game:move-accepted', (payload) => resolve(payload));
      });
      guestSocket.emit('game:roll');
      const moveRes = await movePromise;
      expect(moveRes.toStep).toBe(8);
      // Turn MUST pass to Joseph (index 0) and wait, NOT return to Guru (index 1)!
      expect(moveRes.state.activePlayerIndex).toBe(0);
      expect(moveRes.state.players[0].isConnected).toBe(false);

      // If Guru tries to roll again while Joseph is away -> MUST be rejected!
      const errPromise = new Promise<string>((resolve) => {
        guestSocket.once('room:error', ({ message }) => resolve(message));
      });
      guestSocket.emit('game:roll');
      const errMsg = await errPromise;
      expect(errMsg).toMatch(/Not your turn/i);

      // Joseph rejoins using roomCode -> turn is still on Joseph (0) and Joseph can roll!
      const rejoinedPromise = new Promise<any>((resolve) => {
        hostSocket.once('room:joined', (payload) => resolve(payload));
      });
      await new Promise<void>((resolve) => {
        hostSocket.emit('room:join', { roomCode, playerName: 'Joseph' }, (res) => {
          expect(res.success).toBe(true);
          resolve();
        });
      });
      const rejoined = await rejoinedPromise;
      expect(rejoined.state.activePlayerIndex).toBe(0);
      expect(rejoined.state.players[0].isConnected).toBe(true);

      const josephRollPromise = new Promise<any>((resolve) => {
        hostSocket.once('game:dice-rolled', (p) => resolve(p));
      });
      hostSocket.emit('game:roll');
      const josephRoll = await josephRollPromise;
      expect(josephRoll.playerColor).toBe('red');
      expect(josephRoll.roll).toBe(3);
    } finally {
      spy.mockRestore();
      hostSocket.disconnect();
      guestSocket.disconnect();
    }
  }, 10000);
});
