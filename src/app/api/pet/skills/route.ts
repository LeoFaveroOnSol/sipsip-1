import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getPetSkills, getSkillSummary, calculateSkillEffects } from '@/lib/skill-logic';
import { getTierName, getTierColor, SKILL_TIER_THRESHOLDS, SKILL_ACQUISITION_CONFIG } from '@/lib/constants';

// GET - Get pet skills for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's pet
    const pet = await prisma.pet.findFirst({
      where: { userId: user.id },
    });

    if (!pet) {
      return NextResponse.json({ success: false, error: 'No pet found' }, { status: 404 });
    }

    // Get current power
    const tokenStake = await prisma.tokenStake.findUnique({
      where: { userId_petId: { userId: user.id, petId: pet.id } },
    });
    const currentPower = tokenStake?.power || 0;

    // Get skills with full info
    const skills = await getPetSkills(pet.id);

    // Format skills for frontend
    const formattedSkills = skills.map(skill => ({
      id: skill.id,
      skillId: skill.skillId,
      name: skill.skill.name,
      description: skill.skill.description,
      emoji: skill.skill.emoji,
      tier: skill.tier,
      tierName: getTierName(skill.tier as 1 | 2 | 3 | 4),
      tierColor: getTierColor(skill.tier as 1 | 2 | 3 | 4),
      level: skill.level,
      maxLevel: skill.skill.maxLevel,
      category: skill.skill.category,
      effectType: skill.skill.effect.type,
      effectValue: skill.effectValue,
      effectPercent: Math.round(skill.effectValue * 100),
    }));

    // Get summary stats
    const summary = getSkillSummary(skills);

    // Calculate combined effects
    const effects = await calculateSkillEffects(pet.id);

    // Calculate tier unlock status
    const tierUnlocks = {
      1: { unlocked: true, minPower: SKILL_TIER_THRESHOLDS[1], name: 'Common' },
      2: { unlocked: currentPower >= SKILL_TIER_THRESHOLDS[2], minPower: SKILL_TIER_THRESHOLDS[2], name: 'Rare' },
      3: { unlocked: currentPower >= SKILL_TIER_THRESHOLDS[3], minPower: SKILL_TIER_THRESHOLDS[3], name: 'Epic' },
      4: { unlocked: currentPower >= SKILL_TIER_THRESHOLDS[4], minPower: SKILL_TIER_THRESHOLDS[4], name: 'Legendary' },
    };

    return NextResponse.json({
      success: true,
      data: {
        petId: pet.id,
        petName: pet.name,
        currentPower,
        maxSkills: SKILL_ACQUISITION_CONFIG.maxSkillsPerPet,
        skills: formattedSkills,
        summary: {
          totalSkills: summary.totalSkills,
          byTier: summary.byTier,
          averageLevel: Math.round(summary.averageLevel * 10) / 10,
          topSkill: summary.topSkill ? {
            name: summary.topSkill.skill.name,
            emoji: summary.topSkill.skill.emoji,
            tier: summary.topSkill.tier,
            tierName: getTierName(summary.topSkill.tier as 1 | 2 | 3 | 4),
          } : null,
        },
        combinedEffects: {
          damageBoost: Math.round(effects.damageBoost * 100),
          defenseBoost: Math.round(effects.defenseBoost * 100),
          critChance: Math.round(effects.critChance * 100),
          dodgeChance: Math.round(effects.dodgeChance * 100),
          luckModifier: Math.round(effects.luckModifier * 100),
          powerScaling: Math.round(effects.powerScaling * 100),
        },
        tierUnlocks,
      },
    });
  } catch (error) {
    console.error('Pet skills error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get pet skills' },
      { status: 500 }
    );
  }
}
