import crypto from 'node:crypto';
import {
  GameState,
  Player,
  PlayerColor,
  Token,
  RoomSettings,
  GridCoord,
} from '@ludo/shared';
import {
  COLOR_CONFIG,
  DEFAULT_ROOM_SETTINGS,
  FINISH_STEP,
  BASE_TOKEN_COORDS,
  getTokenGridPosition,
  isGridCellSafe,
} from '@ludo/shared';

export interface MoveResult {
  success: boolean;
  error?: string;
  tokenId?: number;
  fromStep?: number;
  toStep?: number;
  isCapture?: boolean;
  capturedColor?: PlayerColor;
  capturedTokenId?: number;
  capturedFromStep?: number;
  isFinished?: boolean;
  awardedExtraTurn?: boolean;
  extraTurnReason?: 'six' | 'capture' | 'finish' | null;
  gameOver?: boolean;
}

export class LudoEngine {
  private state: GameState;

  constructor(
    roomId: string,
    roomCode: string,
    players: Player[],
    settings: RoomSettings = DEFAULT_ROOM_SETTINGS
  ) {
    // Initialize tokens for all players
    const initializedPlayers = players.map((p) => ({
      ...p,
      tokens: this.createInitialTokens(p.color),
      rank: undefined,
    }));

    this.state = {
      roomId,
      roomCode,
      status: 'PLAYING',
      players: initializedPlayers,
      activePlayerIndex: 0,
      currentRoll: null,
      consecutiveSixes: 0,
      awaitingMove: false,
      legalTokenIndices: [],
      turnTimeRemaining: settings.turnTimerSeconds,
      winner: null,
      standings: [],
      turnVersion: 1,
      lastActionMessage: 'Game started! Red rolls first.',
      settings,
    };
  }

  private createInitialTokens(color: PlayerColor): Token[] {
    const tokens: Token[] = [];
    for (let id = 0; id < 4; id++) {
      const baseCoord = BASE_TOKEN_COORDS[color][id];
      tokens.push({
        id,
        color,
        state: 'BASE',
        step: -1,
        gridX: baseCoord.x,
        gridY: baseCoord.y,
      });
    }
    return tokens;
  }

  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getActivePlayer(): Player {
    return this.state.players[this.state.activePlayerIndex];
  }

  /**
   * Secure dice roll generated authoritatively on server.
   */
  public rollDice(playerId?: string): {
    success: boolean;
    error?: string;
    roll?: number;
    legalTokens?: number[];
    hasMoves?: boolean;
    turnCancelled?: boolean;
  } {
    if (this.state.status !== 'PLAYING') {
      return { success: false, error: 'Game is not in playing state' };
    }

    const activePlayer = this.getActivePlayer();
    if (playerId && activePlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.state.awaitingMove) {
      return { success: false, error: 'Must move a token before rolling again' };
    }

    // Cryptographically secure random integer between 1 and 6 inclusive
    const roll = crypto.randomInt(1, 7);
    this.state.currentRoll = roll;
    this.state.turnVersion++;

    if (roll === 6) {
      this.state.consecutiveSixes++;
    } else {
      this.state.consecutiveSixes = 0;
    }

    // Check 3 consecutive sixes rule
    if (
      this.state.settings.threeSixesCancel &&
      this.state.consecutiveSixes >= 3
    ) {
      this.state.lastActionMessage = `${activePlayer.name} rolled three consecutive 6s! Turn cancelled.`;
      this.state.consecutiveSixes = 0;
      return {
        success: true,
        roll,
        legalTokens: [],
        hasMoves: false,
        turnCancelled: true,
      };
    }

    // Determine legal moves for active player's tokens
    const legalTokens = this.calculateLegalMoves(activePlayer, roll);
    this.state.legalTokenIndices = legalTokens;

    if (legalTokens.length > 0) {
      this.state.awaitingMove = true;
      this.state.lastActionMessage = `${activePlayer.name} rolled a ${roll}! Choose a token to move.`;
      return {
        success: true,
        roll,
        legalTokens,
        hasMoves: true,
        turnCancelled: false,
      };
    } else {
      // No legal moves
      this.state.awaitingMove = false;
      if (roll === 6) {
        // Player rolled a 6 but had no valid moves; player still gets their extra turn
        this.state.lastActionMessage = `${activePlayer.name} rolled a 6 with no legal moves! Roll again.`;
        this.state.currentRoll = null;
        return {
          success: true,
          roll,
          legalTokens: [],
          hasMoves: false,
          turnCancelled: false,
        };
      } else {
        this.state.lastActionMessage = `${activePlayer.name} rolled a ${roll} with no legal moves. Passing turn...`;
        return {
          success: true,
          roll,
          legalTokens: [],
          hasMoves: false,
          turnCancelled: false,
        };
      }
    }
  }

