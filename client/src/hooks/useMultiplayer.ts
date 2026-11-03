import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
  Player,
  PlayerColor,
  RoomSettings,
} from '@ludo/shared';
import { sounds } from '../game/soundEffects.js';

const SESSION_STORAGE_KEY = 'ludo_rush_session';

export interface FloatingReaction {
  id: string;
  emoji: string;
  playerName: string;
  playerColor: PlayerColor;
  timestamp: number;
}

export interface PendingMoveAnimation {
  playerColor: PlayerColor;
  tokenId: number;
  fromStep: number;
  toStep: number;
  isCapture: boolean;
  capturedColor?: PlayerColor;
  capturedTokenId?: number;
  capturedFromStep?: number;
  isFinished: boolean;
  state: GameState;
}

export function useMultiplayer() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMoveAnimation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // Initialize socket
  useEffect(() => {
    // If running in production (e.g. Vercel) and VITE_SERVER_URL is not set, fallback directly to Render production backend
    const serverUrl =
      import.meta.env.VITE_SERVER_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? 'https://ludorush.onrender.com'
        : undefined);

    console.log('[LudoRush] Connecting to multiplayer server:', serverUrl || 'local origin proxy');

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);

      // Attempt session recovery if we have stored credentials
      try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          if (session.roomId && session.playerId && session.sessionToken) {
            socket.emit(
              'session:reconnect',
              {
                roomId: session.roomId,
                playerId: session.playerId,
                sessionToken: session.sessionToken,
              },
              (res: { success: boolean; state?: GameState; player?: Player; error?: string }) => {
                if (res.success && res.state && res.player) {
                  setGameState(res.state);
                  setLocalPlayer(res.player);
                } else {
                  sessionStorage.removeItem(SESSION_STORAGE_KEY);
                }
              }
            );
          }
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Session init: save reconnect credentials
    socket.on('session:init', ({ playerId, sessionToken }: { playerId: string; sessionToken: string }) => {
      try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ ...existing, playerId, sessionToken })
        );
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('room:joined', ({ roomId, player, state }: { roomId: string; roomCode: string; player: Player; state: GameState }) => {
      setGameState(state);
      setLocalPlayer(player);
      setError(null);

      try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ ...existing, roomId, playerId: player.id })
        );
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('room:updated', ({ state }: { state: GameState }) => {
      setGameState(state);
      if (localPlayer) {
        const updatedMe = state.players.find((p: Player) => p.id === localPlayer.id);
        if (updatedMe) setLocalPlayer(updatedMe);
      }
    });

    socket.on('room:error', ({ message }: { message: string; code?: string }) => {
      setError(message);
      setTimeout(() => setError(null), 4000);
    });

    socket.on('game:started', ({ state }: { state: GameState }) => {
      setGameState(state);
      sounds.playEnter();
    });

    socket.on('game:state', ({ state }: { state: GameState }) => {
      setGameState(state);
      if (localPlayer) {
        const updatedMe = state.players.find((p: Player) => p.id === localPlayer.id);
        if (updatedMe) setLocalPlayer(updatedMe);
      }
    });

    socket.on('game:dice-rolled', ({ roll, hasMoves }: { playerColor: PlayerColor; roll: number; legalTokens: number[]; hasMoves: boolean }) => {
      sounds.playRoll();
      setIsRolling(true);
      setTimeout(() => {
        setIsRolling(false);
      }, 500);
    });

    socket.on('game:move-accepted', (payload: any) => {
      setPendingMove(payload);
    });

    socket.on('game:finished', ({ state }: { winner: PlayerColor; standings: PlayerColor[]; state: GameState }) => {
      sounds.playWin();
      setGameState(state);
    });

    socket.on('game:reaction', (reaction: { playerId: string; playerName: string; playerColor: PlayerColor; emoji: string }) => {
      const newReaction: FloatingReaction = {
        id: Math.random().toString(36).substring(2, 9),
        emoji: reaction.emoji,
        playerName: reaction.playerName,
        playerColor: reaction.playerColor,
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev.slice(-10), newReaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    (playerName: string, settings?: Partial<RoomSettings>) => {
      return new Promise<{ success: boolean; roomCode?: string; error?: string }>((resolve) => {
        if (!socketRef.current) return resolve({ success: false, error: 'Not connected' });
        socketRef.current.emit('room:create', { playerName, settings }, (res: { success: boolean; roomId?: string; roomCode?: string; error?: string }) => {
          if (!res.success) setError(res.error || 'Failed to create room');
          resolve(res);
        });
      });
    },
    []
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string, preferredColor?: PlayerColor) => {
      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        if (!socketRef.current) return resolve({ success: false, error: 'Not connected' });
        socketRef.current.emit(
          'room:join',
          { roomCode, playerName, preferredColor },
          (res: { success: boolean; roomId?: string; error?: string }) => {
            if (!res.success) setError(res.error || 'Failed to join room');
            resolve(res);
          }
        );
      });
    },
    []
  );

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:leave');
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setGameState(null);
    setLocalPlayer(null);
  }, []);

  const selectColor = useCallback((color: PlayerColor) => {
    if (socketRef.current) {
      socketRef.current.emit('room:select-color', { color });
    }
  }, []);

  const toggleReady = useCallback((isReady: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('room:ready', { isReady });
    }
  }, []);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    if (socketRef.current) {
      socketRef.current.emit('room:update-settings', { settings });
    }
  }, []);

  const startGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:start');
    }
  }, []);

  const rollDice = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('game:roll');
    }
  }, []);

  const moveToken = useCallback((tokenId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('game:move', { tokenId });
    }
  }, []);

  const triggerRematch = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('game:rematch');
    }
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('game:reaction', { emoji });
    }
  }, []);

  const onMoveAnimationComplete = useCallback((finalState: GameState) => {
    setPendingMove(null);
    setGameState(finalState);
    if (localPlayer) {
      const updatedMe = finalState.players.find((p: Player) => p.id === localPlayer.id);
      if (updatedMe) setLocalPlayer(updatedMe);
    }
  }, [localPlayer]);

  return {
    connected,
    gameState,
    localPlayer,
    isRolling,
    pendingMove,
    onMoveAnimationComplete,
    error,
    reactions,
    createRoom,
    joinRoom,
    leaveRoom,
    selectColor,
    toggleReady,
    updateSettings,
    startGame,
    rollDice,
    moveToken,
    triggerRematch,
    sendReaction,
    clearError: () => setError(null),
  };
}
