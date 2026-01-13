'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TribeCard } from '@/components/tribe/TribeCard';
import { Leaderboard } from '@/components/tribe/Leaderboard';
import { PetCard } from '@/components/pet/PetCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TRIBES } from '@/lib/constants';
import { TribeIcon } from '@/components/ui/TribeIcon';

interface PetData {
  id: string;
  name: string;
  tribe: string;
  stage: string;
  isNeglected: boolean;
}

export default function TribesPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<string | null>(null);
  const [tribePets, setTribePets] = useState<PetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPetsLoading, setIsPetsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tribes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTribe) {
      setIsPetsLoading(true);
      fetch(`/api/pets?tribe=${selectedTribe}&limit=12`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTribePets(data.data.pets);
          }
        })
        .finally(() => setIsPetsLoading(false));
    }
  }, [selectedTribe]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <p className="font-mono text-sm">Loading tribes...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase italic underline decoration-4 mb-2">
            The Tribes
          </h1>
          <p className="font-mono text-sm opacity-60">
            Four lineages. An eternal war. Choose wisely.
          </p>
        </div>

        {/* Tribe Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Object.entries(TRIBES).map(([key]) => {
            const entry = leaderboard.find((e) => e.tribe === key);
            return (
              <TribeCard
                key={key}
                tribe={key as keyof typeof TRIBES}
                score={entry?.total}
                position={entry?.position}
                isSelected={selectedTribe === key}
                onClick={() => setSelectedTribe(selectedTribe === key ? null : key)}
                size="lg"
              />
            );
          })}
        </div>

        {/* Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6">
              Weekly Ranking
            </h2>
            <Leaderboard entries={leaderboard} showLive />

            <Link href="/week" className="block mt-4">
              <Button variant="primary" fullWidth>
                VIEW WAR DETAILS →
              </Button>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6">
              Philosophies
            </h2>
            <div className="space-y-4">
              {[
                { tribe: 'FOFO', text: 'Love is the most destructive weapon. Care with affection, dominate with tenderness.' },
                { tribe: 'CAOS', text: 'Burn the roadmap. Play in the ashes. Creative destruction is the way.' },
                { tribe: 'CHAD', text: 'Silence. Work. On-Chain Results. Less talk, more action.' },
                { tribe: 'DEGEN', text: 'Be weird. Be free. Be meme. Degen is true art.' },
              ].map((item) => (
                <Card key={item.tribe} size="sm" padding="sm">
                  <div className="flex items-start gap-3">
                    <TribeIcon tribe={item.tribe} size={24} />
                    <div>
                      <h3 className="font-black uppercase text-sm">{item.tribe}</h3>
                      <p className="font-mono text-[10px] opacity-70 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Tribe Pets */}
        {selectedTribe && (
          <div>
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6 flex items-center gap-3">
              <TribeIcon tribe={selectedTribe} size={28} />
              {selectedTribe} Tribe Pets
            </h2>

            {isPetsLoading ? (
              <Card padding="lg" className="text-center">
                <p className="font-mono text-sm animate-pulse">Searching pets...</p>
              </Card>
            ) : tribePets.length === 0 ? (
              <Card padding="lg" className="text-center">
                <p className="font-mono text-sm opacity-50">No pets in this tribe yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tribePets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
