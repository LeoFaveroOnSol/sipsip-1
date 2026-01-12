'use client';

import Link from 'next/link';
import { PetSprite } from '@/components/pet/PetSprite';
import { TRIBES } from '@/lib/constants';

interface PetCardProps {
  pet: {
    id: string;
    name: string;
    tribe: string;
    stage: string;
    isNeglected?: boolean;
  };
  showLink?: boolean;
}

export function PetCard({ pet, showLink = true }: PetCardProps) {
  const tribeInfo = TRIBES[pet.tribe as keyof typeof TRIBES];

  const tribeColors: Record<string, string> = {
    FOFO: 'bg-pink-50',
    CAOS: 'bg-zinc-900 text-white',
    CHAD: 'bg-stone-50',
    DEGEN: 'bg-emerald-950 text-emerald-400',
  };

  const content = (
    <div className={`
      border-4 border-black p-4
      shadow-[8px_8px_0px_rgba(0,0,0,1)]
      hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]
      hover:translate-x-1 hover:translate-y-1
      transition-all cursor-pointer
      ${tribeColors[pet.tribe] || 'bg-white'}
    `}>
      <div className="flex flex-col items-center gap-3">
        <PetSprite
          tribe={pet.tribe}
          stage={pet.stage}
          isNeglected={pet.isNeglected}
          size="sm"
        />

        <div className="text-center">
          <h3 className="font-black text-lg uppercase leading-none mb-2">
            {pet.name}
          </h3>
          <div className={`
            inline-flex items-center gap-1 px-2 py-1
            border-2 border-black
            font-mono text-[8px] uppercase
            ${pet.tribe === 'CAOS' ? 'bg-red-600' : 'bg-white'}
          `}>
            {tribeInfo?.emoji} {tribeInfo?.name}
          </div>
        </div>

        {pet.isNeglected && (
          <div className="bg-black text-white px-2 py-1 text-[8px] font-mono">
            MODO VERGONHA
          </div>
        )}
      </div>
    </div>
  );

  if (showLink) {
    return <Link href={`/pet/${pet.id}`}>{content}</Link>;
  }

  return content;
}
