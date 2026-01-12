/**
 * $SIP Staking Logic
 * Handles power calculations, APY rewards, and neglect penalties
 */

import { prisma } from './prisma';
import { TokenEconomics, SIP_DECIMALS, parseSipAmount } from './token';

// ============== CONFIGURATION ==============

export const STAKING_CONFIG = {
  // APY rates
  baseAPY: 0.03,              // 3% base APY
  winningTribeBonus: 0.20,    // +20% APY for winning tribe

  // Neglect penalty
  neglectPenaltyPerDay: 0.01, // 1% burned per day of neglect

  // Minimum stake
  minStake: 10,               // Minimum 10 $SIP to stake
  maxStake: 1_000_000,        // Maximum 1M $SIP per pet

  // Power formula: sqrt(staked) * multipliers
  powerBase: 1,
  powerMultipliers: {
    stageBonus: {
      EGG: 0.5,
      BABY: 0.75,
      TEEN: 1.0,
      ADULT: 1.25,
      LEGENDARY: 1.5,
    },
    // Tribe bonuses only apply if that tribe won last week
    tribeWinnerBonus: 1.1,    // +10% power for winning tribe
  },
};

// ============== POWER CALCULATIONS ==============

export type Stage = 'EGG' | 'BABY' | 'TEEN' | 'ADULT' | 'LEGENDARY';
export type Tribe = 'FOFO' | 'CAOS' | 'CHAD' | 'DEGEN';

export interface PowerCalculation {
  basePower: number;
  stageMultiplier: number;
  tribeMultiplier: number;
  finalPower: number;
  breakdown: {
    stakedAmount: number;
    sqrtPower: number;
    bonuses: string[];
  };
}

/**
 * Calculate pet power based on staked $SIP and multipliers
 * Formula: Power = sqrt(SIP_Staked) * stageMultiplier * tribeMultiplier
 */
export function calculatePower(
  stakedAmount: number,
  stage: Stage,
  isWinningTribe: boolean = false
): PowerCalculation {
  // Convert to display amount if needed
  const displayAmount = stakedAmount / Math.pow(10, SIP_DECIMALS);

  // Base power from square root of staked amount
  const sqrtPower = Math.sqrt(displayAmount);
  const basePower = sqrtPower * STAKING_CONFIG.powerBase;

  // Stage multiplier
  const stageMultiplier = STAKING_CONFIG.powerMultipliers.stageBonus[stage] || 1;

  // Tribe winner bonus
  const tribeMultiplier = isWinningTribe
    ? STAKING_CONFIG.powerMultipliers.tribeWinnerBonus
    : 1;

  // Final power calculation
  const finalPower = basePower * stageMultiplier * tribeMultiplier;

  // Build bonus list for display
  const bonuses: string[] = [];
  if (stageMultiplier !== 1) {
    bonuses.push(`${stage}: ${((stageMultiplier - 1) * 100).toFixed(0)}%`);
  }
  if (tribeMultiplier !== 1) {
    bonuses.push(`Winning Tribe: +${((tribeMultiplier - 1) * 100).toFixed(0)}%`);
  }

  return {
    basePower,
    stageMultiplier,
    tribeMultiplier,
    finalPower: Math.floor(finalPower * 100) / 100, // Round to 2 decimals
    breakdown: {
      stakedAmount: displayAmount,
      sqrtPower: Math.floor(sqrtPower * 100) / 100,
      bonuses,
    },
  };
}

/**
 * Get power level tier based on power value
 */
export function getPowerTier(power: number): {
  tier: string;
  color: string;
  minPower: number;
} {
  if (power >= 1000) return { tier: 'LEGENDARY', color: '#fbbf24', minPower: 1000 };
  if (power >= 500) return { tier: 'EPIC', color: '#a855f7', minPower: 500 };
  if (power >= 200) return { tier: 'RARE', color: '#3b82f6', minPower: 200 };
  if (power >= 50) return { tier: 'COMMON', color: '#22c55e', minPower: 50 };
  return { tier: 'NOVICE', color: '#6b7280', minPower: 0 };
}

// ============== REWARDS CALCULATIONS ==============

export interface RewardsCalculation {
  pendingRewards: number;
  dailyRewards: number;
  effectiveAPY: number;
  daysStaked: number;
  lastClaimAt: Date;
}

/**
 * Calculate pending staking rewards
 */
export function calculatePendingRewards(
  stakedAmount: number,
  lastClaimAt: Date,
  isWinningTribe: boolean = false
): RewardsCalculation {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysStaked = (now.getTime() - lastClaimAt.getTime()) / msPerDay;

  // Calculate effective APY
  const effectiveAPY = isWinningTribe
    ? STAKING_CONFIG.baseAPY + STAKING_CONFIG.winningTribeBonus
    : STAKING_CONFIG.baseAPY;

  // Calculate rewards
  const dailyRewards = TokenEconomics.calculateAPYRewards(stakedAmount, effectiveAPY, 1);
  const pendingRewards = TokenEconomics.calculateAPYRewards(stakedAmount, effectiveAPY, daysStaked);

  return {
    pendingRewards: Math.floor(pendingRewards),
    dailyRewards: Math.floor(dailyRewards),
    effectiveAPY,
    daysStaked,
    lastClaimAt,
  };
}

