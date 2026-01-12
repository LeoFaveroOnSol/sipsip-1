'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Sparkles, RefreshCw } from 'lucide-react';

interface PetSkillData {
  id: string;
  skillId: string;
  tier: number;
  level: number;
  name: string;
  emoji: string;
  description: string;
  tierName: string;
  tierColor: string;
  effectValue: number;
  effectType: string;
}

interface CombinedEffects {
  damageBoost: number;
  defenseBoost: number;
  critChance: number;
  dodgeChance: number;
  luckModifier: number;
  powerScaling: number;
}

interface PetSkillsProps {
  compact?: boolean;
}

export function PetSkills({ compact = false }: PetSkillsProps) {
  const [skills, setSkills] = useState<PetSkillData[]>([]);
  const [combinedEffects, setCombinedEffects] = useState<CombinedEffects | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pet/skills');
      const data = await res.json();
      if (data.success) {
        setSkills(data.data.skills || []);
        setCombinedEffects(data.data.combinedEffects || null);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const getTierBgColor = (tier: number) => {
    const colors: Record<number, string> = {
      1: 'bg-gray-100 border-gray-300',
      2: 'bg-blue-50 border-blue-300',
      3: 'bg-purple-50 border-purple-300',
      4: 'bg-yellow-50 border-yellow-400',
    };
    return colors[tier] || colors[1];
  };

  if (loading) {
    return (
      <Card padding={compact ? 'sm' : 'md'}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-500" />
          <span className="font-black text-sm uppercase">Your Skills</span>
        </div>
        <div className="text-center py-4">
          <RefreshCw size={20} className="animate-spin mx-auto text-gray-400" />
          <p className="text-xs font-mono mt-2 opacity-50">Loading skills...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding={compact ? 'sm' : 'md'}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-500" />
          <span className="font-black text-sm uppercase">Your Skills</span>
        </div>
        <p className="text-xs font-mono text-red-600">{error}</p>
      </Card>
    );
  }

  if (skills.length === 0) {
    return (
      <Card padding={compact ? 'sm' : 'md'}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            <span className="font-black text-sm uppercase">Your Skills</span>
          </div>
          <span className="text-[10px] font-mono opacity-50">0/6</span>
        </div>
        <div className="text-center py-4 bg-zinc-50 border-2 border-dashed border-zinc-300">
          <span className="text-3xl mb-2 block">🎯</span>
          <p className="text-xs font-mono opacity-60">No skills yet!</p>
          <p className="text-[10px] font-mono opacity-40 mt-1">
            Feed 10k+ $SIP to unlock skills
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding={compact ? 'sm' : 'md'}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          <span className="font-black text-sm uppercase">Your Skills</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono opacity-50">{skills.length}/6</span>
          <button
            onClick={fetchSkills}
            className="p-1 hover:bg-zinc-100 rounded"
            title="Refresh skills"
          >
            <RefreshCw size={12} className="opacity-50" />
          </button>
        </div>
      </div>

      <div className={compact ? 'space-y-2' : 'grid grid-cols-2 gap-2'}>
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`p-2 border-2 ${getTierBgColor(skill.tier)} transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{skill.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-black text-xs truncate">{skill.name}</span>
                  {skill.level > 1 && (
                    <span
                      className="text-[9px] font-bold px-1 rounded"
                      style={{
                        backgroundColor: skill.tierColor + '30',
                        color: skill.tierColor
                      }}
                    >
                      Lv.{skill.level}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: skill.tierColor }}
                  >
                    {skill.tierName}
                  </span>
                  <span className="text-[9px] font-mono opacity-60">
                    +{Math.round(skill.effectValue * 100)}%
                  </span>
                </div>
              </div>
            </div>
            {!compact && (
              <p className="text-[9px] font-mono opacity-50 mt-1 truncate">
                {skill.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Summary of effects */}
      {skills.length > 0 && !compact && combinedEffects && (
        <div className="mt-3 pt-3 border-t border-zinc-200">
          <div className="text-[9px] font-mono opacity-60 space-y-1">
            {combinedEffects.damageBoost > 0 && (
              <div className="flex justify-between">
                <span>Damage Boost:</span>
                <span className="text-red-600">+{combinedEffects.damageBoost}%</span>
              </div>
            )}
            {combinedEffects.defenseBoost > 0 && (
              <div className="flex justify-between">
                <span>Defense Boost:</span>
                <span className="text-blue-600">+{combinedEffects.defenseBoost}%</span>
              </div>
            )}
            {combinedEffects.critChance > 0 && (
              <div className="flex justify-between">
                <span>Crit Chance:</span>
                <span className="text-orange-600">+{combinedEffects.critChance}%</span>
              </div>
            )}
            {combinedEffects.dodgeChance > 0 && (
              <div className="flex justify-between">
                <span>Dodge Chance:</span>
                <span className="text-cyan-600">+{combinedEffects.dodgeChance}%</span>
              </div>
            )}
            {combinedEffects.luckModifier > 0 && (
              <div className="flex justify-between">
                <span>Luck Modifier:</span>
                <span className="text-purple-600">+{combinedEffects.luckModifier}%</span>
              </div>
            )}
            {combinedEffects.powerScaling > 0 && (
              <div className="flex justify-between">
                <span>Power Scaling:</span>
                <span className="text-yellow-600">+{combinedEffects.powerScaling}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
