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
  private rollInProgress: boolean = false;
  private pendingAdvanceTimeout: NodeJS.Timeout | null = null;
  private pendingAutoMoveTimeout: NodeJS.Timeout | null = null;
  private pendingBonusClearTimeout: NodeJS.Timeout | null = null;
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

  public findRejoinableParticipant(cleanName: string): RoomParticipant | undefined {
    // 1. Exact case-insensitive name match
    const byName = this.findParticipantByName(cleanName);
    if (byName) return byName;

    // 2. Any explicitly disconnected seat
    const disconnectedPart = Array.from(this.participants.values()).find(
      (p) => !p.player.isConnected
    );
    if (disconnectedPart) return disconnectedPart;

    // 3. Any seat whose previous socket is already closed/gone (handles instant tab reopen before ping timeout)
    const deadSocketPart = Array.from(this.participants.values()).find(
      (p) => !p.socketId || !this.io.sockets.sockets.get(p.socketId)?.connected
    );
    return deadSocketPart;
  }

  public getPlayers(): Player[] {
    return Array.from(this.participants.values()).map((p) => p.player);
  }

  public updatePlayerSocket(playerId: string, socketId: string): void {
    const part = this.participants.get(playerId);
    if (part) {
      part.socketId = socketId;
      part.player.isConnected = true;
      this.engine?.syncPlayer(playerId, {
        isConnected: true,
        name: part.player.name,
      });
      this.lastActiveAt = Date.now();
    }
  }

  public setPlayerDisconnected(socketId: string): Player | null {
    const part = this.getParticipantBySocket(socketId);
    if (part) {
      part.player.isConnected = false;
      part.socketId = '';
      this.engine?.syncPlayer(part.player.id, { isConnected: false });
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
    if (this.status === 'PLAYING' || this.status === 'FINISHED') {
      // Preserve seat, color, and tokens so player can rejoin anytime via room code
      const part = this.participants.get(playerId);
      if (part) {
        part.player.isConnected = false;
        part.socketId = '';
        this.engine?.syncPlayer(playerId, { isConnected: false });
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
    if (this.pendingAdvanceTimeout || this.pendingBonusClearTimeout) {
      // Turn was already rolled and is waiting to display result before advancing
      this.advanceTurn();
      this.io.to(this.id).emit('game:state', { state: this.getGameState() });
      return;
    }

    const state = this.engine.getState();
    const activePlayer = state.players[state.activePlayerIndex];

    this.io.to(this.id).emit('game:turn-expired', { playerColor: activePlayer.color });

    if (!state.awaitingMove) {
      // Player timed out without rolling: auto-roll
      const rollRes = this.engine.rollDice();
      if (rollRes.success && rollRes.roll !== undefined) {
        this.rollInProgress = true;
        this.io.to(this.id).emit('game:dice-rolled', {
          playerColor: activePlayer.color,
          roll: rollRes.roll,
          legalTokens: rollRes.legalTokens || [],
          hasMoves: !!rollRes.hasMoves,
        });

        const updatedState = this.engine.getState();
        this.io.to(this.id).emit('game:state', { state: updatedState });

        if (rollRes.hasMoves && rollRes.legalTokens && rollRes.legalTokens.length > 0) {
          this.scheduleAutoMove(activePlayer.id, rollRes.legalTokens[0], 700);
        } else if (rollRes.roll === 6 && !rollRes.turnCancelled) {
          this.clearPendingBonusClear();
          this.pendingBonusClearTimeout = setTimeout(() => {
            this.pendingBonusClearTimeout = null;
            if (this.engine && this.status === 'PLAYING') {
              this.engine.clearCurrentRoll();
              this.rollInProgress = false;
              this.io.to(this.id).emit('game:state', { state: this.getGameState() });
            }
          }, 1200);
        } else {
          this.scheduleAdvanceTurn(1800);
        }
      }
    } else {
      // Player timed out while choosing a move
      if (state.legalTokenIndices.length > 0) {
        this.clearPendingAutoMove();
        const moveRes = this.engine.moveToken(state.legalTokenIndices[0]);
        this.rollInProgress = false;
        this.broadcastMove(moveRes, activePlayer.color);
      } else {
        this.advanceTurn();
        this.io.to(this.id).emit('game:state', { state: this.engine.getState() });
      }
    }
  }

  public clearPendingAdvance(): void {
    if (this.pendingAdvanceTimeout) {
      clearTimeout(this.pendingAdvanceTimeout);
      this.pendingAdvanceTimeout = null;
    }
  }

  public clearPendingAutoMove(): void {
    if (this.pendingAutoMoveTimeout) {
      clearTimeout(this.pendingAutoMoveTimeout);
      this.pendingAutoMoveTimeout = null;
    }
  }

  public clearPendingBonusClear(): void {
    if (this.pendingBonusClearTimeout) {
      clearTimeout(this.pendingBonusClearTimeout);
      this.pendingBonusClearTimeout = null;
    }
  }

  public scheduleAdvanceTurn(delayMs: number): void {
    this.clearPendingAdvance();
    this.pendingAdvanceTimeout = setTimeout(() => {
      this.pendingAdvanceTimeout = null;
      if (this.status === 'PLAYING') {
        this.advanceTurn();
        this.io.to(this.id).emit('game:state', { state: this.getGameState() });
      }
    }, delayMs);
  }

  public scheduleAutoMove(playerId: string, tokenId: number, delayMs: number): void {
    this.clearPendingAutoMove();
    this.pendingAutoMoveTimeout = setTimeout(() => {
      this.pendingAutoMoveTimeout = null;
      if (this.status === 'PLAYING') {
        const curState = this.getGameState();
        if (curState.awaitingMove && curState.legalTokenIndices.includes(tokenId)) {
          this.moveToken(playerId, tokenId);
        }
      }
    }, delayMs);
  }

  public rollDice(playerId: string) {
    if (!this.engine) return { success: false, error: 'Game not running' };
    if (this.rollInProgress) {
      return { success: false, error: 'Dice roll already in progress' };
    }
    const res = this.engine.rollDice(playerId);
    if (res.success) {
      this.rollInProgress = true;
      this.lastActiveAt = Date.now();
      if (!res.hasMoves && res.roll === 6 && !res.turnCancelled) {
        // Show the rolled 6 clearly before resetting currentRoll for the bonus roll
        this.clearPendingBonusClear();
        this.pendingBonusClearTimeout = setTimeout(() => {
          this.pendingBonusClearTimeout = null;
          if (this.engine && this.status === 'PLAYING') {
            this.engine.clearCurrentRoll();
            this.rollInProgress = false;
            this.io.to(this.id).emit('game:state', { state: this.getGameState() });
          }
        }, 1400);
      }
    }
    return res;
  }

  public advanceTurn(): void {
    this.clearPendingAdvance();
    this.clearPendingAutoMove();
    this.clearPendingBonusClear();
    this.rollInProgress = false;
    if (this.engine && this.status === 'PLAYING') {
      this.engine.advanceTurn();
      this.startTurnTimer();
    }
  }

  public moveToken(playerId: string, tokenId: number): MoveResult {
    this.clearPendingAutoMove();
    if (!this.engine) return { success: false, error: 'Game not running' };
    const activePlayer = this.engine.getActivePlayer();
    const res = this.engine.moveToken(tokenId, playerId);
    if (res.success) {
      this.rollInProgress = false;
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
    this.clearPendingAdvance();
    this.clearPendingAutoMove();
    this.clearPendingBonusClear();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
