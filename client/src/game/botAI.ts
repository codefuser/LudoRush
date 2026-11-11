import {
  GameState,
  Token,
  FINISH_STEP,
  COLOR_CONFIG,
  getTokenGridPosition,
  isGridCellSafe,
  GLOBAL_TRACK_COORDS,
} from '@ludo/shared';

function getGlobalTrackIndex(token: Token): number | null {
  if (token.state !== 'TRACK' || token.step < 0 || token.step > 50) {
    return null;
  }
  const startIdx = COLOR_CONFIG[token.color].startTrackIndex;
  return (startIdx + token.step) % GLOBAL_TRACK_COORDS.length;
}

function isThreatenedByOpponent(
  state: GameState,
  botColor: string,
  trackIdx: number
): boolean {
  const trackLen = GLOBAL_TRACK_COORDS.length;
  for (const opp of state.players) {
    if (opp.color === botColor) continue;
    for (const opTok of opp.tokens) {
      const oppIdx = getGlobalTrackIndex(opTok);
      if (oppIdx === null) continue;
      // Distance ahead from opponent to target trackIdx
      const dist = (trackIdx - oppIdx + trackLen) % trackLen;
      if (dist >= 1 && dist <= 6) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Picks the smartest legal token for an AI Computer player.
 */
export function chooseBestBotMove(state: GameState): number {
  const activePlayer = state.players[state.activePlayerIndex];
  const legal = state.legalTokenIndices;
  const roll = state.currentRoll ?? 0;

  if (!activePlayer || legal.length === 0) return 0;
  if (legal.length === 1) return legal[0];

  let bestId = legal[0];
  let bestScore = -Infinity;

  for (const tokenId of legal) {
    const token = activePlayer.tokens.find((t) => t.id === tokenId);
    if (!token) continue;

    let score = 0;
    const fromStep = token.step;
    const toStep = token.state === 'BASE' ? 0 : fromStep + roll;

    const targetState: Token['state'] =
      toStep === FINISH_STEP
        ? 'FINISHED'
        : toStep >= 51
        ? 'HOME_STRETCH'
        : 'TRACK';

    const targetPos = getTokenGridPosition({
      ...token,
      state: targetState,
      step: toStep,
    });

    // 1. Capture opponent on unsafe track square
    if (targetState === 'TRACK' && toStep <= 50 && !isGridCellSafe(targetPos.x, targetPos.y)) {
      for (const opp of state.players) {
        if (opp.color === activePlayer.color) continue;
        const canCapture = opp.tokens.some(
          (t) => t.state === 'TRACK' && t.gridX === targetPos.x && t.gridY === targetPos.y
        );
        if (canCapture) {
          score += 120;
          break;
        }
      }
    }

    // 2. Finish a token into HOME
    if (toStep === FINISH_STEP) {
      score += 105;
    }

    // 3. Enter private HOME_STRETCH safe zone
    if (fromStep <= 50 && toStep >= 51 && toStep < FINISH_STEP) {
      score += 75;
    }

    // 4. Exit BASE on 6
    if (token.state === 'BASE') {
      score += 65;
    }

    // 5. Land on safe star cell
    if (targetState === 'TRACK' && toStep <= 50 && isGridCellSafe(targetPos.x, targetPos.y)) {
      score += 55;
    }

    // 6. Escape threat vs walk into threat
    const curPos = getTokenGridPosition(token);
    const curGlobal = getGlobalTrackIndex(token);
    if (curGlobal !== null && !isGridCellSafe(curPos.x, curPos.y)) {
      if (isThreatenedByOpponent(state, activePlayer.color, curGlobal)) {
        score += 40;
      }
    }

    if (targetState === 'TRACK' && toStep <= 50 && !isGridCellSafe(targetPos.x, targetPos.y)) {
      const nextGlobal = (COLOR_CONFIG[token.color].startTrackIndex + toStep) % GLOBAL_TRACK_COORDS.length;
      if (isThreatenedByOpponent(state, activePlayer.color, nextGlobal)) {
        score -= 35;
      }
    }

    // 7. Slightly prefer advancing lead token
    score += toStep * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestId = tokenId;
    }
  }

  return bestId;
}
