import { Server } from 'socket.io';
import {
  GameState,
  Player,
  PlayerColor,
  RoomSettings,
  DEFAULT_ROOM_SETTINGS,
  PLAYER_COLORS,
} from '@ludo/shared';
import { LudoEngine, MoveResult } from '../engine/LudoEngine.js';

export interface RoomParticipant {
  player: Player;
  socketId: string;
  sessionToken: string;
}

export class Room {
  public readonly id: string;
  public readonly code: string;
  public hostPlayerId: string;
  public settings: RoomSettings;
  public status: 'LOBBY' | 'PLAYING' | 'FINISHED' = 'LOBBY';
  public createdAt: number = Date.now();
  public lastActiveAt: number = Date.now();

  private participants: Map<string, RoomParticipant> = new Map(); // playerId -> participant
  private engine: LudoEngine | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private io: Server;

  constructor(
    id: string,
    code: string,
    hostPlayerId: string,
    io: Server,
    settings?: Partial<RoomSettings>
  ) {
    this.id = id;
    this.code = code;
    this.hostPlayerId = hostPlayerId;
    this.io = io;
    this.settings = { ...DEFAULT_ROOM_SETTINGS, ...settings };
  }

  public addParticipant(
    player: Player,
    socketId: string,
    sessionToken: string
  ): boolean {
    if (this.participants.size >= this.settings.maxPlayers && !this.participants.has(player.id)) {
      return false;
    }
    this.participants.set(player.id, { player, socketId, sessionToken });
    this.lastActiveAt = Date.now();
    return true;
  }

  public getParticipant(playerId: string): RoomParticipant | undefined {
    return this.participants.get(playerId);
  }

  public getParticipantBySocket(socketId: string): RoomParticipant | undefined {
    for (const part of this.participants.values()) {
      if (part.socketId === socketId) return part;
    }
    return undefined;
  }

  public getParticipantBySession(playerId: string, sessionToken: string): RoomParticipant | undefined {
    const part = this.participants.get(playerId);
    if (part && part.sessionToken === sessionToken) {
      return part;
    }
    return undefined;
  }

  public getParticipants(): Map<string, RoomParticipant> {
    return this.participants;
  }

  public findParticipantByName(name: string): RoomParticipant | undefined {
    const clean = name.trim().toLowerCase();
    for (const part of this.participants.values()) {
      if (part.player.name.trim().toLowerCase() === clean) {
        return part;
      }
    }
    return undefined;
  }

  public getPlayers(): Player[] {
    return Array.from(this.participants.values()).map((p) => p.player);
  }

  public updatePlayerSocket(playerId: string, socketId: string): void {
    const part = this.participants.get(playerId);
    if (part) {
      part.socketId = socketId;
      part.player.isConnected = true;
      this.lastActiveAt = Date.now();
    }
  }

  public setPlayerDisconnected(socketId: string): Player | null {
    const part = this.getParticipantBySocket(socketId);
    if (part) {
      part.player.isConnected = false;
      this.lastActiveAt = Date.now();

      // If host disconnected in lobby, transfer host if other players are connected
      if (this.status === 'LOBBY' && part.player.id === this.hostPlayerId) {
        const nextConnected = Array.from(this.participants.values()).find(
          (p) => p.player.isConnected && p.player.id !== part.player.id
        );
        if (nextConnected) {
          part.player.isHost = false;
          nextConnected.player.isHost = true;
          this.hostPlayerId = nextConnected.player.id;
        }
      }
      return part.player;
    }
    return null;
  }

  public removePlayer(playerId: string): boolean {
    if (this.status === 'PLAYING') {
      // In active game, preserve the player seat and token positions so they can rejoin with room code!
      const part = this.participants.get(playerId);
      if (part) {
        part.player.isConnected = false;
        this.lastActiveAt = Date.now();
      }
      return true;
    }

    const deleted = this.participants.delete(playerId);
    if (deleted && playerId === this.hostPlayerId) {
      const next = Array.from(this.participants.values()).find((p) => p.player.isConnected);
      if (next) {
        next.player.isHost = true;
        this.hostPlayerId = next.player.id;
      }
    }
    return deleted;
  }

