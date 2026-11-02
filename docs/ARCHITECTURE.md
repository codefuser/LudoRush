# Architecture & System Design

## 1. System Overview
Ludo Rush is architected as an authoritative real-time multiplayer application divided into three core packages managed within an npm monorepo:

```
ludo-rush/
├── client/     (Vite + React + TypeScript frontend)
├── server/     (Node.js + Express + Socket.IO + Authoritative LudoEngine)
└── shared/     (Canonical types, board coordinates, paths, events, constants)
```

## 2. Server-Authoritative Model
Clients render the game state and capture user intents (e.g. click dice to roll, click token to move). The backend server is the **single source of truth** for:
- Random dice roll generation using cryptographically secure PRNG (`crypto.randomInt(1, 7)`).
- Legal move calculation for the active player's tokens.
- Token movement validation.
- Collision / capture detection on non-safe cells.
- Extra-turn logic (sixes, captures, finish bonus, 3-sixes cancellation).
- Turn timeouts and automatic turnover.
- Winner declaration and standings.

Clients cannot forge dice results or move tokens to arbitrary board coordinates.

## 3. Real-Time Event Protocol
Socket.IO handles real-time bidirectional communication:
- **Client -> Server**:
  - `room:create`, `room:join`, `room:leave`, `room:ready`, `room:select-color`, `room:update-settings`, `room:start`
  - `game:roll`, `game:move`, `game:rematch`, `game:reaction`, `session:reconnect`
- **Server -> Client**:
  - `session:init`, `room:joined`, `room:updated`, `room:error`
  - `game:started`, `game:state`, `game:dice-rolled`, `game:move-accepted`, `game:token-captured`, `game:turn-changed`, `game:turn-expired`, `game:finished`

## 4. Reconnection & Session Resilience
- Guests receive a server-generated player ID and secret session token via `session:init`.
- Credentials are preserved in browser `sessionStorage`.
- When a client experiences network disconnection or page reload, it emits `session:reconnect` with `{ roomId, playerId, sessionToken }`.
- The server re-attaches the socket to the room, restores `isConnected: true`, and broadcasts the full authoritative `GameState` snapshot, resuming seamlessly without resetting game progress.

## 5. Board Coordinate System
- Canonical 15 × 15 grid representation (x = 0..14, y = 0..14).
- 52 perimeter track cells indexed clockwise.
- Pure coordinate resolver functions (`getTokenGridPosition`, `isGridCellSafe`) ensure client rendering matches server logic with 100% precision.
