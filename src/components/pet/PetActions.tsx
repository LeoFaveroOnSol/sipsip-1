'use client';

import { useState, useEffect } from 'react';
import { Utensils, Gamepad2, Moon, MessageSquare } from 'lucide-react';
import { ACTIONS } from '@/lib/constants';

interface PetActionsProps {
  onActionComplete: () => void;
}

const ACTION_ICONS = {
  feed: Utensils,
  play: Gamepad2,
  sleep: Moon,
  socialize: MessageSquare,
};

export function PetActions({ onActionComplete }: PetActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, Date | null>>({});

  const performAction = async (actionKey: string) => {
    setLoading(actionKey);
    setError(null);

    try {
      const res = await fetch('/api/pet/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionKey }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erro ao executar ação');
        if (data.cooldownEndsAt) {
          setCooldowns(prev => ({
            ...prev,
            [actionKey]: new Date(data.cooldownEndsAt)
          }));
        }
      } else {
        if (data.data?.evolved) {
          alert(`🎉 Evolução detectada!`);
        }
        onActionComplete();
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(null);
    }
  };

  const isOnCooldown = (actionKey: string) => {
    const cooldown = cooldowns[actionKey];
    if (!cooldown) return false;
    return new Date() < cooldown;
  };

  const formatCooldown = (actionKey: string) => {
    const cooldown = cooldowns[actionKey];
    if (!cooldown) return '';
    
    const now = new Date();
    const diff = cooldown.getTime() - now.getTime();
    if (diff <= 0) return '';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update cooldowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns(prev => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border-2 border-black text-[10px] font-mono text-red-800">
          {`> ERRO: ${error}`}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ACTIONS).map(([key, action]) => {
          const Icon = ACTION_ICONS[key as keyof typeof ACTION_ICONS];
          const onCooldown = isOnCooldown(key);
          const isLoading = loading === key;
          const cooldownText = formatCooldown(key);

          return (
            <button
              key={key}
              onClick={() => performAction(key)}
              disabled={onCooldown || isLoading}
              className={`
                flex flex-col items-center justify-center p-4
                border-4 border-black bg-white
                shadow-[4px_4px_0px_rgba(0,0,0,1)]
                hover:shadow-none hover:translate-x-1 hover:translate-y-1
                transition-all group
                disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0
                ${isLoading ? 'bg-yellow-100' : ''}
              `}
            >
              <Icon 
                size={24} 
                className={`mb-2 transition-transform ${!onCooldown && !isLoading ? 'group-hover:scale-110' : ''}`} 
              />
              <span className="font-black text-[10px] uppercase tracking-tighter">
                {action.name}
              </span>
              
              {onCooldown && cooldownText && (
                <span className="font-mono text-[8px] text-zinc-500 mt-1">
                  {cooldownText}
                </span>
              )}
              
              {action.energyCost > 0 && !onCooldown && (
                <span className="text-[8px] text-orange-600 mt-1">
                  -{action.energyCost} ⚡
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
