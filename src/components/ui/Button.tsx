'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-black uppercase tracking-widest
    border-4 border-black
    transition-all duration-100
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    default: 'bg-white text-black hover:bg-zinc-100',
    primary: 'bg-black text-white hover:bg-zinc-800',
    secondary: 'bg-zinc-100 text-black hover:bg-zinc-200',
    ghost: 'bg-transparent border-2 hover:bg-zinc-100',
  };

  const sizes = {
    sm: 'px-3 py-2 text-[9px] shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
    md: 'px-4 py-3 text-[10px] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1',
    lg: 'px-6 py-4 text-xs shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-0 hover:translate-y-0' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
