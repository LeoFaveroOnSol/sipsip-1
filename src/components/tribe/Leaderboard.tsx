'use client';

import { TRIBES } from '@/lib/constants';

interface LeaderboardEntry {
  tribe: string;
  total: number;
  position: number;
  isWinner?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showLive?: boolean;
}

const TRIBE_COLORS: Record<string, string> = {
  FOFO: 'bg-pink-400',
  CAOS: 'bg-red-500',
  CHAD: 'bg-stone-500',
  DEGEN: 'bg-emerald-500',
};

export function Leaderboard({ entries, title, showLive = false }: LeaderboardProps) {
  const sortedEntries = [...entries].sort((a, b) => a.position - b.position);
  const maxScore = Math.max(...entries.map(e => e.total), 1);

  return (
    <div className="border-4 border-black bg-white p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
      {(title || showLive) && (
        <h5 className="font-black text-xs uppercase mb-4 border-b-2 border-black pb-2 flex items-center justify-between">
          {title || 'Ranking'}
          {showLive && (
            <span className="animate-pulse text-red-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-600 rounded-full" />
              LIVE
            </span>
          )}
        </h5>
      )}

      <div className="space-y-3">
        {sortedEntries.map((entry) => {
          const tribeInfo = TRIBES[entry.tribe as keyof typeof TRIBES];
          const percentage = (entry.total / maxScore) * 100;

          return (
            <div key={entry.tribe} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-black italic">
                <span className="flex items-center gap-2">
                  <span className="w-5 text-center">{entry.position}.</span>
                  <span>{tribeInfo?.emoji}</span>
                  <span className="uppercase">{entry.tribe}</span>
                  {entry.isWinner && <span>👑</span>}
                </span>
                <span className="font-mono">{entry.total.toLocaleString()} pts</span>
              </div>
              <div className="h-2 bg-zinc-100 border border-black">
                <div 
                  className={`h-full ${TRIBE_COLORS[entry.tribe] || 'bg-zinc-400'} transition-all duration-500`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
