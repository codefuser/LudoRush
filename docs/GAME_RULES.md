# Ludo Rush - Canonical Game Rules Specification

## 1. Overview & Board Geometry
Ludo Rush implements the canonical international rules of Ludo on a mathematically precise 15 × 15 grid.

- **Quadrant Bases**: 4 colored home bases (Red at Top-Left, Green at Top-Right, Yellow at Bottom-Right, Blue at Bottom-Left), each housing 4 tokens.
- **Track**: 52 universal perimeter cells travelled in a clockwise direction.
- **Home Stretch**: 5 color-specific private cells per player leading from the perimeter track into the center triangle.
- **Finish**: Center triangle (step 56) reached only by exact dice roll.

## 2. Token Progression
Each token progresses through 4 explicit lifecycle states:
1. `BASE`: Token rests in player's corner base.
2. `TRACK`: Token is on the 52-cell outer perimeter track (steps 0 to 50 relative to player's starting cell).
3. `HOME_STRETCH`: Token has entered its personal color lane (steps 51 to 55).
4. `FINISHED`: Token has landed on step 56 in the central triangle with an exact roll.

## 3. Releasing from BASE
- A player must roll a **6** to release a token from `BASE` onto the player's track entry cell (step 0).
- An invalid roll (1–5) cannot release a token from base.

## 4. Movement & Exact Roll Finish
- Tokens advance clockwise by the exact number shown on the dice.
- To reach `FINISHED` (step 56), an **exact roll** is required.
- If the dice roll exceeds the remaining distance to step 56, the move is illegal and cannot be selected.

## 5. Safe Cells & Star Squares
There are **8 safe cells** on the board:
- 4 Starting Cells: Red (1,6), Green (8,1), Yellow (13,8), Blue (6,13).
- 4 Star Cells: (6,2), (12,6), (8,12), (2,8).
Tokens resting on safe cells cannot be captured by opponent tokens. Multiple tokens may safely share a safe cell.

## 6. Captures & Consequences
- Landing on an opponent token on an unsafe track cell captures that token.
- The captured token immediately returns to `BASE` (step -1).
- If `captureBonus` is enabled (default: true), the capturing player is awarded an immediate bonus turn.

## 7. Sixes & Extra Turns
- Rolling a **6** grants an extra turn.
- If `threeSixesCancel` rule is enabled (default: true), rolling three 6s consecutively cancels the player's current turn and automatically passes turn to the next player.
- Bringing a token to `FINISHED` awards a bonus turn if `finishBonus` is enabled.

## 8. Win Condition
A player wins when all 4 of their tokens reach `FINISHED`. In multi-player matches (3–4 players), remaining players can contest for 2nd and 3rd rank.
