import React from 'react';
import { Crown, Flame, Zap, Star, Gem, Shield } from 'lucide-react';
import { AvatarId } from '../../hooks/usePlayerProfile.js';

export interface AvatarMeta {
  id: AvatarId;
  label: string;
  gradient: string;
  glow: string;
}

export const AVATAR_OPTIONS: AvatarMeta[] = [
  {
    id: 'crown',
    label: 'Royalty',
    gradient: 'linear-gradient(135deg, #F59E0B, #EA580C)',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'flame',
    label: 'Blaze',
    gradient: 'linear-gradient(135deg, #F43F5E, #E11D48)',
    glow: 'rgba(244, 63, 94, 0.35)',
  },
  {
    id: 'bolt',
    label: 'Volt',
    gradient: 'linear-gradient(135deg, #22D3EE, #2563EB)',
    glow: 'rgba(34, 211, 238, 0.35)',
  },
  {
    id: 'star',
    label: 'Nova',
    gradient: 'linear-gradient(135deg, #A855F7, #6366F1)',
    glow: 'rgba(168, 85, 247, 0.35)',
  },
  {
    id: 'gem',
    label: 'Emerald',
    gradient: 'linear-gradient(135deg, #10B981, #0D9488)',
    glow: 'rgba(16, 185, 129, 0.35)',
  },
  {
    id: 'shield',
    label: 'Titan',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    glow: 'rgba(59, 130, 246, 0.35)',
  },
];

interface AvatarBadgeProps {
  avatar: AvatarId;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({ avatar, size = 'md' }) => {
  const meta = AVATAR_OPTIONS.find((item) => item.id === avatar) ?? AVATAR_OPTIONS[0];
  const dims =
    size === 'xs'
      ? { box: 26, icon: 14, radius: 8 }
      : size === 'sm'
      ? { box: 32, icon: 16, radius: 10 }
      : size === 'lg'
      ? { box: 64, icon: 30, radius: 20 }
      : { box: 42, icon: 20, radius: 13 };

  const renderIcon = () => {
    switch (meta.id) {
      case 'flame':
        return <Flame size={dims.icon} color="#FFFFFF" strokeWidth={2.4} />;
      case 'bolt':
        return <Zap size={dims.icon} color="#FFFFFF" strokeWidth={2.4} />;
      case 'star':
        return <Star size={dims.icon} color="#FFFFFF" strokeWidth={2.4} />;
      case 'gem':
        return <Gem size={dims.icon} color="#FFFFFF" strokeWidth={2.4} />;
      case 'shield':
        return <Shield size={dims.icon} color="#FFFFFF" strokeWidth={2.4} />;
      case 'crown':
      default:
        return <Crown size={dims.icon} color="#FFFFFF" strokeWidth={2.4} />;
    }
  };

  return (
    <div
      style={{
        width: dims.box,
        height: dims.box,
        borderRadius: dims.radius,
        background: meta.gradient,
        boxShadow: `0 6px 18px ${meta.glow}, inset 0 1px 1px rgba(255,255,255,0.35)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {renderIcon()}
    </div>
  );
};

