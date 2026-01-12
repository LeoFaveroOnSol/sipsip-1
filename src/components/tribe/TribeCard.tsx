'use client';

import { Heart, Skull, ShieldCheck, Ghost, LucideIcon } from 'lucide-react';
import { TRIBES } from '@/lib/constants';

interface TribeCardProps {
  tribe: keyof typeof TRIBES;
  score?: number;
  position?: number;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const TRIBE_ICONS: Record<string, LucideIcon> = {
  FOFO: Heart,
  CAOS: Skull,
  CHAD: ShieldCheck,
  DEGEN: Ghost,
};

const TRIBE_STYLES: Record<string, { bg: string; accent: string; text: string }> = {
  FOFO: { bg: 'bg-pink-50', accent: 'bg-pink-500', text: 'text-pink-900' },
  CAOS: { bg: 'bg-zinc-900', accent: 'bg-red-600', text: 'text-white' },
  CHAD: { bg: 'bg-stone-100', accent: 'bg-stone-600', text: 'text-stone-900' },
  DEGEN: { bg: 'bg-emerald-950', accent: 'bg-emerald-500', text: 'text-emerald-400' },
};

const TRIBE_FLAVORS: Record<string, string> = {
  FOFO: 'O amor é a arma mais destrutiva.',
  CAOS: 'Queime o roadmap. Brinque nas cinzas.',
  CHAD: 'Silêncio. Trabalho. Resultados On-Chain.',
  DEGEN: 'Charts go up. We follow. WAGMI.',
};

export function TribeCard({
  tribe,
  score,
  position,
  isSelected = false,
  onClick,
  size = 'md',
}: TribeCardProps) {
  const tribeInfo = TRIBES[tribe];
  const Icon = TRIBE_ICONS[tribe];
  const styles = TRIBE_STYLES[tribe];

  const sizes = {
    sm: { card: 'p-4', icon: 'w-8 h-8', title: 'text-xl', aspect: 'aspect-square' },
    md: { card: 'p-6', icon: 'w-10 h-10', title: 'text-2xl', aspect: 'aspect-[3/4]' },
    lg: { card: 'p-8', icon: 'w-12 h-12', title: 'text-3xl', aspect: 'aspect-[3/4]' },
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative ${sizes[size].aspect}
        border-4 border-black ${styles.bg}
        flex flex-col justify-between
        shadow-[8px_8px_0px_rgba(0,0,0,1)]
        hover:-translate-y-1 hover:-translate-x-1
        transition-all duration-100
        ${sizes[size].card}
        ${isSelected ? 'ring-4 ring-black ring-offset-2' : ''}
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Position Badge */}
      {position !== undefined && position <= 3 && (
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center font-black text-sm">
          {position}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className={`${sizes[size].icon} border-2 border-black ${styles.accent} shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center`}>
          <Icon size={size === 'sm' ? 16 : 20} className="text-white" />
        </div>
        <span className="font-mono text-[10px] opacity-40">#0001</span>
      </div>

      {/* Content */}
      <div className="text-left mt-auto">
        <h3 className={`${sizes[size].title} font-black uppercase leading-none mb-2 ${styles.text}`}>
          {tribeInfo.name}
        </h3>
        {size !== 'sm' && (
          <p className="text-xs font-mono leading-tight opacity-70">
            {TRIBE_FLAVORS[tribe]}
          </p>
        )}
        {score !== undefined && (
          <div className="mt-3 font-mono text-sm font-bold">
            {score.toLocaleString()} pts
          </div>
        )}
      </div>

      {/* Hover line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black opacity-10 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
