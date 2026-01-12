'use client';

import Link from 'next/link';
import {
  Egg,
  Heart,
  Zap,
  Swords,
  Trophy,
  Users,
  ArrowLeft,
  Sparkles,
  Clock,
  Target,
  Shield,
  Star,
  Wallet,
  MessageSquare,
  Coins,
  Skull,
  Flame,
  TrendingUp,
} from 'lucide-react';

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white pt-20 pb-32">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-8 hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="border-4 border-black p-8 mb-12 bg-gradient-to-br from-pink-100 via-violet-100 to-emerald-100">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-4">
            SipSip Documentation
          </h1>
          <p className="text-lg font-mono">
            Everything you need to know about your virtual pet, $SIP token, battles, raids, and tribal warfare.
          </p>
        </div>

        {/* Table of Contents */}
        <section className="mb-12">
          <h2 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">
            Table of Contents
          </h2>
          <nav className="space-y-2 font-mono text-sm">
            <a href="#getting-started" className="block hover:underline">1. Getting Started</a>
            <a href="#tribes" className="block hover:underline">2. The Four Tribes</a>
            <a href="#pet-care" className="block hover:underline">3. Pet Care</a>
            <a href="#sip-token" className="block hover:underline">4. $SIP Token & Power</a>
            <a href="#token-feeding" className="block hover:underline">5. Token Feeding</a>
            <a href="#pvp-battles" className="block hover:underline">6. PvP Battles</a>
            <a href="#skills" className="block hover:underline">7. Battle Skills</a>
            <a href="#boss-raids" className="block hover:underline">8. Boss Raids</a>
            <a href="#evolution" className="block hover:underline">9. Evolution Stages</a>
            <a href="#tribe-wars" className="block hover:underline">10. Weekly Tribe Wars</a>
            <a href="#scoring" className="block hover:underline">11. Scoring System</a>
            <a href="#social" className="block hover:underline">12. Social & Chat</a>
            <a href="#council" className="block hover:underline">13. Council & Governance</a>
            <a href="#seasons" className="block hover:underline">14. Seasons</a>
            <a href="#faq" className="block hover:underline">15. FAQ</a>
          </nav>
        </section>

        {/* Getting Started */}
        <section id="getting-started" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">1. Getting Started</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-4">
            <p className="font-mono">
              Welcome to SipSip! Here&apos;s how to begin your journey:
            </p>
            <ol className="list-decimal list-inside space-y-3 font-mono">
              <li>
                <strong>Connect Your Wallet:</strong> Use your Solana wallet (Phantom, Solflare, etc.) to sign in. Your wallet address becomes your unique identity.
              </li>
              <li>
                <strong>Choose Your Tribe:</strong> Pick one of the four tribes that resonates with your personality. This choice is permanent for your pet!
              </li>
              <li>
                <strong>Adopt Your Pet:</strong> Name your pet and watch it hatch from its egg. Every pet starts as a unique egg.
              </li>
              <li>
                <strong>Start Caring:</strong> Feed, play with, and care for your pet to keep it happy and help it evolve.
              </li>
              <li>
                <strong>Power Up:</strong> Feed $SIP tokens to your pet to gain Power for battles and raids.
              </li>
            </ol>
          </div>
        </section>

        {/* The Four Tribes */}
        <section id="tribes" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">2. The Four Tribes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FOFO */}
            <div className="border-4 border-black p-4 bg-pink-50">
              <h3 className="font-black text-xl mb-2 flex items-center gap-2">
                <span className="text-2xl">🧸</span> FOFO
              </h3>
              <p className="font-mono text-sm mb-2">The Cozy Tribe</p>
              <p className="text-sm mb-3">
                For those who prioritize comfort, care, and community. FOFO pets thrive on affection and spread warmth wherever they go.
              </p>
              <div className="bg-pink-200 border-2 border-black p-2 text-xs font-mono">
                <strong>Bonus:</strong> +10% stat gain from care actions
              </div>
            </div>

            {/* CAOS */}
            <div className="border-4 border-black p-4 bg-red-50">
              <h3 className="font-black text-xl mb-2 flex items-center gap-2">
                <span className="text-2xl">🔥</span> CAOS
              </h3>
              <p className="font-mono text-sm mb-2">The Chaotic Tribe</p>
              <p className="text-sm mb-3">
                Embrace the unpredictable! CAOS members thrive in disorder and find beauty in randomness.
              </p>
              <div className="bg-red-200 border-2 border-black p-2 text-xs font-mono">
                <strong>Bonus:</strong> +10% damage in PvP battles
              </div>
            </div>

            {/* CHAD */}
            <div className="border-4 border-black p-4 bg-emerald-50">
              <h3 className="font-black text-xl mb-2 flex items-center gap-2">
                <span className="text-2xl">🗿</span> CHAD
              </h3>
              <p className="font-mono text-sm mb-2">The Stoic Tribe</p>
              <p className="text-sm mb-3">
                Discipline, consistency, and unwavering resolve. CHADs believe in steady progress and mental fortitude.
              </p>
              <div className="bg-emerald-200 border-2 border-black p-2 text-xs font-mono">
                <strong>Bonus:</strong> +10% staking APY
              </div>
            </div>

            {/* DEGEN */}
            <div className="border-4 border-black p-4 bg-violet-50">
              <h3 className="font-black text-xl mb-2 flex items-center gap-2">
                <span className="text-2xl">🤡</span> DEGEN
              </h3>
              <p className="font-mono text-sm mb-2">The Absurdist Tribe</p>
              <p className="text-sm mb-3">
                Why be normal? DEGENs embrace the absurd, the weird, and the wonderfully chaotic.
              </p>
              <div className="bg-violet-200 border-2 border-black p-2 text-xs font-mono">
                <strong>Bonus:</strong> +10% damage in boss raids
              </div>
            </div>
          </div>
        </section>

        {/* Pet Care */}
        <section id="pet-care" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">3. Pet Care</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-6">
            <p className="font-mono">
              Your pet has four main stats that need regular attention:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 border-2 border-black flex items-center justify-center shrink-0">
                  <span>🍎</span>
                </div>
                <div>
                  <h4 className="font-black">Hunger</h4>
                  <p className="text-sm font-mono">Feed your pet to keep it nourished. Decreases 4 points per hour. Cooldown: 30 min.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-pink-400 border-2 border-black flex items-center justify-center shrink-0">
                  <span>💖</span>
                </div>
                <div>
                  <h4 className="font-black">Mood</h4>
                  <p className="text-sm font-mono">Play with your pet to boost happiness. Decreases 3 points per hour. Cooldown: 60 min.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center shrink-0">
                  <span>⚡</span>
                </div>
                <div>
                  <h4 className="font-black">Energy</h4>
                  <p className="text-sm font-mono">Let your pet sleep to recover energy. Decreases 2 points per hour. Cooldown: 120 min.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-400 border-2 border-black flex items-center justify-center shrink-0">
                  <span>⭐</span>
                </div>
                <div>
                  <h4 className="font-black">Reputation</h4>
                  <p className="text-sm font-mono">Socialize to build reputation. Doesn&apos;t decay! Cooldown: 180 min.</p>
                </div>
              </div>
            </div>

            <div className="bg-red-100 border-2 border-black p-4">
              <h4 className="font-black flex items-center gap-2 mb-2">
                <Shield size={16} /> SHAME MODE Warning
              </h4>
              <p className="text-sm font-mono">
                If you neglect your pet for 48 hours, it enters SHAME MODE:
              </p>
              <ul className="text-sm font-mono mt-2 list-disc list-inside">
                <li>50% reduced stats</li>
                <li>Cannot participate in battles</li>
                <li>Cannot participate in raids</li>
                <li>1% stake burned per day</li>
                <li>Need 3 consecutive days of care to recover</li>
              </ul>
            </div>
          </div>
        </section>

        {/* $SIP Token */}
        <section id="sip-token" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-400 flex items-center justify-center border-2 border-black">
              <Coins size={20} className="text-black" />
            </div>
            <h2 className="text-2xl font-black uppercase">4. $SIP Token & Power</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-6">
            <p className="font-mono">
              $SIP is the native token of SipSip. It powers the entire game economy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-black p-4 bg-yellow-50">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                  <Zap size={16} /> Power System
                </h4>
                <p className="text-sm font-mono mb-2">
                  Power determines your strength in battles and raids.
                </p>
                <ul className="text-xs font-mono list-disc list-inside">
                  <li>1 Power per 10 $SIP fed</li>
                  <li>Power boosts battle win chance</li>
                  <li>Power boosts raid damage</li>
                  <li>Power contributes to tribe score</li>
                </ul>
              </div>

              <div className="border-2 border-black p-4 bg-green-50">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                  <TrendingUp size={16} /> Staking APY
                </h4>
                <p className="text-sm font-mono mb-2">
                  Stake $SIP to earn passive rewards.
                </p>
                <ul className="text-xs font-mono list-disc list-inside">
                  <li>3% base APY</li>
                  <li>+20% APY for winning tribe (1 week)</li>
                  <li>+10% APY for CHAD tribe members</li>
                  <li>APY calculated on staked balance</li>
                </ul>
              </div>
            </div>

            <div className="bg-black text-white p-4">
              <h4 className="font-black text-yellow-400 mb-3">Token Economy (Deflationary)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <span className="opacity-50">Token Feeding:</span>
                  <span className="block text-red-400">10% burned on every feed</span>
                </div>
                <div>
                  <span className="opacity-50">Battle Prize:</span>
                  <span className="block text-red-400">10% of pot burned</span>
                </div>
                <div>
                  <span className="opacity-50">Neglect Penalty:</span>
                  <span className="block text-red-400">1% stake burned per day</span>
                </div>
                <div>
                  <span className="opacity-50">Total Supply:</span>
                  <span className="block">Always decreasing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Token Feeding */}
        <section id="token-feeding" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-400 flex items-center justify-center border-2 border-black">
              <Flame size={20} className="text-black" />
            </div>
            <h2 className="text-2xl font-black uppercase">5. Token Feeding</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-4">
            <p className="font-mono">
              Feed $SIP tokens directly to your pet to boost its Power and stats.
            </p>

            <div className="bg-amber-50 border-2 border-black p-4">
              <h4 className="font-black mb-2">How Token Feeding Works</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm font-mono">
                <li>Choose an amount of $SIP to feed (minimum 10)</li>
                <li>90% goes to power boost, 10% is burned forever</li>
                <li>Gain 1 Power per 10 $SIP fed</li>
                <li>Pet&apos;s hunger and mood also increase</li>
              </ol>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border-2 border-black p-3">
                <div className="text-2xl font-black">100</div>
                <div className="text-xs font-mono opacity-50">$SIP FED</div>
                <div className="text-sm font-black text-green-600 mt-1">+10 Power</div>
              </div>
              <div className="border-2 border-black p-3">
                <div className="text-2xl font-black">500</div>
                <div className="text-xs font-mono opacity-50">$SIP FED</div>
                <div className="text-sm font-black text-green-600 mt-1">+50 Power</div>
              </div>
              <div className="border-2 border-black p-3">
                <div className="text-2xl font-black">1000</div>
                <div className="text-xs font-mono opacity-50">$SIP FED</div>
                <div className="text-sm font-black text-green-600 mt-1">+100 Power</div>
              </div>
            </div>
          </div>
        </section>

        {/* PvP Battles */}
        <section id="pvp-battles" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 flex items-center justify-center border-2 border-black">
              <Target size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">6. PvP Battles</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-6">
            <p className="font-mono">
              Challenge other pets to head-to-head battles for $SIP rewards!
            </p>

            <div className="space-y-4">
              <div className="border-2 border-black p-4">
                <h4 className="font-black mb-2">Creating a Battle</h4>
                <ol className="list-decimal list-inside text-sm font-mono space-y-1">
                  <li>Choose a bet amount (10-10,000 $SIP)</li>
                  <li>Your challenge is posted for others to accept</li>
                  <li>Opponent must match your bet</li>
                  <li>Battle resolves based on Power</li>
                </ol>
              </div>

              <div className="border-2 border-black p-4 bg-green-50">
                <h4 className="font-black mb-2">Win Probability</h4>
                <ul className="text-sm font-mono list-disc list-inside">
                  <li>Base win chance: 50%</li>
                  <li>Power advantage increases win chance</li>
                  <li>Max win chance: 80%</li>
                  <li>Min win chance: 20%</li>
                  <li>Matchmaking: ±20% power band</li>
                </ul>
              </div>

              <div className="bg-black text-white p-4">
                <h4 className="font-black text-yellow-400 mb-2">Prize Distribution</h4>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div>
                    <span className="opacity-50">Winner Takes:</span>
                    <span className="block text-green-400">90% of total pot</span>
                  </div>
                  <div>
                    <span className="opacity-50">Burned:</span>
                    <span className="block text-red-400">10% of total pot</span>
                  </div>
                </div>
                <p className="text-xs font-mono opacity-50 mt-2">
                  Example: Two 100 $SIP bets = 200 pot. Winner gets 180, 20 burned.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Battle Skills */}
        <section id="skills" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 flex items-center justify-center border-2 border-black">
              <Sparkles size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">7. Battle Skills</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-6">
            <p className="font-mono">
              Feed $SIP tokens to unlock powerful skills that affect battle outcomes!
              Skills add luck-based variance - even weaker pets can win with the right skills!
            </p>

            <div className="space-y-4">
              <div className="border-2 border-black p-4 bg-purple-50">
                <h4 className="font-black mb-2">How Skills Work</h4>
                <ul className="list-disc list-inside text-sm font-mono space-y-1">
                  <li>Feed at least 10,000 $SIP (10 Power) to roll for skills</li>
                  <li>0.5% chance per Power gained to unlock a skill</li>
                  <li>Max 6 skills per pet</li>
                  <li>Skills can level up for stronger effects!</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border-2 border-gray-300 p-3 text-center">
                  <h4 className="font-black text-gray-500 text-sm">Common</h4>
                  <p className="text-xs font-mono">60% drop rate</p>
                  <p className="text-[10px] font-mono opacity-50">Always available</p>
                </div>
                <div className="border-2 border-blue-400 p-3 text-center bg-blue-50">
                  <h4 className="font-black text-blue-600 text-sm">Rare</h4>
                  <p className="text-xs font-mono">28% drop rate</p>
                  <p className="text-[10px] font-mono opacity-50">+100 Power</p>
                </div>
                <div className="border-2 border-purple-400 p-3 text-center bg-purple-50">
                  <h4 className="font-black text-purple-600 text-sm">Epic</h4>
                  <p className="text-xs font-mono">10% drop rate</p>
                  <p className="text-[10px] font-mono opacity-50">+500 Power</p>
                </div>
                <div className="border-2 border-yellow-400 p-3 text-center bg-yellow-50">
                  <h4 className="font-black text-yellow-600 text-sm">Legendary</h4>
                  <p className="text-xs font-mono">2% drop rate</p>
                  <p className="text-[10px] font-mono opacity-50">+1000 Power</p>
                </div>
              </div>

              <div className="border-2 border-black p-4">
                <h4 className="font-black mb-3">Skill Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👊</span>
                    <div>
                      <span className="font-bold text-sm">Damage Boost</span>
                      <p className="text-[10px] font-mono opacity-50">Increases attack damage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <span className="font-bold text-sm">Defense Boost</span>
                      <p className="text-[10px] font-mono opacity-50">Reduces damage taken</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎯</span>
                    <div>
                      <span className="font-bold text-sm">Critical Chance</span>
                      <p className="text-[10px] font-mono opacity-50">Chance for 1.5x damage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💨</span>
                    <div>
                      <span className="font-bold text-sm">Dodge Chance</span>
                      <p className="text-[10px] font-mono opacity-50">Avoid incoming attacks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎰</span>
                    <div>
                      <span className="font-bold text-sm">Luck Modifier</span>
                      <p className="text-[10px] font-mono opacity-50">Affects battle outcomes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                      <span className="font-bold text-sm">Power Scaling</span>
                      <p className="text-[10px] font-mono opacity-50">Power has more effect</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black text-white p-4">
                <h4 className="font-black text-yellow-400 mb-2">Skills in Battle</h4>
                <p className="text-sm font-mono mb-2">
                  Skills add luck-based variance to every battle:
                </p>
                <ul className="text-sm font-mono list-disc list-inside space-y-1">
                  <li>Each pet rolls their luck modifiers</li>
                  <li>Win chance can shift ±15% based on luck</li>
                  <li>Critical hits and dodges happen during battle</li>
                  <li>Even a weaker pet can win with good skills!</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Boss Raids */}
        <section id="boss-raids" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500 flex items-center justify-center border-2 border-black">
              <Skull size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">8. Boss Raids</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-6">
            <p className="font-mono">
              Unite with your tribe to defeat weekly boss monsters!
            </p>

            <div className="space-y-4">
              <div className="border-2 border-black p-4">
                <h4 className="font-black mb-2">How Raids Work</h4>
                <ol className="list-decimal list-inside text-sm font-mono space-y-1">
                  <li>Pay 50 $SIP entry fee to join</li>
                  <li>Attack the boss (damage = Power × 10)</li>
                  <li>All entry fees form the reward pool</li>
                  <li>Boss HP: 1,000,000 (scales with participants)</li>
                  <li>1 attack per hour cooldown</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-2 border-black p-4 bg-yellow-50 text-center">
                  <Trophy size={24} className="mx-auto mb-2" />
                  <h4 className="font-black">By Damage</h4>
                  <p className="text-sm font-mono">70% of pool</p>
                  <p className="text-xs font-mono opacity-50">Proportional to damage dealt</p>
                </div>
                <div className="border-2 border-black p-4 bg-purple-50 text-center">
                  <Star size={24} className="mx-auto mb-2" />
                  <h4 className="font-black">Top 10</h4>
                  <p className="text-sm font-mono">20% of pool</p>
                  <p className="text-xs font-mono opacity-50">+ Exclusive NFT Badge</p>
                </div>
                <div className="border-2 border-black p-4 bg-red-50 text-center">
                  <Skull size={24} className="mx-auto mb-2" />
                  <h4 className="font-black">Killing Blow</h4>
                  <p className="text-sm font-mono">10% of pool</p>
                  <p className="text-xs font-mono opacity-50">+ MYTHIC FORM unlock!</p>
                </div>
              </div>

              <div className="bg-purple-100 border-2 border-black p-4">
                <h4 className="font-black mb-2">Boss Types</h4>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <span className="text-2xl">🐉</span>
                    <p className="text-xs font-mono">Hydra</p>
                  </div>
                  <div>
                    <span className="text-2xl">🐲</span>
                    <p className="text-xs font-mono">Wyrm</p>
                  </div>
                  <div>
                    <span className="text-2xl">🗿</span>
                    <p className="text-xs font-mono">Golem</p>
                  </div>
                  <div>
                    <span className="text-2xl">🔥</span>
                    <p className="text-xs font-mono">Phoenix</p>
                  </div>
                  <div>
                    <span className="text-2xl">🦑</span>
                    <p className="text-xs font-mono">Kraken</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Evolution */}
        <section id="evolution" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Star size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">9. Evolution Stages</h2>
          </div>
          <div className="border-4 border-black p-6">
            <p className="font-mono mb-6">
              Your pet evolves through 6 stages based on care and achievements:
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 border-2 border-black">
                <Egg size={24} />
                <div>
                  <h4 className="font-black">EGG</h4>
                  <p className="text-sm font-mono text-neutral-600">The beginning. Hatches after first interaction.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 border-2 border-black bg-blue-50">
                <Star size={24} />
                <div>
                  <h4 className="font-black">BABY</h4>
                  <p className="text-sm font-mono text-neutral-600">Just hatched! Power multiplier: 0.75x</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 border-2 border-black bg-green-50">
                <Zap size={24} />
                <div>
                  <h4 className="font-black">TEEN</h4>
                  <p className="text-sm font-mono text-neutral-600">Growing up! Power multiplier: 1.0x</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 border-2 border-black bg-purple-50">
                <Target size={24} />
                <div>
                  <h4 className="font-black">ADULT</h4>
                  <p className="text-sm font-mono text-neutral-600">Fully grown! Power multiplier: 1.25x</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 border-2 border-black bg-yellow-100">
                <Trophy size={24} />
                <div>
                  <h4 className="font-black">LEGENDARY</h4>
                  <p className="text-sm font-mono text-neutral-600">The pinnacle! Power multiplier: 1.5x</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 border-2 border-black bg-gradient-to-r from-purple-100 to-pink-100">
                <Sparkles size={24} className="text-purple-600" />
                <div>
                  <h4 className="font-black text-purple-600">MYTHIC</h4>
                  <p className="text-sm font-mono text-neutral-600">Ultimate form! Unlocked by killing blow on boss.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tribe Wars */}
        <section id="tribe-wars" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Swords size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">10. Weekly Tribe Wars</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-4">
            <p className="font-mono">
              Every week, the four tribes compete for supremacy. Wars run from Sunday to Saturday.
            </p>

            <div className="bg-neutral-100 border-2 border-black p-4">
              <h4 className="font-black mb-2 flex items-center gap-2">
                <Clock size={16} /> How It Works
              </h4>
              <ul className="list-disc list-inside space-y-2 text-sm font-mono">
                <li>Each action you take contributes points to your tribe</li>
                <li>Battle wins, raid damage, and care all count</li>
                <li>The tribe with the most points wins</li>
                <li>New war begins every Sunday at 00:00 UTC</li>
              </ul>
            </div>

            <div className="bg-green-100 border-2 border-black p-4">
              <h4 className="font-black mb-2 flex items-center gap-2">
                <Trophy size={16} /> Victory Rewards
              </h4>
              <ul className="list-disc list-inside space-y-2 text-sm font-mono">
                <li>+20% APY bonus for entire winning tribe (1 week)</li>
                <li>Exclusive weekly badge</li>
                <li>Access to special cosmetics</li>
                <li>2% of battle wins go to tribe treasury</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Scoring System */}
        <section id="scoring" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">11. Scoring System</h2>
          </div>
          <div className="border-4 border-black p-6">
            <p className="font-mono mb-4">
              Your tribe&apos;s score is calculated from five categories:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-black p-4">
                <h4 className="font-black text-emerald-600 mb-2">Activity (25%)</h4>
                <p className="text-sm font-mono">
                  Points from feeding, playing, and care actions. 10 points per action.
                </p>
              </div>

              <div className="border-2 border-black p-4">
                <h4 className="font-black text-blue-600 mb-2">Social (20%)</h4>
                <p className="text-sm font-mono">
                  Visit other pets (5 pts), receive reactions (3 pts), chat activity.
                </p>
              </div>

              <div className="border-2 border-black p-4">
                <h4 className="font-black text-purple-600 mb-2">Consistency (20%)</h4>
                <p className="text-sm font-mono">
                  Daily streaks (15 pts/day), ritual bonuses (20 pts), regular care.
                </p>
              </div>

              <div className="border-2 border-black p-4">
                <h4 className="font-black text-orange-600 mb-2">Events (15%)</h4>
                <p className="text-sm font-mono">
                  Battle wins, raid participation, special events.
                </p>
              </div>

              <div className="border-2 border-black p-4 md:col-span-2">
                <h4 className="font-black text-yellow-600 mb-2">Power (20%)</h4>
                <p className="text-sm font-mono">
                  5 points per 100 Power. Feed tokens to increase!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social & Chat */}
        <section id="social" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500 flex items-center justify-center border-2 border-black">
              <MessageSquare size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">12. Social & Chat</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-4">
            <p className="font-mono">
              Connect with other players through the tribe chat system!
            </p>

            <div className="space-y-4">
              <div className="border-2 border-black p-4">
                <h4 className="font-black mb-2">Tribe Chat</h4>
                <ul className="list-disc list-inside text-sm font-mono">
                  <li>Chat with all players or filter by tribe</li>
                  <li>Max 280 characters per message</li>
                  <li>Rate limit: 10 messages per minute</li>
                  <li>Build community and coordinate strategies!</li>
                </ul>
              </div>

              <div className="border-2 border-black p-4">
                <h4 className="font-black mb-2">Reactions</h4>
                <div className="flex gap-3 mt-2">
                  <span className="text-2xl" title="Love">❤️</span>
                  <span className="text-2xl" title="LOL">😂</span>
                  <span className="text-2xl" title="Cringe">😬</span>
                  <span className="text-2xl" title="Chad">🗿</span>
                  <span className="text-2xl" title="RIP">💀</span>
                </div>
                <p className="text-sm font-mono mt-2">
                  React to other pets to earn social points!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Council */}
        <section id="council" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">13. Council & Governance</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-4">
            <p className="font-mono">
              The Council is where the community shapes the future of SipSip.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center shrink-0 text-sm font-bold">1</div>
                <p className="text-sm font-mono">
                  <strong>Proposals:</strong> Vote on season themes, new pet forms, lore, and events.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center shrink-0 text-sm font-bold">2</div>
                <p className="text-sm font-mono">
                  <strong>Voting:</strong> One wallet = one vote. Sign with your wallet to prove ownership.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center shrink-0 text-sm font-bold">3</div>
                <p className="text-sm font-mono">
                  <strong>Implementation:</strong> Approved proposals get built and shipped!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seasons */}
        <section id="seasons" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase">14. Seasons</h2>
          </div>
          <div className="border-4 border-black p-6 space-y-4">
            <p className="font-mono">
              SipSip operates in seasons, each lasting multiple weeks with special themes and rewards.
            </p>

            <ul className="list-disc list-inside space-y-2 text-sm font-mono">
              <li>Each season has a unique theme affecting gameplay and aesthetics</li>
              <li>Seasonal leaderboards track tribe performance</li>
              <li>Special seasonal badges for top performers</li>
              <li>New pet forms and cosmetics released each season</li>
              <li>Season champion tribe gets permanent bragging rights!</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <span className="text-white font-black">?</span>
            </div>
            <h2 className="text-2xl font-black uppercase">15. FAQ</h2>
          </div>
          <div className="space-y-4">
            <div className="border-4 border-black p-4">
              <h4 className="font-black mb-2">Can I change my tribe?</h4>
              <p className="text-sm font-mono text-neutral-600">
                No, tribe choice is permanent for each pet. Choose wisely!
              </p>
            </div>

            <div className="border-4 border-black p-4">
              <h4 className="font-black mb-2">What happens if I neglect my pet?</h4>
              <p className="text-sm font-mono text-neutral-600">
                48 hours of neglect triggers SHAME MODE: 50% reduced stats, no battles/raids, 1% stake burned per day. Need 3 consecutive days of care to recover.
              </p>
            </div>

            <div className="border-4 border-black p-4">
              <h4 className="font-black mb-2">How do I get more Power?</h4>
              <p className="text-sm font-mono text-neutral-600">
                Feed $SIP tokens to your pet! 1 Power per 10 $SIP. Higher evolution stages also have power multipliers.
              </p>
            </div>

            <div className="border-4 border-black p-4">
              <h4 className="font-black mb-2">Is there a cost to play?</h4>
              <p className="text-sm font-mono text-neutral-600">
                Basic gameplay is free! Battles and raids require $SIP tokens. You start with a balance for testing.
              </p>
            </div>

            <div className="border-4 border-black p-4">
              <h4 className="font-black mb-2">How do I unlock MYTHIC form?</h4>
              <p className="text-sm font-mono text-neutral-600">
                Deal the killing blow to a weekly boss! This is the rarest achievement in the game.
              </p>
            </div>

            <div className="border-4 border-black p-4">
              <h4 className="font-black mb-2">Can I have multiple pets?</h4>
              <p className="text-sm font-mono text-neutral-600">
                Currently, each wallet can have one pet. Multi-pet support may come in a future season!
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-4 border-black p-8 bg-black text-white text-center">
          <h2 className="text-2xl font-black uppercase mb-4">Ready to Begin?</h2>
          <p className="font-mono mb-6">Adopt your pet, feed it $SIP, and dominate the tribe wars!</p>
          <Link
            href="/"
            className="inline-block bg-yellow-400 text-black px-8 py-3 font-black uppercase border-4 border-yellow-400 hover:bg-yellow-300 transition-colors"
          >
            Start Playing
          </Link>
        </section>
      </div>
    </main>
  );
}
