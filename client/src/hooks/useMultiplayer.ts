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

export interface ReactionParticle {
  id: number;
  rx: number;
  ry: number;
  scale: number;
  rot: number;
  delay: number;
  size: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  playerName: string;
  playerColor: PlayerColor;
  targetColor?: PlayerColor;
  particles: ReactionParticle[];
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
  const [lastRoomCode, setLastRoomCode] = useState<string>('');

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const rollLockRef = useRef(false);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPlayerRef = useRef<Player | null>(null);

  const updateLocalPlayer = useCallback((player: Player | null) => {
    localPlayerRef.current = player;
    setLocalPlayer(player);
  }, []);

  // Initialize socket
  useEffect(() => {
    // Sanitize any environment variable or URL
    const rawEnv = import.meta.env.VITE_SERVER_URL;
    const cleanEnv = typeof rawEnv === 'string' ? rawEnv.trim() : '';

    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // On localhost, allow undefined if no VITE_SERVER_URL is provided (uses Vite proxy /api and /socket.io)
    // On production (e.g. Vercel deployment), always connect directly to the Render live backend URL!
    const serverUrl = isLocalhost
      ? (cleanEnv || undefined)
      : (cleanEnv || 'https://ludorush.onrender.com');

    console.log('[LudoRush] Connecting to multiplayer server:', serverUrl || 'local origin proxy');

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[LudoRush] Socket connected successfully! ID:', socket.id);
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
                  updateLocalPlayer(res.player);
                  setLastRoomCode(res.state.roomCode);
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

    socket.on('disconnect', (reason) => {
      console.warn('[LudoRush] Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[LudoRush] Socket connection error:', err.message);
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

    socket.on('room:joined', ({ roomId, roomCode, player, state }: { roomId: string; roomCode: string; player: Player; state: GameState }) => {
      setGameState(state);
      updateLocalPlayer(player);
      setLastRoomCode(roomCode || state.roomCode);
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
      const currentMe = localPlayerRef.current;
      if (currentMe) {
        const updatedMe = state.players.find((p: Player) => p.id === currentMe.id);
        if (updatedMe) updateLocalPlayer(updatedMe);
      }
    });

    socket.on('room:error', ({ message }: { message: string; code?: string }) => {
      setError(message);
      rollLockRef.current = false;
      setIsRolling(false);
      setTimeout(() => setError(null), 4000);
    });

    socket.on('game:started', ({ state }: { state: GameState }) => {
      setGameState(state);
      rollLockRef.current = false;
      sounds.playEnter();
    });

    socket.on('game:state', ({ state }: { state: GameState }) => {
      setGameState(state);
      rollLockRef.current = false;
      const currentMe = localPlayerRef.current;
      if (currentMe) {
        const updatedMe = state.players.find((p: Player) => p.id === currentMe.id);
        if (updatedMe) updateLocalPlayer(updatedMe);
      }
    });

    socket.on('game:dice-rolled', ({ roll, hasMoves }: { playerColor: PlayerColor; roll: number; legalTokens: number[]; hasMoves: boolean }) => {
      sounds.playRoll();
      setIsRolling(true);
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
      rollTimerRef.current = setTimeout(() => {
        rollTimerRef.current = null;
        setIsRolling(false);
      }, 360);
    });

    socket.on('game:move-accepted', (payload: any) => {
      setPendingMove(payload);
    });

    socket.on('game:finished', ({ state }: { winner: PlayerColor; standings: PlayerColor[]; state: GameState }) => {
      sounds.playWin();
      setGameState(state);
    });

    socket.on('game:turn-changed', ({ timeRemaining }: { activePlayerColor: PlayerColor; timeRemaining: number }) => {
      rollLockRef.current = false;
      setGameState((prev) => (prev ? { ...prev, turnTimeRemaining: timeRemaining } : prev));
    });

    socket.on('game:reaction', (reaction: { playerId: string; playerName: string; playerColor: PlayerColor; emoji: string; targetColor?: PlayerColor }) => {
      const count = 16;
      const particles: ReactionParticle[] = Array.from({ length: count }).map((_, i) => ({
        id: i,
        rx: (Math.random() - 0.5) * 220,
        ry: -(140 + Math.random() * 160),
        scale: 0.8 + Math.random() * 0.6,
        rot: (Math.random() - 0.5) * 60,
        delay: Math.round(i * 45 + Math.random() * 50),
        size: Math.round(24 + Math.random() * 14),
      }));

      const newReaction: FloatingReaction = {
        id: Math.random().toString(36).substring(2, 9),
        emoji: reaction.emoji,
        playerName: reaction.playerName,
        playerColor: reaction.playerColor,
        targetColor: reaction.targetColor,
        particles,
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev.slice(-6), newReaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2800);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Smooth local 1-second countdown tick for turn timer
  useEffect(() => {
    if (!gameState || gameState.status !== 'PLAYING') return;
    if (gameState.settings.turnTimerSeconds <= 0) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'PLAYING' || prev.turnTimeRemaining <= 0) return prev;
        return { ...prev, turnTimeRemaining: Math.max(0, prev.turnTimeRemaining - 1) };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.turnVersion, gameState?.status, gameState?.activePlayerIndex]);

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
    rollLockRef.current = false;
    setIsRolling(false);
    setPendingMove(null);
    setGameState(null);
    updateLocalPlayer(null);
  }, [updateLocalPlayer]);

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
    if (rollLockRef.current) return;
    if (socketRef.current) {
      rollLockRef.current = true;
      setIsRolling(true);
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

  const sendReaction = useCallback((emoji: string, targetColor?: PlayerColor) => {
    if (socketRef.current) {
      socketRef.current.emit('game:reaction', { emoji, targetColor });
    }
  }, []);

  const onMoveAnimationComplete = useCallback((finalState: GameState) => {
    setPendingMove(null);
    setGameState(finalState);
    rollLockRef.current = false;
    const currentMe = localPlayerRef.current;
    if (currentMe) {
      const updatedMe = finalState.players.find((p: Player) => p.id === currentMe.id);
      if (updatedMe) updateLocalPlayer(updatedMe);
    }
  }, [updateLocalPlayer]);

  return {
    connected,
    gameState,
    localPlayer,
    lastRoomCode,
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
