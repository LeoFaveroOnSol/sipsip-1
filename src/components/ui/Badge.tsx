'use client';

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'error' | 'tribe';
  tribe?: 'FOFO' | 'CAOS' | 'CHAD' | 'DEGEN';
  size?: 'sm' | 'md';
  animate?: boolean;
}

export function Badge({ 
  children, 
  variant = 'default',
  tribe,
  size = 'md',
  animate = false,
}: BadgeProps) {
  const variants = {
    default: 'bg-white text-black',
    warning: 'bg-yellow-400 text-black',
    success: 'bg-green-500 text-white',
    error: 'bg-red-600 text-white',
    tribe: '',
  };

  const tribeStyles = {
    FOFO: 'bg-pink-400 text-pink-900',
    CAOS: 'bg-red-600 text-white',
    CHAD: 'bg-emerald-500 text-emerald-950',
    DEGEN: 'bg-violet-500 text-white',
  };

  const sizes = {
    sm: 'px-2 py-1 text-[8px]',
    md: 'px-3 py-1 text-[10px]',
  };

  const colorStyle = variant === 'tribe' && tribe ? tribeStyles[tribe] : variants[variant];

  return (
    <span 
      className={`
        inline-flex items-center gap-1
        border-2 border-black
        font-mono font-bold uppercase tracking-wider
        ${colorStyle}
        ${sizes[size]}
        ${animate ? 'animate-pulse' : ''}
      `}
    >
      {children}
    </span>
  );
}

