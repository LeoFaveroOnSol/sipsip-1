'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Terminal } from '@/components/ui/Terminal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skull, Zap, Users, Clock, Trophy, Flame } from 'lucide-react';

interface RaidData {
  id: string;
  bossName: string;
  bossFormId: string;
  bossElement: string | null;
  hp: {
    current: number;
    max: number;
    percent: string;
  };
  entryFee: string;
  entryFeeRaw: number;
  rewardPool: string;
  rewardPoolRaw: number;
  participantCount: number;
  status: string;
  timeRemaining: {
    hours: number;
    minutes: number;
    formatted: string;
  };
}

interface UserParticipation {
  totalDamage: number;
  attackCount: number;
  sipContributed: string;
  rewardClaimed: boolean;
}

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

const BOSS_EMOJIS: Record<string, string> = {
  boss_hydra: '🐉',
  boss_wyrm: '🐲',
  boss_golem: '🗿',
  boss_phoenix: '🔥',
  boss_kraken: '🦑',
};

const ELEMENT_COLORS: Record<string, string> = {
  chaos: 'bg-purple-500',
  fire: 'bg-red-500',
  ice: 'bg-cyan-500',
  earth: 'bg-amber-600',
  dark: 'bg-zinc-800',
};

export default function RaidPage() {
  const { user } = useAuth();
  const [raid, setRaid] = useState<RaidData | null>(null);
  const [userParticipation, setUserParticipation] = useState<UserParticipation | null>(null);
  const [canJoin, setCanJoin] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>(['Raid system initialized...']);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
    if (user) {
      fetchRaidData();
      fetchLeaderboard();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchRaidData();
      fetchLeaderboard();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchRaidData = async () => {
    try {
      const res = await fetch('/api/raid/current');
      const data = await res.json();

      if (data.success) {
        setRaid(data.data.raid);
        setUserParticipation(data.data.userParticipation);
        setCanJoin(data.data.canJoin);
        if (data.data.raid) {
          addLog(`Boss HP: ${data.data.raid.hp.percent}%`);
        }
        setError(null);
      } else if (data.error === 'Not authenticated') {
        // Ignore auth errors during polling
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching raid data:', err);
      // Check if it's a network error (possibly caused by browser extension)
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Network error - check if browser extensions are blocking requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/raid/leaderboard');
      const data = await res.json();

      if (data.success) {
        setLeaderboard(data.data.leaderboard);
        setUserRank(data.data.userRank);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const handleJoinRaid = async () => {
    setActionLoading('join');
    setError(null);
    addLog('Joining raid...');

    try {
      const res = await fetch('/api/raid/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      addLog('Joined raid successfully!');
      await fetchRaidData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join raid');
      addLog('ERROR: Failed to join');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAttack = async () => {
    setActionLoading('attack');
    setError(null);
    setLastDamage(null);
    addLog('Attacking boss...');

    try {
      const res = await fetch('/api/raid/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setLastDamage(data.data.damage);
      addLog(`💥 Dealt ${data.data.damage.toLocaleString()} damage!`);

      setTimeout(() => setLastDamage(null), 2000);

      await fetchRaidData();
      await fetchLeaderboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attack failed');
      addLog('ERROR: Attack failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaimRewards = async () => {
    setActionLoading('claim');
    setError(null);
    addLog('Claiming rewards...');

    try {
      const res = await fetch('/api/raid/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raidId: raid?.id }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      addLog(`Rewards claimed: ${data.data.reward} $SIP`);
      await fetchRaidData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim rewards');
      addLog('ERROR: Claim failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4">🐉</div>
          <h2 className="font-black text-xl uppercase mb-2">Boss Raid</h2>
          <p className="font-mono text-sm opacity-60">Connect wallet to join</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🐉</div>
          <p className="font-mono text-sm">Loading raid data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase italic underline decoration-4 mb-2">
            Boss Raid
          </h1>
          <p className="font-mono text-sm opacity-60">
            Unite against the weekly boss. Damage = Rewards.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card size="sm" padding="sm" className="mb-6 bg-red-100 border-red-600">
            <p className="font-mono text-sm text-red-800">{`> ERROR: ${error}`}</p>
          </Card>
        )}

        {!raid ? (
          <Card padding="lg" className="text-center">
            <div className="text-6xl mb-4">😴</div>
            <h2 className="font-black text-xl uppercase mb-2">No Active Raid</h2>
            <p className="font-mono text-sm opacity-60">Check back later for the next boss!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Boss Card */}
              <Card padding="lg" className="relative overflow-hidden">
                {/* Damage Popup */}
                {lastDamage && (
                  <div className="absolute top-4 right-4 text-3xl font-black text-red-500 animate-bounce z-10">
                    -{lastDamage.toLocaleString()}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Boss Avatar */}
                  <div className="w-full md:w-48 h-48 border-4 border-black bg-zinc-900 flex items-center justify-center relative">
                    <span className="text-8xl">
                      {BOSS_EMOJIS[raid.bossFormId] || '👹'}
                    </span>
                    {raid.bossElement && (
                      <div className={`absolute bottom-2 right-2 w-8 h-8 ${ELEMENT_COLORS[raid.bossElement] || 'bg-purple-500'} border-2 border-black flex items-center justify-center`}>
                        <Flame size={16} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Boss Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-2xl font-black uppercase">{raid.bossName}</h2>
                      {raid.bossElement && (
                        <Tag variant="warning" className="text-xs uppercase">
                          {raid.bossElement}
                        </Tag>
                      )}
                      <Tag
                        variant={raid.status === 'ACTIVE' ? 'success' : 'info'}
                        className="text-xs uppercase"
                      >
                        {raid.status}
                      </Tag>
                    </div>

                    {/* HP Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span>BOSS HP</span>
                        <span>{raid.hp.current.toLocaleString()} / {raid.hp.max.toLocaleString()}</span>
                      </div>
                      <div className="h-6 bg-zinc-200 border-2 border-black overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-500"
                          style={{ width: `${raid.hp.percent}%` }}
                        />
                      </div>
                      <div className="text-right text-xs font-black mt-1">{raid.hp.percent}%</div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-100 border-2 border-black p-3 text-center">
                        <Clock size={16} className="mx-auto mb-1" />
                        <div className="text-sm font-black">{raid.timeRemaining.formatted}</div>
                        <div className="text-[8px] font-mono opacity-50">TIME LEFT</div>
                      </div>
                      <div className="bg-zinc-100 border-2 border-black p-3 text-center">
                        <Users size={16} className="mx-auto mb-1" />
                        <div className="text-sm font-black">{raid.participantCount}</div>
                        <div className="text-[8px] font-mono opacity-50">RAIDERS</div>
                      </div>
                      <div className="bg-yellow-100 border-2 border-black p-3 text-center">
                        <Trophy size={16} className="mx-auto mb-1 text-yellow-600" />
                        <div className="text-sm font-black text-yellow-600">{raid.rewardPool}</div>
                        <div className="text-[8px] font-mono opacity-50">REWARD POOL</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* User Participation */}
              <Card padding="lg">
                {userParticipation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black uppercase">Your Contribution</h3>
                      {raid.status === 'DEFEATED' && !userParticipation.rewardClaimed && (
                        <Button
                          onClick={handleClaimRewards}
                          disabled={actionLoading === 'claim'}
                          variant="primary"
                        >
                          {actionLoading === 'claim' ? 'CLAIMING...' : '🎁 CLAIM REWARDS'}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <Card size="sm" padding="md" className="text-center bg-zinc-100">
                        <div className="text-2xl font-black">{userParticipation.totalDamage.toLocaleString()}</div>
                        <div className="text-[10px] font-mono opacity-50">TOTAL DAMAGE</div>
                      </Card>
                      <Card size="sm" padding="md" className="text-center bg-zinc-100">
                        <div className="text-2xl font-black">{userParticipation.attackCount}</div>
                        <div className="text-[10px] font-mono opacity-50">ATTACKS</div>
                      </Card>
                      <Card size="sm" padding="md" className="text-center bg-yellow-100">
                        <div className="text-2xl font-black text-yellow-600">{userParticipation.sipContributed}</div>
                        <div className="text-[10px] font-mono opacity-50">ENTRY PAID</div>
                      </Card>
                    </div>

                    {raid.status === 'ACTIVE' && (
                      <Button
                        onClick={handleAttack}
                        disabled={actionLoading === 'attack'}
                        fullWidth
                        variant="primary"
                        size="lg"
                      >
                        {actionLoading === 'attack' ? '⚔️ ATTACKING...' : '⚔️ ATTACK BOSS!'}
                      </Button>
                    )}

                    {userParticipation.rewardClaimed && (
                      <div className="text-center p-3 bg-green-100 border-2 border-black">
                        <span className="font-black text-green-600">✓ REWARDS CLAIMED</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-6xl mb-4">⚔️</div>
                    <h3 className="text-xl font-black uppercase mb-2">Join the Raid!</h3>
                    <p className="font-mono text-sm opacity-60 mb-4">
                      Entry fee: <span className="text-yellow-600 font-black">{raid.entryFee} $SIP</span>
                    </p>

                    {canJoin ? (
                      <Button
                        onClick={handleJoinRaid}
                        disabled={actionLoading === 'join'}
                        variant="primary"
                        size="lg"
                      >
                        {actionLoading === 'join' ? 'JOINING...' : '💰 PAY & JOIN RAID'}
                      </Button>
                    ) : (
                      <p className="font-mono text-sm text-red-600">
                        You need a healthy pet to join raids
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* Leaderboard */}
              <Card padding="lg">
                <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
                  Raid Leaderboard
                </h3>

                {leaderboard.length === 0 ? (
                  <p className="font-mono text-sm opacity-60 text-center py-4">No participants yet</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 border-2 border-black ${
                          entry.isUser ? 'bg-yellow-100' :
                          idx === 0 ? 'bg-amber-100' :
                          idx < 3 ? 'bg-zinc-100' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center font-black ${
                            idx === 0 ? 'bg-yellow-400' : idx < 3 ? 'bg-zinc-300' : 'bg-white border border-black'
                          }`}>
                            {entry.position}
                          </div>
                          <div>
                            <div className="font-black text-sm uppercase">
                              {entry.petName}
                              {entry.isKillingBlow && <span className="ml-2">💀</span>}
                            </div>
                            <div className="text-[10px] font-mono opacity-50">
                              {entry.tribe} • {entry.attackCount} attacks
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm">{entry.totalDamage}</div>
                          <div className="text-[10px] font-mono opacity-50">DAMAGE</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {userRank && userRank.position > 10 && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                    <div className="flex items-center justify-between p-3 bg-yellow-100 border-2 border-black">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center font-black bg-yellow-400">
                          {userRank.position}
                        </div>
                        <div>
                          <div className="font-black text-sm uppercase">YOU</div>
                          <div className="text-[10px] font-mono opacity-50">{userRank.attackCount} attacks</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm">{userRank.totalDamage}</div>
                        <div className="text-[10px] font-mono opacity-50">DAMAGE</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Terminal */}
              <div className="h-48">
                <Terminal logs={logs} />
              </div>

              {/* How it Works */}
              <Card padding="md">
                <h3 className="font-black text-sm uppercase mb-4 border-b-2 border-black pb-2">
                  How Raids Work
                </h3>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 font-black">1.</span>
                    <span>Pay entry fee to join</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 font-black">2.</span>
                    <span>Attack boss (damage = power)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 font-black">3.</span>
                    <span>All fees form reward pool</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-black">+</span>
                    <span>Rewards by damage dealt</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-black">+</span>
                    <span>Top 10 = exclusive badge</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-black">💀</span>
                    <span>Killing blow = Mythic Form!</span>
                  </div>
                </div>
              </Card>

              {/* Rewards Info */}
              <Card padding="md" className="bg-black text-white">
                <h3 className="font-black text-sm uppercase mb-4">Reward Distribution</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-50">By Damage</span>
                    <span>70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Top 10 Bonus</span>
                    <span>20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Killing Blow</span>
                    <span>10%</span>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <div className="flex justify-between">
                      <span className="opacity-50">Current Pool</span>
                      <span className="text-yellow-400 font-black">{raid?.rewardPool || '0'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
