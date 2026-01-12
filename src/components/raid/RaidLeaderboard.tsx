'use client';

import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

interface LeaderboardEntry {
  position: number;
  petName: string;
  tribe: string;
  wallet: string;
  totalDamage: string;
  totalDamageRaw: number;
  attackCount: number;
  isKillingBlow: boolean;
  isTop10: boolean;
  isUser: boolean;
}

interface RaidLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  userRank?: {
    position: number;
    petName: string;
    tribe: string;
    totalDamage: string;
    attackCount: number;
    isKillingBlow: boolean;
    isTop10: boolean;
  } | null;
  top10Threshold: number;
}

const TRIBE_COLORS = {
  FOFO: 'text-pink-400',
  CAOS: 'text-orange-400',
  CHAD: 'text-blue-400',
  DEGEN: 'text-purple-400',
};

const POSITION_STYLES = {
  1: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', icon: '🥇' },
  2: { bg: 'bg-gray-400/20', border: 'border-gray-400/50', icon: '🥈' },
  3: { bg: 'bg-amber-600/20', border: 'border-amber-600/50', icon: '🥉' },
};

export default function RaidLeaderboard({
  leaderboard,
  userRank,
  top10Threshold,
}: RaidLeaderboardProps) {
  const renderEntry = (entry: LeaderboardEntry, isUserRow = false) => {
    const positionStyle = POSITION_STYLES[entry.position as keyof typeof POSITION_STYLES];
    const tribeColor = TRIBE_COLORS[entry.tribe as keyof typeof TRIBE_COLORS] || 'text-gray-400';

    return (
      <div
        key={`${entry.position}-${isUserRow ? 'user' : 'list'}`}
        className={`flex items-center gap-4 p-3 rounded-lg ${
          isUserRow || entry.isUser
            ? 'bg-blue-500/10 border border-blue-500/30'
            : positionStyle
              ? `${positionStyle.bg} border ${positionStyle.border}`
              : 'bg-gray-800/50'
        }`}
      >
        {/* Position */}
        <div className="w-10 text-center">
          {positionStyle ? (
            <span className="text-xl">{positionStyle.icon}</span>
          ) : (
            <span className="text-lg font-mono text-gray-400">#{entry.position}</span>
          )}
        </div>

        {/* Pet Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-white truncate">
              {entry.petName}
            </span>
            <span className={`text-xs ${tribeColor}`}>
              {entry.tribe}
            </span>
            {entry.isKillingBlow && (
              <Tag className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                Killing Blow
              </Tag>
            )}
            {entry.isTop10 && !entry.isKillingBlow && (
              <Tag className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Top 10
              </Tag>
            )}
            {(isUserRow || entry.isUser) && (
              <Tag className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                YOU
              </Tag>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {entry.wallet} • {entry.attackCount} attacks
          </div>
        </div>

        {/* Damage */}
        <div className="text-right">
          <div className="font-mono text-lg text-white">
            {entry.totalDamage}
          </div>
          <div className="text-xs text-gray-500">damage</div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-mono text-white uppercase tracking-wider">
          Damage Leaderboard
        </h3>
        <span className="text-xs text-gray-500">
          Top {top10Threshold} get NFT Badge
        </span>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No participants yet. Be the first to attack!
          </div>
        ) : (
          leaderboard.map(entry => renderEntry(entry))
        )}
      </div>

      {/* User's position if not in top */}
      {userRank && !leaderboard.some(e => e.isUser) && (
        <>
          <div className="my-4 flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-gray-700" />
            <span className="text-xs text-gray-600">Your Position</span>
            <div className="flex-1 border-t border-dashed border-gray-700" />
          </div>
          {renderEntry({
            position: userRank.position,
            petName: userRank.petName,
            tribe: userRank.tribe,
            wallet: '',
            totalDamage: userRank.totalDamage,
            totalDamageRaw: 0,
            attackCount: userRank.attackCount,
            isKillingBlow: userRank.isKillingBlow,
            isTop10: userRank.isTop10,
            isUser: true,
          }, true)}
        </>
      )}

      {/* Reward Info */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <div className="text-sm text-gray-400 mb-2">Rewards</div>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>All Participants</span>
            <span className="text-green-400">Share of Pool (by damage)</span>
          </div>
          <div className="flex justify-between">
            <span>Top {top10Threshold}</span>
            <span className="text-yellow-400">NFT Badge + Bonus</span>
          </div>
          <div className="flex justify-between">
            <span>Killing Blow</span>
            <span className="text-red-400">Mythic Form Unlock!</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
