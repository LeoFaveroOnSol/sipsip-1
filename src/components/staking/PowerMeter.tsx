'use client';

import { useEffect, useState } from 'react';

interface PowerMeterProps {
  power: number;
  maxPower?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  tribe?: string;
}

const TRIBE_COLORS = {
  FOFO: { primary: '#f472b6', secondary: '#fce7f3' },    // Pink
  CAOS: { primary: '#f97316', secondary: '#fed7aa' },    // Orange
  CHAD: { primary: '#3b82f6', secondary: '#dbeafe' },    // Blue
  DEGEN: { primary: '#a855f7', secondary: '#f3e8ff' },   // Purple
};

export default function PowerMeter({
  power,
  maxPower = 1000,
  size = 'md',
  showLabel = true,
  animated = true,
  tribe = 'FOFO',
}: PowerMeterProps) {
  const [displayPower, setDisplayPower] = useState(0);

  // Animate power value
  useEffect(() => {
    if (!animated) {
      setDisplayPower(power);
      return;
    }

    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startValue = displayPower;
    const diff = power - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayPower(startValue + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [power, animated]);

  const percentage = Math.min((displayPower / maxPower) * 100, 100);
  const colors = TRIBE_COLORS[tribe as keyof typeof TRIBE_COLORS] || TRIBE_COLORS.FOFO;

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Calculate power tier
  const getPowerTier = () => {
    if (power >= 500) return { name: 'Legendary', color: '#fbbf24' };
    if (power >= 200) return { name: 'Epic', color: '#a855f7' };
    if (power >= 100) return { name: 'Rare', color: '#3b82f6' };
    if (power >= 50) return { name: 'Common', color: '#22c55e' };
    return { name: 'Novice', color: '#9ca3af' };
  };

  const tier = getPowerTier();

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className={`${textSizes[size]} font-mono text-gray-400 uppercase tracking-wider`}>
            Power
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`${textSizes[size]} font-bold px-2 py-0.5 rounded`}
              style={{ backgroundColor: tier.color + '20', color: tier.color }}
            >
              {tier.name}
            </span>
            <span className={`${textSizes[size]} font-mono text-white`}>
              {displayPower.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Power Bar */}
      <div
        className={`w-full ${sizeClasses[size]} bg-gray-800 rounded-full overflow-hidden border border-gray-700`}
      >
        <div
          className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
          }}
        >
          {/* Animated shine effect */}
          {animated && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Power segments indicator */}
      {size !== 'sm' && (
        <div className="flex justify-between mt-1 px-1">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div
              key={mark}
              className={`w-0.5 h-1 rounded-full ${
                percentage >= mark ? 'bg-gray-400' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
