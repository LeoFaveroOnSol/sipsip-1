/**
 * Pet Skills Logic
 * Handles skill acquisition, leveling, and battle effects
 */

import { prisma } from './prisma';
import {
  PET_SKILLS,
  SKILL_ACQUISITION_CONFIG,
  SKILL_TIER_THRESHOLDS,
  SkillTier,
  Skill,
  getSkillById,
  getSkillsByTier,
} from './constants';

// ============== TYPES ==============

export interface PetSkillWithInfo {
  id: string;
  skillId: string;
  tier: number;
  level: number;
  skill: Skill;
  effectValue: number; // Calculated effect value at current level
}

export interface SkillEffects {
  damageBoost: number;
  defenseBoost: number;
  critChance: number;
  dodgeChance: number;
  luckModifier: number;
  powerScaling: number;
}

export interface SkillRollResult {
  success: boolean;
  skill?: Skill;
  tier?: SkillTier;
  isNewSkill?: boolean;
  levelUp?: boolean;
  newLevel?: number;
}

// ============== SKILL ACQUISITION ==============

/**
 * Roll for a new skill when gaining power
 * Higher power = better chance for higher tier skills
 */
export async function rollForSkill(
  petId: string,
  powerGained: number,
  totalPower: number
): Promise<SkillRollResult> {
  // Check if power gained is enough to roll (10+ power = 10k+ tokens)
  if (powerGained < SKILL_ACQUISITION_CONFIG.minPowerForRoll) {
    return { success: false };
  }

  // Get current pet skills
  const existingSkills = await prisma.petSkill.findMany({
    where: { petId },
  });

  // Check max skills limit (6 skills max)
  if (existingSkills.length >= SKILL_ACQUISITION_CONFIG.maxSkillsPerPet) {
    // Try to level up an existing skill instead (100% chance if 10+ power)
    return await tryLevelUpRandomSkill(petId, existingSkills, powerGained);
  }

  // 100% GUARANTEED to get a skill when feeding 10k+ tokens!
  // The only randomness is WHICH TIER you get

  // Determine the tier (this is where the % comes in)
  let tier = rollSkillTier(totalPower);

  // Check if player has unlocked this tier
  if (totalPower < SKILL_TIER_THRESHOLDS[tier]) {
    // Downgrade to highest available tier
    const availableTier = getHighestAvailableTier(totalPower);
    if (availableTier === 0) {
      return { success: false };
    }
    tier = availableTier; // Use the available tier instead
  }

  // Get skills of this tier that the pet doesn't have
  const tierSkills = getSkillsByTier(tier);
  const existingSkillIds = existingSkills.map(s => s.skillId);
  const availableSkills = tierSkills.filter(s => !existingSkillIds.includes(s.id));

  if (availableSkills.length === 0) {
    // Already has all skills of this tier, try lower tier or level up
    return await tryLevelUpRandomSkill(petId, existingSkills, powerGained);
  }

  // Pick a random skill from available
  const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];

  // Save the new skill
  await prisma.petSkill.create({
    data: {
      petId,
      skillId: skill.id,
      tier: skill.tier,
      level: 1,
    },
  });

  // Create event for skill acquisition
  await prisma.petEvent.create({
    data: {
      petId,
      type: 'skill_acquired',
      payload: JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
        tier: skill.tier,
        powerGained,
      }),
    },
  });

  return {
    success: true,
    skill,
    tier: skill.tier,
    isNewSkill: true,
  };
}

/**
 * Roll for skill tier based on power and drop rates
 */
function rollSkillTier(totalPower: number): SkillTier {
  const config = SKILL_ACQUISITION_CONFIG;

  // Calculate adjusted drop rates based on power
  let legendaryChance = config.tierDropRates[4] + (totalPower * config.powerScaling.legendaryBonus);
  let epicChance = config.tierDropRates[3] + (totalPower * config.powerScaling.epicBonus);
  let rareChance = config.tierDropRates[2] + (totalPower * config.powerScaling.rareBonus);

  // Cap chances
  legendaryChance = Math.min(legendaryChance, 0.10); // Max 10%
  epicChance = Math.min(epicChance, 0.25); // Max 25%
  rareChance = Math.min(rareChance, 0.40); // Max 40%

  const roll = Math.random();

  if (roll < legendaryChance) return 4;
  if (roll < legendaryChance + epicChance) return 3;
  if (roll < legendaryChance + epicChance + rareChance) return 2;
  return 1;
}

