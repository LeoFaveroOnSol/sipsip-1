'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PowerMeter from './PowerMeter';

interface StakingInfo {
  staked: number;
  stakedFormatted: string;
  power: number;
  pendingRewards: number;
  pendingRewardsFormatted: string;
  apy: number;
  nextClaimIn: string;
  isWinningTribe: boolean;
}

interface StakePanelProps {
  tribe: string;
  onStake?: (amount: number) => Promise<void>;
  onUnstake?: (amount: number) => Promise<void>;
  onClaim?: () => Promise<void>;
}

export default function StakePanel({ tribe, onStake, onUnstake, onClaim }: StakePanelProps) {
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'stake' | 'unstake'>('stake');
  const [error, setError] = useState<string | null>(null);

  // Fetch staking info
  useEffect(() => {
    fetchStakingInfo();
  }, []);

  const fetchStakingInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staking/status');
      const data = await res.json();

      if (data.success) {
        setStakingInfo(data.data);
      }
    } catch (err) {
      console.error('Error fetching staking info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setActionLoading('stake');
    setError(null);

    try {
      if (onStake) {
        await onStake(numAmount);
      } else {
        const res = await fetch('/api/staking/stake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: numAmount }),
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error);
        }
      }

      setAmount('');
      await fetchStakingInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Staking failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnstake = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setActionLoading('unstake');
    setError(null);

    try {
      if (onUnstake) {
        await onUnstake(numAmount);
      } else {
        const res = await fetch('/api/staking/unstake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: numAmount }),
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error);
        }
      }

      setAmount('');
      await fetchStakingInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unstaking failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaim = async () => {
    setActionLoading('claim');
    setError(null);

    try {
      if (onClaim) {
        await onClaim();
      } else {
        const res = await fetch('/api/staking/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error);
        }
      }

      await fetchStakingInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-20 bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-mono text-white uppercase tracking-wider">
            $SIP Staking
          </h3>
          {stakingInfo?.isWinningTribe && (
            <span className="text-xs font-mono px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
              +20% APY BONUS
            </span>
          )}
        </div>

        {/* Power Meter */}
        <div>
          <PowerMeter
            power={stakingInfo?.power || 0}
            tribe={tribe}
            size="lg"
            animated
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Staked</div>
            <div className="text-xl font-mono text-white">
              {stakingInfo?.stakedFormatted || '0'} <span className="text-sm text-gray-400">$SIP</span>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">APY</div>
            <div className="text-xl font-mono text-green-400">
              {((stakingInfo?.apy || 0.03) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pending Rewards</div>
                <div className="text-xl font-mono text-yellow-400">
                  {stakingInfo?.pendingRewardsFormatted || '0'} <span className="text-sm text-gray-400">$SIP</span>
                </div>
              </div>
              <Button
                onClick={handleClaim}
                disabled={!stakingInfo?.pendingRewards || actionLoading === 'claim'}
                variant="secondary"
                size="sm"
              >
                {actionLoading === 'claim' ? 'Claiming...' : 'Claim'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stake/Unstake Toggle */}
        <div className="flex rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setMode('stake')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-mono transition-colors ${
              mode === 'stake'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => setMode('unstake')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-mono transition-colors ${
              mode === 'unstake'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Unstake
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-gray-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
              $SIP
            </span>
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2">
            {['25%', '50%', '75%', 'MAX'].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  if (mode === 'stake') {
                    // TODO: Get user balance
                    setAmount('100'); // Placeholder
                  } else {
                    const staked = stakingInfo?.staked || 0;
                    const percent = pct === 'MAX' ? 1 : parseInt(pct) / 100;
                    setAmount((staked * percent).toFixed(2));
                  }
                }}
                className="flex-1 py-1 text-xs font-mono text-gray-400 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              >
                {pct}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-sm font-mono bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={mode === 'stake' ? handleStake : handleUnstake}
          disabled={!amount || actionLoading !== null}
          variant={mode === 'stake' ? 'primary' : 'secondary'}
          className="w-full"
        >
          {actionLoading ? (
            `${mode === 'stake' ? 'Staking' : 'Unstaking'}...`
          ) : (
            `${mode === 'stake' ? 'Stake' : 'Unstake'} $SIP`
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          {mode === 'stake' ? (
            <>Staking increases your Power. Power = sqrt(staked) × multipliers</>
          ) : (
            <>Warning: Unstaking during neglect will incur a 1% daily penalty</>
          )}
        </p>
      </div>
    </Card>
  );
}
