'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from '@solana/spl-token';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Terminal } from '@/components/ui/Terminal';
import { Swords, Trophy, Zap, Target, RefreshCw, ExternalLink, Coins } from 'lucide-react';
import { TRIBES, BATTLE_CONFIG } from '@/lib/constants';
import { TribeIcon } from '@/components/ui/TribeIcon';

interface TreasuryInfo {
  treasuryWallet: string;
  tokenMint: string;
  configured: boolean;
}

interface TokenBalance {
  balance: number;
  balanceUI: number;
  formatted: string;
}

interface PendingBattle {
  id: string;
  betAmount: string;
  betAmountRaw: number;
  challenger: {
    wallet: string;
    pet: {
      id: string;
      name: string;
      tribe: string;
      stage: string;
      formId: string;
    };
    power: number;
  };
  powerMatch: {
    userPower: number;
    challengerPower: number;
    isInPowerBand: boolean;
    powerDiffPercent: string;
  };
  createdAt: Date;
}

interface BattleHistory {
  id: string;
  status: string;
  betAmount: string;
  isChallenger: boolean;
  opponent: {
    id: string;
    name: string;
    tribe: string;
  };
  myPower: number;
  opponentPower: number;
  won: boolean;
  prizePool: string | null;
  createdAt: Date;
}

interface Stats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: string;
}

interface PetSkill {
  id: string;
  skillId: string;
  name: string;
  description: string;
  emoji: string;
  tier: number;
  tierName: string;
  tierColor: string;
  level: number;
  maxLevel: number;
  category: string;
  effectType: string;
  effectValue: number;
  effectPercent: number;
}

interface SkillsData {
  skills: PetSkill[];
  summary: {
    totalSkills: number;
    byTier: Record<number, number>;
    averageLevel: number;
    topSkill: { name: string; emoji: string; tier: number; tierName: string } | null;
  };
  combinedEffects: {
    damageBoost: number;
    defenseBoost: number;
    critChance: number;
    dodgeChance: number;
    luckModifier: number;
    powerScaling: number;
  };
}

type TabType = 'find' | 'create' | 'history';

