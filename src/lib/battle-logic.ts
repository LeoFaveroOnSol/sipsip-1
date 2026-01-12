/**
 * PvP Auto-Battle Logic
 * Handles matchmaking, battle resolution, and replay generation
 * Now with Skills system integration for luck-based combat!
 */

import { prisma } from './prisma';
import { BATTLE_CONFIG, TRIBE_BONUSES, Tribe } from './constants';
import { TokenEconomics, SIP_DECIMALS } from './token';
import { getOrCreateStake, updateTribeGuildStats } from './staking';
import {
  calculateSkillEffects,
  applySkillsToBattle,
  applySkillsToDamage,
  SkillEffects,
  getPetSkills,
} from './skill-logic';

// ============== TYPES ==============

export interface BattleReplayFrame {
  timestamp: number;        // Relative time in seconds
  attackerId: 'challenger' | 'defender';
  action: 'attack' | 'defend' | 'special' | 'hit' | 'dodge' | 'critical';
  damage?: number;
  remainingHp?: {
    challenger: number;
    defender: number;
  };
  effect?: 'spark' | 'impact' | 'heal' | 'buff' | 'explosion';
  position?: { x: number; y: number; z: number };
}

export interface BattleResult {
  winnerId: string;
  winnerPetId: string;
  loserId: string;
  loserPetId: string;
  prizeAmount: number;
  burnedAmount: number;
  treasuryAmount: number;
  replayData: BattleReplayFrame[];
  stats: {
    challengerFinalHp: number;
    defenderFinalHp: number;
    totalRounds: number;
    criticalHits: number;
    dodges: number;
  };
  // Skill-based battle modifiers
  skillEffects?: {
    challenger: SkillEffects;
    defender: SkillEffects;
    baseWinChance: number;
    adjustedWinChance: number;
    challengerLuckRoll: number;
    defenderLuckRoll: number;
  };
}

export interface MatchmakingResult {
  success: boolean;
  opponents?: Array<{
    odId: string;
    odName: string;
    petId: string;
    petName: string;
    tribe: string;
    power: number;
    winChance: number;
  }>;
  userPower?: number;
  error?: string;
}

// ============== WIN PROBABILITY ==============

/**
 * Calculate win probability based on power difference
 * Formula: 50% + (power_diff * 0.03%), capped at 80%, floor at 20%
 */
export function calculateWinProbability(
  challengerPower: number,
  defenderPower: number
): number {
  const powerDiff = challengerPower - defenderPower;
  const bonusChance = powerDiff * BATTLE_CONFIG.powerDiffMultiplier;
  const winChance = BATTLE_CONFIG.baseWinChance + bonusChance;

  // Clamp between min and max
  return Math.max(
    BATTLE_CONFIG.minWinChance,
    Math.min(BATTLE_CONFIG.maxWinChance, winChance)
  );
}

/**
 * Apply tribe bonus to damage
 */
export function applyTribeBonus(
  baseDamage: number,
  tribe: Tribe,
  isAttacker: boolean
): number {
  if (tribe === 'CAOS' && isAttacker) {
    return baseDamage * (1 + TRIBE_BONUSES.CAOS.bonus);
  }
  return baseDamage;
}

// ============== BATTLE RESOLUTION ==============

/**
 * Resolve a battle with Skills integration
 * Skills add luck-based variance - even weaker pets can win with good skills!
 */
