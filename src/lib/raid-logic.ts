/**
 * Boss Raid Logic (PvE)
 * Handles weekly boss raids, damage calculation, and reward distribution
 */

import { prisma } from './prisma';
import { RAID_CONFIG, TRIBE_BONUSES, Tribe } from './constants';
import { SIP_DECIMALS } from './token';
import { getOrCreateStake } from './staking';

// ============== TYPES ==============

export interface BossConfig {
  name: string;
  formId: string;
  element?: 'fire' | 'ice' | 'chaos' | 'nature';
  hpMultiplier: number;
  description: string;
}

export interface RaidParticipation {
  userId: string;
  wallet: string;
  petId: string;
  petName: string;
  tribe: string;
  totalDamage: number;
  attackCount: number;
  damagePercent: number;
  estimatedReward: number;
  isTop10: boolean;
  isKillingBlow: boolean;
}

export interface RaidStatus {
  id: string;
  bossName: string;
  bossFormId: string;
  bossElement?: string;
  hpMax: number;
  hpCurrent: number;
  hpPercent: number;
  status: 'ACTIVE' | 'DEFEATED' | 'EXPIRED';
  rewardPool: number;
  participantCount: number;
  timeRemaining: number; // seconds
  startAt: Date;
  endAt: Date;
}

// ============== BOSS CONFIGURATIONS ==============

export const BOSS_ROSTER: BossConfig[] = [
  {
    name: 'Chaos Hydra',
    formId: 'boss_hydra',
    element: 'chaos',
    hpMultiplier: 1.0,
    description: 'A multi-headed beast of pure chaos energy',
  },
  {
    name: 'Frost Wyrm',
    formId: 'boss_wyrm',
    element: 'ice',
    hpMultiplier: 1.2,
    description: 'An ancient dragon frozen in eternal slumber',
  },
  {
    name: 'Infernal Golem',
    formId: 'boss_golem',
    element: 'fire',
    hpMultiplier: 1.5,
    description: 'A construct of molten rock and rage',
  },
  {
    name: 'World Tree Guardian',
    formId: 'boss_guardian',
    element: 'nature',
    hpMultiplier: 1.3,
    description: 'Protector of the ancient forests',
  },
  {
    name: 'Void Leviathan',
    formId: 'boss_leviathan',
    element: undefined,
    hpMultiplier: 2.0,
    description: 'A creature from beyond the void',
  },
];

// ============== DAMAGE CALCULATION ==============

/**
 * Calculate damage based on power and bonuses
 * Formula: power * baseDamageMultiplier * (1 + bonuses)
 */
export function calculateDamage(
  power: number,
  tribe: Tribe,
  bossElement?: string
): {
  baseDamage: number;
  tribeBonus: number;
  elementBonus: number;
  finalDamage: number;
} {
  const baseDamage = power * RAID_CONFIG.baseDamageMultiplier;

  // Tribe bonus (DEGEN gets +10% raid damage)
  const tribeBonus = tribe === 'DEGEN' ? TRIBE_BONUSES.DEGEN.bonus : 0;

  // Element bonus (future feature)
  const elementBonus = 0;

  const totalMultiplier = 1 + tribeBonus + elementBonus;
  const finalDamage = Math.floor(baseDamage * totalMultiplier);

  return {
    baseDamage: Math.floor(baseDamage),
    tribeBonus,
    elementBonus,
    finalDamage,
  };
}

/**
 * Calculate reward share based on damage contribution
 */
export function calculateRewardShare(
  participantDamage: number,
  totalDamage: number,
  rewardPool: number,
  isKillingBlow: boolean = false
): number {
  if (totalDamage === 0) return 0;

  const damagePercent = participantDamage / totalDamage;
  let reward = Math.floor(rewardPool * damagePercent);

  // Killing blow bonus
  if (isKillingBlow) {
    reward = Math.floor(reward * RAID_CONFIG.killingBlowMultiplier);
  }

  return reward;
}

// ============== DATABASE OPERATIONS ==============

/**
 * Create a new boss raid for the week
 */
