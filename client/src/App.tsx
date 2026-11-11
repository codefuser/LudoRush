import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { useMultiplayer } from './hooks/useMultiplayer.js';
import { useLocalGame } from './hooks/useLocalGame.js';
import { usePlayerProfile } from './hooks/usePlayerProfile.js';
import { Header } from './components/common/Header.js';
import { SplashScreen } from './components/screens/SplashScreen.js';
import { HomeScreen } from './components/screens/HomeScreen.js';
import { OnlineHubScreen } from './components/screens/OnlineHubScreen.js';
import { CreateRoomScreen } from './components/screens/CreateRoomScreen.js';
import { JoinRoomScreen } from './components/screens/JoinRoomScreen.js';
import { VsComputerScreen } from './components/screens/VsComputerScreen.js';
import { PassAndPlayScreen } from './components/screens/PassAndPlayScreen.js';
import { LobbyView } from './components/lobby/LobbyView.js';
import { LudoBoard } from './components/board/LudoBoard.js';
import { PlayerCard } from './components/players/PlayerCard.js';
import { Dice } from './components/dice/Dice.js';
import { GameOverModal } from './components/results/GameOverModal.js';
import { ReactionBar } from './components/common/ReactionBar.js';
import { ProfileModal } from './components/modals/ProfileModal.js';
import { SettingsModal } from './components/modals/SettingsModal.js';

type AppScreen =
  | 'splash'
  | 'home'
  | 'online'
  | 'create-room'
  | 'join-room'
  | 'vs-computer'
  | 'pass-play';

const AMBIENT_PARTICLES = [
  { top: '12%', left: '8%', size: 6, color: '#22D3EE', delay: '0s' },
  { top: '24%', left: '88%', size: 5, color: '#A855F7', delay: '1.2s' },
  { top: '65%', left: '10%', size: 7, color: '#10B981', delay: '2.1s' },
  { top: '76%', left: '84%', size: 6, color: '#F59E0B', delay: '0.7s' },
  { top: '42%', left: '92%', size: 4, color: '#3B82F6', delay: '3.0s' },
  { top: '86%', left: '24%', size: 5, color: '#F43F5E', delay: '1.8s' },
];