export async function resolveBattleWithSkills(
  challengerId: string,
  challengerPetId: string,
  challengerPower: number,
  challengerTribe: Tribe,
  defenderId: string,
  defenderPetId: string,
  defenderPower: number,
  defenderTribe: Tribe,
  betAmount: number
): Promise<BattleResult> {
  // Get skill effects for both pets
  const challengerEffects = await calculateSkillEffects(challengerPetId);
  const defenderEffects = await calculateSkillEffects(defenderPetId);

  // Apply power scaling from skills
  const adjustedChallengerPower = challengerPower * (1 + challengerEffects.powerScaling);
  const adjustedDefenderPower = defenderPower * (1 + defenderEffects.powerScaling);

  // Calculate base win probability from power
  const baseWinChance = calculateWinProbability(adjustedChallengerPower, adjustedDefenderPower);

  // Apply skill-based luck modifiers
  const { adjustedWinChance, attackerLuckRoll, defenderLuckRoll } = applySkillsToBattle(
    baseWinChance,
    challengerEffects,
    defenderEffects
  );

  // Roll for winner
  const roll = Math.random();
  const challengerWins = roll < adjustedWinChance;

  // Calculate prize distribution
  const totalPot = betAmount * 2;
  const burnedAmount = Math.floor(totalPot * BATTLE_CONFIG.burnShare);
  const treasuryAmount = Math.floor(totalPot * 0.02); // 2% to tribe treasury
  const prizeAmount = totalPot - burnedAmount - treasuryAmount;

  // Generate battle replay with skill effects
  const replayData = generateBattleReplayWithSkills(
    challengerPower,
    challengerTribe,
    challengerEffects,
    defenderPower,
    defenderTribe,
    defenderEffects,
    challengerWins
  );

  // Calculate final HP from replay
  const lastFrame = replayData[replayData.length - 1];
  const challengerFinalHp = lastFrame.remainingHp?.challenger || 0;
  const defenderFinalHp = lastFrame.remainingHp?.defender || 0;

  // Count critical hits and dodges
  const criticalHits = replayData.filter(f => f.action === 'critical').length;
  const dodges = replayData.filter(f => f.action === 'dodge').length;

  return {
    winnerId: challengerWins ? challengerId : defenderId,
    winnerPetId: challengerWins ? challengerPetId : defenderPetId,
    loserId: challengerWins ? defenderId : challengerId,
    loserPetId: challengerWins ? defenderPetId : challengerPetId,
    prizeAmount,
    burnedAmount,
    treasuryAmount,
    replayData,
    stats: {
      challengerFinalHp,
      defenderFinalHp,
      totalRounds: Math.floor(replayData.length / 2),
      criticalHits,
      dodges,
    },
    skillEffects: {
      challenger: challengerEffects,
      defender: defenderEffects,
      baseWinChance,
      adjustedWinChance,
      challengerLuckRoll: attackerLuckRoll,
      defenderLuckRoll: defenderLuckRoll,
    },
  };
}

/**
 * Legacy: Resolve a battle without skills (kept for compatibility)
 */
export function resolveBattle(
  challengerId: string,
  challengerPetId: string,
  challengerPower: number,
  challengerTribe: Tribe,
  defenderId: string,
  defenderPetId: string,
  defenderPower: number,
  defenderTribe: Tribe,
  betAmount: number
): BattleResult {
  const winProbability = calculateWinProbability(challengerPower, defenderPower);
  const roll = Math.random();
  const challengerWins = roll < winProbability;

  // Calculate prize distribution
  const totalPot = betAmount * 2;
  const burnedAmount = Math.floor(totalPot * BATTLE_CONFIG.burnShare);
  const treasuryAmount = Math.floor(totalPot * 0.02); // 2% to tribe treasury
  const prizeAmount = totalPot - burnedAmount - treasuryAmount;

  // Generate battle replay
  const replayData = generateBattleReplay(
    challengerPower,
    challengerTribe,
    defenderPower,
    defenderTribe,
    challengerWins
  );

  // Calculate final HP from replay
  const lastFrame = replayData[replayData.length - 1];
  const challengerFinalHp = lastFrame.remainingHp?.challenger || 0;
  const defenderFinalHp = lastFrame.remainingHp?.defender || 0;

  // Count critical hits
  const criticalHits = replayData.filter(f => f.action === 'critical').length;
  const dodges = replayData.filter(f => f.action === 'dodge').length;

  return {
    winnerId: challengerWins ? challengerId : defenderId,
    winnerPetId: challengerWins ? challengerPetId : defenderPetId,
    loserId: challengerWins ? defenderId : challengerId,
    loserPetId: challengerWins ? defenderPetId : challengerPetId,
    prizeAmount,
    burnedAmount,
    treasuryAmount,
    replayData,
    stats: {
      challengerFinalHp,
      defenderFinalHp,
      totalRounds: Math.floor(replayData.length / 2),
      criticalHits,
      dodges,
    },
  };
}

/**
 * Generate battle replay frames for 3D animation
 */
