'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle, X, Egg, Heart, Swords, Trophy, Users, Zap, ArrowRight,
  Coins, Target, Skull, MessageSquare, Shield
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: Egg,
      title: '1. Adopt Your Pet',
      description: 'Connect your Solana wallet and adopt a unique digital pet. Choose one of 4 tribes: FOFO (love), CAOS (chaos), CHAD (grind), or DEGEN (memes). Your choice affects bonuses and gameplay style.',
      color: 'bg-yellow-400',
    },
    {
      icon: Heart,
      title: '2. Care Daily',
      description: 'Feed, play, let sleep, and socialize with your pet. Each action has cooldowns and affects your pet\'s stats. Neglect for 48h leads to SHAME MODE with penalties!',
      color: 'bg-pink-400',
    },
    {
      icon: Coins,
      title: '3. $SIP Token',
      description: 'Use $SIP tokens to power up your pet. Feed tokens to gain POWER (1 power per 10 $SIP). 10% of fed tokens are burned forever, creating deflation. Power boosts battle win chance and raid damage.',
      color: 'bg-amber-400',
    },
    {
      icon: Zap,
      title: '4. Evolve & Power Up',
      description: 'Your pet evolves: Egg → Baby → Teen → Adult → Legendary → Mythic. Consistent care unlocks evolutions. Stake $SIP to increase power and earn APY rewards.',
      color: 'bg-emerald-400',
    },
    {
      icon: Target,
      title: '5. PvP Battles',
      description: 'Challenge other pets to battles! Bet $SIP tokens, winner takes 90% of the pot, 10% is burned. Power determines win probability. Matchmaking ensures fair fights (±20% power band).',
      color: 'bg-red-400',
    },
    {
      icon: Skull,
      title: '6. Boss Raids',
      description: 'Unite with your tribe against weekly bosses! Pay 50 $SIP entry, deal damage based on your power. Rewards distributed by damage dealt. Top 10 get NFT badges, killing blow unlocks MYTHIC form!',
      color: 'bg-purple-400',
    },
    {
      icon: Swords,
      title: '7. Tribe Wars',
      description: 'Every action earns points for your tribe. Compete weekly for glory! Winning tribe gets +20% APY bonus for a week. Each tribe has unique bonuses: FOFO (+10% care), CAOS (+10% battle damage), CHAD (+10% APY), DEGEN (+10% raid damage).',
      color: 'bg-orange-400',
    },
    {
      icon: MessageSquare,
      title: '8. Social & Chat',
      description: 'Chat with your tribe members, visit other pets, react to them. Build reputation and connections. High reputation unlocks special forms and bonuses.',
      color: 'bg-cyan-400',
    },
    {
      icon: Shield,
      title: '9. Council Governance',
      description: 'Vote on proposals to shape SipSip\'s future! Choose season themes, new pet forms, lore, and events. Your vote matters - one wallet, one vote.',
      color: 'bg-violet-400',
    },
    {
      icon: Trophy,
      title: '10. Rewards & Glory',
      description: 'Win battles, defeat bosses, dominate tribe wars. Earn $SIP rewards, exclusive NFT badges, special pet forms, and eternal bragging rights. The grind never stops!',
      color: 'bg-yellow-500',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-yellow-400">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-2">
            <HelpCircle size={24} />
            How SipSip Works
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Step Indicator */}
          <div className="flex gap-1 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex-1 h-2 transition-all ${
                  i === step ? 'bg-black' : 'bg-zinc-200 hover:bg-zinc-300'
                }`}
              />
            ))}
          </div>

          {/* Current Step */}
          <div className="text-center">
            <div className={`w-20 h-20 ${steps[step].color} border-4 border-black mx-auto mb-4 flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]`}>
              {(() => {
                const Icon = steps[step].icon;
                return <Icon size={40} className="text-black" />;
              })()}
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">{steps[step].title}</h3>
            <p className="text-sm font-mono leading-relaxed max-w-md mx-auto">
              {steps[step].description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className={`px-4 py-2 border-2 border-black font-black text-xs uppercase ${
                step === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black hover:text-white'
              }`}
            >
              Previous
            </button>

            <span className="font-mono text-xs">
              {step + 1} / {steps.length}
            </span>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 bg-black text-white border-2 border-black font-black text-xs uppercase hover:bg-zinc-800"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-500 text-white border-2 border-black font-black text-xs uppercase hover:bg-emerald-600"
              >
                Got it!
              </button>
            )}
          </div>

          {/* Quick Overview */}
          <div className="mt-8 pt-6 border-t-2 border-zinc-200">
            <h4 className="font-black text-xs uppercase mb-4 text-center">Quick Overview</h4>
            <div className="grid grid-cols-5 gap-2">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`p-2 border-2 transition-all ${
                      i === step ? 'border-black bg-zinc-100' : 'border-zinc-200 hover:border-black'
                    }`}
                  >
                    <Icon size={16} className="mx-auto mb-1" />
                    <span className="text-[7px] font-black uppercase block leading-tight">
                      {s.title.split(' ').slice(1, 3).join(' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Token Economy Summary */}
          <div className="mt-6 p-4 bg-black text-white border-2 border-black">
            <h4 className="font-black text-xs uppercase mb-3 text-yellow-400">$SIP Token Economy</h4>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
              <div>
                <span className="opacity-50">Token Feeding:</span>
                <span className="block">1 Power per 10 $SIP</span>
              </div>
              <div>
                <span className="opacity-50">Burn Rate:</span>
                <span className="block text-red-400">10% on every feed</span>
              </div>
              <div>
                <span className="opacity-50">Battle Win:</span>
                <span className="block text-green-400">90% pot to winner</span>
              </div>
              <div>
                <span className="opacity-50">Battle Burn:</span>
                <span className="block text-red-400">10% pot burned</span>
              </div>
              <div>
                <span className="opacity-50">Raid Entry:</span>
                <span className="block">50 $SIP per raid</span>
              </div>
              <div>
                <span className="opacity-50">Staking APY:</span>
                <span className="block text-green-400">3% base + bonuses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-black bg-zinc-100 flex justify-between items-center">
          <span className="font-mono text-[10px] opacity-60">
            Need more details?
          </span>
          <Link
            href="/docs"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white font-black text-xs uppercase hover:bg-zinc-800 transition-colors"
          >
            Full Docs
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 border-2 border-black font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all"
      >
        <HelpCircle size={14} />
        <span className="hidden sm:inline">How it Works</span>
      </button>
      <HowItWorksModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