  /**
   * Calculates which of the player's 4 tokens can legally move for the given roll.
   */
  public calculateLegalMoves(player: Player, roll: number): number[] {
    const legal: number[] = [];

    for (const token of player.tokens) {
      if (token.state === 'FINISHED') {
        continue;
      }

      if (token.state === 'BASE') {
        if (roll === 6) {
          legal.push(token.id);
        }
        continue;
      }

      // Token is on TRACK or HOME_STRETCH
      const targetStep = token.step + roll;
      if (targetStep <= FINISH_STEP) {
        legal.push(token.id);
      }
    }

    return legal;
  }

  /**
   * Executes movement for a token. Authoritative move resolution.
   */
  public moveToken(tokenId: number, playerId?: string): MoveResult {
    if (this.state.status !== 'PLAYING') {
      return { success: false, error: 'Game is not playing' };
    }

    const activePlayer = this.getActivePlayer();
    if (playerId && activePlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (!this.state.awaitingMove || this.state.currentRoll === null) {
      return { success: false, error: 'No active roll awaiting move' };
    }

    if (!this.state.legalTokenIndices.includes(tokenId)) {
      return { success: false, error: 'Illegal token move' };
    }

    const token = activePlayer.tokens.find((t) => t.id === tokenId);
    if (!token) {
      return { success: false, error: 'Token not found' };
    }

    const roll = this.state.currentRoll;
    const fromStep = token.step;
    let targetStep = 0;

    if (token.state === 'BASE') {
      targetStep = 0;
      token.state = 'TRACK';
    } else {
      targetStep = token.step + roll;
      if (targetStep === FINISH_STEP) {
        token.state = 'FINISHED';
      } else if (targetStep >= 51) {
        token.state = 'HOME_STRETCH';
      } else {
        token.state = 'TRACK';
      }
    }

    token.step = targetStep;
    const newCoord = getTokenGridPosition(token);
    token.gridX = newCoord.x;
    token.gridY = newCoord.y;

    this.state.turnVersion++;
    let isCapture = false;
    let capturedColor: PlayerColor | undefined;
    let capturedTokenId: number | undefined;
    let capturedFromStep: number | undefined;

    // Check for capture if token landed on outer track (steps 0..50)
    if (token.state === 'TRACK' && targetStep <= 50) {
      const isSafe = isGridCellSafe(token.gridX, token.gridY);
      if (!isSafe) {
        for (const opponent of this.state.players) {
          if (opponent.color === activePlayer.color) continue;
          for (const opToken of opponent.tokens) {
            if (
              opToken.state === 'TRACK' &&
              opToken.gridX === token.gridX &&
              opToken.gridY === token.gridY
            ) {
              // Capture opponent token!
              isCapture = true;
              capturedColor = opponent.color;
              capturedTokenId = opToken.id;
              capturedFromStep = opToken.step;

              opToken.state = 'BASE';
              opToken.step = -1;
              const opBaseCoord = BASE_TOKEN_COORDS[opponent.color][opToken.id];
              opToken.gridX = opBaseCoord.x;
              opToken.gridY = opBaseCoord.y;

              this.state.lastActionMessage = `${activePlayer.name} captured ${opponent.name}'s token!`;
              break;
            }
          }
          if (isCapture) break;
        }
      }
    }

    // Check if token reached finish
    const isFinished = token.state === 'FINISHED';
    if (isFinished) {
      this.state.lastActionMessage = `${activePlayer.name} brought a token HOME!`;
    }

    // Check if player has finished all 4 tokens
    const allFinished = activePlayer.tokens.every((t) => t.state === 'FINISHED');
    let gameOver = false;

    if (allFinished && !activePlayer.rank) {
      const currentRank = this.state.standings.length + 1;
      activePlayer.rank = currentRank;
      this.state.standings.push(activePlayer.color);

      if (this.state.winner === null) {
        this.state.winner = activePlayer.color;
      }

      // Check if game should end
      const activePlayersRemaining = this.state.players.filter(
        (p) => !p.rank
      );

      // In 2 player game, 1st finish ends game; in 3-4 players, when only 1 remains
      if (
        this.state.players.length === 2 ||
        activePlayersRemaining.length <= 1
      ) {
        gameOver = true;
        this.state.status = 'FINISHED';

        if (activePlayersRemaining.length === 1) {
          const lastPlayer = activePlayersRemaining[0];
          lastPlayer.rank = this.state.standings.length + 1;
          this.state.standings.push(lastPlayer.color);
        }

        this.state.lastActionMessage = `Game over! ${activePlayer.name} wins!`;
      }
    }

    // Determine extra turn
    let awardedExtraTurn = false;
    let extraTurnReason: 'six' | 'capture' | 'finish' | null = null;

    if (!gameOver) {
      if (this.state.settings.captureBonus && isCapture) {
        awardedExtraTurn = true;
        extraTurnReason = 'capture';
        this.state.lastActionMessage += ` Bonus roll for capture!`;
      } else if (this.state.settings.finishBonus && isFinished) {
        awardedExtraTurn = true;
        extraTurnReason = 'finish';
        this.state.lastActionMessage += ` Bonus roll for reaching home!`;
      } else if (roll === 6) {
        awardedExtraTurn = true;
        extraTurnReason = 'six';
        this.state.lastActionMessage = `${activePlayer.name} rolled a 6! Bonus roll.`;
      }
    }

    // Reset move state
    this.state.awaitingMove = false;
    this.state.currentRoll = null;
    this.state.legalTokenIndices = [];

    if (!awardedExtraTurn && !gameOver) {
      this.advanceTurn();
    } else if (awardedExtraTurn && !gameOver) {
      // Keep turn with same player, reset timer
      this.state.turnTimeRemaining = this.state.settings.turnTimerSeconds;
    }

    return {
      success: true,
      tokenId,
      fromStep,
      toStep: targetStep,
      isCapture,
      capturedColor,
      capturedTokenId,
      capturedFromStep,
      isFinished,
      awardedExtraTurn,
      extraTurnReason,
      gameOver,
    };
  }

  /**
   * Advances the turn to the next player who has not finished all tokens.
   */
  public advanceTurn(): void {
    this.state.currentRoll = null;
    this.state.awaitingMove = false;
    this.state.legalTokenIndices = [];
    this.state.consecutiveSixes = 0;
    this.state.turnTimeRemaining = this.state.settings.turnTimerSeconds;

    const totalPlayers = this.state.players.length;
    let nextIndex = (this.state.activePlayerIndex + 1) % totalPlayers;
    let loops = 0;

    // Find next player who still has unfinished tokens
    while (loops < totalPlayers) {
      const candidate = this.state.players[nextIndex];
      const hasUnfinishedTokens = candidate.tokens.some((t) => t.state !== 'FINISHED');
      if (hasUnfinishedTokens && candidate.isConnected) {
        this.state.activePlayerIndex = nextIndex;
        this.state.turnVersion++;
        return;
      }
      nextIndex = (nextIndex + 1) % totalPlayers;
      loops++;
    }

    // Fallback: next index if all checked
    this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % totalPlayers;
    this.state.turnVersion++;
  }

  public decrementTimer(): { expired: boolean; timeRemaining: number } {
    if (this.state.settings.turnTimerSeconds <= 0) {
      return { expired: false, timeRemaining: 0 };
    }

    this.state.turnTimeRemaining = Math.max(0, this.state.turnTimeRemaining - 1);
    const expired = this.state.turnTimeRemaining === 0;
    return { expired, timeRemaining: this.state.turnTimeRemaining };
  }

  public resetRematch(): void {
    this.state.status = 'PLAYING';
    this.state.activePlayerIndex = 0;
    this.state.currentRoll = null;
    this.state.consecutiveSixes = 0;
    this.state.awaitingMove = false;
    this.state.legalTokenIndices = [];
    this.state.turnTimeRemaining = this.state.settings.turnTimerSeconds;
    this.state.winner = null;
    this.state.standings = [];
    this.state.turnVersion++;
    this.state.lastActionMessage = 'Rematch started! Red rolls first.';

    for (const player of this.state.players) {
      player.rank = undefined;
      player.tokens = this.createInitialTokens(player.color);
    }
  }
}
