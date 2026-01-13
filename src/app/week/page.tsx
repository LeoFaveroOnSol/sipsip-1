'use client';

import { useEffect, useState } from 'react';
import { Leaderboard } from '@/components/tribe/Leaderboard';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TRIBES, SCORING } from '@/lib/constants';
import { Gamepad2, MessageCircle, Flame, Star } from 'lucide-react';
import { TribeIcon } from '@/components/ui/TribeIcon';

interface WeekData {
  currentWeek: {
    id: string;
    weekNumber: number;
    year: number;
    startAt: string;
    endAt: string;
    isActive: boolean;
    progress: number;
    scores: Array<{
      tribe: string;
      scoreActivity: number;
      scoreSocial: number;
      scoreConsistency: number;
      scoreEvent: number;
      total: number;
    }>;
  };
  leaderboard: Array<{
    tribe: string;
    total: number;
    position: number;
    isWinner: boolean;
  }>;
  history: Array<{
    id: string;
    weekNumber: number;
    year: number;
    winnerTribe: string | null;
  }>;
}

export default function WeekPage() {
  const [data, setData] = useState<WeekData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTribe, setSelectedTribe] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/week')
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
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <p className="font-mono text-sm">Loading war...</p>
        </Card>
      </div>
    );
  }

  const { currentWeek, leaderboard, history } = data;
  const selectedScore = selectedTribe
    ? currentWeek.scores.find((s) => s.tribe === selectedTribe)
    : null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase italic underline decoration-4 mb-2">
            Tribal War
          </h1>
          <p className="font-mono text-sm opacity-60">
            Week {currentWeek.weekNumber} of {currentWeek.year}
          </p>
        </div>

        {/* Progress */}
        <Card size="lg" padding="md" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-black text-xl uppercase">Week Progress</h2>
              <p className="font-mono text-[10px] opacity-50">
                {new Date(currentWeek.startAt).toLocaleDateString('en-US')} - {new Date(currentWeek.endAt).toLocaleDateString('en-US')}
              </p>
            </div>
            <div className="text-right">
              <span className="font-black text-4xl">{currentWeek.progress}%</span>
              <p className="font-mono text-[10px] opacity-50">
                {currentWeek.isActive ? 'IN PROGRESS' : 'COMPLETED'}
              </p>
            </div>
          </div>

          <div className="h-4 border-2 border-black bg-white p-[2px] shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${currentWeek.progress}%` }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6">
              Current Leaderboard
            </h2>

            <Leaderboard entries={leaderboard} showLive />

            <div className="mt-6 pt-6 border-t-2 border-black">
              <p className="text-center font-mono text-[10px] opacity-50 mb-4">
                Click a tribe to see breakdown
              </p>
              <div className="flex justify-center gap-2">
                {Object.entries(TRIBES).map(([key, tribe]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTribe(selectedTribe === key ? null : key)}
                    className={`
                      w-12 h-12 border-2 border-black flex items-center justify-center text-xl
                      transition-all duration-100
                      ${selectedTribe === key
                        ? 'bg-black text-white shadow-none translate-x-1 translate-y-1'
                        : 'bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                      }
                    `}
                  >
                    <TribeIcon tribe={key} size={20} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            {selectedScore ? (
              <Card padding="md">
                <div className="flex items-center gap-3 mb-6">
                  <TribeIcon tribe={selectedTribe || 'FOFO'} size={32} />
                  <h2 className="font-black text-xl uppercase">
                    {TRIBES[selectedTribe as keyof typeof TRIBES]?.name}
                  </h2>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'Activity', value: selectedScore.scoreActivity, Icon: Gamepad2, label: 'Activity' },
                    { key: 'Social', value: selectedScore.scoreSocial, Icon: MessageCircle, label: 'Social' },
                    { key: 'Consistency', value: selectedScore.scoreConsistency, Icon: Flame, label: 'Consistency' },
                    { key: 'Event', value: selectedScore.scoreEvent, Icon: Star, label: 'Events' },
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-3 border-2 border-black bg-zinc-50">
                      <span className="font-mono text-xs flex items-center gap-2">
                        <item.Icon size={14} /> {item.label}
                      </span>
                      <span className="font-black">{item.value}</span>
                    </div>
                  ))}

                  <div className="pt-4 border-t-4 border-black mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-black uppercase">TOTAL</span>
                      <span className="font-black text-3xl">{selectedScore.total}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card padding="lg" className="text-center">
                <span className="text-5xl mb-4 block">📊</span>
                <p className="font-mono text-sm opacity-50">
                  Select a tribe to see breakdown
                </p>
              </Card>
            )}

            {/* Scoring Info */}
            <Card padding="md" className="mt-6">
              <h3 className="font-black uppercase text-sm mb-4 border-b-2 border-black pb-2">
                How does it work?
              </h3>
              <div className="space-y-2 font-mono text-[10px] opacity-70">
                <p className="flex items-center gap-2"><Gamepad2 size={12} /> Activity ({SCORING.weights.activity}%)</p>
                <p className="flex items-center gap-2"><MessageCircle size={12} /> Social ({SCORING.weights.social}%)</p>
                <p className="flex items-center gap-2"><Flame size={12} /> Consistency ({SCORING.weights.consistency}%)</p>
                <p className="flex items-center gap-2"><Star size={12} /> Events ({SCORING.weights.event}%)</p>
              </div>
            </Card>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6">
              History
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
              {history.map((week) => {
                return (
                  <Card key={week.id} size="sm" padding="sm" className="text-center">
                    <span className="block mb-2">
                      {week.winnerTribe ? (
                        <TribeIcon tribe={week.winnerTribe} size={24} />
                      ) : (
                        <span className="text-2xl">—</span>
                      )}
                    </span>
                    <div className="font-black text-xs">W{week.weekNumber}</div>
                    <div className="font-mono text-[8px] opacity-50">{week.year}</div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
