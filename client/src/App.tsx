import React, { useMemo } from 'react';
import { useMultiplayer } from './hooks/useMultiplayer.js';
import { useLocalGame } from './hooks/useLocalGame.js';
import { Header } from './components/common/Header.js';
import { HomeView } from './components/home/HomeView.js';
import { LobbyView } from './components/lobby/LobbyView.js';
import { LudoBoard } from './components/board/LudoBoard.js';
import { PlayerCard } from './components/players/PlayerCard.js';
import { Dice } from './components/dice/Dice.js';
import { GameOverModal } from './components/results/GameOverModal.js';
import { ReactionBar } from './components/common/ReactionBar.js';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const remote = useMultiplayer();
  const local = useLocalGame();

  const isLocalActive = local.mode !== null;
  const gameState = isLocalActive ? local.gameState : remote.gameState;
  const localPlayer = isLocalActive ? local.localPlayer : remote.localPlayer;
  const isRolling = isLocalActive ? local.isRolling : remote.isRolling;
  const pendingMove = isLocalActive ? local.pendingMove : remote.pendingMove;
  const reactions = isLocalActive ? local.reactions : remote.reactions;

  const rollDice = isLocalActive ? local.rollDice : remote.rollDice;
  const moveToken = isLocalActive ? local.moveToken : remote.moveToken;
  const onMoveAnimationComplete = isLocalActive
    ? local.onMoveAnimationComplete
    : remote.onMoveAnimationComplete;
  const triggerRematch = isLocalActive ? local.triggerRematch : remote.triggerRematch;
  const leaveRoom = isLocalActive ? local.exitLocalGame : remote.leaveRoom;
  const sendReaction = isLocalActive ? local.sendReaction : remote.sendReaction;

  const inviteCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  }, []);

  const activePlayer = gameState?.players[gameState.activePlayerIndex];
  const isMyTurn = isLocalActive
    ? Boolean(activePlayer && !activePlayer.isBot)
    : localPlayer
    ? activePlayer?.id === localPlayer.id
    : false;
  const canRoll = Boolean(
    isMyTurn &&
      !gameState?.awaitingMove &&
      gameState?.currentRoll === null &&
      gameState?.status === 'PLAYING' &&
      !isRolling
  );

  const modeLabel =
    local.mode === 'bot'
      ? 'vs Computer'
      : local.mode === 'local'
      ? 'Pass & Play'
      : undefined;

  // Check which quadrant position is active:
  // Red = Top-Left, Green = Top-Right, Blue = Bottom-Left, Yellow = Bottom-Right
  const isRedActive = activePlayer?.color === 'red';
  const isGreenActive = activePlayer?.color === 'green';
  const isBlueActive = activePlayer?.color === 'blue';
  const isYellowActive = activePlayer?.color === 'yellow';

  return (
    <div
      className={`flex flex-col justify-between relative overflow-x-hidden bg-[#0B0F19] text-slate-100 select-none ${
        gameState && gameState.status === 'PLAYING'
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden'
          : 'min-h-screen overflow-y-auto'
      }`}
    >
      {/* Background atmospheric ambient glows in 4 Ludo colors */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-red-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-emerald-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-blue-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-amber-500/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Global Header */}
      <Header
        roomCode={gameState?.roomCode}
        modeLabel={modeLabel}
        connected={remote.connected}
        onLeave={gameState ? leaveRoom : undefined}
      />

      {/* Error Toast Notification */}
      {remote.error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-bounce">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{remote.error}</span>
          <button
            onClick={remote.clearError}
            className="ml-2 text-rose-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Animated Multi-Particle Reaction Bursts */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => {
          const targetPos =
            r.targetColor === 'red'
              ? { left: '25%', top: '22%' }
              : r.targetColor === 'green'
              ? { left: '75%', top: '22%' }
              : r.targetColor === 'blue'
              ? { left: '25%', top: '78%' }
              : r.targetColor === 'yellow'
              ? { left: '75%', top: '78%' }
              : { left: '50%', bottom: '15%' };

          const animName =
            r.emoji === '🔥'
              ? 'reaction-fire-fountain'
              : r.emoji === '😂'
              ? 'reaction-laugh-fountain'
              : 'reaction-fountain-default';

          return (
            <div
              key={r.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={targetPos}
            >
              <div className="relative w-8 h-8 flex items-center justify-center pointer-events-none">
                {r.particles?.map((p) => (
                  <span
                    key={p.id}
                    className="reaction-particle"
                    style={{
                      '--rx': `${p.rx}px`,
                      '--rrot': `${p.rot}deg`,
                      animationName: animName,
                      animationDelay: `${p.delay}ms`,
                      fontSize: `${p.size}px`,
                    } as React.CSSProperties}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col items-center p-1 sm:p-2 z-10 w-full ${
          !gameState
            ? 'justify-start pt-2 overflow-y-auto'
            : gameState.status === 'PLAYING'
            ? 'justify-center overflow-hidden'
            : 'justify-center overflow-y-auto'
        }`}
      >
        {!gameState ? (
          <HomeView
            initialRoomCode={inviteCode}
            lastRoomCode={remote.lastRoomCode}
            connected={remote.connected}
            onCreateRoom={(name, settings) => remote.createRoom(name, settings)}
            onJoinRoom={(code, name) => remote.joinRoom(code, name)}
            onStartBotGame={local.startBotGame}
            onStartLocalGame={local.startLocalGame}
          />
        ) : gameState.status === 'LOBBY' ? (
          <LobbyView
            gameState={gameState}
            localPlayer={localPlayer}
            onSelectColor={remote.selectColor}
            onToggleReady={remote.toggleReady}
            onUpdateSettings={remote.updateSettings}
            onStartGame={remote.startGame}
            onLeaveRoom={leaveRoom}
          />
        ) : (
          /* Live Game Screen (Strict zero-scroll viewport fit) */
          <div className="w-full max-w-4xl flex flex-col items-center gap-1 sm:gap-1.5 h-full justify-center">
            {/* Top Status & Turn Bar */}
            <div
              style={{ minHeight: '36px', height: '36px' }}
              className="w-full max-w-[600px] glass-panel px-3 py-1 flex items-center justify-between gap-2 shrink-0"
            >
              {/* Left: Active turn indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="w-2 h-2 rounded-full animate-ping shrink-0"
                  style={{
                    backgroundColor:
                      activePlayer?.color === 'red'
                        ? '#F51F2B'
                        : activePlayer?.color === 'green'
                        ? '#08B84B'
                        : activePlayer?.color === 'yellow'
                        ? '#FFD817'
                        : '#087CF0',
                  }}
                />
                <span
                  className="font-black text-xs px-2.5 py-0.5 rounded-full text-white shadow-sm flex items-center gap-1 shrink-0 font-display tracking-wide"
                  style={{
                    backgroundColor:
                      activePlayer?.color === 'red'
                        ? '#F51F2B'
                        : activePlayer?.color === 'green'
                        ? '#08B84B'
                        : activePlayer?.color === 'yellow'
                        ? '#C9A700'
                        : '#087CF0',
                  }}
                >
                  {local.mode === 'local'
                    ? `${activePlayer?.name}'s Turn 🎲`
                    : isMyTurn
                    ? 'YOUR TURN 🎲'
                    : `${activePlayer?.name}'s Turn`}
                </span>
              </div>

              {/* Right: Last Action Message (clean badge) */}
              <div className="text-[11px] text-slate-300 font-semibold truncate bg-slate-900/60 px-2.5 py-0.5 rounded-lg border border-slate-700/40 text-right">
                {gameState.lastActionMessage || 'Game in progress...'}
              </div>
            </div>

            {/* Top Players Row (Red = Left, Green = Right) */}
            <div
              style={{ height: '42px', minHeight: '42px', maxHeight: '42px' }}
              className="w-full grid grid-cols-2 gap-2 max-w-[600px] shrink-0"
            >
              <div className="h-full flex items-center">
                {gameState.players.find((p) => p.color === 'red') && (
                  <PlayerCard
                    player={gameState.players.find((p) => p.color === 'red')!}
                    isActive={activePlayer?.color === 'red'}
                    isLocal={localPlayer?.color === 'red'}
                    turnTimeRemaining={gameState.turnTimeRemaining}
                    maxTurnTime={gameState.settings.turnTimerSeconds}
                    onReactToPlayer={(color, emoji) => sendReaction(emoji, color)}
                  />
                )}
              </div>
              <div className="h-full flex items-center">
                {gameState.players.find((p) => p.color === 'green') && (
                  <PlayerCard
                    player={gameState.players.find((p) => p.color === 'green')!}
                    isActive={activePlayer?.color === 'green'}
                    isLocal={localPlayer?.color === 'green'}
                    turnTimeRemaining={gameState.turnTimeRemaining}
                    maxTurnTime={gameState.settings.turnTimerSeconds}
                    onReactToPlayer={(color, emoji) => sendReaction(emoji, color)}
                  />
                )}
              </div>
            </div>

            {/* TOP DICE TRAY (Fixed height 56px: Left = Above Red, Right = Above Green) */}
            <div
              style={{ height: '56px', minHeight: '56px', maxHeight: '56px' }}
              className="w-full max-w-[600px] flex items-center justify-between px-3 sm:px-6 shrink-0"
            >
              {/* Left slot: Directly above Red quadrant */}
              <div className="w-[48%] flex items-center justify-start px-2 h-full">
                {isRedActive && activePlayer && (
                  <Dice
                    color="red"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={48}
                    align="left"
                  />
                )}
              </div>

              {/* Right slot: Directly above Green quadrant (Right aligned: [ROLL] [DICE]) */}
              <div className="w-[48%] flex items-center justify-end px-2 h-full">
                {isGreenActive && activePlayer && (
                  <Dice
                    color="green"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={48}
                    align="right"
                  />
                )}
              </div>
            </div>

            {/* Central 15x15 Ludo Board */}
            <LudoBoard
              gameState={gameState}
              localPlayer={localPlayer}
              pendingMove={pendingMove}
              onMoveAnimationComplete={onMoveAnimationComplete}
              onMoveToken={moveToken}
              allowLocalControl={isLocalActive}
            />

            {/* BOTTOM DICE TRAY (Fixed height 56px: Left = Below Blue, Right = Below Yellow) */}
            <div
              style={{ height: '56px', minHeight: '56px', maxHeight: '56px' }}
              className="w-full max-w-[600px] flex items-center justify-between px-3 sm:px-6 shrink-0"
            >
              {/* Left slot: Directly below Blue quadrant */}
              <div className="w-[48%] flex items-center justify-start px-2 h-full">
                {isBlueActive && activePlayer && (
                  <Dice
                    color="blue"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={48}
                    align="left"
                  />
                )}
              </div>

              {/* Right slot: Directly below Yellow quadrant (Right aligned: [ROLL] [DICE]) */}
              <div className="w-[48%] flex items-center justify-end px-2 h-full">
                {isYellowActive && activePlayer && (
                  <Dice
                    color="yellow"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={48}
                    align="right"
                  />
                )}
              </div>
            </div>

            {/* Bottom Players Row (Blue = Left, Yellow = Right) */}
            <div
              style={{ height: '42px', minHeight: '42px', maxHeight: '42px' }}
              className="w-full grid grid-cols-2 gap-2 max-w-[600px] shrink-0"
            >
              <div className="h-full flex items-center">
                {gameState.players.find((p) => p.color === 'blue') && (
                  <PlayerCard
                    player={gameState.players.find((p) => p.color === 'blue')!}
                    isActive={activePlayer?.color === 'blue'}
                    isLocal={localPlayer?.color === 'blue'}
                    turnTimeRemaining={gameState.turnTimeRemaining}
                    maxTurnTime={gameState.settings.turnTimerSeconds}
                    onReactToPlayer={(color, emoji) => sendReaction(emoji, color)}
                  />
                )}
              </div>
              <div className="h-full flex items-center">
                {gameState.players.find((p) => p.color === 'yellow') && (
                  <PlayerCard
                    player={gameState.players.find((p) => p.color === 'yellow')!}
                    isActive={activePlayer?.color === 'yellow'}
                    isLocal={localPlayer?.color === 'yellow'}
                    turnTimeRemaining={gameState.turnTimeRemaining}
                    maxTurnTime={gameState.settings.turnTimerSeconds}
                    onReactToPlayer={(color, emoji) => sendReaction(emoji, color)}
                  />
                )}
              </div>
            </div>

            {/* Emoji Reaction Bar */}
            <div className="mt-1">
              <ReactionBar onReact={sendReaction} />
            </div>

            {/* Game Over Modal Overlay */}
            {gameState.status === 'FINISHED' && (
              <GameOverModal
                gameState={gameState}
                localPlayer={localPlayer}
                allowRematch={isLocalActive}
                onRematch={triggerRematch}
                onReturnHome={leaveRoom}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-500 z-10">
        Ludo Rush • Minimal Real-Time Authoritative Multiplayer Ludo
      </footer>
    </div>
  );
};
