'use client';

import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/lib/utils';

interface TimerProps {
  targetDate: Date | string;
  onComplete?: () => void;
  className?: string;
}

export function Timer({ targetDate, onComplete, className = '' }: TimerProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState(formatTimeRemaining(target));
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now >= target) {
        setIsComplete(true);
        setTimeLeft('Disponível!');
        onComplete?.();
        clearInterval(interval);
      } else {
        setTimeLeft(formatTimeRemaining(target));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target, onComplete]);

  return (
    <span
      className={`font-mono ${isComplete ? 'text-green-500' : 'text-gray-400'} ${className}`}
    >
      {timeLeft}
    </span>
  );
}

