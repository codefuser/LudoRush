import { useState, useCallback, useEffect } from 'react';
import { sounds } from '../game/soundEffects.js';

export type AvatarId = 'crown' | 'flame' | 'bolt' | 'star' | 'gem' | 'shield';

export interface PlayerProfile {
  name: string;
  avatar: AvatarId;
  soundEnabled: boolean;
  particlesEnabled: boolean;
  gamesPlayed: number;
  wins: number;
}

const PROFILE_STORAGE_KEY = 'ludo_rush_profile_v1';

const DEFAULT_PROFILE: PlayerProfile = {
  name: '',
  avatar: 'crown',
  soundEnabled: true,
  particlesEnabled: true,
  gamesPlayed: 0,
  wins: 0,
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

  const recordMatch = useCallback((won: boolean) => {
    setProfile((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      wins: prev.wins + (won ? 1 : 0),
    }));
  }, []);

  const resetStats = useCallback(() => {
    setProfile((prev) => ({ ...prev, gamesPlayed: 0, wins: 0 }));
  }, []);

  return {
    profile,
    updateName,
    updateAvatar,
    toggleSound,
    toggleParticles,
    recordMatch,
    resetStats,
  };
}