/**
 * Get highest tier available based on power
 */
function getHighestAvailableTier(totalPower: number): SkillTier | 0 {
  if (totalPower >= SKILL_TIER_THRESHOLDS[4]) return 4;
  if (totalPower >= SKILL_TIER_THRESHOLDS[3]) return 3;
  if (totalPower >= SKILL_TIER_THRESHOLDS[2]) return 2;
  if (totalPower >= SKILL_TIER_THRESHOLDS[1]) return 1;
  return 0;
}

/**
 * Try to level up a random existing skill
 * 100% GUARANTEED when you have 10+ power and max skills
 */
async function tryLevelUpRandomSkill(
  petId: string,
  existingSkills: Array<{ id: string; skillId: string; level: number }>,
  powerGained: number
): Promise<SkillRollResult> {
  // Filter skills that can be leveled up
  const levelableSkills = existingSkills.filter(ps => {
    const skillDef = getSkillById(ps.skillId);
    return skillDef && ps.level < skillDef.maxLevel;
  });

  if (levelableSkills.length === 0) {
    // All skills are max level - nothing to do
    return { success: false };
  }

  // 100% GUARANTEED level up when feeding 10k+ tokens!
  // Pick random skill to level up
  const skillToLevel = levelableSkills[Math.floor(Math.random() * levelableSkills.length)];
  const skillDef = getSkillById(skillToLevel.skillId)!;

  const newLevel = Math.min(skillToLevel.level + 1, skillDef.maxLevel);

  await prisma.petSkill.update({
    where: { id: skillToLevel.id },
    data: { level: newLevel },
  });

  // Create event for level up
  await prisma.petEvent.create({
    data: {
      petId,
      type: 'skill_levelup',
      payload: JSON.stringify({
        skillId: skillDef.id,
        skillName: skillDef.name,
        oldLevel: skillToLevel.level,
        newLevel,
      }),
    },
  });

  return {
    success: true,
    skill: skillDef,
    tier: skillDef.tier,
    isNewSkill: false,
    levelUp: true,
    newLevel,
  };
}

// ============== SKILL EFFECTS CALCULATION ==============

/**
 * Get all skills for a pet with calculated effect values
 */
export async function getPetSkills(petId: string): Promise<PetSkillWithInfo[]> {
  const skills = await prisma.petSkill.findMany({
    where: { petId },
    orderBy: { tier: 'desc' },
  });

  return skills.map(ps => {
    const skillDef = getSkillById(ps.skillId);
    if (!skillDef) {
      return null;
    }

    const effectValue = calculateEffectValue(skillDef, ps.level);

    return {
      id: ps.id,
      skillId: ps.skillId,
      tier: ps.tier,
      level: ps.level,
      skill: skillDef,
      effectValue,
    };
  }).filter((s): s is PetSkillWithInfo => s !== null);
}

/**
 * Calculate effect value based on skill definition and level
 */
function calculateEffectValue(skill: Skill, level: number): number {
  return skill.effect.value + (skill.effect.perLevel * (level - 1));
}

/**
 * Calculate combined effects from all pet skills
 */
export async function calculateSkillEffects(petId: string): Promise<SkillEffects> {
  const skills = await getPetSkills(petId);

  const effects: SkillEffects = {
    damageBoost: 0,
    defenseBoost: 0,
    critChance: 0,
    dodgeChance: 0,
    luckModifier: 0,
    powerScaling: 0,
  };

  for (const ps of skills) {
    switch (ps.skill.effect.type) {
      case 'damage_boost':
        effects.damageBoost += ps.effectValue;
        break;
      case 'defense_boost':
        effects.defenseBoost += ps.effectValue;
        break;
      case 'crit_chance':
        effects.critChance += ps.effectValue;
        break;
      case 'dodge_chance':
        effects.dodgeChance += ps.effectValue;
        break;
      case 'luck_modifier':
        effects.luckModifier += ps.effectValue;
        break;
      case 'power_scaling':
        effects.powerScaling += ps.effectValue;
        break;
    }
  }

  return effects;
}

