'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TRIBES } from '@/lib/constants';
import { Trophy, Gift, Calendar, Target } from 'lucide-react';
import { TribeIcon } from '@/components/ui/TribeIcon';

interface SeasonData {
  currentSeason: {
    id: string;
    number: string;
    theme: string;
    startAt: string;
    endAt: string;
    isActive: boolean;
    progress: number;
    metadata: {
      description?: string;
      rewards?: string[];
    } | null;
  };
  rankings: Array<{
    tribe: string;
    weekWins: number;
    totalScore: number;
    position: number;
  }>;
}

export default function SeasonPage() {
  const [data, setData] = useState<SeasonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/season')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🏆</div>
          <p className="font-mono text-sm">Loading season...</p>
        </Card>
      </div>
    );
  }

  const { currentSeason, rankings } = data;
  const sortedRankings = [...rankings].sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <Card size="lg" padding="lg" className="mb-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-10 left-10 text-[8rem] font-black rotate-12">🌟</div>
            <div className="absolute bottom-10 right-10 text-[10rem] font-black -rotate-6">✨</div>
          </div>

          <div className="relative text-center">
            <div className="inline-block mb-4 px-4 py-1 border-2 border-black bg-yellow-400 font-black text-xs uppercase">
              SEASON {currentSeason.number}
            </div>

            <h1 className="text-4xl lg:text-5xl font-black uppercase mb-4">
              {currentSeason.theme}
            </h1>

            <p className="font-mono text-sm mb-8 max-w-xl mx-auto opacity-70">
              {currentSeason.metadata?.description || 'A new season with new challenges and rewards!'}
            </p>

            {/* Progress */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between font-mono text-[10px] mb-2 opacity-50">
                <span>{new Date(currentSeason.startAt).toLocaleDateString('en-US')}</span>
                <span>{currentSeason.progress}%</span>
                <span>{new Date(currentSeason.endAt).toLocaleDateString('en-US')}</span>
              </div>
              <div className="h-3 border-2 border-black bg-white p-[2px] shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <div
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${currentSeason.progress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rankings */}
          <div>
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6 flex items-center gap-3">
              <Trophy size={24} />
              Season Ranking
            </h2>

            <div className="space-y-4">
              {sortedRankings.map((entry) => {
                const tribe = TRIBES[entry.tribe as keyof typeof TRIBES];
                const isTop3 = entry.position <= 3;

                return (
                  <Card
                    key={entry.tribe}
                    size="sm"
                    padding="md"
                    className={entry.position === 1 ? 'bg-yellow-50 border-yellow-500' : ''}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position */}
                      <div className={`
                        w-10 h-10 border-2 border-black flex items-center justify-center font-black
                        ${entry.position === 1 ? 'bg-yellow-400' :
                          entry.position === 2 ? 'bg-zinc-300' :
                          entry.position === 3 ? 'bg-orange-400' : 'bg-white'}
                      `}>
                        {entry.position}
                      </div>

                      {/* Tribe */}
                      <div className="flex items-center gap-3 flex-1">
                        <TribeIcon tribe={entry.tribe} size={32} />
                        <div>
                          <span className="font-black uppercase block">{tribe?.name}</span>
                          <span className="font-mono text-[10px] opacity-50">
                            {entry.weekWins} weekly wins
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <span className="font-black text-xl">{entry.totalScore.toLocaleString()}</span>
                        <span className="font-mono text-[10px] opacity-50 block">pts</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Rewards & Info */}
          <div className="space-y-6">
            {/* Rewards */}
            <div>
              <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6 flex items-center gap-3">
                <Gift size={24} />
                Rewards
              </h2>

              <div className="space-y-3">
                {[
                  { position: '🥇 1st Place', reward: 'Exclusive Badge + Mythic Form' },
                  { position: '🥈 2nd Place', reward: 'Silver Badge + Special Cosmetic' },
                  { position: '🥉 3rd Place', reward: 'Bronze Badge + Unique Title' },
                  { position: '📊 Participants', reward: 'Bonus XP + Season Badge' },
                ].map((item) => (
                  <Card key={item.position} size="sm" padding="sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.position.split(' ')[0]}</span>
                      <div>
                        <div className="font-black text-sm">{item.position.split(' ').slice(1).join(' ')}</div>
                        <div className="font-mono text-[10px] opacity-60">{item.reward}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* How it works */}
            <Card padding="md">
              <h3 className="font-black uppercase text-sm mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
                <Target size={16} />
                How it works
              </h3>
              <div className="space-y-2 font-mono text-[10px] opacity-70">
                <p>📅 Each season lasts approximately 1 month</p>
                <p>⚔️ Weekly wins accumulate points for the tribe</p>
                <p>🏆 At the end, the tribe with the most points wins</p>
                <p>🎁 Active participants receive rewards</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
