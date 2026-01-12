'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';

interface PetInfo {
  id: string;
  name: string;
  tribe: string;
  stage: string;
  formId: string;
}

interface BattleCardProps {
  id: string;
  betAmount: string;
  betAmountRaw: number;
  challenger: {
    wallet: string;
    pet: PetInfo;
    power: number;
  };
  powerMatch?: {
    userPower: number;
    challengerPower: number;
    isInPowerBand: boolean;
    powerDiffPercent: string;
  };
  createdAt: Date;
  onAccept?: (battleId: string) => void;
  loading?: boolean;
}

const TRIBE_COLORS = {
  FOFO: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  CAOS: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  CHAD: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  DEGEN: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
};

const STAGE_ICONS = {
  EGG: '🥚',
  BABY: '🐣',
  TEEN: '🐥',
  ADULT: '🐔',
  LEGENDARY: '🦅',
};

export default function BattleCard({
  id,
  betAmount,
  challenger,
  powerMatch,
  createdAt,
  onAccept,
  loading = false,
}: BattleCardProps) {
  const tribeColor = TRIBE_COLORS[challenger.pet.tribe as keyof typeof TRIBE_COLORS] || TRIBE_COLORS.FOFO;
  const stageIcon = STAGE_ICONS[challenger.pet.stage as keyof typeof STAGE_ICONS] || '🥚';

  // Format time ago
  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card className="p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Challenger Info */}
        <div className="flex items-center gap-3 flex-1">
          {/* Pet Avatar Placeholder */}
          <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-2xl">
            {stageIcon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-white truncate">
                {challenger.pet.name}
              </span>
              <Tag
                className={`text-xs ${tribeColor}`}
              >
                {challenger.pet.tribe}
              </Tag>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 font-mono">
                {challenger.wallet}
              </span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">
                {timeAgo()}
              </span>
            </div>
          </div>
        </div>

        {/* Bet & Power Info */}
        <div className="text-right">
          <div className="text-lg font-mono text-yellow-400">
            {betAmount} <span className="text-sm text-gray-500">$SIP</span>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-xs text-gray-500">
              Power: {challenger.power.toFixed(1)}
            </span>
            {powerMatch && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  powerMatch.isInPowerBand
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {powerMatch.isInPowerBand ? 'Fair Match' : `${powerMatch.powerDiffPercent}% diff`}
              </span>
            )}
          </div>
        </div>

        {/* Accept Button */}
        {onAccept && (
          <Button
            onClick={() => onAccept(id)}
            disabled={loading}
            variant="primary"
            size="sm"
            className="ml-2"
          >
            {loading ? 'Accepting...' : 'Fight!'}
          </Button>
        )}
      </div>
    </Card>
  );
}
