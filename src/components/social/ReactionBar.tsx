'use client';

import { useState } from 'react';
import { REACTIONS, ReactionType } from '@/lib/constants';

interface ReactionBarProps {
  petId: string;
  reactions: Partial<Record<ReactionType, number>>;
  canReact: boolean;
  onReact: () => void;
}

export function ReactionBar({ petId, reactions, canReact, onReact }: ReactionBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReaction = async (type: ReactionType) => {
    if (!canReact) return;

    setLoading(type);
    setError(null);

    try {
      const res = await fetch('/api/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, type }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erro ao reagir');
      } else {
        onReact();
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-400 text-sm text-center">{error}</div>
      )}

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {Object.entries(REACTIONS).map(([key, reaction]) => {
          const count = reactions[key as ReactionType] || 0;
          const isLoading = loading === key;

          return (
            <button
              key={key}
              onClick={() => handleReaction(key as ReactionType)}
              disabled={!canReact || isLoading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-white/5 border border-white/10
                transition-all duration-300
                ${canReact ? 'hover:bg-white/10 hover:scale-110' : 'opacity-50 cursor-not-allowed'}
                ${isLoading ? 'animate-pulse' : ''}
              `}
            >
              <span className="text-xl">{reaction.emoji}</span>
              <span className="text-sm font-display font-bold text-white/60">{count}</span>
            </button>
          );
        })}
      </div>

      {!canReact && (
        <p className="text-xs text-white/40 text-center font-display">
          Aguarde o cooldown para reagir novamente
        </p>
      )}
    </div>
  );
}
