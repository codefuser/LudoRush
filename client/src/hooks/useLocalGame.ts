import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GameState,
  Player,
  PlayerColor,
  RoomSettings,
  PLAYER_COLORS,
  DEFAULT_ROOM_SETTINGS,
  LudoEngine,
} from '@ludo/shared';
import { sounds } from '../game/soundEffects.js';
import { chooseBestBotMove, BotDifficulty } from '../game/botAI.js';
import {
  PendingMoveAnimation,
  FloatingReaction,
  ReactionParticle,
} from './useMultiplayer.js';

export type LocalGameMode = 'bot' | 'local' | null;

export function useLocalGame() {
  const [mode, setMode] = useState<LocalGameMode>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMoveAnimation | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const engineRef = useRef<LudoEngine | null>(null);
  const rollLockRef = useRef(false);
  const difficultyRef = useRef<BotDifficulty>('medium');
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      clearTimeout(id);
    }
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const executeMove = useCallback((tokenId: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    const activeBefore = engine.getActivePlayer();
    const res = engine.moveToken(tokenId);
    if (!res.success) return;

    const finalState = engine.getState();
    setPendingMove({
      playerColor: activeBefore.color,
      tokenId: res.tokenId ?? tokenId,
      fromStep: res.fromStep ?? 0,
      toStep: res.toStep ?? 0,
      isCapture: !!res.isCapture,
      capturedColor: res.capturedColor,
      capturedTokenId: res.capturedTokenId,
      capturedFromStep: res.capturedFromStep,
      isFinished: !!res.isFinished,
      state: finalState,
    });
  }, []);

  const rollDice = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || rollLockRef.current) return;

    const activePlayer = engine.getActivePlayer();
    const res = engine.rollDice(activePlayer.id);
    if (!res.success || res.roll === undefined) return;

    rollLockRef.current = true;
    sounds.playDiceClick();
    sounds.playRoll();
    setIsRolling(true);
    setGameState(engine.getState());

    // Settle dice face after crisp 360ms spin
    scheduleTimeout(() => {
      setIsRolling(false);
    }, 360);

    // Scenario A: No legal moves (or 3 sixes cancel)
    if ((!res.hasMoves && res.roll !== 6) || res.turnCancelled) {
      scheduleTimeout(() => {
        if (!engineRef.current) return;
        engineRef.current.advanceTurn();
        rollLockRef.current = false;
        setGameState(engineRef.current.getState());
      }, 2200);
      return;
    }

    // Scenario B: Rolled a 6 with no legal moves -> hold 6 face clearly, then allow bonus roll
    if (!res.hasMoves && res.roll === 6) {
      scheduleTimeout(() => {
        if (!engineRef.current) return;
        engineRef.current.clearCurrentRoll();
        rollLockRef.current = false;
        setGameState(engineRef.current.getState());
      }, 1400);
      return;
    }

    // Scenario C: Has legal moves
    if (res.hasMoves && res.legalTokens && res.legalTokens.length > 0) {
      if (activePlayer.isBot) {
        // AI chooses smartest token after dice settles
        scheduleTimeout(() => {
          if (!engineRef.current) return;
          const curState = engineRef.current.getState();
          if (curState.awaitingMove) {
            const bestToken = chooseBestBotMove(curState, difficultyRef.current);
            executeMove(bestToken);
          }
        }, 950);
        return;
      }

      // Human auto-move when only 1 token or all legal tokens share identical position
      let autoTokenId: number | undefined;
      if (res.legalTokens.length === 1) {
        autoTokenId = res.legalTokens[0];
      } else {
        const eligibleTokens = activePlayer.tokens.filter((t) =>
          res.legalTokens!.includes(t.id)
        );
        if (eligibleTokens.length > 0) {
          const firstStep = eligibleTokens[0].step;
          if (eligibleTokens.every((t) => t.step === firstStep)) {
            autoTokenId = eligibleTokens[0].id;
          }
        }
      }

      if (autoTokenId !== undefined) {
        const targetId = autoTokenId;
        scheduleTimeout(() => {
          if (!engineRef.current) return;
          const curState = engineRef.current.getState();
          if (curState.awaitingMove && curState.legalTokenIndices.includes(targetId)) {
            executeMove(targetId);
          }
        }, 850);
      } else {
        // Unlock so manual token move proceeds cleanly
        rollLockRef.current = false;
      }
    }
  }, [executeMove, scheduleTimeout]);

  const moveToken = useCallback(
    (tokenId: number) => {
      const engine = engineRef.current;
      if (!engine || pendingMove) return;
      const active = engine.getActivePlayer();
      if (active.isBot) return;
      executeMove(tokenId);
    },
    [executeMove, pendingMove]
  );

  const onMoveAnimationComplete = useCallback((finalState: GameState) => {
    setPendingMove(null);
    setGameState(finalState);
    rollLockRef.current = false;
    if (finalState.status === 'FINISHED') {
      sounds.playWin();
    }
  }, []);

  // Automatically trigger Bot turn when active player is CPU
  useEffect(() => {
    if (mode !== 'bot' || !gameState || gameState.status !== 'PLAYING') return;
    if (isRolling || pendingMove || gameState.awaitingMove || gameState.currentRoll !== null) {
      return;
    }

    const active = gameState.players[gameState.activePlayerIndex];
    if (active?.isBot && !rollLockRef.current) {
      const t = scheduleTimeout(() => {
        rollDice();
      }, 650);
      return () => {
        clearTimeout(t);
        timersRef.current.delete(t);
      };
    }
  }, [mode, gameState, isRolling, pendingMove, rollDice, scheduleTimeout]);

  // Turn timer countdown when enabled in local/bot modes
  useEffect(() => {
    if (!gameState || gameState.status !== 'PLAYING') return;
    if (gameState.settings.turnTimerSeconds <= 0) return;
    if (isRolling || pendingMove) return;

    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const { expired } = engine.decrementTimer();
      setGameState(engine.getState());

      if (expired) {
        const cur = engine.getState();
        if (!cur.awaitingMove && cur.currentRoll === null) {
          rollDice();
        } else if (cur.awaitingMove && cur.legalTokenIndices.length > 0) {
          executeMove(cur.legalTokenIndices[0]);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.status, gameState?.turnVersion, isRolling, pendingMove, rollDice, executeMove]);

  const startBotGame = useCallback(
    (
      playerName: string,
      totalPlayers: 2 | 3 | 4,
      humanColor: PlayerColor = 'red',
      turnTimerSeconds = 30,
      difficulty: BotDifficulty = 'medium'
    ) => {
      clearAllTimers();
      rollLockRef.current = false;
      difficultyRef.current = difficulty;
      setIsRolling(false);
      setPendingMove(null);

      // Build seats in clockwise order starting with humanColor first, or standard Red->Green->Yellow->Blue order
      const otherColors = PLAYER_COLORS.filter((c) => c !== humanColor);
      const selectedColors: PlayerColor[] = [
        humanColor,
        ...otherColors.slice(0, totalPlayers - 1),
      ].sort((a, b) => PLAYER_COLORS.indexOf(a) - PLAYER_COLORS.indexOf(b));

      let botCount = 1;
      const players: Player[] = selectedColors.map((color) => {
        const isHuman = color === humanColor;
        return {
          id: isHuman ? 'local-human' : `bot-${color}`,
          name: isHuman ? playerName.trim() || 'You' : `Computer ${botCount++}`,
          color,
          isHost: isHuman,
          isReady: true,
          isConnected: true,
          isBot: !isHuman,
          tokens: [],
        };
      });

      const settings: RoomSettings = {
        ...DEFAULT_ROOM_SETTINGS,
        maxPlayers: totalPlayers,
        turnTimerSeconds,
      };

      const engine = new LudoEngine('local-bot', 'VS CPU', players, settings);
      engineRef.current = engine;
      const initialState = engine.getState();

      setMode('bot');
      setLocalPlayer(initialState.players.find((p) => p.id === 'local-human') || null);
      setGameState(initialState);
      sounds.playEnter();
    },
    [clearAllTimers]
  );

  const startLocalGame = useCallback(
    (
      playerNames: string[],
      totalPlayers: 2 | 3 | 4,
      turnTimerSeconds = 0,
      customColors?: PlayerColor[]
    ) => {
      clearAllTimers();
      rollLockRef.current = false;
      setIsRolling(false);
      setPendingMove(null);

      const selectedColors =
        customColors && customColors.length === totalPlayers
          ? customColors
          : PLAYER_COLORS.slice(0, totalPlayers);
      const players: Player[] = selectedColors.map((color, idx) => ({
        id: `local-p${idx + 1}`,
        name: (playerNames[idx] || '').trim() || `Player ${idx + 1}`,
        color,
        isHost: idx === 0,
        isReady: true,
        isConnected: true,
        isBot: false,
        tokens: [],
      }));

      const settings: RoomSettings = {
        ...DEFAULT_ROOM_SETTINGS,
        maxPlayers: totalPlayers,
        turnTimerSeconds,
      };

      const engine = new LudoEngine('local-pass', 'LOCAL', players, settings);
      engineRef.current = engine;
      const initialState = engine.getState();

      setMode('local');
      // Null localPlayer in Pass & Play so "(You)" isn't pinned to a single seat
      setLocalPlayer(null);
      setGameState(initialState);
      sounds.playEnter();
    },
    [clearAllTimers]
  );

  const triggerRematch = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    clearAllTimers();
    rollLockRef.current = false;
    setIsRolling(false);
    setPendingMove(null);
    engine.resetRematch();
    setGameState(engine.getState());
    sounds.playEnter();
  }, [clearAllTimers]);

  const exitLocalGame = useCallback(() => {
    clearAllTimers();
    rollLockRef.current = false;
    engineRef.current = null;
    setMode(null);
    setGameState(null);
    setLocalPlayer(null);
    setIsRolling(false);
    setPendingMove(null);
  }, [clearAllTimers]);

  const sendReaction = useCallback(
    (emoji: string, targetColor?: PlayerColor) => {
      if (!gameState) return;
      const active = gameState.players[gameState.activePlayerIndex];
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
        emoji,
        playerName: active?.name || 'Player',
        playerColor: active?.color || 'red',
        targetColor,
        particles,
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev.slice(-6), newReaction]);
      scheduleTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2800);
    },
    [gameState, scheduleTimeout]
  );

  return {
    mode,
    gameState,
    localPlayer,
    isRolling,
    pendingMove,
    reactions,
    startBotGame,
    startLocalGame,
    rollDice,
    moveToken,
    onMoveAnimationComplete,
    triggerRematch,
    exitLocalGame,
    sendReaction,
  };
}

