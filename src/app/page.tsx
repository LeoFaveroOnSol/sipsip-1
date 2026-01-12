'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/providers/AuthProvider';
import { useProvidersReady } from '@/components/providers/ClientProviders';
import { TribeCard } from '@/components/tribe/TribeCard';
import { Leaderboard } from '@/components/tribe/Leaderboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TRIBES } from '@/lib/constants';

// Import dinâmico do SafeWalletButton para garantir que só renderize com provider
const SafeWalletButton = dynamic(
  () => import('@/components/layout/SafeWalletButton').then((mod) => mod.SafeWalletButton),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-12 w-full bg-zinc-200 animate-pulse border-4 border-black" />
    )
  }
);

export default function HomePage() {
  const providersReady = useProvidersReady();
  const { isAuthenticated, pet } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/tribes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
        }
      })
      .catch(console.error);
  }, []);

  // Renderização do CTA baseada no estado
  const renderCTA = () => {
    // Enquanto providers não estão prontos, mostrar placeholder
    if (!providersReady) {
      return (
        <div className="h-12 w-full bg-zinc-200 animate-pulse border-4 border-black" />
      );
    }

    // Usuário autenticado com pet
    if (isAuthenticated && pet) {
      return (
        <Link href="/app" className="block">
          <Button variant="primary" size="lg" fullWidth>
            VER MEU PET →
          </Button>
        </Link>
      );
    }

    // Usuário autenticado sem pet
    if (isAuthenticated && !pet) {
      return (
        <Link href="/app" className="block">
          <Button variant="primary" size="lg" fullWidth>
            CRIAR MEU PET →
          </Button>
        </Link>
      );
    }

    // Não autenticado - mostrar botão de wallet
    return <SafeWalletButton />;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 lg:py-20 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <Card size="lg" padding="lg" className="relative">
            {/* Version Tag */}
            <div className="absolute -top-4 -left-4 bg-yellow-400 border-2 border-black px-4 py-1 font-black italic text-sm -rotate-3 z-10">
              v0.0.1-ALPHA
            </div>

            {/* Logo */}
            <h1 className="text-6xl font-black leading-none mb-4 tracking-tighter uppercase italic">
              SipSip <span className="text-2xl not-italic tracking-normal">🥚</span>
            </h1>

            {/* Description */}
            <p className="font-mono text-sm mb-8 border-l-4 border-black pl-4 py-2 bg-zinc-50">
              A primeira simulação de sobrevivência tribal na Solana. Sua carteira é seu destino.
            </p>

            {/* CTA */}
            {renderCTA()}

            {/* Tribe hints */}
            <div className="mt-8 flex justify-between gap-2">
              {Object.keys(TRIBES).map(t => (
                <div key={t} className="text-[10px] font-mono opacity-30 uppercase">{t}</div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Tribes Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black mb-8 uppercase italic underline decoration-4">
            Escolha sua linhagem:
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(TRIBES).map(([key]) => (
              <TribeCard
                key={key}
                tribe={key as keyof typeof TRIBES}
                size="md"
              />
            ))}
          </div>
        </div>
      </section>

      {/* War Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leaderboard */}
            <div>
              <h2 className="text-2xl font-black mb-6 uppercase italic border-b-4 border-black pb-2">
                Guerra das Tribos
              </h2>
              
              {leaderboard.length > 0 ? (
                <Leaderboard entries={leaderboard} showLive />
              ) : (
                <Card padding="lg">
                  <p className="font-mono text-sm opacity-50">Carregando ranking...</p>
                </Card>
              )}

              <Link href="/week" className="block mt-4">
                <Button variant="primary" fullWidth>
                  VER DETALHES →
                </Button>
              </Link>
            </div>

            {/* How to Play */}
            <div>
              <h2 className="text-2xl font-black mb-6 uppercase italic border-b-4 border-black pb-2">
                Como Jogar
              </h2>

              <div className="space-y-4">
                {[
                  { step: 1, title: 'CONECTE', desc: 'Use Phantom ou Solflare' },
                  { step: 2, title: 'ESCOLHA', desc: 'Selecione sua tribo' },
                  { step: 3, title: 'CUIDE', desc: 'Alimente, brinque, durma' },
                  { step: 4, title: 'DOMINE', desc: 'Vença a guerra semanal' },
                ].map((item) => (
                  <Card key={item.step} size="sm" padding="sm" className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-black uppercase text-sm">{item.title}</h3>
                      <p className="font-mono text-[10px] opacity-60">{item.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Council CTA */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card size="lg" padding="lg" className="text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-[10%] left-[5%] text-8xl font-black rotate-12">🏛️</div>
              <div className="absolute bottom-[20%] right-[10%] text-9xl font-black -rotate-6">VOTE</div>
            </div>
            
            <div className="relative">
              <h2 className="text-4xl font-black uppercase mb-4">
                Council de Governança
              </h2>
              <p className="font-mono text-sm mb-6 max-w-md mx-auto opacity-70">
                Vote nas propostas e ajude a moldar o futuro do jogo. Sua carteira, seu voto.
              </p>
              <Link href="/council">
                <Button variant="primary" size="lg">
                  PARTICIPAR →
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-[0.03] overflow-hidden">
        <div className="absolute top-[10%] left-[5%] text-[12rem] font-black rotate-12 tracking-tighter">SOLANA</div>
        <div className="absolute bottom-[20%] right-[5%] text-[14rem] font-black -rotate-6 tracking-tighter">SIPSIP</div>
      </div>
    </div>
  );
}