function generateBattleReplay(
  challengerPower: number,
  challengerTribe: Tribe,
  defenderPower: number,
  defenderTribe: Tribe,
  challengerWins: boolean
): BattleReplayFrame[] {
  const frames: BattleReplayFrame[] = [];
  let time = 0;
  const timeStep = 0.5; // 0.5 seconds per action

  // Initial HP (based on power)
  let challengerHp = 100 + challengerPower * 0.1;
  let defenderHp = 100 + defenderPower * 0.1;
  const challengerMaxHp = challengerHp;
  const defenderMaxHp = defenderHp;

  // Base damage (based on power)
  const challengerBaseDamage = 10 + challengerPower * 0.05;
  const defenderBaseDamage = 10 + defenderPower * 0.05;

  // Battle loop (max 20 rounds to prevent infinite loops)
  let round = 0;
  const maxRounds = 20;
  let currentAttacker: 'challenger' | 'defender' = 'challenger';

  while (round < maxRounds && challengerHp > 0 && defenderHp > 0) {
    const isChallenger = currentAttacker === 'challenger';
    const attackerPower = isChallenger ? challengerPower : defenderPower;
    const attackerTribe = isChallenger ? challengerTribe : defenderTribe;

    // Determine action type
    const actionRoll = Math.random();
    let action: BattleReplayFrame['action'] = 'attack';
    let damage = isChallenger ? challengerBaseDamage : defenderBaseDamage;
    let effect: BattleReplayFrame['effect'] = 'spark';

    // Critical hit chance (10%)
    if (actionRoll < 0.1) {
      action = 'critical';
      damage *= 1.5;
      effect = 'explosion';
    }
    // Dodge chance for defender (15%)
    else if (actionRoll < 0.25) {
      action = 'dodge';
      damage = 0;
      effect = undefined;
    }
    // Special attack chance (5%)
    else if (actionRoll < 0.30) {
      action = 'special';
      damage *= 1.25;
      effect = 'impact';
    }

    // Apply tribe bonus
    damage = applyTribeBonus(damage, attackerTribe, true);

    // Apply damage
    if (damage > 0) {
      if (isChallenger) {
        defenderHp = Math.max(0, defenderHp - damage);
      } else {
        challengerHp = Math.max(0, challengerHp - damage);
      }
    }

    // Add attack frame
    frames.push({
      timestamp: time,
      attackerId: currentAttacker,
      action,
      damage: Math.floor(damage),
      remainingHp: {
        challenger: Math.floor((challengerHp / challengerMaxHp) * 100),
        defender: Math.floor((defenderHp / defenderMaxHp) * 100),
      },
      effect,
    });

    // Add hit reaction frame (if not dodged)
    if (damage > 0) {
      time += timeStep;
      frames.push({
        timestamp: time,
        attackerId: currentAttacker === 'challenger' ? 'defender' : 'challenger',
        action: 'hit',
        damage: Math.floor(damage),
        remainingHp: {
          challenger: Math.floor((challengerHp / challengerMaxHp) * 100),
          defender: Math.floor((defenderHp / defenderMaxHp) * 100),
        },
        effect: 'impact',
      });
    }

    time += timeStep;
    currentAttacker = currentAttacker === 'challenger' ? 'defender' : 'challenger';
    round++;
  }

  // Ensure correct winner
  if (challengerWins && defenderHp > 0) {
    defenderHp = 0;
    frames[frames.length - 1].remainingHp = {
      challenger: Math.max(1, Math.floor((challengerHp / challengerMaxHp) * 100)),
      defender: 0,
    };
  } else if (!challengerWins && challengerHp > 0) {
    challengerHp = 0;
    frames[frames.length - 1].remainingHp = {
      challenger: 0,
      defender: Math.max(1, Math.floor((defenderHp / defenderMaxHp) * 100)),
    };
  }

  return frames;
}

/**
 * Generate battle replay frames with skill effects integration
 */
