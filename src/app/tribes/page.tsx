'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TribeCard } from '@/components/tribe/TribeCard';
import { Leaderboard } from '@/components/tribe/Leaderboard';
import { PetCard } from '@/components/pet/PetCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TRIBES } from '@/lib/constants';

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
          <p className="font-mono text-sm">Carregando tribos...</p>
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
            As Tribos
          </h1>
          <p className="font-mono text-sm opacity-60">
            Quatro linhagens. Uma guerra eterna. Escolha sabiamente.
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
              Ranking Semanal
            </h2>
            <Leaderboard entries={leaderboard} showLive />
            
            <Link href="/week" className="block mt-4">
              <Button variant="primary" fullWidth>
                VER DETALHES DA GUERRA →
              </Button>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6">
              Filosofias
            </h2>
            <div className="space-y-4">
              {[
                { tribe: 'FOFO', text: 'O amor é a arma mais destrutiva. Cuide com carinho, domine com ternura.' },
                { tribe: 'CAOS', text: 'Queime o roadmap. Brinque nas cinzas. A destruição criativa é o caminho.' },
                { tribe: 'CHAD', text: 'Silêncio. Trabalho. Resultados On-Chain. Menos conversa, mais ação.' },
                { tribe: 'CRINGE', text: 'Seja estranho. Seja livre. Seja meme. O cringe é a verdadeira arte.' },
              ].map((item) => (
                <Card key={item.tribe} size="sm" padding="sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{TRIBES[item.tribe as keyof typeof TRIBES]?.emoji}</span>
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
              <span>{TRIBES[selectedTribe as keyof typeof TRIBES]?.emoji}</span>
              Pets da tribo {selectedTribe}
            </h2>

            {isPetsLoading ? (
              <Card padding="lg" className="text-center">
                <p className="font-mono text-sm animate-pulse">Buscando pets...</p>
              </Card>
            ) : tribePets.length === 0 ? (
              <Card padding="lg" className="text-center">
                <p className="font-mono text-sm opacity-50">Nenhum pet nesta tribo ainda</p>
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
