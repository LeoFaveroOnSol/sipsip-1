'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from '@solana/spl-token';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Coins, Flame, TrendingUp, Zap, RefreshCw, ExternalLink, Sparkles, HelpCircle, X } from 'lucide-react';

interface TokenFeedingProps {
  onFeedComplete: () => void;
  currentPower?: number;
}

interface TokenBalance {
  balance: number;
  balanceUI: number;
  formatted: string;
  tokenMint: string;
}

interface TreasuryInfo {
  treasuryWallet: string;
  tokenMint: string;
  configured: boolean;
}

interface SkillAcquired {
  name: string;
  emoji: string;
  tier: number;
  tierName: string;
  tierColor: string;
  description: string;
  isNewSkill?: boolean;
  levelUp?: boolean;
  newLevel?: number;
}

interface FeedResult {
  amountFed: number;
  powerGained: number;
  newPower: number;
  skillAcquired?: SkillAcquired | null;
  message: string;
}

export function TokenFeeding({ onFeedComplete, currentPower = 0 }: TokenFeedingProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [treasuryInfo, setTreasuryInfo] = useState<TreasuryInfo | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [feedResult, setFeedResult] = useState<FeedResult | null>(null);
  const [showSkillsModal, setShowSkillsModal] = useState(false);

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

  useEffect(() => {
    fetchBalance();
    fetchTreasuryInfo();
  }, [fetchBalance, fetchTreasuryInfo]);

  const handleFeed = async () => {
    const feedAmount = parseFloat(amount);
    if (isNaN(feedAmount) || feedAmount < 1000) {
      setError('Minimum amount is 1,000 $SIP');
      return;
    }

    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    if (!treasuryInfo?.configured) {
      setError('Treasury wallet not configured');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setTxSignature(null);
    setFeedResult(null);

    try {
      // 1. Build the token transfer transaction
      const tokenMint = new PublicKey(treasuryInfo.tokenMint);
      const treasuryWallet = new PublicKey(treasuryInfo.treasuryWallet);

      // Detect which token program this mint uses (Token or Token-2022)
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

      // Get ATAs - getAssociatedTokenAddressSync(mint, owner, allowOffCurve, tokenProgram, ataProgram)
      const senderATA = getAssociatedTokenAddressSync(tokenMint, publicKey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
      const treasuryATA = getAssociatedTokenAddressSync(tokenMint, treasuryWallet, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);


      // Calculate amount with decimals (6 decimals for pump.fun tokens)
      const decimals = 6;
      const rawAmount = BigInt(Math.floor(feedAmount * Math.pow(10, decimals)));

      // Build transaction
      const transaction = new Transaction();

      // Check if treasury ATA exists by checking account info
      const treasuryATAInfo = await connection.getAccountInfo(treasuryATA);

      // Only create ATA if it doesn't exist
      if (!treasuryATAInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,        // payer
            treasuryATA,      // associatedToken
            treasuryWallet,   // owner
            tokenMint,        // mint
            tokenProgramId,   // tokenProgram (detected)
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Add transfer instruction with detected token program
      transaction.add(
        createTransferInstruction(
          senderATA,
          treasuryATA,
          publicKey,
          rawAmount,
          [],
          tokenProgramId  // Use detected program
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // 2. Sign and send transaction
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      // Wait for confirmation
      setSuccess('Transaction sent! Waiting for confirmation...');

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      setTxSignature(signature);

      // 3. Verify with backend and apply power boost
      const res = await fetch('/api/pet/feed-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txSignature: signature,
          expectedAmount: feedAmount,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Save full result for UI
      setFeedResult(data.data);
      setSuccess(data.data.message || `Fed ${feedAmount.toLocaleString()} $SIP! Power +${data.data.powerGained}`);
      setAmount('');
      onFeedComplete();
      // Refresh balance after feeding
      fetchBalance();

      // Clear after 10 seconds (longer to show skill info)
      setTimeout(() => {
        setSuccess(null);
        setFeedResult(null);
      }, 10000);
    } catch (err: any) {
      console.error('Feed error:', err);
      if (err.message?.includes('User rejected')) {
        setError('Transaction cancelled');
      } else if (err.message?.includes('insufficient')) {
        setError('Insufficient token balance');
      } else {
        setError(err.message || 'Failed to feed tokens');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick amounts in thousands (10K, 50K, 100K, 500K tokens)
  const quickAmounts = [10000, 50000, 100000, 500000];
  // 1 Power per 1000 $SIP (adjusted for low market cap)
  const powerPreview = amount ? Math.floor(parseFloat(amount) / 1000) : 0;

  return (
    <Card padding="md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-400 border-2 border-black flex items-center justify-center">
          <Coins size={20} />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase">Token Feeding</h3>
          <p className="text-[10px] font-mono opacity-50">Feed $SIP to boost power</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border-2 border-black text-xs font-mono text-red-800">
          {`> ${error}`}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border-2 border-black">
          <div className="text-xs font-mono text-green-800 mb-2">
            {`> ${success}`}
          </div>

          {/* Power gained display */}
          {feedResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white/50 p-2 border border-green-300">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-yellow-600" />
                  <span className="text-xs font-bold">POWER GAINED</span>
                </div>
                <span className="font-black text-green-700">+{feedResult.powerGained}</span>
              </div>

              <div className="flex items-center justify-between bg-white/50 p-2 border border-green-300">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-600" />
                  <span className="text-xs font-bold">NEW POWER TOTAL</span>
                </div>
                <span className="font-black text-green-700">{feedResult.newPower}</span>
              </div>

              {/* Skill acquired display */}
              {feedResult.skillAcquired && (
                <div
                  className="p-3 border-2 border-black animate-pulse"
                  style={{ backgroundColor: feedResult.skillAcquired.tierColor + '20' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} style={{ color: feedResult.skillAcquired.tierColor }} />
                    <span className="text-xs font-black uppercase">
                      {feedResult.skillAcquired.isNewSkill ? 'NEW SKILL UNLOCKED!' : 'SKILL LEVEL UP!'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{feedResult.skillAcquired.emoji}</span>
                    <div>
                      <div className="font-black">{feedResult.skillAcquired.name}</div>
                      <div
                        className="text-xs font-bold"
                        style={{ color: feedResult.skillAcquired.tierColor }}
                      >
                        {feedResult.skillAcquired.tierName}
                        {feedResult.skillAcquired.levelUp && ` Lv.${feedResult.skillAcquired.newLevel}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono mt-1 opacity-70">
                    {feedResult.skillAcquired.description}
                  </div>
                </div>
              )}
            </div>
          )}

          {txSignature && (
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-2 text-xs text-green-600 hover:underline"
            >
              View on Solscan <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-100 border-2 border-black p-3 text-center">
            <Zap size={16} className="mx-auto mb-1 text-yellow-600" />
            <div className="text-lg font-black">{currentPower}</div>
            <div className="text-[8px] font-mono opacity-50">CURRENT POWER</div>
          </div>
          <div className="bg-zinc-100 border-2 border-black p-3 text-center relative">
            <button
              onClick={fetchBalance}
              className="absolute top-1 right-1 p-1 hover:bg-zinc-200 rounded"
              disabled={loadingBalance}
            >
              <RefreshCw size={12} className={loadingBalance ? 'animate-spin' : ''} />
            </button>
            <Coins size={16} className="mx-auto mb-1 text-yellow-600" />
            <div className="text-lg font-black">
              {loadingBalance ? '...' : (tokenBalance?.balanceUI?.toLocaleString() || '0')}
            </div>
            <div className="text-[8px] font-mono opacity-50">$SIP BALANCE</div>
          </div>
        </div>

        {/* Token Info */}
        {treasuryInfo?.configured && (
          <div className="text-[9px] font-mono opacity-50 bg-zinc-50 p-2 border border-zinc-200 space-y-1">
            <div>
              <span>Token: </span>
              <span className="break-all">{treasuryInfo.tokenMint.slice(0, 8)}...{treasuryInfo.tokenMint.slice(-4)}</span>
            </div>
            <div>
              <span>Treasury: </span>
              <span className="break-all">{treasuryInfo.treasuryWallet.slice(0, 8)}...{treasuryInfo.treasuryWallet.slice(-4)}</span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block font-black text-xs uppercase tracking-widest mb-2">
            Amount to Feed ($SIP)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Min: 1,000 $SIP"
            className="brutal-input"
          />
          <div className="flex gap-2 mt-2">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="flex-1 py-1 text-xs font-black border-2 border-black bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                {amt >= 1000 ? `${amt / 1000}K` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-yellow-50 border-2 border-black p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-xs font-black">POWER BOOST</span>
              </div>
              <span className="font-black text-green-600">+{powerPreview.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-red-500" />
                <span className="text-xs font-black">BURNED</span>
              </div>
              <span className="font-black text-red-500">
                {(parseFloat(amount) * 0.1).toLocaleString()} $SIP (10%)
              </span>
            </div>
            {powerPreview >= 10 && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-300">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500" />
                  <span className="text-xs font-black">SKILL</span>
                </div>
                <span className="font-black text-purple-600">
                  100% GUARANTEED!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-[10px] font-mono opacity-50 space-y-1">
          <p>* 1 Power per 1,000 $SIP fed</p>
          <p>* 10k+ $SIP = SKILL GUARANTEED!</p>
          <p>* Tier chances: 60% Common, 28% Rare, 10% Epic, 2% Legendary</p>
          <p>* Higher total power = better tier chances</p>
        </div>

        {/* View Skills Button */}
        <button
          onClick={() => setShowSkillsModal(true)}
          className="w-full py-2 text-xs font-bold border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={14} className="text-purple-500" />
          VIEW ALL SKILLS
          <HelpCircle size={14} className="text-purple-400" />
        </button>

        {!connected ? (
          <div className="p-3 bg-zinc-100 border-2 border-black text-center">
            <p className="text-xs font-mono">Connect wallet to feed tokens</p>
          </div>
        ) : (
          <Button
            onClick={handleFeed}
            disabled={!amount || loading || parseFloat(amount) < 1000 || !treasuryInfo?.configured}
            fullWidth
            variant="primary"
          >
            {loading ? 'PROCESSING...' : '🍖 FEED TOKEN'}
          </Button>
        )}
      </div>

      {/* Skills Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black max-w-lg w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-purple-500 text-white p-4 border-b-4 border-black flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <span className="font-black text-lg">BATTLE SKILLS</span>
              </div>
              <button
                onClick={() => setShowSkillsModal(false)}
                className="p-1 hover:bg-purple-600 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* How to Get Skills */}
            <div className="p-4 bg-yellow-50 border-b-2 border-black">
              <h3 className="font-black text-sm mb-2">🎯 HOW TO GET SKILLS</h3>
              <div className="text-xs font-mono space-y-1">
                <p>• Feed your pet with <strong>10,000+ $SIP</strong></p>
                <p>• Each 10k+ feed guarantees <strong>100% a skill!</strong></p>
                <p>• Tier is random based on chances below</p>
                <p>• Maximum of <strong>6 skills</strong> per pet</p>
                <p>• After that, you get <strong>level ups</strong></p>
              </div>
            </div>

            {/* Tier Chances */}
            <div className="p-4 border-b-2 border-black">
              <h3 className="font-black text-sm mb-3">📊 TIER CHANCES</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-100 border-2 border-gray-300">
                  <span className="font-bold text-gray-600">⚪ Common</span>
                  <div className="text-right">
                    <span className="font-black">60%</span>
                    <span className="text-[10px] ml-2 opacity-50">0+ Power</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 border-2 border-blue-300">
                  <span className="font-bold text-blue-600">🔵 Rare</span>
                  <div className="text-right">
                    <span className="font-black">28%</span>
                    <span className="text-[10px] ml-2 opacity-50">100+ Power</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 border-2 border-purple-300">
                  <span className="font-bold text-purple-600">🟣 Epic</span>
                  <div className="text-right">
                    <span className="font-black">10%</span>
                    <span className="text-[10px] ml-2 opacity-50">500+ Power</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 border-2 border-yellow-400">
                  <span className="font-bold text-yellow-600">🟡 Legendary</span>
                  <div className="text-right">
                    <span className="font-black">2%</span>
                    <span className="text-[10px] ml-2 opacity-50">1000+ Power</span>
                  </div>
                </div>
              </div>
            </div>

            {/* All Skills List */}
            <div className="p-4">
              <h3 className="font-black text-sm mb-3">⚔️ ALL SKILLS</h3>

              {/* Common Skills */}
              <div className="mb-4">
                <div className="text-xs font-black text-gray-500 mb-2 uppercase">Common (Tier 1)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 border border-gray-200 text-xs">
                    <span className="text-lg">👊</span> <strong>Quick Jab</strong>
                    <p className="text-[10px] opacity-60">+5% damage</p>
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-200 text-xs">
                    <span className="text-lg">🛡️</span> <strong>Thick Skin</strong>
                    <p className="text-[10px] opacity-60">+5% defense</p>
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-200 text-xs">
                    <span className="text-lg">🍀</span> <strong>Lucky Charm</strong>
                    <p className="text-[10px] opacity-60">+3% crit chance</p>
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-200 text-xs">
                    <span className="text-lg">💨</span> <strong>Nimble Feet</strong>
                    <p className="text-[10px] opacity-60">+3% dodge</p>
                  </div>
                </div>
              </div>

              {/* Rare Skills */}
              <div className="mb-4">
                <div className="text-xs font-black text-blue-500 mb-2 uppercase">Rare (Tier 2)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-200 text-xs">
                    <span className="text-lg">💥</span> <strong>Power Strike</strong>
                    <p className="text-[10px] opacity-60">+10% damage</p>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 text-xs">
                    <span className="text-lg">🔰</span> <strong>Iron Will</strong>
                    <p className="text-[10px] opacity-60">+10% defense</p>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 text-xs">
                    <span className="text-lg">🎰</span> <strong>Fortune&apos;s Favor</strong>
                    <p className="text-[10px] opacity-60">+5% luck modifier</p>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 text-xs">
                    <span className="text-lg">👤</span> <strong>Shadow Step</strong>
                    <p className="text-[10px] opacity-60">+8% dodge</p>
                  </div>
                </div>
              </div>

              {/* Epic Skills */}
              <div className="mb-4">
                <div className="text-xs font-black text-purple-500 mb-2 uppercase">Epic (Tier 3)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-purple-50 border border-purple-200 text-xs">
                    <span className="text-lg">😤</span> <strong>Berserker Rage</strong>
                    <p className="text-[10px] opacity-60">+18% damage</p>
                  </div>
                  <div className="p-2 bg-purple-50 border border-purple-200 text-xs">
                    <span className="text-lg">💎</span> <strong>Diamond Body</strong>
                    <p className="text-[10px] opacity-60">+18% defense</p>
                  </div>
                  <div className="p-2 bg-purple-50 border border-purple-200 text-xs">
                    <span className="text-lg">🎯</span> <strong>Critical Eye</strong>
                    <p className="text-[10px] opacity-60">+12% crit chance</p>
                  </div>
                  <div className="p-2 bg-purple-50 border border-purple-200 text-xs">
                    <span className="text-lg">⚡</span> <strong>Power Surge</strong>
                    <p className="text-[10px] opacity-60">+15% power scaling</p>
                  </div>
                </div>
              </div>

              {/* Legendary Skills */}
              <div>
                <div className="text-xs font-black text-yellow-600 mb-2 uppercase">Legendary (Tier 4)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-yellow-50 border border-yellow-300 text-xs">
                    <span className="text-lg">💀</span> <strong>Death Blow</strong>
                    <p className="text-[10px] opacity-60">+30% damage</p>
                  </div>
                  <div className="p-2 bg-yellow-50 border border-yellow-300 text-xs">
                    <span className="text-lg">🏆</span> <strong>Immortal Shield</strong>
                    <p className="text-[10px] opacity-60">+30% defense</p>
                  </div>
                  <div className="p-2 bg-yellow-50 border border-yellow-300 text-xs">
                    <span className="text-lg">🌟</span> <strong>Fate Bender</strong>
                    <p className="text-[10px] opacity-60">+15% luck modifier</p>
                  </div>
                  <div className="p-2 bg-yellow-50 border border-yellow-300 text-xs">
                    <span className="text-lg">👑</span> <strong>Ascendant Power</strong>
                    <p className="text-[10px] opacity-60">+25% power scaling</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-4 bg-zinc-100 border-t-4 border-black">
              <button
                onClick={() => setShowSkillsModal(false)}
                className="w-full py-3 font-black border-4 border-black bg-white hover:bg-zinc-50 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