function generateBattleReplayWithSkills(
  challengerPower: number,
  challengerTribe: Tribe,
  challengerEffects: SkillEffects,
  defenderPower: number,
  defenderTribe: Tribe,
  defenderEffects: SkillEffects,
  challengerWins: boolean
): BattleReplayFrame[] {
  const frames: BattleReplayFrame[] = [];
  let time = 0;
  const timeStep = 0.5; // 0.5 seconds per action

  // Initial HP (based on power, with defense boost affecting max HP)
  let challengerHp = (100 + challengerPower * 0.1) * (1 + challengerEffects.defenseBoost * 0.5);
  let defenderHp = (100 + defenderPower * 0.1) * (1 + defenderEffects.defenseBoost * 0.5);
  const challengerMaxHp = challengerHp;
  const defenderMaxHp = defenderHp;

  // Base damage (based on power)
  const challengerBaseDamage = 10 + challengerPower * 0.05;
  const defenderBaseDamage = 10 + defenderPower * 0.05;

  // Battle loop (max 20 rounds to prevent infinite loops)
  let round = 0;
  const maxRounds = 20;
  let currentAttacker: 'challenger' | 'defender' = 'challenger';

  while (round < maxRounds && challengerHp > 0 && defenderHp > 0) {
    const isChallenger = currentAttacker === 'challenger';
    const attackerTribe = isChallenger ? challengerTribe : defenderTribe;
    const attackerEffects = isChallenger ? challengerEffects : defenderEffects;
    const defenderSkillEffects = isChallenger ? defenderEffects : challengerEffects;

    // Base damage for this attacker
    let baseDamage = isChallenger ? challengerBaseDamage : defenderBaseDamage;

    // Apply skill effects to damage calculation
    const {
      finalDamage,
      wasDodged,
      wasCritical,
      critChance,
      dodgeChance,
    } = applySkillsToDamage(baseDamage, attackerEffects, defenderSkillEffects, false);

    let action: BattleReplayFrame['action'] = 'attack';
    let damage = finalDamage;
    let effect: BattleReplayFrame['effect'] = 'spark';

    if (wasDodged) {
      action = 'dodge';
      damage = 0;
      effect = undefined;
    } else if (wasCritical) {
      action = 'critical';
      effect = 'explosion';
    } else if (Math.random() < 0.05) {
      // 5% special attack chance
      action = 'special';
      damage = Math.floor(damage * 1.25);
      effect = 'impact';
    }

    // Apply tribe bonus
    damage = applyTribeBonus(damage, attackerTribe, true);

    // Apply damage
    if (damage > 0) {
      if (isChallenger) {
        defenderHp = Math.max(0, defenderHp - damage);
      } else {
        challengerHp = Math.max(0, challengerHp - damage);
      }
    }

    // Add attack frame
    frames.push({
      timestamp: time,
      attackerId: currentAttacker,
      action,
      damage: Math.floor(damage),
      remainingHp: {
        challenger: Math.floor((challengerHp / challengerMaxHp) * 100),
        defender: Math.floor((defenderHp / defenderMaxHp) * 100),
      },
      effect,
    });

    // Add hit reaction frame (if not dodged)
    if (damage > 0) {
      time += timeStep;
      frames.push({
        timestamp: time,
        attackerId: currentAttacker === 'challenger' ? 'defender' : 'challenger',
        action: 'hit',
        damage: Math.floor(damage),
        remainingHp: {
          challenger: Math.floor((challengerHp / challengerMaxHp) * 100),
          defender: Math.floor((defenderHp / defenderMaxHp) * 100),
        },
        effect: 'impact',
      });
    }

    time += timeStep;
    currentAttacker = currentAttacker === 'challenger' ? 'defender' : 'challenger';
    round++;
  }

  // Ensure correct winner
  if (challengerWins && defenderHp > 0) {
    defenderHp = 0;
    frames[frames.length - 1].remainingHp = {
      challenger: Math.max(1, Math.floor((challengerHp / challengerMaxHp) * 100)),
      defender: 0,
    };
  } else if (!challengerWins && challengerHp > 0) {
    challengerHp = 0;
    frames[frames.length - 1].remainingHp = {
      challenger: 0,
      defender: Math.max(1, Math.floor((defenderHp / defenderMaxHp) * 100)),
    };
  }

  return frames;
}

// ============== DATABASE OPERATIONS ==============

/**
 * Create a new battle challenge
 */