  public selectColor(playerId: string, color: PlayerColor): boolean {
    if (this.status !== 'LOBBY') return false;

    // Check if color is already taken by another player
    for (const part of this.participants.values()) {
      if (part.player.id !== playerId && part.player.color === color) {
        return false;
      }
    }

    const part = this.participants.get(playerId);
    if (part) {
      part.player.color = color;
      return true;
    }
    return false;
  }

  public setPlayerReady(playerId: string, isReady: boolean): boolean {
    if (this.status !== 'LOBBY') return false;
    const part = this.participants.get(playerId);
    if (part) {
      part.player.isReady = isReady;
      return true;
    }
    return false;
  }

  public updateSettings(playerId: string, newSettings: Partial<RoomSettings>): boolean {
    if (this.status !== 'LOBBY') return false;
    if (playerId !== this.hostPlayerId) return false;

    this.settings = { ...this.settings, ...newSettings };
    return true;
  }

  public getAvailableColors(): PlayerColor[] {
    const taken = new Set(Array.from(this.participants.values()).map((p) => p.player.color));
    return PLAYER_COLORS.filter((c) => !taken.has(c));
  }

  public canStartGame(requestingPlayerId: string): { canStart: boolean; error?: string } {
    if (requestingPlayerId !== this.hostPlayerId) {
      return { canStart: false, error: 'Only the host can start the game' };
    }
    if (this.status !== 'LOBBY') {
      return { canStart: false, error: 'Game has already started' };
    }
    const players = this.getPlayers().filter((p) => p.isConnected);
    if (players.length < 2) {
      return { canStart: false, error: 'At least 2 players are required to start' };
    }
    if (players.length > this.settings.maxPlayers) {
      return { canStart: false, error: 'Player count exceeds room limit' };
    }

    // Check unique colors
    const colors = new Set(players.map((p) => p.color));
    if (colors.size !== players.length) {
      return { canStart: false, error: 'Every player must have a distinct color' };
    }

    return { canStart: true };
  }

  public startGame(): boolean {
    const players = this.getPlayers();
    this.status = 'PLAYING';

    // Order players deterministically: Red, Green, Yellow, Blue order
    const orderedPlayers = [...players].sort((a, b) => {
      const order: Record<PlayerColor, number> = { red: 0, green: 1, yellow: 2, blue: 3 };
      return order[a.color] - order[b.color];
    });

    this.engine = new LudoEngine(this.id, this.code, orderedPlayers, this.settings);
    this.startTurnTimer();
    return true;
  }

