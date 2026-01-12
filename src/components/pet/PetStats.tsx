'use client';

import { ProgressBar } from '@/components/ui/ProgressBar';

interface PetStatsProps {
  hunger: number;
  mood: number;
  energy: number;
  reputation: number;
}

export function PetStats({ hunger, mood, energy, reputation }: PetStatsProps) {
  return (
    <div className="space-y-1">
      <ProgressBar label="Hunger" value={hunger} statType="hunger" />
      <ProgressBar label="Mood" value={mood} statType="mood" />
      <ProgressBar label="Energy" value={energy} statType="energy" />
      <ProgressBar label="Reputation" value={reputation} statType="reputation" />
    </div>
  );
}
