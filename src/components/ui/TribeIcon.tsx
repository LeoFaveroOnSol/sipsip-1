'use client';

import { Heart, Flame, Shield, Zap, LucideIcon } from 'lucide-react';

export const TRIBE_ICONS: Record<string, LucideIcon> = {
  FOFO: Heart,
  CAOS: Flame,
  CHAD: Shield,
  DEGEN: Zap,
};

interface TribeIconProps {
  tribe: string;
  size?: number;
  className?: string;
}

export function TribeIcon({ tribe, size = 20, className = '' }: TribeIconProps) {
  const Icon = TRIBE_ICONS[tribe] || Zap;
  return <Icon size={size} className={className} />;
}

// For API responses where we can't use React components
export function getTribeIconName(tribe: string): string {
  const icons: Record<string, string> = {
    FOFO: 'heart',
    CAOS: 'flame',
    CHAD: 'shield',
    DEGEN: 'zap',
  };
  return icons[tribe] || 'zap';
}
