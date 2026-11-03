import React, { useMemo } from 'react';
import { useMultiplayer } from './hooks/useMultiplayer.js';
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
  const {
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
    clearError,
  } = useMultiplayer();

  const inviteCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  }, []);

  const activePlayer = gameState?.players[gameState.activePlayerIndex];
  const isMyTurn = localPlayer ? activePlayer?.id === localPlayer.id : false;
  const canRoll = isMyTurn && !gameState?.awaitingMove && gameState?.status === 'PLAYING';

  // Check which quadrant position is active:
  // Red = Top-Left, Green = Top-Right, Blue = Bottom-Left, Yellow = Bottom-Right
  const isRedActive = activePlayer?.color === 'red';
  const isGreenActive = activePlayer?.color === 'green';
  const isBlueActive = activePlayer?.color === 'blue';
  const isYellowActive = activePlayer?.color === 'yellow';

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-[#0B0F19] text-slate-100">
      {/* Background atmospheric ambient glows in 4 Ludo colors */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-red-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-emerald-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-blue-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-amber-500/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Global Header */}
      <Header
        roomCode={gameState?.roomCode}
        connected={connected}
        onLeave={gameState ? leaveRoom : undefined}
      />

      {/* Error Toast Notification */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-bounce">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-2 text-rose-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Reactions on Screen */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="floating-reaction"
            style={{
              left: `${35 + Math.random() * 30}%`,
              bottom: '25%',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 z-10 w-full">
        {!gameState ? (
          <HomeView
            initialRoomCode={inviteCode}
            connected={connected}
            onCreateRoom={(name, settings) => createRoom(name, settings)}
            onJoinRoom={(code, name) => joinRoom(code, name)}
          />
        ) : gameState.status === 'LOBBY' ? (
          <LobbyView
            gameState={gameState}
            localPlayer={localPlayer}
            onSelectColor={selectColor}
            onToggleReady={toggleReady}
            onUpdateSettings={updateSettings}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
          />
        ) : (
          /* Live Game Screen */
          <div className="w-full max-w-4xl flex flex-col items-center gap-2">
            {/* Top Status & Turn Bar */}
            <div
              style={{ minHeight: '40px' }}
              className="w-full max-w-[600px] glass-panel px-3 py-2 flex items-center justify-between gap-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  Current Turn:
                </span>
                <span
                  className="font-extrabold text-xs px-2.5 py-1 rounded-full text-white shadow-sm flex items-center gap-1.5"
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
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {isMyTurn ? 'YOUR TURN 🎲' : `${activePlayer?.name}'s Turn`}
                </span>
              </div>

              {/* Action Prompt / Guide */}
              <div className="text-xs text-slate-300 font-medium truncate text-right">
                {gameState.lastActionMessage || 'Game in progress...'}
              </div>
            </div>

            {/* Top Players Row (Red = Left, Green = Right) */}
            <div
              style={{ height: '44px', minHeight: '44px', maxHeight: '44px' }}
              className="w-full grid grid-cols-2 gap-2 max-w-[600px]"
            >
              <div className="h-full flex items-center">
                {gameState.players.find((p) => p.color === 'red') && (
                  <PlayerCard
                    player={gameState.players.find((p) => p.color === 'red')!}
                    isActive={activePlayer?.color === 'red'}
                    isLocal={localPlayer?.color === 'red'}
                    turnTimeRemaining={gameState.turnTimeRemaining}
                    maxTurnTime={gameState.settings.turnTimerSeconds}
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
                  />
                )}
              </div>
            </div>

            {/* TOP DICE TRAY (Fixed height 64px: Left = Above Red, Right = Above Green) */}
            <div
              style={{ height: '64px', minHeight: '64px', maxHeight: '64px' }}
              className="w-full max-w-[600px] flex items-center justify-between px-6"
            >
              {/* Left slot: Directly above Red quadrant */}
              <div className="w-[45%] flex items-center justify-center h-full">
                {isRedActive && activePlayer && (
                  <Dice
                    color="red"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={52}
                  />
                )}
              </div>

              {/* Right slot: Directly above Green quadrant */}
              <div className="w-[45%] flex items-center justify-center h-full">
                {isGreenActive && activePlayer && (
                  <Dice
                    color="green"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={52}
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
            />

            {/* BOTTOM DICE TRAY (Fixed height 64px: Left = Below Blue, Right = Below Yellow) */}
            <div
              style={{ height: '64px', minHeight: '64px', maxHeight: '64px' }}
              className="w-full max-w-[600px] flex items-center justify-between px-6"
            >
              {/* Left slot: Directly below Blue quadrant */}
              <div className="w-[45%] flex items-center justify-center h-full">
                {isBlueActive && activePlayer && (
                  <Dice
                    color="blue"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={52}
                  />
                )}
              </div>

              {/* Right slot: Directly below Yellow quadrant */}
              <div className="w-[45%] flex items-center justify-center h-full">
                {isYellowActive && activePlayer && (
                  <Dice
                    color="yellow"
                    value={gameState.currentRoll}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    onRoll={rollDice}
                    size={52}
                  />
                )}
              </div>
            </div>

            {/* Bottom Players Row (Blue = Left, Yellow = Right) */}
            <div
              style={{ height: '44px', minHeight: '44px', maxHeight: '44px' }}
              className="w-full grid grid-cols-2 gap-2 max-w-[600px]"
            >
              <div className="h-full flex items-center">
                {gameState.players.find((p) => p.color === 'blue') && (
                  <PlayerCard
                    player={gameState.players.find((p) => p.color === 'blue')!}
                    isActive={activePlayer?.color === 'blue'}
                    isLocal={localPlayer?.color === 'blue'}
                    turnTimeRemaining={gameState.turnTimeRemaining}
                    maxTurnTime={gameState.settings.turnTimerSeconds}
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
