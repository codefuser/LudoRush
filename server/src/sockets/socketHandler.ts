import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Player,
  PlayerColor,
  PLAYER_COLORS,
} from '@ludo/shared';
import { RoomManager } from '../rooms/RoomManager.js';

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager
) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    // 1. Session Reconnection
    socket.on('session:reconnect', ({ roomId, playerId, sessionToken }, callback) => {
      const room = roomManager.getRoomById(roomId);
      if (!room) {
        return callback({ success: false, error: 'Room not found or expired' });
      }

      const participant = room.getParticipantBySession(playerId, sessionToken);
      if (!participant) {
        return callback({ success: false, error: 'Invalid session credentials' });
      }

      // Reattach socket to participant and room channel
      room.updatePlayerSocket(playerId, socket.id);
      socket.join(roomId);

      const state = room.getGameState();
      callback({
        success: true,
        state,
        player: participant.player,
      });

      // Notify other players
      socket.to(roomId).emit('player:connected', {
        playerId,
        color: participant.player.color,
      });
      io.to(roomId).emit('room:updated', { state });
    });

    // 2. Create Room
    socket.on('room:create', ({ playerName, settings }, callback) => {
      const cleanName = (playerName || 'Player').trim().substring(0, 20);
      const hostId = uuidv4();
      const sessionToken = uuidv4();

      const hostPlayer: Player = {
        id: hostId,
        name: cleanName,
        color: 'red',
        isHost: true,
        isReady: true,
        isConnected: true,
        tokens: [],
      };

      const room = roomManager.createRoom(hostId, settings);
      room.addParticipant(hostPlayer, socket.id, sessionToken);
      socket.join(room.id);

      // Send private session token to client
      socket.emit('session:init', { playerId: hostId, sessionToken });

      const state = room.getGameState();
      socket.emit('room:joined', {
        roomId: room.id,
        roomCode: room.code,
        player: hostPlayer,
        state,
      });

      callback({
        success: true,
        roomId: room.id,
        roomCode: room.code,
      });
    });

    // 3. Join Room
    socket.on('room:join', ({ roomCode, playerName, preferredColor }, callback) => {
      const cleanName = (playerName || 'Guest').trim().substring(0, 20);
      const room = roomManager.getRoomByCode(roomCode);

      if (!room) {
        return callback({ success: false, error: 'Room not found. Check your code or invite link.' });
      }

      if (room.status !== 'LOBBY') {
        // In active game, check if this is an existing or disconnected participant rejoining with the room code!
        const byName = room.findParticipantByName(cleanName);
        const disconnectedPart = Array.from(room.getParticipants().values()).find((p) => !p.player.isConnected);
        const existingPart = byName || disconnectedPart;

        if (existingPart) {
          // Re-attach socket to existing player!
          existingPart.player.name = cleanName;
          existingPart.player.isConnected = true;
          room.updatePlayerSocket(existingPart.player.id, socket.id);
          socket.join(room.id);
          socket.emit('session:init', { playerId: existingPart.player.id, sessionToken: existingPart.sessionToken });

          const state = room.getGameState();
          socket.emit('room:joined', {
            roomId: room.id,
            roomCode: room.code,
            player: existingPart.player,
            state,
          });
          socket.emit('game:state', { state });

          // Broadcast to other players in room
          socket.to(room.id).emit('player:connected', {
            playerId: existingPart.player.id,
            color: existingPart.player.color,
          });
          io.to(room.id).emit('room:updated', { state });

          return callback({ success: true, roomId: room.id });
        }

        return callback({ success: false, error: 'Game in this room has already started and is full.' });
      }

      const availableColors = room.getAvailableColors();
      if (availableColors.length === 0) {
        return callback({ success: false, error: 'Room is full.' });
      }

      let chosenColor: PlayerColor = availableColors[0];
      if (preferredColor && availableColors.includes(preferredColor)) {
        chosenColor = preferredColor;
      }

      const playerId = uuidv4();
      const sessionToken = uuidv4();

      const newPlayer: Player = {
        id: playerId,
        name: cleanName,
        color: chosenColor,
        isHost: false,
        isReady: false,
        isConnected: true,
        tokens: [],
      };

      const added = room.addParticipant(newPlayer, socket.id, sessionToken);
      if (!added) {
        return callback({ success: false, error: 'Could not join room. Room may be full.' });
      }

      socket.join(room.id);
      socket.emit('session:init', { playerId, sessionToken });

      const state = room.getGameState();
      socket.emit('room:joined', {
        roomId: room.id,
        roomCode: room.code,
        player: newPlayer,
        state,
      });

      // Broadcast update to all room members
      io.to(room.id).emit('room:updated', { state });

      callback({ success: true, roomId: room.id });
    });

    // 4. Leave Room
    socket.on('room:leave', () => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      room.removePlayer(playerId);
      socket.leave(room.id);

      const state = room.getGameState();
      io.to(room.id).emit('room:updated', { state });
    });

    // 5. Select Color
    socket.on('room:select-color', ({ color }) => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      if (room.selectColor(playerId, color)) {
        io.to(room.id).emit('room:updated', { state: room.getGameState() });
      }
    });

    // 6. Ready Toggle
    socket.on('room:ready', ({ isReady }) => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      if (room.setPlayerReady(playerId, isReady)) {
        io.to(room.id).emit('room:updated', { state: room.getGameState() });
      }
    });

    // 7. Update Settings
    socket.on('room:update-settings', ({ settings }) => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      if (room.updateSettings(playerId, settings)) {
        io.to(room.id).emit('room:updated', { state: room.getGameState() });
      }
    });

    // 8. Start Game
    socket.on('room:start', () => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      const check = room.canStartGame(playerId);
      if (!check.canStart) {
        return socket.emit('room:error', { message: check.error || 'Cannot start game' });
      }

      room.startGame();
      const state = room.getGameState();
      io.to(room.id).emit('game:started', { state });
    });

    // 9. Roll Dice
    socket.on('game:roll', () => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      const stateBefore = room.getGameState();
      const rollingPlayer = stateBefore.players[stateBefore.activePlayerIndex];

      const res = room.rollDice(playerId);
      if (!res.success) {
        return socket.emit('room:error', { message: res.error || 'Cannot roll dice' });
      }

      io.to(room.id).emit('game:dice-rolled', {
        playerColor: rollingPlayer.color,
        roll: res.roll!,
        legalTokens: res.legalTokens || [],
        hasMoves: !!res.hasMoves,
      });

      io.to(room.id).emit('game:state', { state: room.getGameState() });

      // Scenario A: Auto-move if:
      // 1) Exactly 1 legal token can move, OR
      // 2) All legal tokens share the identical current position (e.g. 2 tokens stacked on the same spot)
      let shouldAutoMove = false;
      let autoTokenId: number | undefined;

      if (res.hasMoves && res.legalTokens && res.legalTokens.length > 0) {
        if (res.legalTokens.length === 1) {
          shouldAutoMove = true;
          autoTokenId = res.legalTokens[0];
        } else {
          // Check if all eligible tokens are at the exact same step
          const eligibleTokens = rollingPlayer.tokens.filter((t) => res.legalTokens!.includes(t.id));
          if (eligibleTokens.length > 0) {
            const firstStep = eligibleTokens[0].step;
            const allSameSpot = eligibleTokens.every((t) => t.step === firstStep);
            if (allSameSpot) {
              shouldAutoMove = true;
              autoTokenId = eligibleTokens[0].id;
            }
          }
        }
      }

      if (shouldAutoMove && autoTokenId !== undefined) {
        room.scheduleAutoMove(playerId, autoTokenId, 500);
      }

      // Scenario B: No legal moves (or 3 sixes cancel) -> show rolled dice for 1.4s then advance turn
      if ((!res.hasMoves && res.roll !== 6) || res.turnCancelled) {
        room.scheduleAdvanceTurn(1400);
      }
    });

    // 10. Move Token
    socket.on('game:move', ({ tokenId }) => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      const res = room.moveToken(playerId, tokenId);
      if (!res.success) {
        return socket.emit('room:error', { message: res.error || 'Cannot move token' });
      }
    });

    // 11. Rematch
    socket.on('game:rematch', () => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;

      if (!room.triggerRematch(playerId)) {
        return socket.emit('room:error', { message: 'Only host can start a rematch' });
      }
    });

    // 12. Emoji Reactions (General or Targeted at a player)
    socket.on('game:reaction', ({ emoji, targetColor }) => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room, playerId } = context;
      const part = room.getParticipant(playerId);
      if (!part) return;

      io.to(room.id).emit('game:reaction', {
        playerId,
        playerName: part.player.name,
        playerColor: part.player.color,
        emoji,
        targetColor,
      });
    });

    // 13. Disconnect Handling
    socket.on('disconnect', () => {
      const context = roomManager.getRoomForSocket(socket.id);
      if (!context) return;
      const { room } = context;

      const player = room.setPlayerDisconnected(socket.id);
      if (player) {
        io.to(room.id).emit('player:disconnected', {
          playerId: player.id,
          color: player.color,
        });
        io.to(room.id).emit('room:updated', { state: room.getGameState() });
      }
    });
  });
}