export async function createBattle(
  challengerId: string,
  challengerPetId: string,
  betAmount: number,
  txSignature?: string
): Promise<{
  success: boolean;
  battle?: { id: string };
  error?: string;
}> {
  try {
    // Validate bet amount
    if (betAmount < BATTLE_CONFIG.minBet * Math.pow(10, SIP_DECIMALS)) {
      return { success: false, error: `Minimum bet is ${BATTLE_CONFIG.minBet} $SIP` };
    }
    if (betAmount > BATTLE_CONFIG.maxBet * Math.pow(10, SIP_DECIMALS)) {
      return { success: false, error: `Maximum bet is ${BATTLE_CONFIG.maxBet} $SIP` };
    }

    // Get challenger's pet and power
    const pet = await prisma.pet.findUnique({
      where: { id: challengerPetId },
    });

    if (!pet || pet.userId !== challengerId) {
      return { success: false, error: 'Pet not found or not owned by user' };
    }

    if (pet.isNeglected) {
      return { success: false, error: 'Cannot battle with neglected pet' };
    }

    // Get stake for power
    const stake = await getOrCreateStake(challengerId, challengerPetId);

    // Create battle
    const battle = await prisma.battle.create({
      data: {
        challengerId,
        challengerPetId,
        betAmount,
        challengerPower: stake.power,
        status: 'PENDING',
        escrowPda: txSignature,
      },
    });

    return { success: true, battle: { id: battle.id } };
  } catch (error) {
    console.error('Error creating battle:', error);
    return { success: false, error: 'Failed to create battle' };
  }
}

/**
 * Find opponents for matchmaking (within ±20% power band)
 */
