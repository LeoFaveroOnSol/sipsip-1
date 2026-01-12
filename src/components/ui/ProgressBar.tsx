'use client';

import { 
  Utensils, 
  Gamepad2, 
  Zap, 
  Crown,
  LucideIcon 
} from 'lucide-react';

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue?: number;
  statType: 'hunger' | 'mood' | 'energy' | 'reputation';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STAT_CONFIG: Record<string, { icon: LucideIcon; colorClass: string }> = {
  hunger: { icon: Utensils, colorClass: 'bg-orange-500' },
  mood: { icon: Gamepad2, colorClass: 'bg-sky-400' },
  energy: { icon: Zap, colorClass: 'bg-yellow-400' },
  reputation: { icon: Crown, colorClass: 'bg-indigo-500' },
};

export function ProgressBar({ 
  label, 
  value, 
  maxValue = 100, 
  statType,
  showIcon = true,
  size = 'md'
}: ProgressBarProps) {
  const config = STAT_CONFIG[statType];
  const Icon = config.icon;
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">
          {showIcon && <Icon size={12} />}
          {label}
        </div>
        <span className="font-mono text-[10px]">{Math.floor(value)}%</span>
      </div>
      <div className={`${heights[size]} border-2 border-black bg-white p-[2px] shadow-[2px_2px_0px_rgba(0,0,0,1)]`}>
        <div 
          className={`h-full transition-all duration-500 ${config.colorClass}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