export async function createWeeklyRaid(weekId: string): Promise<{
  success: boolean;
  raid?: { id: string; bossName: string };
  error?: string;
}> {
  try {
    // Check if raid already exists for this week
    const existingRaid = await prisma.bossRaid.findFirst({
      where: { weekId, status: 'ACTIVE' },
    });

    if (existingRaid) {
      return { success: false, error: 'Raid already exists for this week' };
    }

    // Select random boss
    const bossConfig = BOSS_ROSTER[Math.floor(Math.random() * BOSS_ROSTER.length)];

    // Calculate boss HP based on participant count estimate
    const activePetCount = await prisma.pet.count({
      where: { isNeglected: false },
    });
    const hpMultiplier = Math.max(1, activePetCount * 0.1) * bossConfig.hpMultiplier;
    const bossHp = Math.floor(RAID_CONFIG.bossHpBase * hpMultiplier);

    // Get week dates
    const week = await prisma.week.findUnique({ where: { id: weekId } });
    if (!week) {
      return { success: false, error: 'Week not found' };
    }

    // Create raid
    const raid = await prisma.bossRaid.create({
      data: {
        weekId,
        bossName: bossConfig.name,
        bossFormId: bossConfig.formId,
        bossElement: bossConfig.element,
        bossHpMax: bossHp,
        bossHpCurrent: bossHp,
        entryFee: RAID_CONFIG.entryFee,
        rewardPool: 0,
        status: 'ACTIVE',
        startAt: week.startAt,
        endAt: week.endAt,
      },
    });

    return { success: true, raid: { id: raid.id, bossName: raid.bossName } };
  } catch (error) {
    console.error('Error creating raid:', error);
    return { success: false, error: 'Failed to create raid' };
  }
}

/**
 * Get current active raid
 */
export async function getCurrentRaid(): Promise<RaidStatus | null> {
  const raid = await prisma.bossRaid.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: { startAt: 'desc' },
  });

  if (!raid) return null;

  const now = new Date();
  const timeRemaining = Math.max(0, (raid.endAt.getTime() - now.getTime()) / 1000);

  return {
    id: raid.id,
    bossName: raid.bossName,
    bossFormId: raid.bossFormId,
    bossElement: raid.bossElement || undefined,
    hpMax: raid.bossHpMax,
    hpCurrent: raid.bossHpCurrent,
    hpPercent: Math.floor((raid.bossHpCurrent / raid.bossHpMax) * 100),
    status: raid.status as 'ACTIVE' | 'DEFEATED' | 'EXPIRED',
    rewardPool: raid.rewardPool,
    participantCount: raid._count.participants,
    timeRemaining,
    startAt: raid.startAt,
    endAt: raid.endAt,
  };
}

/**
 * Join a raid (pay entry fee)
 */
export async function joinRaid(
  raidId: string,
  userId: string,
  petId: string,
  txSignature?: string
): Promise<{
  success: boolean;
  participation?: { id: string };
  error?: string;
}> {
  try {
    // Check raid exists and is active
    const raid = await prisma.bossRaid.findUnique({
      where: { id: raidId },
    });

    if (!raid) {
      return { success: false, error: 'Raid not found' };
    }

    if (raid.status !== 'ACTIVE') {
      return { success: false, error: 'Raid is not active' };
    }

    // Check if already participating
    const existingParticipation = await prisma.bossRaidParticipant.findUnique({
      where: { raidId_userId: { raidId, userId: userId } },
    });

    if (existingParticipation) {
      return { success: false, error: 'Already participating in this raid' };
    }

    // Get pet
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet || pet.userId !== userId) {
      return { success: false, error: 'Pet not found or not owned by user' };
    }

    if (pet.isNeglected) {
      return { success: false, error: 'Cannot raid with neglected pet' };
    }

    // Create participation
    const participation = await prisma.bossRaidParticipant.create({
      data: {
        raidId,
        userId: userId,
        petId,
        totalDamage: 0,
        attackCount: 0,
        sipContributed: raid.entryFee,
      },
    });

    // Add entry fee to reward pool
    await prisma.bossRaid.update({
      where: { id: raidId },
      data: {
        rewardPool: raid.rewardPool + raid.entryFee,
      },
    });

    return { success: true, participation: { id: participation.id } };
  } catch (error) {
    console.error('Error joining raid:', error);
    return { success: false, error: 'Failed to join raid' };
  }
}