export async function findOpponents(
  userId: string,
  petId: string,
  limit: number = 10
): Promise<MatchmakingResult> {
  try {
    // Get user's power
    const stake = await getOrCreateStake(userId, petId);
    const userPower = stake.power;

    // Calculate power band
    const minPower = userPower * (1 - BATTLE_CONFIG.powerBandPercent);
    const maxPower = userPower * (1 + BATTLE_CONFIG.powerBandPercent);

    // Find pending battles within power band
    const pendingBattles = await prisma.battle.findMany({
      where: {
        status: 'PENDING',
        challengerId: { not: userId },
        challengerPower: {
          gte: minPower,
          lte: maxPower,
        },
      },
      include: {
        challenger: true,
        challengerPet: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const opponents = pendingBattles.map(battle => ({
      odId: battle.challengerId,
      odName: battle.challenger.walletPubkey.slice(0, 8) + '...',
      petId: battle.challengerPetId,
      petName: battle.challengerPet.name,
      tribe: battle.challengerPet.tribe,
      power: battle.challengerPower,
      winChance: Math.floor(calculateWinProbability(userPower, battle.challengerPower) * 100),
    }));

    return { success: true, opponents, userPower };
  } catch (error) {
    console.error('Error finding opponents:', error);
    return { success: false, error: 'Failed to find opponents' };
  }
}

/**
 * Accept a battle challenge and resolve it
 */
export async function acceptBattle(
  battleId: string,
  defenderId: string,
  defenderPetId: string,
  txSignature?: string
): Promise<{
  success: boolean;
  result?: BattleResult;
  error?: string;
}> {
  try {
    // Get battle
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        challengerPet: true,
      },
    });

    if (!battle) {
      return { success: false, error: 'Battle not found' };
    }

    if (battle.status !== 'PENDING') {
      return { success: false, error: 'Battle is no longer available' };
    }

    if (battle.challengerId === defenderId) {
      return { success: false, error: 'Cannot battle yourself' };
    }

    // Get defender's pet
    const defenderPet = await prisma.pet.findUnique({
      where: { id: defenderPetId },
    });

    if (!defenderPet || defenderPet.userId !== defenderId) {
      return { success: false, error: 'Pet not found or not owned by user' };
    }

    if (defenderPet.isNeglected) {
      return { success: false, error: 'Cannot battle with neglected pet' };
    }

    // Get defender's power
    const defenderStake = await getOrCreateStake(defenderId, defenderPetId);

    // Resolve battle with Skills integration (adds luck-based variance!)
    const result = await resolveBattleWithSkills(
      battle.challengerId,
      battle.challengerPetId,
      battle.challengerPower,
      battle.challengerPet.tribe as Tribe,
      defenderId,
      defenderPetId,
      defenderStake.power,
      defenderPet.tribe as Tribe,
      battle.betAmount
    );

    // Update battle record
    await prisma.battle.update({
      where: { id: battleId },
      data: {
        defenderId,
        defenderPetId,
        defenderPower: defenderStake.power,
        winnerId: result.winnerId,
        winnerPetId: result.winnerPetId,
        winProbability: calculateWinProbability(battle.challengerPower, defenderStake.power),
        prizePool: result.prizeAmount,
        burnedAmount: result.burnedAmount,
        replayData: JSON.stringify(result.replayData),
        status: 'COMPLETED',
        matchedAt: new Date(),
        completedAt: new Date(),
        settleTxSignature: txSignature,
      },
    });

    // Update tribe guild stats
    await updateTribeGuildStats(battle.challengerPet.tribe as Tribe);
    await updateTribeGuildStats(defenderPet.tribe as Tribe);

    // Update tribe member ranks
    const winnerTribe = result.winnerId === battle.challengerId
      ? battle.challengerPet.tribe
      : defenderPet.tribe;

    // Add treasury contribution
    const guild = await prisma.tribeGuild.findUnique({
      where: { tribe: winnerTribe },
    });

    if (guild) {
      await prisma.tribeGuild.update({
        where: { tribe: winnerTribe },
        data: {
          treasury: guild.treasury + result.treasuryAmount,
        },
      });
    }

    // Create PetEvents for both participants (for tribe scoring)
    await prisma.petEvent.create({
      data: {
        petId: battle.challengerPetId,
        type: 'action',
        payload: JSON.stringify({
          action: 'battle',
          battleId,
          role: 'challenger',
          won: result.winnerId === battle.challengerId,
          prizeAmount: result.winnerId === battle.challengerId ? result.prizeAmount : 0,
        }),
      },
    });
    await prisma.petEvent.create({
      data: {
        petId: defenderPetId,
        type: 'action',
        payload: JSON.stringify({
          action: 'battle',
          battleId,
          role: 'defender',
          won: result.winnerId === defenderId,
          prizeAmount: result.winnerId === defenderId ? result.prizeAmount : 0,
        }),
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error('Error accepting battle:', error);
    return { success: false, error: 'Failed to accept battle' };
  }
}

/**
 * Cancel a pending battle (only by challenger)
 */
export async function cancelBattle(
  battleId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
    });

    if (!battle) {
      return { success: false, error: 'Battle not found' };
    }

    if (battle.challengerId !== userId) {
      return { success: false, error: 'Only challenger can cancel' };
    }

    if (battle.status !== 'PENDING') {
      return { success: false, error: 'Battle cannot be cancelled' };
    }

    await prisma.battle.update({
      where: { id: battleId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling battle:', error);
    return { success: false, error: 'Failed to cancel battle' };
  }
}

/**
 * Get battle history for a user
 */
export async function getBattleHistory(
  userId: string,
  limit: number = 20
): Promise<{
  success: boolean;
  battles?: Array<{
    id: string;
    opponent: string;
    opponentPet: string;
    betAmount: number;
    isWinner: boolean;
    prizeWon: number;
    completedAt: Date | null;
  }>;
  error?: string;
}> {
  try {
    const battles = await prisma.battle.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { challengerId: userId },
          { defenderId: userId },
        ],
      },
      include: {
        challenger: true,
        defender: true,
        challengerPet: true,
        defenderPet: true,
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    const history = battles.map(battle => {
      const isChallenger = battle.challengerId === userId;
      const opponent = isChallenger ? battle.defender : battle.challenger;
      const opponentPet = isChallenger ? battle.defenderPet : battle.challengerPet;
      const isWinner = battle.winnerId === userId;

      return {
        id: battle.id,
        opponent: opponent?.walletPubkey.slice(0, 8) + '...' || 'Unknown',
        opponentPet: opponentPet?.name || 'Unknown',
        betAmount: battle.betAmount,
        isWinner,
        prizeWon: isWinner ? (battle.prizePool || 0) : 0,
        completedAt: battle.completedAt,
      };
    });

    return { success: true, battles: history };
  } catch (error) {
    console.error('Error getting battle history:', error);
    return { success: false, error: 'Failed to get battle history' };
  }
}

/**
 * Get battle details including replay
 */
export async function getBattleDetails(battleId: string) {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      challenger: true,
      defender: true,
      challengerPet: true,
      defenderPet: true,
    },
  });

  if (!battle) return null;

  return {
    ...battle,
    replayData: battle.replayData ? JSON.parse(battle.replayData) as BattleReplayFrame[] : [],
  };
}

/**
 * Cleanup expired pending battles
 */
export async function cleanupExpiredBattles(): Promise<number> {
  const expiryTime = new Date(
    Date.now() - BATTLE_CONFIG.matchTimeoutMinutes * 60 * 1000
  );

  const result = await prisma.battle.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: expiryTime },
    },
    data: { status: 'CANCELLED' },
  });

  return result.count;
}