export default function BattlePage() {
  const { user } = useAuth();
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [activeTab, setActiveTab] = useState<TabType>('find');
  const [pendingBattles, setPendingBattles] = useState<PendingBattle[]>([]);
  const [battleHistory, setBattleHistory] = useState<BattleHistory[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userPower, setUserPower] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['Battle system online...']);
  const [betAmount, setBetAmount] = useState('');
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Token state
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [treasuryInfo, setTreasuryInfo] = useState<TreasuryInfo | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Skills state
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch('/api/token/balance');
      const data = await res.json();
      if (data.success) {
        setTokenBalance(data.data);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const fetchTreasuryInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/pet/feed-token');
      const data = await res.json();
      if (data.success) {
        setTreasuryInfo(data.data);
      }
    } catch (err) {
      console.error('Error fetching treasury info:', err);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/pet/skills');
      const data = await res.json();
      if (data.success) {
        setSkillsData(data.data);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPendingBattles();
      fetchBattleHistory();
      fetchBalance();
      fetchTreasuryInfo();
      fetchSkills();
    }
  }, [user, fetchBalance, fetchTreasuryInfo, fetchSkills]);

  const fetchPendingBattles = async () => {
    try {
      const res = await fetch('/api/battle/pending');
      const data = await res.json();

      if (data.success) {
        setPendingBattles(data.data.battles);
        setUserPower(data.data.userPower);
        addLog(`Found ${data.data.battles.length} open challenges`);
        setError(null);
      } else if (data.error !== 'Not authenticated') {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching pending battles:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Network error - check if browser extensions are blocking requests');
      }
    }
  };

  const fetchBattleHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/battle/history?limit=10');
      const data = await res.json();

      if (data.success) {
        setBattleHistory(data.data.battles);
        setStats(data.data.stats);
      } else if (data.error !== 'Not authenticated') {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching battle history:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Network error - check if browser extensions are blocking requests');
      }
    } finally {
      setLoading(false);
    }
  };

  // Build and send token transfer transaction
  const sendTokenTransfer = async (amount: number): Promise<string | null> => {
    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet');
      return null;
    }

    if (!treasuryInfo?.configured) {
      setError('Treasury wallet not configured');
      return null;
    }

    try {
      const tokenMint = new PublicKey(treasuryInfo.tokenMint);
      const treasuryWallet = new PublicKey(treasuryInfo.treasuryWallet);

      // Detect which token program this mint uses
      let tokenProgramId = TOKEN_PROGRAM_ID;
      try {
        await getMint(connection, tokenMint, 'confirmed', TOKEN_PROGRAM_ID);
      } catch {
        try {
          await getMint(connection, tokenMint, 'confirmed', TOKEN_2022_PROGRAM_ID);
          tokenProgramId = TOKEN_2022_PROGRAM_ID;
        } catch {
          // Default to standard Token Program
        }
      }

      // Get ATAs
      const senderATA = getAssociatedTokenAddressSync(tokenMint, publicKey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
      const treasuryATA = getAssociatedTokenAddressSync(tokenMint, treasuryWallet, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);

      // Calculate amount with decimals (6 decimals for pump.fun tokens)
      const decimals = 6;
      const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));

      // Build transaction
      const transaction = new Transaction();

      // Check if treasury ATA exists
      const treasuryATAInfo = await connection.getAccountInfo(treasuryATA);

      if (!treasuryATAInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            treasuryATA,
            treasuryWallet,
            tokenMint,
            tokenProgramId,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderATA,
          treasuryATA,
          publicKey,
          rawAmount,
          [],
          tokenProgramId
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return signature;
    } catch (err: any) {
      console.error('Token transfer error:', err);
      if (err.message?.includes('User rejected')) {
        setError('Transaction cancelled');
      } else if (err.message?.includes('insufficient')) {
        setError('Insufficient token balance');
      } else {
        setError(err.message || 'Failed to transfer tokens');
      }
      return null;
    }
  };

  const handleCreateBattle = async () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < BATTLE_CONFIG.minBet) {
      setError(`Minimum bet is ${BATTLE_CONFIG.minBet.toLocaleString()} $SIP`);
      return;
    }

    if (!connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    setActionLoading('create');
    setError(null);
    setSuccess(null);
    setTxSignature(null);
    addLog(`Creating challenge for ${amount.toLocaleString()} $SIP...`);
    addLog('Sending token transfer...');

    try {
      // First, send the token transfer
      const signature = await sendTokenTransfer(amount);

      if (!signature) {
        setActionLoading(null);
        return;
      }

      setTxSignature(signature);
      addLog('Transaction confirmed! Creating battle...');

      // Then create the battle with the tx signature
      const res = await fetch('/api/battle/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: amount, txSignature: signature }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setSuccess(`Challenge created! Bet: ${amount.toLocaleString()} $SIP`);
      addLog('Challenge created! Waiting for opponent...');
      setBetAmount('');
      setActiveTab('find');
      await fetchPendingBattles();
      await fetchBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create battle');
      addLog('ERROR: Failed to create challenge');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptBattle = async (battleId: string, betAmountRaw: number) => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    // betAmountRaw is already in display format from the API
    const amount = betAmountRaw / Math.pow(10, 6);

    setActionLoading(battleId);
    setError(null);
    setSuccess(null);
    setTxSignature(null);
    addLog('Accepting challenge...');
    addLog(`Sending ${amount.toLocaleString()} $SIP...`);

    try {
      // First, send the token transfer to match the bet
      const signature = await sendTokenTransfer(amount);

      if (!signature) {
        setActionLoading(null);
        return;
      }

      setTxSignature(signature);
      addLog('Transaction confirmed! Fighting...');

      // Then accept the battle
      const res = await fetch('/api/battle/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, txSignature: signature }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const won = data.data?.winnerId === user?.id;
      if (won) {
        setSuccess(`Victory! You won ${data.data.prizePool} $SIP!`);
        addLog('VICTORY!');
      } else {
        setSuccess('Defeat... Better luck next time!');
        addLog('DEFEAT...');
      }

      await fetchPendingBattles();
      await fetchBattleHistory();
      await fetchBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept battle');
      addLog('ERROR: Battle failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Quick bet amounts (10K, 50K, 100K, 500K)
  const quickAmounts = [10000, 50000, 100000, 500000];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card size="md" padding="lg" className="text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="font-black text-xl uppercase mb-2">Battle Arena</h2>
          <p className="font-mono text-sm opacity-60">Connect wallet to enter</p>
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
            Battle Arena
          </h1>
          <p className="font-mono text-sm opacity-60">
            PvP combat. Winner takes 90%. 10% burned forever.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card size="sm" padding="md" className="text-center">
            <div className="text-3xl font-black">{stats?.totalBattles || 0}</div>
            <div className="text-[10px] font-mono uppercase opacity-50">Total Battles</div>
          </Card>
          <Card size="sm" padding="md" className="text-center bg-green-50">
            <div className="text-3xl font-black text-green-600">{stats?.wins || 0}</div>
            <div className="text-[10px] font-mono uppercase opacity-50">Victories</div>
          </Card>
          <Card size="sm" padding="md" className="text-center bg-red-50">
            <div className="text-3xl font-black text-red-600">{stats?.losses || 0}</div>
            <div className="text-[10px] font-mono uppercase opacity-50">Defeats</div>
          </Card>
          <Card size="sm" padding="md" className="text-center bg-yellow-50">
            <div className="text-3xl font-black text-yellow-600">{stats?.winRate || '0'}%</div>
            <div className="text-[10px] font-mono uppercase opacity-50">Win Rate</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Power & Balance Display */}
            <div className="grid grid-cols-2 gap-4">
              <Card size="sm" padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black flex items-center justify-center">
                    <Zap className="text-yellow-400" size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase opacity-50">Your Battle Power</div>
                    <div className="text-2xl font-black">{userPower.toLocaleString()}</div>
                  </div>
                </div>
              </Card>
              <Card size="sm" padding="md">
                <div className="flex items-center gap-3 relative">
                  <button
                    onClick={fetchBalance}
                    className="absolute top-0 right-0 p-1 hover:bg-zinc-200 rounded"
                    disabled={loadingBalance}
                  >
                    <RefreshCw size={12} className={loadingBalance ? 'animate-spin' : ''} />
                  </button>
                  <div className="w-12 h-12 bg-yellow-400 border-2 border-black flex items-center justify-center">
                    <Coins size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase opacity-50">$SIP Balance</div>
                    <div className="text-2xl font-black">
                      {loadingBalance ? '...' : (tokenBalance?.balanceUI?.toLocaleString() || '0')}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { id: 'find' as TabType, label: 'Find Battles', icon: Target },
                { id: 'create' as TabType, label: 'Create Challenge', icon: Swords },
                { id: 'history' as TabType, label: 'History', icon: Trophy },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 font-black text-xs uppercase
                    border-4 border-black transition-all
                    ${activeTab === tab.id
                      ? 'bg-black text-white shadow-none translate-x-1 translate-y-1'
                      : 'bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                    }
                  `}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <Card size="sm" padding="sm" className="bg-red-100 border-red-600">
                <p className="font-mono text-sm text-red-800">{`> ERROR: ${error}`}</p>
              </Card>
            )}

            {/* Success Message */}
            {success && (
              <Card size="sm" padding="sm" className="bg-green-100 border-green-600">
                <p className="font-mono text-sm text-green-800">{`> ${success}`}</p>
                {txSignature && (
                  <a
                    href={`https://solscan.io/tx/${txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mt-1 text-green-600 hover:underline text-xs"
                  >
                    View on Solscan <ExternalLink size={10} />
                  </a>
                )}
              </Card>
            )}

            {/* Tab Content */}
            {activeTab === 'find' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase">Open Challenges</h2>
                  <Button onClick={fetchPendingBattles} size="sm">
                    REFRESH
                  </Button>
                </div>

                {pendingBattles.length === 0 ? (
                  <Card padding="lg" className="text-center">
                    <div className="text-6xl mb-4">⚔️</div>
                    <p className="font-mono text-sm opacity-60">No battles available</p>
                    <p className="font-mono text-xs opacity-40 mt-2">Create your own challenge!</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pendingBattles.map(battle => {
                      const tribeInfo = TRIBES[battle.challenger.pet.tribe as keyof typeof TRIBES];
                      return (
                        <Card key={battle.id} size="sm" padding="md" hover>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 border-2 border-black flex items-center justify-center ${
                                battle.challenger.pet.tribe === 'FOFO' ? 'bg-pink-200' :
                                battle.challenger.pet.tribe === 'CAOS' ? 'bg-red-200' :
                                battle.challenger.pet.tribe === 'CHAD' ? 'bg-emerald-200' :
                                'bg-violet-200'
                              }`}>
                                <TribeIcon tribe={battle.challenger.pet.tribe} size={28} />
                              </div>
                              <div>
                                <div className="font-black uppercase">{battle.challenger.pet.name}</div>
                                <div className="text-[10px] font-mono opacity-50">
                                  {battle.challenger.pet.tribe} • PWR: {battle.challenger.power}
                                </div>
                                <div className="text-xs font-mono mt-1">
                                  <span className={battle.powerMatch.isInPowerBand ? 'text-green-600' : 'text-red-600'}>
                                    {battle.powerMatch.powerDiffPercent}% power diff
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-black text-yellow-600">{battle.betAmount}</div>
                              <div className="text-[10px] font-mono opacity-50">$SIP BET</div>
                              <Button
                                onClick={() => handleAcceptBattle(battle.id, battle.betAmountRaw)}
                                disabled={actionLoading === battle.id || !battle.powerMatch.isInPowerBand || !connected}
                                size="sm"
                                variant="primary"
                                className="mt-2"
                              >
                                {actionLoading === battle.id ? 'FIGHTING...' : 'ACCEPT'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <Card padding="lg">
                <h2 className="text-xl font-black uppercase mb-6">Create Challenge</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block font-black text-xs uppercase tracking-widest mb-2">
                      Bet Amount ($SIP)
                    </label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder={`Minimum: ${BATTLE_CONFIG.minBet.toLocaleString()}`}
                      className="brutal-input"
                    />
                    <div className="flex gap-2 mt-3">
                      {quickAmounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount.toString())}
                          className="flex-1 py-2 text-xs font-black border-2 border-black bg-zinc-100 hover:bg-zinc-200 transition-colors"
                        >
                          {amount >= 1000 ? `${amount / 1000}K` : amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {betAmount && parseFloat(betAmount) > 0 && (
                    <Card size="sm" padding="md" className="bg-zinc-100">
                      <div className="text-xs font-black uppercase mb-3">Prize Breakdown</div>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="flex justify-between">
                          <span className="opacity-50">Total Pot</span>
                          <span className="font-black">{(parseFloat(betAmount) * 2).toLocaleString()} $SIP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-50">Winner (90%)</span>
                          <span className="font-black text-green-600">+{(parseFloat(betAmount) * 2 * 0.9).toLocaleString()} $SIP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-50">Burned (10%)</span>
                          <span className="font-black text-red-600">🔥 {(parseFloat(betAmount) * 2 * 0.1).toLocaleString()} $SIP</span>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="text-[10px] font-mono opacity-50 space-y-1">
                    <p>* Minimum bet: {BATTLE_CONFIG.minBet.toLocaleString()} $SIP</p>
                    <p>* Win chance based on power difference (50% base +/- advantage)</p>
                    <p>* Tokens sent to treasury escrow</p>
                  </div>

                  {!connected ? (
                    <div className="p-3 bg-zinc-100 border-2 border-black text-center">
                      <p className="text-xs font-mono">Connect wallet to create challenge</p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCreateBattle}
                      disabled={!betAmount || actionLoading === 'create' || parseFloat(betAmount) < BATTLE_CONFIG.minBet || !treasuryInfo?.configured}
                      fullWidth
                      variant="primary"
                    >
                      {actionLoading === 'create' ? 'PROCESSING...' : 'CREATE CHALLENGE'}
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h2 className="text-xl font-black uppercase">Battle History</h2>

                {loading ? (
                  <Card padding="lg" className="text-center">
                    <p className="font-mono text-sm animate-pulse">Loading history...</p>
                  </Card>
                ) : battleHistory.length === 0 ? (
                  <Card padding="lg" className="text-center">
                    <p className="font-mono text-sm opacity-60">No battles yet</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {battleHistory.map(battle => {
                      const isPending = battle.status === 'PENDING';
                      const isCancelled = battle.status === 'CANCELLED';
                      const hasOpponent = battle.opponent && battle.opponent.name;

                      return (
                        <Card key={battle.id} size="sm" padding="md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 flex items-center justify-center text-xl ${
                                isPending ? 'bg-yellow-200' :
                                isCancelled ? 'bg-gray-200' :
                                battle.won ? 'bg-green-200' : 'bg-red-200'
                              }`}>
                                {isPending ? '⏳' : isCancelled ? '✕' : battle.won ? 'W' : 'L'}
                              </div>
                              <div>
                                <div className="font-black uppercase text-sm">
                                  {isPending ? 'Waiting for opponent...' :
                                   isCancelled ? 'Cancelled' :
                                   hasOpponent ? `vs ${battle.opponent.name}` : 'Battle'}
                                </div>
                                <div className="text-[10px] font-mono opacity-50">
                                  {hasOpponent ? `${battle.opponent.tribe} - ` : ''}
                                  {new Date(battle.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-black ${
                                isPending ? 'text-yellow-600' :
                                isCancelled ? 'text-gray-500' :
                                battle.won ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isPending || isCancelled ? '' : battle.won ? '+' : '-'}{battle.betAmount}
                              </div>
                              <div className="text-[10px] font-mono opacity-50">
                                {isPending ? 'PENDING' : isCancelled ? 'CANCELLED' : '$SIP'}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
                How Battle Works
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 font-black">1.</span>
                  <span>Create challenge with $SIP bet (min {(BATTLE_CONFIG.minBet / 1000).toFixed(0)}K)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 font-black">2.</span>
                  <span>Opponent matches your bet</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 font-black">3.</span>
                  <span>Power determines win chance</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-black">+</span>
                  <span>Winner takes 90% of pot</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-black">*</span>
                  <span>10% burned = deflation</span>
                </div>
              </div>

              {/* Power Band Explanation */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-zinc-300">
                <h4 className="font-black text-[10px] uppercase tracking-widest mb-2 opacity-60">
                  Power Matchmaking
                </h4>
                <div className="space-y-2 text-[10px] font-mono">
                  <p className="opacity-70">
                    You can only accept battles within <span className="font-black text-green-600">±20%</span> of your power level.
                  </p>
                  <p className="opacity-70">
                    <span className="text-green-600">Green %</span> = can accept
                    <br />
                    <span className="text-red-600">Red %</span> = too far apart
                  </p>
                </div>
              </div>

              {/* Skills System Explanation */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-zinc-300">
                <h4 className="font-black text-[10px] uppercase tracking-widest mb-2 opacity-60">
                  Skills System
                </h4>
                <div className="space-y-2 text-[10px] font-mono">
                  <p className="opacity-70">
                    <span className="font-black text-purple-600">Feed $SIP</span> to unlock battle skills!
                  </p>
                  <p className="opacity-70">
                    Skills add <span className="text-yellow-600 font-black">luck variance</span> to battles.
                    Even weaker pets can win with good skills!
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-500">Common 60%</p>
                    <p className="text-blue-500">Rare 28% (+100 power)</p>
                    <p className="text-purple-500">Epic 10% (+500 power)</p>
                    <p className="text-yellow-500">Legendary 2% (+1000 power)</p>
                  </div>
                  <p className="opacity-50 mt-2">
                    More $SIP = better skill drops!
                  </p>
                </div>
              </div>
            </Card>

            {/* Your Skills */}
            <Card padding="md" className="border-2 border-purple-300">
              <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2">
                <span className="text-purple-600">Your Skills</span>
                <span className="text-[10px] font-mono opacity-50">
                  {skillsData ? `${skillsData.skills.length}/6` : '...'}
                </span>
              </h3>
              {skillsData && skillsData.skills.length > 0 ? (
                <div className="space-y-2">
                  {skillsData.skills.slice(0, 4).map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 p-2 bg-zinc-50 rounded border">
                      <span className="text-lg">{skill.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs truncate">{skill.name}</span>
                          <span className="text-[8px] px-1 rounded" style={{ backgroundColor: skill.tierColor, color: 'white' }}>
                            Lv.{skill.level}
                          </span>
                        </div>
                        <p className="text-[9px] font-mono opacity-50">+{skill.effectPercent}% {skill.effectType.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                  {skillsData.skills.length > 4 && (
                    <p className="text-[10px] font-mono text-center opacity-50">
                      +{skillsData.skills.length - 4} more skills
                    </p>
                  )}
                  {/* Combined Effects */}
                  <div className="mt-3 pt-3 border-t border-dashed border-zinc-300">
                    <p className="text-[10px] font-black uppercase opacity-50 mb-2">Battle Bonuses</p>
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                      {skillsData.combinedEffects.damageBoost > 0 && (
                        <span className="text-red-600">+{skillsData.combinedEffects.damageBoost}% DMG</span>
                      )}
                      {skillsData.combinedEffects.defenseBoost > 0 && (
                        <span className="text-blue-600">+{skillsData.combinedEffects.defenseBoost}% DEF</span>
                      )}
                      {skillsData.combinedEffects.critChance > 0 && (
                        <span className="text-orange-600">+{skillsData.combinedEffects.critChance}% CRIT</span>
                      )}
                      {skillsData.combinedEffects.dodgeChance > 0 && (
                        <span className="text-green-600">+{skillsData.combinedEffects.dodgeChance}% DODGE</span>
                      )}
                      {skillsData.combinedEffects.luckModifier > 0 && (
                        <span className="text-yellow-600">+{skillsData.combinedEffects.luckModifier}% LUCK</span>
                      )}
                      {skillsData.combinedEffects.powerScaling > 0 && (
                        <span className="text-purple-600">+{skillsData.combinedEffects.powerScaling}% PWR</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[10px] font-mono opacity-50">No skills yet</p>
                  <p className="text-[9px] font-mono opacity-30 mt-1">Feed $SIP to unlock skills!</p>
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card padding="md" className="bg-black text-white">
              <h3 className="font-black text-sm uppercase mb-4">Arena Stats</h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="opacity-50">Your Rank</span>
                  <span>#--</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">Total Earned</span>
                  <span className="text-green-400">+0 $SIP</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50">Total Lost</span>
                  <span className="text-red-400">-0 $SIP</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
