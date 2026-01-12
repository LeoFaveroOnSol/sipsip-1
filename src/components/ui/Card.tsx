'use client';

import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  size = 'md',
  hover = false,
  padding = 'md',
  className = '',
  ...props 
}: CardProps) {
  const sizes = {
    sm: 'border-2 shadow-[4px_4px_0px_rgba(0,0,0,1)]',
    md: 'border-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]',
    lg: 'border-[6px] shadow-[16px_16px_0px_rgba(0,0,0,1)]',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverStyles = hover 
    ? 'transition-all duration-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 cursor-pointer' 
    : '';

  return (
    <div
      className={`
        bg-white border-black
        ${sizes[size]}
        ${paddings[padding]}
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
