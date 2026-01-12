'use client';

import { ReactNode } from 'react';

interface TagProps {
  children: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  rotate?: number;
  variant?: 'warning' | 'info' | 'success';
}

export function Tag({ 
  children, 
  position = 'top-left',
  rotate = -3,
  variant = 'warning',
}: TagProps) {
  const positions = {
    'top-left': '-top-3 -left-3',
    'top-right': '-top-3 -right-3',
    'bottom-left': '-bottom-3 -left-3',
    'bottom-right': '-bottom-3 -right-3',
  };

  const variants = {
    warning: 'bg-yellow-400',
    info: 'bg-sky-400',
    success: 'bg-green-400',
  };

  return (
    <div 
      className={`
        absolute z-10
        px-3 py-1
        border-2 border-black
        font-black text-[10px] italic uppercase
        ${positions[position]}
        ${variants[variant]}
      `}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}