// ============== NEGLECT PENALTY ==============

export interface NeglectPenalty {
  penaltyAmount: number;
  daysNeglected: number;
  remainingStake: number;
  shouldApply: boolean;
}

/**
 * Calculate neglect penalty for a staked pet
 */
export function calculateNeglectPenalty(
  stakedAmount: number,
  isNeglected: boolean,
  neglectedAt: Date | null
): NeglectPenalty {
  if (!isNeglected || !neglectedAt || stakedAmount <= 0) {
    return {
      penaltyAmount: 0,
      daysNeglected: 0,
      remainingStake: stakedAmount,
      shouldApply: false,
    };
  }

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysNeglected = Math.floor((now.getTime() - neglectedAt.getTime()) / msPerDay);

  if (daysNeglected < 1) {
    return {
      penaltyAmount: 0,
      daysNeglected: 0,
      remainingStake: stakedAmount,
      shouldApply: false,
    };
  }

  const penaltyAmount = TokenEconomics.calculateNeglectPenalty(
    stakedAmount,
    daysNeglected,
    STAKING_CONFIG.neglectPenaltyPerDay
  );

  return {
    penaltyAmount,
    daysNeglected,
    remainingStake: stakedAmount - penaltyAmount,
    shouldApply: penaltyAmount > 0,
  };
}

// ============== DATABASE OPERATIONS ==============

/**
 * Get or create stake record for a pet
 */
export async function getOrCreateStake(userId: string, petId: string) {
  let stake = await prisma.tokenStake.findUnique({
    where: { userId_petId: { userId, petId } },
  });

  if (!stake) {
    stake = await prisma.tokenStake.create({
      data: {
        userId,
        petId,
        amountStaked: 0,
        power: 0,
        pendingRewards: 0,
      },
    });
  }

  return stake;
}

/**
 * Stake $SIP on a pet
 */
export async function stakeTokens(
  userId: string,
  petId: string,
  amount: number,
  txSignature?: string
): Promise<{
  success: boolean;
  stake?: Awaited<ReturnType<typeof getOrCreateStake>>;
  error?: string;
}> {
  try {
    // Validate amount
    const displayAmount = amount / Math.pow(10, SIP_DECIMALS);
    if (displayAmount < STAKING_CONFIG.minStake) {
      return { success: false, error: `Minimum stake is ${STAKING_CONFIG.minStake} $SIP` };
    }

    // Get pet for stage info
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet || pet.userId !== userId) {
      return { success: false, error: 'Pet not found or not owned by user' };
    }

    // Check max stake
    const currentStake = await getOrCreateStake(userId, petId);
    const newTotal = currentStake.amountStaked + amount;
    const maxStakeRaw = STAKING_CONFIG.maxStake * Math.pow(10, SIP_DECIMALS);

    if (newTotal > maxStakeRaw) {
      return { success: false, error: `Maximum stake is ${STAKING_CONFIG.maxStake} $SIP` };
    }

    // Calculate new power
    const { finalPower } = calculatePower(newTotal, pet.stage as Stage);

    // Update stake
    const updatedStake = await prisma.tokenStake.update({
      where: { userId_petId: { userId, petId } },
      data: {
        amountStaked: newTotal,
        power: finalPower,
        stakeTxSignature: txSignature,
      },
    });

    // Record history
    await prisma.stakeHistory.create({
      data: {
        userId,
        petId,
        action: 'STAKE',
        amount,
        txSignature,
      },
    });

    return { success: true, stake: updatedStake };
  } catch (error) {
    console.error('Error staking tokens:', error);
    return { success: false, error: 'Failed to stake tokens' };
  }
}

/**
 * Unstake $SIP from a pet
 */
export async function unstakeTokens(
  userId: string,
  petId: string,
  amount: number,
  txSignature?: string
): Promise<{
  success: boolean;
  stake?: Awaited<ReturnType<typeof getOrCreateStake>>;
  error?: string;
}> {
  try {
    const stake = await getOrCreateStake(userId, petId);

    if (amount > stake.amountStaked) {
      return { success: false, error: 'Insufficient staked amount' };
    }

    // Get pet for stage info
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return { success: false, error: 'Pet not found' };
    }

    const newTotal = stake.amountStaked - amount;
    const { finalPower } = calculatePower(newTotal, pet.stage as Stage);

    // Update stake
    const updatedStake = await prisma.tokenStake.update({
      where: { userId_petId: { userId, petId } },
      data: {
        amountStaked: newTotal,
        power: finalPower,
      },
    });

    // Record history
    await prisma.stakeHistory.create({
      data: {
        userId,
        petId,
        action: 'UNSTAKE',
        amount,
        txSignature,
      },
    });

    return { success: true, stake: updatedStake };
  } catch (error) {
    console.error('Error unstaking tokens:', error);
    return { success: false, error: 'Failed to unstake tokens' };
  }
}