/**
 * Attack the boss
 */
export async function attackBoss(
  raidId: string,
  userId: string
): Promise<{
  success: boolean;
  damage?: number;
  bossRemainingHp?: number;
  isKillingBlow?: boolean;
  error?: string;
}> {
  try {
    // Get raid and participation
    const raid = await prisma.bossRaid.findUnique({
      where: { id: raidId },
    });

    if (!raid || raid.status !== 'ACTIVE') {
      return { success: false, error: 'Raid not active' };
    }

    const participation = await prisma.bossRaidParticipant.findUnique({
      where: { raidId_userId: { raidId, userId: userId } },
      include: { pet: true },
    });

    if (!participation) {
      return { success: false, error: 'Not participating in this raid' };
    }

    // Check attack cooldown (1 hour)
    const cooldownMs = RAID_CONFIG.attackCooldownMinutes * 60 * 1000;
    const timeSinceLastAttack = Date.now() - participation.updatedAt.getTime();

    if (participation.attackCount > 0 && timeSinceLastAttack < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastAttack) / 60000);
      return { success: false, error: `Attack on cooldown. ${remainingMinutes} minutes remaining.` };
    }

    // Get power
    const stake = await getOrCreateStake(userId, participation.petId);

    // Calculate damage
    const { finalDamage } = calculateDamage(
      stake.power,
      participation.pet.tribe as Tribe,
      raid.bossElement || undefined
    );

    // Apply damage
    const newHp = Math.max(0, raid.bossHpCurrent - finalDamage);
    const isKillingBlow = raid.bossHpCurrent > 0 && newHp === 0;

    // Update raid
    const updateData: {
      bossHpCurrent: number;
      status?: string;
      defeatedAt?: Date;
      killingBlowUserId?: string;
      killingBlowPetId?: string;
    } = {
      bossHpCurrent: newHp,
    };

    if (isKillingBlow) {
      updateData.status = 'DEFEATED';
      updateData.defeatedAt = new Date();
      updateData.killingBlowUserId = userId;
      updateData.killingBlowPetId = participation.petId;
    }

    await prisma.bossRaid.update({
      where: { id: raidId },
      data: updateData,
    });

    // Update participation
    await prisma.bossRaidParticipant.update({
      where: { id: participation.id },
      data: {
        totalDamage: participation.totalDamage + finalDamage,
        attackCount: participation.attackCount + 1,
        isKillingBlow,
      },
    });

    return {
      success: true,
      damage: finalDamage,
      bossRemainingHp: newHp,
      isKillingBlow,
    };
  } catch (error) {
    console.error('Error attacking boss:', error);
    return { success: false, error: 'Failed to attack boss' };
  }
}

/**
 * Get raid leaderboard
 */
export async function getRaidLeaderboard(
  raidId: string,
  limit: number = 20
): Promise<RaidParticipation[]> {
  const raid = await prisma.bossRaid.findUnique({
    where: { id: raidId },
    include: {
      participants: {
        include: {
          user: true,
          pet: true,
        },
        orderBy: { totalDamage: 'desc' },
        take: limit,
      },
    },
  });

  if (!raid) return [];

  // Calculate total damage
  const totalDamage = raid.participants.reduce((sum, p) => sum + p.totalDamage, 0);

  return raid.participants.map((p, index) => ({
    userId: p.userId,
    wallet: p.user.walletPubkey,
    petId: p.petId,
    petName: p.pet.name,
    tribe: p.pet.tribe,
    totalDamage: p.totalDamage,
    attackCount: p.attackCount,
    damagePercent: totalDamage > 0 ? (p.totalDamage / totalDamage) * 100 : 0,
    estimatedReward: calculateRewardShare(p.totalDamage, totalDamage, raid.rewardPool, p.isKillingBlow),
    isTop10: index < RAID_CONFIG.top10BadgeThreshold,
    isKillingBlow: p.isKillingBlow,
  }));
}

/**
 * Claim raid rewards
 */
