'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Pet3D } from '@/components/pet/Pet3D';
import { PetStats } from '@/components/pet/PetStats';
import { PetActions } from '@/components/pet/PetActions';
import { TokenFeeding } from '@/components/pet/TokenFeeding';
import { PetSkills } from '@/components/pet/PetSkills';
import { TribeCard } from '@/components/tribe/TribeCard';
import { Leaderboard } from '@/components/tribe/Leaderboard';
import { TribeChat } from '@/components/social/TribeChat';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Terminal } from '@/components/ui/Terminal';
import { TRIBES, PET_FORMS, Tribe } from '@/lib/constants';
import { PetState } from '@/lib/pet-system-3d';
import { AlertTriangle, Flame } from 'lucide-react';
import { TribeIcon } from '@/components/ui/TribeIcon';

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
  cooldowns?: Record<string, string | null>;
}

const STAGES = ['Egg', 'Baby', 'Teen', 'Adult', 'Legendary', 'Mythic'];

export default function AppPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshUser, user } = useAuth();
  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['System initialized...']);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // State for creation
  const [newPetName, setNewPetName] = useState('');
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // State for 3D pet animation
  const [petState, setPetState] = useState<PetState>('idle');

  // State for staking/power
  const [currentPower, setCurrentPower] = useState(0);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const fetchPet = useCallback(async () => {
    try {
      const res = await fetch('/api/pet');
      const data = await res.json();

      if (data.success) {
        setPet(data.data);
        addLog('Pet data synchronized.');
      } else if (res.status === 404) {
        setPet(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Connection error');
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

  const fetchPower = useCallback(async () => {
    try {
      const res = await fetch('/api/staking/status');
      const data = await res.json();
      if (data.success) {
        setCurrentPower(data.data.stake?.power || 0);
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
      fetchPower();
    }
  }, [isAuthenticated, authLoading, router, fetchPet, fetchLeaderboard, fetchPower]);

  const handleCreatePet = async () => {
    if (!newPetName.trim() || !selectedTribe) {
      setCreateError('Fill in the name and choose a tribe');
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
        addLog(`Pet "${newPetName}" created successfully!`);
        await refreshUser();
        await fetchPet();
      } else {
        setCreateError(data.error);
      }
    } catch {
      setCreateError('Connection error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleActionComplete = () => {
    fetchPet();
    fetchPower(); // Refresh power after token feeding
    addLog('Action executed successfully.');
    // Reset animation after a delay
    setTimeout(() => setPetState('idle'), 3000);
  };

  const handleActionStart = (action: string) => {
    // Map action to 3D animation state
    const actionToState: Record<string, PetState> = {
      feed: 'eat',
      play: 'happy',
      sleep: 'sleep',
      socialize: 'happy',
    };
    setPetState(actionToState[action] || 'idle');
    addLog(`Executing ${action}...`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🥚</div>
          <p className="font-mono text-sm">Initializing protocol...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="font-black text-xl uppercase mb-2">ERROR</h2>
          <p className="font-mono text-sm mb-6">{error}</p>
          <Button onClick={fetchPet}>TRY AGAIN</Button>
        </Card>
      </div>
    );
  }

  // Pet creation screen
  if (!pet) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <h2 className="text-4xl font-black mb-8 uppercase italic underline decoration-4">
            Choose your lineage:
          </h2>

          {createError && (
            <Card size="sm" padding="sm" className="mb-6 bg-red-100 border-red-600">
              <p className="font-mono text-sm text-red-800">{`> ERROR: ${createError}`}</p>
            </Card>
          )}

          {/* Name */}
          <Card padding="md" className="mb-6">
            <label className="block font-black text-xs uppercase tracking-widest mb-2">
              Pet Name
            </label>
            <input
              type="text"
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="Type the name..."
              maxLength={20}
              className="brutal-input"
            />
            <p className="text-[10px] font-mono text-right mt-1 opacity-50">
              {newPetName.length}/20
            </p>
          </Card>

          {/* Tribes */}
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

          {/* Create */}
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreatePet}
              disabled={!newPetName.trim() || !selectedTribe || isCreating}
            >
              {isCreating ? 'CREATING...' : '🥚 HATCH MY PET'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pet dashboard - Layout 3-6-3
  const tribeInfo = TRIBES[pet.tribe as keyof typeof TRIBES];
  const form = PET_FORMS.find((f) => f.id === pet.formId);
  const stageIndex = ['EGG', 'BABY', 'TEEN', 'ADULT', 'LEGENDARY'].indexOf(pet.stage);

  const tribeBg: Record<string, string> = {
    FOFO: 'bg-pink-50',
    CAOS: 'bg-zinc-900',
    CHAD: 'bg-stone-100',
    DEGEN: 'bg-violet-50',
  };

  return (
    <div className={`min-h-screen ${tribeBg[pet.tribe] || 'bg-[#f0f0f0]'} p-4 md:p-8 transition-colors duration-1000`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: PROFILE AND STATUS */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile */}
          <Card padding="md">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 border-2 border-black flex items-center justify-center ${pet.tribe === 'FOFO' ? 'bg-pink-500' : pet.tribe === 'CAOS' ? 'bg-red-600' : pet.tribe === 'CHAD' ? 'bg-emerald-500' : 'bg-violet-500'}`}>
                <TribeIcon tribe={pet.tribe} size={24} className="text-white" />
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
              <div className="font-mono flex items-center gap-1">{pet.careStreak} <Flame size={14} className="text-orange-500" /></div>
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

          {/* Pet Skills */}
          <PetSkills compact />

          {/* Council Alert */}
          <div className="border-2 border-black p-3 bg-yellow-400 font-black text-xs uppercase flex items-center gap-3 animate-pulse">
            <AlertTriangle size={16} />
            Council Vote Open
          </div>
        </div>

        {/* CENTER COLUMN: THE PET */}
        <div className="lg:col-span-6 space-y-6">
          {/* Neglect alert */}
          {pet.computedStats.isNeglected && (
            <Card padding="sm" className="bg-red-100 border-red-600">
              <div className="flex items-center gap-3">
                <span className="text-2xl">😢</span>
                <div>
                  <h3 className="font-black uppercase text-red-800">SHAME MODE!</h3>
                  <p className="text-[10px] font-mono text-red-700">
                    Your pet was neglected. Perform actions to recover it!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Pet Display */}
          <Card size="lg" padding="md" className="relative overflow-hidden">
            {/* Scanlines */}
            <div className="scanlines" />

            {/* Pet Viewport */}
            <div className="aspect-square bg-zinc-100 border-4 border-black relative flex items-center justify-center overflow-hidden">
              {/* Grid Background */}
              <div className="grid-pattern" />

              {/* Pet */}
              <Pet3D
                tribe={pet.tribe}
                stage={pet.stage}
                isNeglected={pet.computedStats.isNeglected}
                isSleeping={petState === 'sleep'}
                state={petState}
                size="lg"
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

            {/* Evolution bar */}
            <div className="mt-4">
              {(() => {
                // Evolution thresholds: EGG->1, BABY->5, TEEN->15, ADULT->30
                const thresholds: Record<string, { current: number; next: number; nextStage: string }> = {
                  EGG: { current: 0, next: 1, nextStage: 'Baby' },
                  BABY: { current: 1, next: 5, nextStage: 'Teen' },
                  TEEN: { current: 5, next: 15, nextStage: 'Adult' },
                  ADULT: { current: 15, next: 30, nextStage: 'Legendary' },
                  LEGENDARY: { current: 30, next: 30, nextStage: 'MAX' },
                };
                const t = thresholds[pet.stage] || thresholds.EGG;
                const progress = pet.stage === 'LEGENDARY'
                  ? 100
                  : Math.min(100, ((pet.totalActions - t.current) / (t.next - t.current)) * 100);
                return (
                  <>
                    <div className="flex justify-between items-center mb-2 font-black text-[10px] uppercase">
                      <span>Stage: {STAGES[stageIndex] || 'Egg'}</span>
                      <span>{pet.stage === 'LEGENDARY' ? 'MAX LEVEL!' : `${pet.totalActions}/${t.next} → ${t.nextStage}`}</span>
                    </div>
                    <div className="h-2 bg-zinc-200 border border-black overflow-hidden">
                      <div
                        className={`h-full transition-all ${pet.stage === 'LEGENDARY' ? 'bg-yellow-500' : 'bg-black'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>

          {/* Actions */}
          <PetActions
            onActionComplete={handleActionComplete}
            onActionStart={handleActionStart}
            initialCooldowns={pet.cooldowns}
          />

          {/* Token Feeding */}
          <TokenFeeding
            onFeedComplete={handleActionComplete}
            currentPower={currentPower}
          />
        </div>

        {/* RIGHT COLUMN: LOGS AND RANKING */}
        <div className="lg:col-span-3 space-y-6">
          {/* Terminal Logs */}
          <div className="h-48">
            <Terminal logs={logs} />
          </div>

          {/* Tribe War */}
          {leaderboard.length > 0 && (
            <Leaderboard entries={leaderboard} title="Tribe War Status" showLive />
          )}

          {/* Chat */}
          <TribeChat tribe={pet.tribe} compact />

          {/* Utility buttons */}
          <div className="flex gap-2">
            <Link href={`/pet/${pet.id}`} className="flex-1">
              <Button fullWidth size="sm">
                PUBLIC PROFILE
              </Button>
            </Link>
            <Link href="/week" className="flex-1">
              <Button fullWidth size="sm">
                WAR →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
