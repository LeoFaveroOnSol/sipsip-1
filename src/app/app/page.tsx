'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { PetSprite } from '@/components/pet/PetSprite';
import { PetStats } from '@/components/pet/PetStats';
import { PetActions } from '@/components/pet/PetActions';
import { TribeCard } from '@/components/tribe/TribeCard';
import { Leaderboard } from '@/components/tribe/Leaderboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Terminal } from '@/components/ui/Terminal';
import { TRIBES, PET_FORMS, Tribe } from '@/lib/constants';
import { AlertTriangle, Crown } from 'lucide-react';

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
}

const STAGES = ['Ovo', 'Bebê', 'Adolescente', 'Adulto', 'Lendário', 'Mítico'];

export default function AppPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshUser, user } = useAuth();
  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['Sistema inicializado...']);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Estado para criação
  const [newPetName, setNewPetName] = useState('');
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const fetchPet = useCallback(async () => {
    try {
      const res = await fetch('/api/pet');
      const data = await res.json();

      if (data.success) {
        setPet(data.data);
        addLog('Dados do pet sincronizados.');
      } else if (res.status === 404) {
        setPet(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/tribes');
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.data.leaderboard);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    if (isAuthenticated) {
      fetchPet();
      fetchLeaderboard();
    }
  }, [isAuthenticated, authLoading, router, fetchPet, fetchLeaderboard]);

  const handleCreatePet = async () => {
    if (!newPetName.trim() || !selectedTribe) {
      setCreateError('Preencha o nome e escolha uma tribo');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPetName.trim(),
          tribe: selectedTribe,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addLog(`Pet "${newPetName}" criado com sucesso!`);
        await refreshUser();
        await fetchPet();
      } else {
        setCreateError(data.error);
      }
    } catch {
      setCreateError('Erro de conexão');
    } finally {
      setIsCreating(false);
    }
  };

  const handleActionComplete = () => {
    fetchPet();
    addLog('Ação executada com sucesso.');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🥚</div>
          <p className="font-mono text-sm">Inicializando protocolo...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="font-black text-xl uppercase mb-2">ERRO</h2>
          <p className="font-mono text-sm mb-6">{error}</p>
          <Button onClick={fetchPet}>TENTAR NOVAMENTE</Button>
        </Card>
      </div>
    );
  }

  // Tela de criação de pet
  if (!pet) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <h2 className="text-4xl font-black mb-8 uppercase italic underline decoration-4">
            Escolha sua linhagem:
          </h2>

          {createError && (
            <Card size="sm" padding="sm" className="mb-6 bg-red-100 border-red-600">
              <p className="font-mono text-sm text-red-800">{`> ERRO: ${createError}`}</p>
            </Card>
          )}

          {/* Nome */}
          <Card padding="md" className="mb-6">
            <label className="block font-black text-xs uppercase tracking-widest mb-2">
              Nome do Pet
            </label>
            <input
              type="text"
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="Digite o nome..."
              maxLength={20}
              className="brutal-input"
            />
            <p className="text-[10px] font-mono text-right mt-1 opacity-50">
              {newPetName.length}/20
            </p>
          </Card>

          {/* Tribos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(TRIBES).map(([key]) => (
              <TribeCard
                key={key}
                tribe={key as keyof typeof TRIBES}
                isSelected={selectedTribe === key}
                onClick={() => setSelectedTribe(key as Tribe)}
                size="md"
              />
            ))}
          </div>

          {/* Criar */}
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreatePet}
              disabled={!newPetName.trim() || !selectedTribe || isCreating}
            >
              {isCreating ? 'CRIANDO...' : '🥚 CHOCAR MEU PET'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard do pet - Layout 3-6-3
  const tribeInfo = TRIBES[pet.tribe as keyof typeof TRIBES];
  const form = PET_FORMS.find((f) => f.id === pet.formId);
  const stageIndex = ['EGG', 'BABY', 'TEEN', 'ADULT', 'LEGENDARY'].indexOf(pet.stage);

  const tribeBg: Record<string, string> = {
    FOFO: 'bg-pink-50',
    CAOS: 'bg-zinc-900',
    CHAD: 'bg-stone-100',
    CRINGE: 'bg-violet-50',
  };

  return (
    <div className={`min-h-screen ${tribeBg[pet.tribe] || 'bg-[#f0f0f0]'} p-4 md:p-8 transition-colors duration-1000`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: PERFIL E STATUS */}
        <div className="lg:col-span-3 space-y-6">
          {/* Perfil */}
          <Card padding="md">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 border-2 border-black flex items-center justify-center ${pet.tribe === 'FOFO' ? 'bg-pink-500' : pet.tribe === 'CAOS' ? 'bg-red-600' : pet.tribe === 'CHAD' ? 'bg-emerald-500' : 'bg-violet-500'}`}>
                <span className="text-xl">{tribeInfo?.emoji}</span>
              </div>
              <div>
                <h4 className="font-black text-xl leading-none uppercase">{pet.name}</h4>
                <p className="text-[10px] font-mono uppercase opacity-50 italic">
                  {tribeInfo?.name} TRIBE MEMBER
                </p>
              </div>
            </div>
            <div className="bg-black text-white p-2 font-mono text-[10px] mb-2">
              WALLET: {user?.walletPubkey?.slice(0, 6)}...{user?.walletPubkey?.slice(-4)}
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs font-black uppercase">Care Streak</div>
              <div className="font-mono">{pet.careStreak} 🔥</div>
            </div>
          </Card>

          {/* Status Bars */}
          <Card padding="md">
            <PetStats
              hunger={pet.computedStats.hunger}
              mood={pet.computedStats.mood}
              energy={pet.computedStats.energy}
              reputation={pet.computedStats.reputation}
            />
          </Card>

          {/* Council Alert */}
          <div className="border-2 border-black p-3 bg-yellow-400 font-black text-xs uppercase flex items-center gap-3 animate-pulse">
            <AlertTriangle size={16} />
            Council Vote Open
          </div>
        </div>

        {/* COLUNA CENTRAL: O PET */}
        <div className="lg:col-span-6 space-y-6">
          {/* Alerta de negligência */}
          {pet.computedStats.isNeglected && (
            <Card padding="sm" className="bg-red-100 border-red-600">
              <div className="flex items-center gap-3">
                <span className="text-2xl">😢</span>
                <div>
                  <h3 className="font-black uppercase text-red-800">MODO VERGONHA!</h3>
                  <p className="text-[10px] font-mono text-red-700">
                    Seu pet foi negligenciado. Execute ações para recuperá-lo!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Display do Pet */}
          <Card size="lg" padding="md" className="relative overflow-hidden">
            {/* Scanlines */}
            <div className="scanlines" />

            {/* Pet Viewport */}
            <div className="aspect-square bg-zinc-100 border-4 border-black relative flex items-center justify-center overflow-hidden">
              {/* Grid Background */}
              <div className="grid-pattern" />

              {/* Pet */}
              <PetSprite
                tribe={pet.tribe}
                stage={pet.stage}
                isNeglected={pet.computedStats.isNeglected}
                size="xl"
              />

              {/* Level Ticket */}
              <div className="absolute bottom-4 right-4 bg-white border-2 border-black p-2 font-black text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                LEVEL: {stageIndex + 1}
              </div>

              {/* Debug info */}
              <div className="absolute top-4 left-4 font-mono text-[9px] opacity-30">
                SIPSIP_CORE_v1.0.4<br/>
                FORM: {pet.formId}
              </div>
            </div>

            {/* Barra de evolução */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2 font-black text-[10px] uppercase">
                <span>Evolução: {STAGES[stageIndex] || 'Ovo'}</span>
                <span>XP: {pet.totalActions * 10}/1000</span>
              </div>
              <div className="h-2 bg-zinc-200 border border-black overflow-hidden">
                <div 
                  className="h-full bg-black transition-all"
                  style={{ width: `${Math.min(100, (pet.totalActions * 10) / 10)}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Ações */}
          <PetActions onActionComplete={handleActionComplete} />
        </div>

        {/* COLUNA DIREITA: LOGS E RANKING */}
        <div className="lg:col-span-3 space-y-6">
          {/* Terminal Logs */}
          <div className="h-48">
            <Terminal logs={logs} />
          </div>

          {/* Tribe War */}
          {leaderboard.length > 0 && (
            <Leaderboard entries={leaderboard} title="Tribe War Status" showLive />
          )}

          {/* Utility buttons */}
          <div className="flex gap-2">
            <Link href={`/pet/${pet.id}`} className="flex-1">
              <Button fullWidth size="sm">
                PERFIL PÚBLICO
              </Button>
            </Link>
            <Link href="/week" className="flex-1">
              <Button fullWidth size="sm">
                GUERRA →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