/**
 * Claim staking rewards
 */
export async function claimRewards(
  userId: string,
  petId: string,
  isWinningTribe: boolean = false,
  txSignature?: string
): Promise<{
  success: boolean;
  claimedAmount?: number;
  error?: string;
}> {
  try {
    const stake = await getOrCreateStake(userId, petId);

    if (stake.amountStaked <= 0) {
      return { success: false, error: 'No tokens staked' };
    }

    const { pendingRewards } = calculatePendingRewards(
      stake.amountStaked,
      stake.lastClaimAt,
      isWinningTribe
    );

    if (pendingRewards <= 0) {
      return { success: false, error: 'No rewards to claim' };
    }

    // Update stake
    await prisma.tokenStake.update({
      where: { userId_petId: { userId, petId } },
      data: {
        lastClaimAt: new Date(),
        pendingRewards: 0,
      },
    });

    // Record history
    await prisma.stakeHistory.create({
      data: {
        userId,
        petId,
        action: 'CLAIM',
        amount: pendingRewards,
        txSignature,
      },
    });

    return { success: true, claimedAmount: pendingRewards };
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return { success: false, error: 'Failed to claim rewards' };
  }
}

/**
 * Apply neglect penalty (burns staked tokens)
 */
export async function applyNeglectPenalty(
  userId: string,
  petId: string
): Promise<{
  success: boolean;
  penaltyAmount?: number;
  error?: string;
}> {
  try {
    const stake = await prisma.tokenStake.findUnique({
      where: { userId_petId: { userId, petId } },
    });

    if (!stake || stake.amountStaked <= 0) {
      return { success: true, penaltyAmount: 0 };
    }

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return { success: false, error: 'Pet not found' };
    }

    const penalty = calculateNeglectPenalty(
      stake.amountStaked,
      pet.isNeglected,
      pet.neglectedAt
    );

    if (!penalty.shouldApply) {
      return { success: true, penaltyAmount: 0 };
    }

    // Calculate new power
    const { finalPower } = calculatePower(penalty.remainingStake, pet.stage as Stage);

    // Update stake (burn penalty)
    await prisma.tokenStake.update({
      where: { userId_petId: { userId, petId } },
      data: {
        amountStaked: penalty.remainingStake,
        power: finalPower,
      },
    });

    // Record burn in history
    await prisma.stakeHistory.create({
      data: {
        userId,
        petId,
        action: 'BURN_PENALTY',
        amount: penalty.penaltyAmount,
      },
    });

    return { success: true, penaltyAmount: penalty.penaltyAmount };
  } catch (error) {
    console.error('Error applying neglect penalty:', error);
    return { success: false, error: 'Failed to apply penalty' };
  }
}

/**
 * Get staking summary for a user's pet
 */
export async function getStakingSummary(userId: string, petId: string, isWinningTribe: boolean = false) {
  const stake = await getOrCreateStake(userId, petId);
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
  });

  if (!pet) {
    return null;
  }

  const powerCalc = calculatePower(stake.amountStaked, pet.stage as Stage, isWinningTribe);
  const rewardsCalc = calculatePendingRewards(stake.amountStaked, stake.lastClaimAt, isWinningTribe);
  const penaltyCalc = calculateNeglectPenalty(stake.amountStaked, pet.isNeglected, pet.neglectedAt);

  // Use stored power (from token feeding) if available, otherwise use calculated power
  const effectivePower = stake.power > 0 ? stake.power : powerCalc.finalPower;
  const tier = getPowerTier(effectivePower);

  return {
    stake: {
      amount: stake.amountStaked,
      power: effectivePower, // Use stored power from token feeding
      stakedAt: stake.stakedAt,
    },
    power: powerCalc,
    rewards: rewardsCalc,
    penalty: penaltyCalc,
    tier,
    pet: {
      name: pet.name,
      tribe: pet.tribe,
      stage: pet.stage,
      isNeglected: pet.isNeglected,
    },
  };
}

/**
 * Get total tribe power (sum of all member powers)
 */
export async function getTribeTotalPower(tribe: Tribe): Promise<number> {
  const stakes = await prisma.tokenStake.findMany({
    where: {
      pet: {
        tribe,
      },
    },
    select: {
      power: true,
    },
  });

  return stakes.reduce((total, stake) => total + stake.power, 0);
}

/**
 * Update tribe guild stats
 */
export async function updateTribeGuildStats(tribe: Tribe): Promise<void> {
  const totalPower = await getTribeTotalPower(tribe);
  const memberCount = await prisma.pet.count({
    where: { tribe },
  });

  await prisma.tribeGuild.upsert({
    where: { tribe },
    update: {
      totalPower,
      memberCount,
    },
    create: {
      tribe,
      totalPower,
      memberCount,
      treasury: 0,
    },
  });
}
