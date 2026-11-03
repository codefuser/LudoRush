import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@ludo/shared';
import { RoomManager } from './rooms/RoomManager.js';
import { registerSocketHandlers } from './sockets/socketHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Allow dynamic CORS reflection so credentials work with Vercel, localhost, and custom domains
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  callback(null, true);
};

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const roomManager = new RoomManager(io);
registerSocketHandlers(io, roomManager);

// REST Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// REST Room Info preview endpoint
app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = roomManager.getRoomByCode(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const players = room.getPlayers();
  return res.json({
    id: room.id,
    code: room.code,
    status: room.status,
    playerCount: players.length,
    maxPlayers: room.settings.maxPlayers,
    players: players.map((p) => ({
      name: p.name,
      color: p.color,
      isHost: p.isHost,
      isReady: p.isReady,
      isConnected: p.isConnected,
    })),
  });
});

// Serve static frontend files in production if client/dist exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`🎮 Authoritative Ludo Multiplayer Server running on port ${PORT}`);
});

export { app, httpServer, io, roomManager };
