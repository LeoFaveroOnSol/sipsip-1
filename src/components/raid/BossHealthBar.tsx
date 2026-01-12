'use client';

import { useEffect, useState } from 'react';

interface BossHealthBarProps {
  current: number;
  max: number;
  bossName: string;
  element?: string;
  animated?: boolean;
}

const ELEMENT_COLORS = {
  chaos: { primary: '#a855f7', secondary: '#c084fc' },
  fire: { primary: '#ef4444', secondary: '#f97316' },
  ice: { primary: '#06b6d4', secondary: '#22d3ee' },
  shadow: { primary: '#374151', secondary: '#6b7280' },
  nature: { primary: '#22c55e', secondary: '#4ade80' },
};

export default function BossHealthBar({
  current,
  max,
  bossName,
  element = 'chaos',
  animated = true,
}: BossHealthBarProps) {
  const [displayCurrent, setDisplayCurrent] = useState(current);

  // Animate HP changes
  useEffect(() => {
    if (!animated) {
      setDisplayCurrent(current);
      return;
    }

    const duration = 500;
    const startTime = Date.now();
    const startValue = displayCurrent;
    const diff = current - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayCurrent(startValue + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [current, animated]);

  const percentage = Math.max(0, Math.min(100, (displayCurrent / max) * 100));
  const colors = ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] || ELEMENT_COLORS.chaos;

  // Determine HP color based on percentage
  const getHpColor = () => {
    if (percentage > 60) return '#22c55e'; // Green
    if (percentage > 30) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toFixed(0);
  };

  return (
    <div className="w-full">
      {/* Boss Name & Element */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-mono text-white uppercase tracking-wider">
            {bossName}
          </h3>
          {element && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded uppercase"
              style={{
                backgroundColor: colors.primary + '30',
                color: colors.primary,
              }}
            >
              {element}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400 font-mono">
          {formatNumber(displayCurrent)} / {formatNumber(max)}
        </span>
      </div>

      {/* HP Bar Container */}
      <div className="relative h-8 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
        {/* Background glow effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at ${percentage}% 50%, ${colors.primary}, transparent 70%)`,
          }}
        />

        {/* HP Fill */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-300"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
          }}
        >
          {/* Animated shine */}
          {animated && percentage > 5 && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
            />
          )}
        </div>

        {/* Damage markers (visual segments) */}
        <div className="absolute inset-0 flex">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-gray-800/50 last:border-0"
            />
          ))}
        </div>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-lg font-bold font-mono drop-shadow-lg"
            style={{ color: getHpColor() }}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex justify-between mt-1 px-1">
        {[100, 75, 50, 25, 0].map((phase) => (
          <div
            key={phase}
            className={`text-xs ${
              percentage <= phase ? 'text-gray-400' : 'text-gray-700'
            }`}
          >
            {phase}%
          </div>
        ))}
      </div>
    </div>
  );
}
