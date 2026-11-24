import { useState, useCallback, useEffect } from 'react';
import { sounds } from '../game/soundEffects.js';

export type AvatarId = 'crown' | 'flame' | 'bolt' | 'star' | 'gem' | 'shield';
export type DiceSkin = 'neon' | 'gold' | 'wood';
export type BoardTheme = 'cyber' | 'luxury' | 'wood';

export interface LevelInfo {
  level: number;
  title: string;
  badge: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export function getLevelInfo(xp: number = 0): LevelInfo {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const nextLevelXp = 100;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  let title = 'Rookie';
  let badge = '🥉';
  if (level >= 15) {
    title = 'Grandmaster';
    badge = '👑';
  } else if (level >= 10) {
    title = 'Pro Master';
    badge = '💎';
  } else if (level >= 6) {
    title = 'Strategist';
    badge = '🥇';
  } else if (level >= 3) {
    title = 'Challenger';
    badge = '🥈';
  }

  return {
    level,
    title,
    badge,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
  };
}

export interface PlayerProfile {
  name: string;
  avatar: AvatarId;
  soundEnabled: boolean;
  particlesEnabled: boolean;
  gamesPlayed: number;
  wins: number;
  xp: number;
  diceSkin: DiceSkin;
  boardTheme: BoardTheme;
}

const PROFILE_STORAGE_KEY = 'ludo_rush_profile_v1';

const DEFAULT_PROFILE: PlayerProfile = {
  name: '',
  avatar: 'crown',
  soundEnabled: true,
  particlesEnabled: true,
  gamesPlayed: 0,
  wins: 0,
  xp: 0,
  diceSkin: 'neon',
  boardTheme: 'cyber',
};

function loadInitialProfile(): PlayerProfile {
  try {
    const legacyName = localStorage.getItem('ludo_player_name') || '';
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        name: parsed.name || legacyName,
        xp: typeof parsed.xp === 'number' ? parsed.xp : (parsed.wins || 0) * 150 + (parsed.gamesPlayed || 0) * 50,
        diceSkin: parsed.diceSkin || 'neon',
        boardTheme: parsed.boardTheme || 'cyber',
      };
    }
    return { ...DEFAULT_PROFILE, name: legacyName };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function usePlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfile>(loadInitialProfile);

  useEffect(() => {
    sounds.enabled = profile.soundEnabled;
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      if (profile.name) {
        localStorage.setItem('ludo_player_name', profile.name);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  const updateName = useCallback((name: string) => {
    setProfile((prev) => ({ ...prev, name }));
  }, []);

  const updateAvatar = useCallback((avatar: AvatarId) => {
    setProfile((prev) => ({ ...prev, avatar }));
  }, []);

  const toggleSound = useCallback(() => {
    setProfile((prev) => {
      const next = !prev.soundEnabled;
      sounds.enabled = next;
      return { ...prev, soundEnabled: next };
    });
  }, []);

  const toggleParticles = useCallback(() => {
    setProfile((prev) => ({ ...prev, particlesEnabled: !prev.particlesEnabled }));
  }, []);

  const updateDiceSkin = useCallback((diceSkin: DiceSkin) => {
    setProfile((prev) => ({ ...prev, diceSkin }));
  }, []);

  const updateBoardTheme = useCallback((boardTheme: BoardTheme) => {
    setProfile((prev) => ({ ...prev, boardTheme }));
  }, []);

  const recordMatch = useCallback((won: boolean) => {
    const gainedXp = won ? 150 : 50;
    setProfile((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      wins: prev.wins + (won ? 1 : 0),
      xp: (prev.xp || 0) + gainedXp,
    }));
  }, []);

  const resetStats = useCallback(() => {
    setProfile((prev) => ({ ...prev, gamesPlayed: 0, wins: 0, xp: 0 }));
  }, []);

  return {
    profile,
    updateName,
    updateAvatar,
    toggleSound,
    toggleParticles,
    updateDiceSkin,
    updateBoardTheme,
    recordMatch,
    resetStats,
  };
}

