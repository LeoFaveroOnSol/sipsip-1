'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PetSprite } from '@/components/pet/PetSprite';
import { PetStats } from '@/components/pet/PetStats';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TRIBES, PET_FORMS } from '@/lib/constants';
import { useAuth } from '@/components/providers/AuthProvider';
import { Share2, Eye, MessageSquare, Flame } from 'lucide-react';

interface PetData {
  id: string;
  name: string;
  tribe: string;
  stage: string;
  formId: string;
  careStreak: number;
  totalActions: number;
  isNeglected: boolean;
  computedStats: {
    hunger: number;
    mood: number;
    energy: number;
    reputation: number;
    isNeglected: boolean;
  };
  _count: {
    visits: number;
    reactions: number;
  };
  owner: {
    walletAddress: string;
  };
}

interface Reaction {
  type: string;
  _count: number;
}

const REACTION_TYPES = [
  { type: 'LOVE', emoji: '❤️', label: 'Amei' },
  { type: 'LOL', emoji: '😂', label: 'KKK' },
  { type: 'CRINGE', emoji: '😬', label: 'Cringe' },
  { type: 'CHAD', emoji: '💪', label: 'Chad' },
  { type: 'RIP', emoji: '💀', label: 'RIP' },
];

export default function PetProfilePage() {
  const params = useParams();
  const petId = params.id as string;
  const { isAuthenticated, user } = useAuth();

  const [pet, setPet] = useState<PetData | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reacting, setReacting] = useState(false);
  const [visited, setVisited] = useState(false);

  useEffect(() => {
    fetchPet();
    if (isAuthenticated) {
      registerVisit();
    }
  }, [petId, isAuthenticated]);

  const fetchPet = async () => {
    try {
      const res = await fetch(`/api/pet/${petId}`);
      const data = await res.json();

      if (data.success) {
        setPet(data.data.pet);
        setReactions(data.data.reactions || []);
      } else {
        setError(data.error || 'Pet não encontrado');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const registerVisit = async () => {
    if (visited) return;
    try {
      await fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPetId: petId }),
      });
      setVisited(true);
    } catch {
      // Ignore
    }
  };

  const handleReaction = async (type: string) => {
    if (!isAuthenticated) {
      alert('Conecte sua carteira para reagir');
      return;
    }

    setReacting(true);
    try {
      const res = await fetch('/api/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, type }),
      });

      if (res.ok) {
        fetchPet();
      }
    } catch {
      // Ignore
    } finally {
      setReacting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔍</div>
          <p className="font-mono text-sm">Buscando pet...</p>
        </Card>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center max-w-md">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="font-black text-xl uppercase mb-2">PET NÃO ENCONTRADO</h2>
          <p className="font-mono text-sm mb-6 opacity-60">{error}</p>
          <Link href="/tribes">
            <Button>EXPLORAR TRIBOS</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tribeInfo = TRIBES[pet.tribe as keyof typeof TRIBES];
  const form = PET_FORMS.find((f) => f.id === pet.formId);
  const isOwner = user?.walletPubkey === pet.owner?.walletAddress;

  const tribeBg: Record<string, string> = {
    FOFO: 'bg-pink-50',
    CAOS: 'bg-zinc-900',
    CHAD: 'bg-stone-100',
    DEGEN: 'bg-emerald-950',
  };

  return (
    <div className={`min-h-screen ${tribeBg[pet.tribe] || 'bg-[#f0f0f0]'} p-4 md:p-8 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto">
        {/* Owner Badge */}
        {isOwner && (
          <Card size="sm" padding="sm" className="mb-6 bg-yellow-100 text-center">
            <span className="font-black text-sm">👑 Este é seu pet!</span>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pet Card */}
          <Card size="lg" padding="lg" className="text-center relative overflow-hidden">
            {/* Scanlines */}
            <div className="scanlines" />
            
            {/* Grid */}
            <div className="grid-pattern" />

            <div className="relative flex flex-col items-center">
              <PetSprite
                tribe={pet.tribe}
                stage={pet.stage}
                isNeglected={pet.computedStats.isNeglected}
                size="xl"
                use3D={true}
              />

              <h1 className="font-black text-3xl uppercase mt-6 mb-3">{pet.name}</h1>

              <div className={`
                inline-flex items-center gap-2 px-4 py-2
                border-2 border-black font-mono text-xs uppercase
                ${pet.tribe === 'CAOS' ? 'bg-red-600 text-white' : 'bg-white'}
              `}>
                {tribeInfo?.emoji} {tribeInfo?.name}
              </div>

              {/* Form */}
              <Card size="sm" padding="sm" className="mt-6">
                <div className="font-mono text-[10px] opacity-50 mb-1">FORMA</div>
                <div className="font-black">{form?.name || 'Desconhecida'}</div>
                <div className="font-mono text-[10px] opacity-60">{form?.description}</div>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <Card size="sm" padding="sm" className="text-center">
                  <Flame size={16} className="mx-auto mb-1" />
                  <div className="font-black text-lg">{pet.careStreak}</div>
                  <div className="font-mono text-[8px] opacity-50">STREAK</div>
                </Card>
                <Card size="sm" padding="sm" className="text-center">
                  <MessageSquare size={16} className="mx-auto mb-1" />
                  <div className="font-black text-lg">{pet.totalActions}</div>
                  <div className="font-mono text-[8px] opacity-50">AÇÕES</div>
                </Card>
                <Card size="sm" padding="sm" className="text-center">
                  <Eye size={16} className="mx-auto mb-1" />
                  <div className="font-black text-lg">{pet._count?.visits || 0}</div>
                  <div className="font-mono text-[8px] opacity-50">VISITAS</div>
                </Card>
                <Card size="sm" padding="sm" className="text-center">
                  <span className="text-lg">💬</span>
                  <div className="font-black text-lg">{pet._count?.reactions || 0}</div>
                  <div className="font-mono text-[8px] opacity-50">REAÇÕES</div>
                </Card>
              </div>

              {/* Owner */}
              {pet.owner?.walletAddress && (
                <div className="mt-6 font-mono text-[10px] opacity-30">
                  OWNER: {pet.owner.walletAddress.slice(0, 8)}...{pet.owner.walletAddress.slice(-4)}
                </div>
              )}
            </div>
          </Card>

          {/* Stats & Reactions */}
          <div className="space-y-6">
            {/* Status */}
            <Card padding="md">
              <h2 className="font-black uppercase text-lg mb-4 border-b-2 border-black pb-2">
                📊 Status
              </h2>
              <PetStats
                hunger={pet.computedStats.hunger}
                mood={pet.computedStats.mood}
                energy={pet.computedStats.energy}
                reputation={pet.computedStats.reputation}
              />
            </Card>

            {/* Reactions */}
            <Card padding="md">
              <h2 className="font-black uppercase text-lg mb-4 border-b-2 border-black pb-2">
                💬 Reações
              </h2>

              {/* Current reactions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {reactions.length > 0 ? (
                  reactions.map((r) => {
                    const reactionInfo = REACTION_TYPES.find((t) => t.type === r.type);
                    return (
                      <Card key={r.type} size="sm" padding="sm" className="flex items-center gap-2">
                        <span className="text-xl">{reactionInfo?.emoji}</span>
                        <span className="font-black">{r._count}</span>
                      </Card>
                    );
                  })
                ) : (
                  <p className="font-mono text-sm opacity-50">Nenhuma reação ainda</p>
                )}
              </div>

              {/* React buttons */}
              {!isOwner && (
                <div className="border-t-2 border-black pt-4">
                  <p className="font-mono text-[10px] opacity-50 mb-3">Deixe sua reação:</p>
                  <div className="flex flex-wrap gap-2">
                    {REACTION_TYPES.map((r) => (
                      <button
                        key={r.type}
                        onClick={() => handleReaction(r.type)}
                        disabled={reacting || !isAuthenticated}
                        className="w-12 h-12 border-2 border-black bg-white text-xl
                                   shadow-[4px_4px_0px_rgba(0,0,0,1)]
                                   hover:shadow-none hover:translate-x-1 hover:translate-y-1
                                   transition-all disabled:opacity-50"
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                  {!isAuthenticated && (
                    <p className="font-mono text-[10px] opacity-30 mt-2">
                      🔒 Conecte sua carteira para reagir
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Share */}
            <Card padding="md" className="text-center">
              <h2 className="font-black uppercase text-lg mb-4">📤 Compartilhar</h2>
              <Button 
                fullWidth
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copiado!');
                }}
              >
                <Share2 size={16} />
                COPIAR LINK
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