export const App: React.FC = () => {
  const remote = useMultiplayer();
  const local = useLocalGame();
  const {
    profile,
    updateName,
    updateAvatar,
    toggleSound,
    toggleParticles,
    recordMatch,
    resetStats,
  } = usePlayerProfile();

  const inviteCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  }, []);

  const [screen, setScreen] = useState<AppScreen>(() =>
    inviteCode ? 'join-room' : 'splash'
  );
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [settingsModalMode, setSettingsModalMode] = useState<'closed' | 'settings' | 'rules'>(
    'closed'
  );

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
  const leaveRoomRaw = isLocalActive ? local.exitLocalGame : remote.leaveRoom;
  const sendReaction = isLocalActive ? local.sendReaction : remote.sendReaction;

  const handleLeaveToHome = useCallback(() => {
    leaveRoomRaw();
    setScreen('home');
    if (typeof window !== 'undefined' && window.location.search.includes('room=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [leaveRoomRaw]);

  const handleLogoClick = useCallback(() => {
    if (gameState) {
      handleLeaveToHome();
    } else if (screen !== 'splash') {
      setScreen('home');
    }
  }, [gameState, handleLeaveToHome, screen]);

  const handleSplashFinish = useCallback(() => {
    setScreen((prev) => (prev === 'splash' ? 'home' : prev));
  }, []);

  // Record finished match once per completion into local player profile stats
  const recordedFinishRef = useRef<boolean>(false);
  useEffect(() => {
    if (!gameState || gameState.status !== 'FINISHED') {
      recordedFinishRef.current = false;
      return;
    }
    if (!recordedFinishRef.current) {
      recordedFinishRef.current = true;
      const didWin = Boolean(localPlayer && gameState.winner === localPlayer.color);
      recordMatch(didWin);
    }
  }, [gameState, localPlayer, recordMatch]);

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
      ? 'VS COMPUTER'
      : local.mode === 'local'
      ? 'PASS & PLAY'
      : undefined;

  const isRedActive = activePlayer?.color === 'red';
  const isGreenActive = activePlayer?.color === 'green';
  const isBlueActive = activePlayer?.color === 'blue';
  const isYellowActive = activePlayer?.color === 'yellow';

  const isGameplay = Boolean(
    gameState && (gameState.status === 'PLAYING' || gameState.status === 'FINISHED')
  );

  const renderScreenContent = () => {
    if (gameState) {
      if (gameState.status === 'LOBBY') {
        return (
          <LobbyView
            gameState={gameState}
            localPlayer={localPlayer}
            onSelectColor={remote.selectColor}
            onToggleReady={remote.toggleReady}
            onUpdateSettings={remote.updateSettings}
            onStartGame={remote.startGame}
            onLeaveRoom={handleLeaveToHome}
          />
        );
      }

      /* Screen 9 & 10: Live Gameplay & Result Experience (coins/board 100% preserved) */
      return (
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

            {/* Right: Last Action Message */}
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

          {/* TOP DICE TRAY */}
          <div
            style={{ height: '56px', minHeight: '56px', maxHeight: '56px' }}
            className="w-full max-w-[600px] flex items-center justify-between px-3 sm:px-6 shrink-0"
          >
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

          {/* Central 15x15 Ludo Board (Tokens & Board internal code UNTOUCHED) */}
          <div className="lr-board-halo">
            <LudoBoard
              gameState={gameState}
              localPlayer={localPlayer}
              pendingMove={pendingMove}
              onMoveAnimationComplete={onMoveAnimationComplete}
              onMoveToken={moveToken}
              allowLocalControl={isLocalActive}
            />
          </div>

          {/* BOTTOM DICE TRAY */}
          <div
            style={{ height: '56px', minHeight: '56px', maxHeight: '56px' }}
            className="w-full max-w-[600px] flex items-center justify-between px-3 sm:px-6 shrink-0"
          >
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

          {/* Screen 10: Victory / Result Modal */}
          {gameState.status === 'FINISHED' && (
            <GameOverModal
              gameState={gameState}
              localPlayer={localPlayer}
              allowRematch={isLocalActive}
              onRematch={triggerRematch}
              onReturnHome={handleLeaveToHome}
            />
          )}
        </div>
      );
    }

    /* Screens 2–7 Navigation */
    switch (screen) {
      case 'online':
        return (
          <OnlineHubScreen
            connected={remote.connected}
            onBack={() => setScreen('home')}
            onCreateRoom={() => setScreen('create-room')}
            onJoinRoom={() => setScreen('join-room')}
          />
        );
      case 'create-room':
        return (
          <CreateRoomScreen
            defaultName={profile.name}
            onNamePersist={updateName}
            onBack={() => setScreen('online')}
            onCreateRoom={(name, settings) => remote.createRoom(name, settings)}
          />
        );
      case 'join-room':
        return (
          <JoinRoomScreen
            defaultName={profile.name}
            initialRoomCode={inviteCode || remote.lastRoomCode}
            onNamePersist={updateName}
            onBack={() => setScreen('online')}
            onJoinRoom={(code, name) => remote.joinRoom(code, name)}
          />
        );
      case 'vs-computer':
        return (
          <VsComputerScreen
            defaultName={profile.name}
            onNamePersist={updateName}
            onBack={() => setScreen('home')}
            onStartBotGame={local.startBotGame}
          />
        );
      case 'pass-play':
        return (
          <PassAndPlayScreen
            defaultFirstPlayerName={profile.name}
            onBack={() => setScreen('home')}
            onStartLocalGame={local.startLocalGame}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            profile={profile}
            connected={remote.connected}
            onSelectOnline={() => setScreen('online')}
            onSelectVsComputer={() => setScreen('vs-computer')}
            onSelectPassAndPlay={() => setScreen('pass-play')}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenRules={() => setSettingsModalMode('rules')}
          />
        );
    }
  };

  return (
    <div className={`lr-app-shell ${isGameplay ? 'is-gameplay' : ''}`}>
      {/* Screen 1: Splash Screen */}
      {screen === 'splash' && !gameState && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {/* Ambient Atmospheric Grid & Particles */}
      {profile.particlesEnabled && (
        <>
          <div className="lr-ambient-grid" />
          <div className="lr-particles">
            {AMBIENT_PARTICLES.map((p, idx) => (
              <span
                key={idx}
                className="lr-particle-dot"
                style={{
                  top: p.top,
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  boxShadow: `0 0 18px ${p.color}`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Persistent Gaming Header */}
      <Header
        roomCode={gameState?.roomCode}
        modeLabel={modeLabel}
        connected={remote.connected}
        isInGame={Boolean(gameState)}
        profile={profile}
        onToggleSound={toggleSound}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenSettings={() => setSettingsModalMode('settings')}
        onLogoClick={handleLogoClick}
        onLeave={gameState ? handleLeaveToHome : undefined}
      />

      {/* Global Error Toast */}
      {remote.error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-bounce">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{remote.error}</span>
          <button
            type="button"
            onClick={remote.clearError}
            className="ml-2 text-rose-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Multi-Particle Reaction Fountain */}
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
                    style={
                      {
                        '--rx': `${p.rx}px`,
                        '--rrot': `${p.rot}deg`,
                        animationName: animName,
                        animationDelay: `${p.delay}ms`,
                        fontSize: `${p.size}px`,
                      } as React.CSSProperties
                    }
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Stage */}
      <main className={`lr-main-stage ${isGameplay ? 'is-gameplay' : ''}`}>
        {renderScreenContent()}
      </main>

      {/* Footer (hidden on zero-scroll gameplay screen so viewport stays uncluttered) */}
      {!isGameplay && (
        <footer className="lr-footer">
          Ludo Rush • Real-Time Authoritative Multiplayer Arena
        </footer>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onUpdateName={updateName}
          onUpdateAvatar={updateAvatar}
          onResetStats={resetStats}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Settings & Rules Modal */}
      {settingsModalMode !== 'closed' && (
        <SettingsModal
          profile={profile}
          onToggleSound={toggleSound}
          onToggleParticles={toggleParticles}
          initialShowRules={settingsModalMode === 'rules'}
          onClose={() => setSettingsModalMode('closed')}
        />
      )}
    </div>
  );
};
