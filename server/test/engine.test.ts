import { describe, it, expect } from 'vitest';
import { LudoEngine } from '../src/engine/LudoEngine.js';
import {
  isGridCellSafe,
  GLOBAL_TRACK_COORDS,
  getTokenGridPosition,
  Player,
  DEFAULT_ROOM_SETTINGS,
} from '@ludo/shared';

describe('Authoritative LudoEngine', () => {
  const mockPlayers: Player[] = [
    {
      id: 'p1',
      name: 'Alice',
      color: 'red',
      isHost: true,
      isReady: true,
      isConnected: true,
      tokens: [],
    },
    {
      id: 'p2',
      name: 'Bob',
      color: 'green',
      isHost: false,
      isReady: true,
      isConnected: true,
      tokens: [],
    },
  ];

  it('initializes game state with all tokens in BASE', () => {
    const engine = new LudoEngine('r1', 'TEST01', mockPlayers);
    const state = engine.getState();

    expect(state.status).toBe('PLAYING');
    expect(state.players.length).toBe(2);
    expect(state.activePlayerIndex).toBe(0);

    for (const player of state.players) {
      expect(player.tokens.length).toBe(4);
      for (const token of player.tokens) {
        expect(token.state).toBe('BASE');
        expect(token.step).toBe(-1);
      }
    }
  });

  it('determines legal moves correctly for base tokens', () => {
    const engine = new LudoEngine('r1', 'TEST01', mockPlayers);
    const redPlayer = engine.getActivePlayer();

    // Roll of 1..5: no tokens in base can move
    const movesOn5 = engine.calculateLegalMoves(redPlayer, 5);
    expect(movesOn5).toEqual([]);

    // Roll of 6: all 4 base tokens can exit to track
    const movesOn6 = engine.calculateLegalMoves(redPlayer, 6);
    expect(movesOn6).toEqual([0, 1, 2, 3]);
  });

  it('moves a token from BASE to track start cell on 6', () => {
    const engine = new LudoEngine('r1', 'TEST01', mockPlayers);
    // Simulate active player rolled a 6
    (engine as any).state.currentRoll = 6;
    (engine as any).state.awaitingMove = true;
    (engine as any).state.legalTokenIndices = [0];

    const result = engine.moveToken(0);
    expect(result.success).toBe(true);
    expect(result.toStep).toBe(0);

    const state = engine.getState();
    const token = state.players[0].tokens[0];
    expect(token.state).toBe('TRACK');
    expect(token.step).toBe(0);
    expect(token.gridX).toBe(1);
    expect(token.gridY).toBe(6); // Red start cell
  });

  it('advances a token along track and allows exact roll into FINISH', () => {
    const engine = new LudoEngine('r1', 'TEST01', mockPlayers);
    const redToken = (engine as any).state.players[0].tokens[0];
    redToken.state = 'HOME_STRETCH';
    redToken.step = 54;

    // Remaining distance to 56 is 2.
    // If roll is 3, cannot move (overshoot)
    expect(engine.calculateLegalMoves((engine as any).state.players[0], 3)).not.toContain(0);

    // If roll is 2, exact roll into FINISH
    expect(engine.calculateLegalMoves((engine as any).state.players[0], 2)).toContain(0);

    (engine as any).state.currentRoll = 2;
    (engine as any).state.awaitingMove = true;
    (engine as any).state.legalTokenIndices = [0];

    const result = engine.moveToken(0);
    expect(result.success).toBe(true);
    expect(result.toStep).toBe(56);
    expect(result.isFinished).toBe(true);
    expect(redToken.state).toBe('FINISHED');
  });

  it('captures opponent token on unsafe track cell and sends it to BASE', () => {
    const engine = new LudoEngine('r1', 'TEST01', mockPlayers, {
      ...DEFAULT_ROOM_SETTINGS,
      captureBonus: true,
    });

    const redToken = (engine as any).state.players[0].tokens[0];
    const greenToken = (engine as any).state.players[1].tokens[0];

    // Place Green token on outer track cell: grid (4, 6) which is step 3 for Red
    // Red start is (1,6). Step 3 is (4,6) [unsafe]
    greenToken.state = 'TRACK';
    greenToken.step = 25; // some step on green track that maps to (4, 6)
    greenToken.gridX = 4;
    greenToken.gridY = 6;

    // Red token is at step 0: (1, 6)
    redToken.state = 'TRACK';
    redToken.step = 0;
    redToken.gridX = 1;
    redToken.gridY = 6;

    // Red rolls 3: lands on (4, 6)
    (engine as any).state.currentRoll = 3;
    (engine as any).state.awaitingMove = true;
    (engine as any).state.legalTokenIndices = [0];

    const result = engine.moveToken(0);
    expect(result.success).toBe(true);
    expect(result.isCapture).toBe(true);
    expect(result.capturedColor).toBe('green');
    expect(result.awardedExtraTurn).toBe(true);
    expect(result.extraTurnReason).toBe('capture');

    // Verify green token was sent back to BASE
    expect(greenToken.state).toBe('BASE');
    expect(greenToken.step).toBe(-1);
  });

  it('does NOT capture on safe star cells', () => {
    const engine = new LudoEngine('r1', 'TEST01', mockPlayers);
    const redToken = (engine as any).state.players[0].tokens[0];
    const greenToken = (engine as any).state.players[1].tokens[0];

    // Safe Star at (6, 2) [Step 8 for Red]
    expect(isGridCellSafe(6, 2)).toBe(true);

    greenToken.state = 'TRACK';
    greenToken.gridX = 6;
    greenToken.gridY = 2;

    redToken.state = 'TRACK';
    redToken.step = 4;
    redToken.gridX = 5;
    redToken.gridY = 6;

    // Red moves 4 steps from step 4 -> lands on step 8 at (6, 2)
    (engine as any).state.currentRoll = 4;
    (engine as any).state.awaitingMove = true;
    (engine as any).state.legalTokenIndices = [0];

    const result = engine.moveToken(0);
    expect(result.success).toBe(true);
    expect(result.isCapture).toBe(false);
    expect(greenToken.state).toBe('TRACK'); // Still on track!
  });

  it('validates all 8 canonical safe cells', () => {
    const safeCells = [
      { x: 1, y: 6 },  // Red start
      { x: 6, y: 2 },  // Top star
      { x: 8, y: 1 },  // Green start
      { x: 12, y: 6 }, // Right star
      { x: 13, y: 8 }, // Yellow start
      { x: 8, y: 12 }, // Bottom star
      { x: 6, y: 13 }, // Blue start
      { x: 2, y: 8 },  // Left star
    ];

    for (const pos of safeCells) {
      expect(isGridCellSafe(pos.x, pos.y)).toBe(true);
    }

    // Non-safe cells should return false
    expect(isGridCellSafe(2, 6)).toBe(false);
    expect(isGridCellSafe(7, 3)).toBe(false);
  });
});
