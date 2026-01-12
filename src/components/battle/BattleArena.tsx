'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PowerMeter from '@/components/staking/PowerMeter';

interface PetInfo {
  id: string;
  name: string;
  tribe: string;
  stage: string;
  formId: string;
}

interface Fighter {
  pet: PetInfo;
  power: number;
  wallet?: string;
  isUser?: boolean;
}

interface ReplayFrame {
  timestamp: number;
  attackerId: 'challenger' | 'defender';
  action: 'attack' | 'defend' | 'special' | 'hit' | 'dodge' | 'critical';
  damage?: number;
  remainingHp?: { challenger: number; defender: number };
}

interface BattleArenaProps {
  challenger: Fighter;
  defender: Fighter;
  winner?: string; // 'challenger' | 'defender' | null (ongoing)
  replayData?: ReplayFrame[];
  prizePool?: string;
  burnedAmount?: string;
  onReplayComplete?: () => void;
}

const TRIBE_COLORS = {
  FOFO: '#f472b6',
  CAOS: '#f97316',
  CHAD: '#3b82f6',
  DEGEN: '#a855f7',
};

const STAGE_EMOJIS = {
  EGG: '🥚',
  BABY: '🐣',
  TEEN: '🐥',
  ADULT: '🐔',
  LEGENDARY: '🦅',
};

export default function BattleArena({
  challenger,
  defender,
  winner,
  replayData,
  prizePool,
  burnedAmount,
  onReplayComplete,
}: BattleArenaProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [challengerHp, setChallengerHp] = useState(100);
  const [defenderHp, setDefenderHp] = useState(100);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number; side: 'left' | 'right' }[]>([]);
  const damageIdRef = useRef(0);

  // Play replay animation
  useEffect(() => {
    if (!isPlaying || !replayData || currentFrame >= replayData.length) {
      if (currentFrame >= (replayData?.length || 0) && isPlaying) {
        setIsPlaying(false);
        onReplayComplete?.();
      }
      return;
    }

    const frame = replayData[currentFrame];
    const nextFrameDelay = currentFrame < replayData.length - 1
      ? replayData[currentFrame + 1].timestamp - frame.timestamp
      : 1000;

    // Apply frame effects
    if (frame.remainingHp) {
      setChallengerHp(frame.remainingHp.challenger);
      setDefenderHp(frame.remainingHp.defender);
    }

    if (frame.damage) {
      const side = frame.attackerId === 'challenger' ? 'right' : 'left';
      const newId = damageIdRef.current++;
      setDamageNumbers(prev => [...prev, { id: newId, value: frame.damage!, side }]);

      // Remove damage number after animation
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== newId));
      }, 1000);
    }

    setLastAction(`${frame.attackerId} used ${frame.action}${frame.damage ? ` for ${frame.damage} damage` : ''}!`);

    const timer = setTimeout(() => {
      setCurrentFrame(prev => prev + 1);
    }, Math.min(nextFrameDelay, 500)); // Cap at 500ms between frames

    return () => clearTimeout(timer);
  }, [isPlaying, currentFrame, replayData, onReplayComplete]);

  const startReplay = () => {
    setCurrentFrame(0);
    setChallengerHp(100);
    setDefenderHp(100);
    setIsPlaying(true);
    setLastAction(null);
    setDamageNumbers([]);
  };

  const renderFighter = (fighter: Fighter, side: 'left' | 'right', hp: number) => {
    const isWinner = winner === (side === 'left' ? 'challenger' : 'defender');
    const isLoser = winner && !isWinner;
    const tribeColor = TRIBE_COLORS[fighter.pet.tribe as keyof typeof TRIBE_COLORS] || TRIBE_COLORS.FOFO;
    const emoji = STAGE_EMOJIS[fighter.pet.stage as keyof typeof STAGE_EMOJIS] || '🥚';

    return (
      <div className={`flex-1 flex flex-col items-center ${side === 'right' ? 'flex-col-reverse' : ''}`}>
        {/* Fighter Name & Tribe */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ backgroundColor: tribeColor + '30', color: tribeColor }}
            >
              {fighter.pet.tribe}
            </span>
            {fighter.isUser && (
              <span className="text-xs font-mono px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                YOU
              </span>
            )}
          </div>
          <h3 className="text-lg font-mono text-white mt-1">
            {fighter.pet.name}
          </h3>
          <div className="text-xs text-gray-500">
            Power: {fighter.power.toFixed(1)}
          </div>
        </div>

        {/* HP Bar */}
        <div className="w-full max-w-[200px] mb-4">
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${hp}%`,
                backgroundColor: hp > 50 ? '#22c55e' : hp > 25 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center mt-1">{hp.toFixed(0)}%</div>
        </div>

        {/* Pet Avatar */}
        <div
          className={`relative w-32 h-32 rounded-xl flex items-center justify-center text-6xl transition-all duration-200 ${
            isWinner ? 'animate-bounce scale-110' : ''
          } ${isLoser ? 'opacity-50 grayscale' : ''}`}
          style={{
            backgroundColor: tribeColor + '20',
            border: `2px solid ${tribeColor}50`,
          }}
        >
          {emoji}

          {/* Damage Numbers */}
          {damageNumbers
            .filter(d => d.side === side)
            .map(d => (
              <div
                key={d.id}
                className="absolute text-2xl font-bold text-red-500 animate-ping"
                style={{
                  top: '20%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                -{d.value}
              </div>
            ))}

          {/* Winner Crown */}
          {isWinner && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">
              👑
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      {/* Arena Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-mono text-white uppercase tracking-wider">
          {winner ? 'Battle Complete' : 'Battle Arena'}
        </h2>
        {prizePool && (
          <div className="text-sm text-yellow-400 mt-1">
            Prize Pool: {prizePool} $SIP
            {burnedAmount && <span className="text-gray-500"> ({burnedAmount} burned)</span>}
          </div>
        )}
      </div>

      {/* Fighters */}
      <div className="flex items-center justify-center gap-8">
        {renderFighter(challenger, 'left', challengerHp)}

        {/* VS Divider */}
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold text-gray-600">VS</div>
          {lastAction && (
            <div className="text-xs text-gray-400 mt-2 max-w-[150px] text-center animate-pulse">
              {lastAction}
            </div>
          )}
        </div>

        {renderFighter(defender, 'right', defenderHp)}
      </div>

      {/* Replay Controls */}
      {replayData && replayData.length > 0 && (
        <div className="mt-6 flex justify-center gap-4">
          <Button
            onClick={startReplay}
            disabled={isPlaying}
            variant="secondary"
            size="sm"
          >
            {isPlaying ? 'Playing...' : 'Watch Replay'}
          </Button>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${(currentFrame / replayData.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {currentFrame}/{replayData.length}
            </span>
          </div>
        </div>
      )}

      {/* Winner Announcement */}
      {winner && (
        <div className="mt-6 text-center">
          <div
            className={`text-2xl font-mono ${
              (winner === 'challenger' && challenger.isUser) ||
              (winner === 'defender' && defender.isUser)
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {(winner === 'challenger' && challenger.isUser) ||
            (winner === 'defender' && defender.isUser)
              ? '🎉 VICTORY! 🎉'
              : '💀 DEFEAT 💀'}
          </div>
          <div className="text-sm text-gray-400 mt-2">
            {winner === 'challenger' ? challenger.pet.name : defender.pet.name} wins!
          </div>
        </div>
      )}
    </Card>
  );
}