  private startTurnTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.settings.turnTimerSeconds <= 0) return;

    this.timerInterval = setInterval(() => {
      if (!this.engine || this.status !== 'PLAYING') {
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      const { expired, timeRemaining } = this.engine.decrementTimer();

      // Emit countdown heartbeat
      const state = this.engine.getState();
      this.io.to(this.id).emit('game:turn-changed', {
        activePlayerColor: state.players[state.activePlayerIndex].color,
        timeRemaining,
      });

      if (expired) {
        this.handleTurnTimeout();
      }
    }, 1000);
  }

  private handleTurnTimeout(): void {
    if (!this.engine) return;
    const state = this.engine.getState();
    const activePlayer = state.players[state.activePlayerIndex];

    this.io.to(this.id).emit('game:turn-expired', { playerColor: activePlayer.color });

    if (!state.awaitingMove) {
      // Player timed out without rolling: auto-roll
      const rollRes = this.engine.rollDice();
      if (rollRes.success && rollRes.roll !== undefined) {
        this.io.to(this.id).emit('game:dice-rolled', {
          playerColor: activePlayer.color,
          roll: rollRes.roll,
          legalTokens: rollRes.legalTokens || [],
          hasMoves: !!rollRes.hasMoves,
        });

        const updatedState = this.engine.getState();
        this.io.to(this.id).emit('game:state', { state: updatedState });

        // If exactly 1 legal move, auto-move it
        if (rollRes.legalTokens && rollRes.legalTokens.length === 1) {
          const moveRes = this.engine.moveToken(rollRes.legalTokens[0]);
          this.broadcastMove(moveRes, activePlayer.color);
        }
      }
    } else {
      // Player timed out while choosing a move
      if (state.legalTokenIndices.length > 0) {
        // Auto-move first legal token
        const moveRes = this.engine.moveToken(state.legalTokenIndices[0]);
        this.broadcastMove(moveRes, activePlayer.color);
      } else {
        this.engine.advanceTurn();
        this.io.to(this.id).emit('game:state', { state: this.engine.getState() });
      }
    }
  }

  public rollDice(playerId: string) {
    if (!this.engine) return { success: false, error: 'Game not running' };
    const res = this.engine.rollDice(playerId);
    if (res.success) {
      this.lastActiveAt = Date.now();
    }
    return res;
  }

  public advanceTurn(): void {
    if (this.engine && this.status === 'PLAYING') {
      this.engine.advanceTurn();
      this.startTurnTimer();
    }
  }

  public moveToken(playerId: string, tokenId: number): MoveResult {
    if (!this.engine) return { success: false, error: 'Game not running' };
    const activePlayer = this.engine.getActivePlayer();
    const res = this.engine.moveToken(tokenId, playerId);
    if (res.success) {
      this.lastActiveAt = Date.now();
      this.broadcastMove(res, activePlayer.color);
    }
    return res;
  }

  private broadcastMove(moveRes: MoveResult, playerColor: PlayerColor): void {
    if (!this.engine) return;
    const state = this.engine.getState();

    if (moveRes.isCapture && moveRes.capturedColor && moveRes.capturedTokenId !== undefined) {
      this.io.to(this.id).emit('game:token-captured', {
        capturedColor: moveRes.capturedColor,
        capturedTokenId: moveRes.capturedTokenId,
        capturedFromStep: moveRes.capturedFromStep,
        byColor: playerColor,
      });
    }

    this.io.to(this.id).emit('game:move-accepted', {
      playerColor,
      tokenId: moveRes.tokenId ?? 0,
      fromStep: moveRes.fromStep ?? 0,
      toStep: moveRes.toStep ?? 0,
      isCapture: !!moveRes.isCapture,
      capturedColor: moveRes.capturedColor,
      capturedTokenId: moveRes.capturedTokenId,
      capturedFromStep: moveRes.capturedFromStep,
      isFinished: !!moveRes.isFinished,
      state,
    });

    if (moveRes.gameOver && state.winner) {
      this.status = 'FINISHED';
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.io.to(this.id).emit('game:finished', {
        winner: state.winner,
        standings: state.standings,
        state,
      });
    }
  }

  public triggerRematch(requestingPlayerId: string): boolean {
    if (requestingPlayerId !== this.hostPlayerId) return false;
    if (!this.engine) return false;

    this.status = 'PLAYING';
    this.engine.resetRematch();
    this.startTurnTimer();

    const state = this.engine.getState();
    this.io.to(this.id).emit('game:started', { state });
    return true;
  }

  public getGameState(): GameState {
    if (this.engine) {
      return this.engine.getState();
    }

    // Lobby state
    return {
      roomId: this.id,
      roomCode: this.code,
      status: this.status,
      players: this.getPlayers(),
      activePlayerIndex: 0,
      currentRoll: null,
      consecutiveSixes: 0,
      awaitingMove: false,
      legalTokenIndices: [],
      turnTimeRemaining: this.settings.turnTimerSeconds,
      winner: null,
      standings: [],
      turnVersion: 0,
      lastActionMessage: 'Waiting in lobby for players to ready up.',
      settings: this.settings,
    };
  }

  public cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