/**
 * Apply skill effects to battle win probability
 * This adds luck-based variance to battles
 */
export function applySkillsToBattle(
  baseWinChance: number,
  attackerEffects: SkillEffects,
  defenderEffects: SkillEffects
): {
  adjustedWinChance: number;
  attackerLuckRoll: number;
  defenderLuckRoll: number;
} {
  // Calculate luck rolls (each player rolls their luck)
  const attackerLuckRoll = Math.random() * (1 + attackerEffects.luckModifier);
  const defenderLuckRoll = Math.random() * (1 + defenderEffects.luckModifier);

  // Luck difference affects win chance
  const luckDiff = (attackerLuckRoll - defenderLuckRoll) * 0.15; // ±15% max from luck

  // Power scaling affects base chance
  const powerScalingBonus = (attackerEffects.powerScaling - defenderEffects.powerScaling) * 0.5;

  // Calculate adjusted win chance
  let adjustedWinChance = baseWinChance + luckDiff + powerScalingBonus;

  // Clamp to 15%-85% (skills can push slightly beyond normal limits)
  adjustedWinChance = Math.max(0.15, Math.min(0.85, adjustedWinChance));

  return {
    adjustedWinChance,
    attackerLuckRoll,
    defenderLuckRoll,
  };
}

/**
 * Apply skills to damage calculation
 */
export function applySkillsToDamage(
  baseDamage: number,
  attackerEffects: SkillEffects,
  defenderEffects: SkillEffects,
  isCritical: boolean
): {
  finalDamage: number;
  wasDodged: boolean;
  wasCritical: boolean;
  critChance: number;
  dodgeChance: number;
} {
  // Check for critical hit
  const critChance = 0.10 + attackerEffects.critChance; // Base 10% + skill bonus
  const wasCritical = isCritical || Math.random() < critChance;

  // Check for dodge
  const dodgeChance = 0.10 + defenderEffects.dodgeChance; // Base 10% + skill bonus
  const wasDodged = Math.random() < dodgeChance;

  if (wasDodged) {
    return {
      finalDamage: 0,
      wasDodged: true,
      wasCritical: false,
      critChance,
      dodgeChance,
    };
  }

  // Apply damage modifiers
  let damage = baseDamage;

  // Apply attacker damage boost
  damage *= (1 + attackerEffects.damageBoost);

  // Apply critical multiplier
  if (wasCritical) {
    damage *= 1.5;
  }

  // Apply defender defense reduction
  damage *= (1 - defenderEffects.defenseBoost);

  return {
    finalDamage: Math.floor(damage),
    wasDodged: false,
    wasCritical,
    critChance,
    dodgeChance,
  };
}

// ============== UTILITY FUNCTIONS ==============

/**
 * Get skill summary for display
 */
export function getSkillSummary(skills: PetSkillWithInfo[]): {
  totalSkills: number;
  byTier: Record<number, number>;
  averageLevel: number;
  topSkill?: PetSkillWithInfo;
} {
  if (skills.length === 0) {
    return {
      totalSkills: 0,
      byTier: { 1: 0, 2: 0, 3: 0, 4: 0 },
      averageLevel: 0,
    };
  }

  const byTier: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalLevel = 0;

  for (const skill of skills) {
    byTier[skill.tier]++;
    totalLevel += skill.level;
  }

  // Find top skill (highest tier, then highest level)
  const topSkill = skills.reduce((top, current) => {
    if (!top) return current;
    if (current.tier > top.tier) return current;
    if (current.tier === top.tier && current.level > top.level) return current;
    return top;
  }, skills[0]);

  return {
    totalSkills: skills.length,
    byTier,
    averageLevel: totalLevel / skills.length,
    topSkill,
  };
}
