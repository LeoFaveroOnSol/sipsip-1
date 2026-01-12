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
      <ProgressBar label="Fome" value={hunger} statType="hunger" />
      <ProgressBar label="Humor" value={mood} statType="mood" />
      <ProgressBar label="Energia" value={energy} statType="energy" />
      <ProgressBar label="Reputação" value={reputation} statType="reputation" />
    </div>
  );
}
