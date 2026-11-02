# 🎲 Ludo Rush - Minimal Real-Time Authoritative Multiplayer Web Game

A high-performance, responsive, browser-based multiplayer Ludo game featuring server-authoritative logic, private room lobbies, player-specific dice rendering, and instant URL-based invitations.

## ✨ Features
- **Browser-Based & Frictionless**: No app installation or mandatory user accounts required.
- **Server-Authoritative Game Engine**: Dice rolls, legal moves, collisions/captures, extra turns, and win detection are calculated on the backend.
- **Accurate 15 × 15 Board Grid**: Follows the official colorful Ludo board design with 4 distinct color quadrants, 8 safe star cells, 4 starting arrows, and exact home stretch lanes.
- **Player-Specific Dice**: The active player's 3D dice appears directly in that player's colored base area.
- **Private Rooms & 1-Click Invites**: Create custom rooms with 6-character room codes and shareable links (`/?room=CODE`).
- **Real-Time Reconnection**: Recovers player session, dice rolls, and turn states on page reload or temporary connection drop.
- **Audio & Visual Polish**: Synthesized zero-dependency Web Audio API sound effects, confetti celebrations, and floating emoji reactions.

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Shared Package
```bash
npm run build -w shared
```

### 3. Run Both Client & Server Concurrently
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Sockets**: [http://localhost:4000](http://localhost:4000)

### 4. Run Automated Tests
```bash
npm test
```

## 📐 Project Structure
```text
ludo-rush/
├── client/          # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # Board, Dice, Token, Player, Lobby, GameOver
│   │   ├── hooks/       # useMultiplayer WebSocket hook
│   │   └── game/        # Synthesized sound effects
├── server/          # Node.js + Express + Socket.IO authoritative engine
│   ├── src/
│   │   ├── engine/      # Pure LudoEngine rules & state transitions
│   │   ├── rooms/       # RoomManager & Room lifecycle
│   │   └── sockets/     # Real-time event controllers
│   └── test/        # Unit & integration test suites
├── shared/          # Shared types, constants, events, coordinate mappings
└── docs/            # Rules, architecture, and deployment documentation
```

## 📜 Documentation
- [Game Rules Specification](docs/GAME_RULES.md)
- [Architecture & Design](docs/ARCHITECTURE.md)
- [Production Deployment](docs/DEPLOYMENT.md)