export async function claimRaidRewards(
  raidId: string,
  userId: string,
  txSignature?: string
): Promise<{
  success: boolean;
  reward?: number;
  nftBadge?: boolean;
  mythicForm?: boolean;
  error?: string;
}> {
  try {
    // Get raid
    const raid = await prisma.bossRaid.findUnique({
      where: { id: raidId },
      include: {
        participants: {
          orderBy: { totalDamage: 'desc' },
        },
      },
    });

    if (!raid) {
      return { success: false, error: 'Raid not found' };
    }

    if (raid.status !== 'DEFEATED') {
      return { success: false, error: 'Raid not yet completed' };
    }

    // Find participation
    const participation = raid.participants.find(p => p.userId === userId);
    if (!participation) {
      return { success: false, error: 'Not a participant in this raid' };
    }

    if (participation.rewardClaimed > 0) {
      return { success: false, error: 'Rewards already claimed' };
    }

    // Calculate reward
    const totalDamage = raid.participants.reduce((sum, p) => sum + p.totalDamage, 0);
    const reward = calculateRewardShare(
      participation.totalDamage,
      totalDamage,
      raid.rewardPool,
      participation.isKillingBlow
    );

    // Check if top 10
    const rank = raid.participants.findIndex(p => p.userId === userId);
    const isTop10 = rank < RAID_CONFIG.top10BadgeThreshold;

    // Update participation
    await prisma.bossRaidParticipant.update({
      where: { id: participation.id },
      data: {
        rewardClaimed: reward,
        nftBadgeId: isTop10 ? `raid_${raid.id}_top10` : null,
      },
    });

    // Create badge for top 10
    if (isTop10) {
      await prisma.badge.create({
        data: {
          userId: userId,
          type: 'raid_top10',
          metadata: JSON.stringify({
            raidId: raid.id,
            bossName: raid.bossName,
            rank: rank + 1,
            damage: participation.totalDamage,
          }),
        },
      });
    }

    // Create badge for killing blow + potentially unlock mythic form
    if (participation.isKillingBlow && RAID_CONFIG.mythicFormForKiller) {
      await prisma.badge.create({
        data: {
          userId: userId,
          type: 'raid_killing_blow',
          metadata: JSON.stringify({
            raidId: raid.id,
            bossName: raid.bossName,
          }),
        },
      });

      // Update pet form to mythic
      await prisma.pet.update({
        where: { id: participation.petId },
        data: { formId: 'mythic_ascended' },
      });
    }

    return {
      success: true,
      reward,
      nftBadge: isTop10,
      mythicForm: participation.isKillingBlow && RAID_CONFIG.mythicFormForKiller,
    };
  } catch (error) {
    console.error('Error claiming raid rewards:', error);
    return { success: false, error: 'Failed to claim rewards' };
  }
}

/**
 * End expired raids
 */
export async function endExpiredRaids(): Promise<number> {
  const now = new Date();

  const result = await prisma.bossRaid.updateMany({
    where: {
      status: 'ACTIVE',
      endAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  });

  return result.count;
}

/**
 * Get user's participation in current raid
 */
export async function getUserRaidParticipation(
  raidId: string,
  userId: string
): Promise<{
  isParticipating: boolean;
  participation?: {
    totalDamage: number;
    attackCount: number;
    canAttack: boolean;
    cooldownRemaining: number;
  };
}> {
  const participation = await prisma.bossRaidParticipant.findUnique({
    where: { raidId_userId: { raidId, userId: userId } },
  });

  if (!participation) {
    return { isParticipating: false };
  }

  const cooldownMs = RAID_CONFIG.attackCooldownMinutes * 60 * 1000;
  const timeSinceLastAttack = Date.now() - participation.updatedAt.getTime();
  const canAttack = participation.attackCount === 0 || timeSinceLastAttack >= cooldownMs;
  const cooldownRemaining = canAttack ? 0 : Math.ceil((cooldownMs - timeSinceLastAttack) / 1000);

  return {
    isParticipating: true,
    participation: {
      totalDamage: participation.totalDamage,
      attackCount: participation.attackCount,
      canAttack,
      cooldownRemaining,
    },
  };
}
