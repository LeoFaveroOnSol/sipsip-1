/**
 * Tribe Guild Logic
 * Handles tribe guild operations including treasury, rankings, and chat
 */

import { prisma } from './prisma';
import { TRIBES } from './constants';

// ============== TYPES ==============

export interface GuildInfo {
  tribe: string;
  treasury: number;
  totalPower: number;
  memberCount: number;
  weekId?: string;
}

export interface GuildMember {
  userId: string;
  petId: string;
  petName: string;
  wallet: string;
  power: number;
  battlesWon: number;
  battlesLost: number;
  sipContributed: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  wallet: string;
  message: string;
  createdAt: Date;
}

// ============== GUILD OPERATIONS ==============

/**
 * Get or create a tribe guild
 */
export async function getOrCreateGuild(tribe: string): Promise<GuildInfo> {
  let guild = await prisma.tribeGuild.findUnique({
    where: { tribe },
  });

  if (!guild) {
    guild = await prisma.tribeGuild.create({
      data: { tribe },
    });
  }

  return {
    tribe: guild.tribe,
    treasury: guild.treasury,
    totalPower: guild.totalPower,
    memberCount: guild.memberCount,
    weekId: guild.weekId || undefined,
  };
}

/**
 * Update guild stats (called after battles, staking changes, etc)
 */
export async function updateGuildStats(tribe: string): Promise<void> {
  // Get all pets in this tribe with their stakes
  const petsInTribe = await prisma.pet.findMany({
    where: { tribe },
    include: {
      stakes: true,
    },
  });

  const totalPower = petsInTribe.reduce((sum, pet) => {
    const petPower = pet.stakes.reduce((s, stake) => s + stake.power, 0);
    return sum + petPower;
  }, 0);

  await prisma.tribeGuild.upsert({
    where: { tribe },
    update: {
      totalPower,
      memberCount: petsInTribe.length,
    },
    create: {
      tribe,
      totalPower,
      memberCount: petsInTribe.length,
    },
  });
}

/**
 * Add to tribe treasury (called when tribe members win battles)
 */
export async function addToTreasury(tribe: string, amount: number): Promise<void> {
  await prisma.tribeGuild.upsert({
    where: { tribe },
    update: {
      treasury: { increment: amount },
    },
    create: {
      tribe,
      treasury: amount,
    },
  });
}

/**
 * Get guild leaderboard for current week
 */
export async function getGuildRanking(
  tribe: string,
  weekId: string,
  limit: number = 20
): Promise<GuildMember[]> {
  const rankings = await prisma.tribeMemberRank.findMany({
    where: {
      guild: { tribe },
      weekId,
    },
    include: {
      user: {
        select: { walletPubkey: true },
        include: {
          pet: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { powerContribution: 'desc' },
    take: limit,
  });

  return rankings.map(r => ({
    userId: r.userId,
    petId: r.petId,
    petName: r.user.pet?.name || 'Unknown',
    wallet: r.user.walletPubkey,
    power: r.powerContribution,
    battlesWon: r.battlesWon,
    battlesLost: r.battlesLost,
    sipContributed: r.sipContributed,
  }));
}

/**
 * Update member ranking for the week
 */
export async function updateMemberRanking(
  userId: string,
  petId: string,
  weekId: string,
  updates: {
    powerContribution?: number;
    battlesWon?: number;
    battlesLost?: number;
    sipContributed?: number;
  }
): Promise<void> {
  // Get user's tribe
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
  });

  if (!pet) return;

  // Get or create guild
  const guild = await prisma.tribeGuild.upsert({
    where: { tribe: pet.tribe },
    update: {},
    create: { tribe: pet.tribe },
  });

  // Upsert member ranking
  await prisma.tribeMemberRank.upsert({
    where: {
      guildId_userId_weekId: {
        guildId: guild.id,
        userId,
        weekId,
      },
    },
    update: {
      powerContribution: updates.powerContribution !== undefined
        ? { increment: updates.powerContribution }
        : undefined,
      battlesWon: updates.battlesWon !== undefined
        ? { increment: updates.battlesWon }
        : undefined,
      battlesLost: updates.battlesLost !== undefined
        ? { increment: updates.battlesLost }
        : undefined,
      sipContributed: updates.sipContributed !== undefined
        ? { increment: updates.sipContributed }
        : undefined,
    },
    create: {
      guildId: guild.id,
      userId,
      petId,
      weekId,
      powerContribution: updates.powerContribution || 0,
      battlesWon: updates.battlesWon || 0,
      battlesLost: updates.battlesLost || 0,
      sipContributed: updates.sipContributed || 0,
    },
  });
}

// ============== CHAT OPERATIONS ==============

const MAX_MESSAGE_LENGTH = 280;
const RATE_LIMIT_SECONDS = 5;
const chatRateLimits = new Map<string, number>();

/**
 * Send a chat message in tribe guild
 */
export async function sendChatMessage(
  userId: string,
  tribe: string,
  message: string
): Promise<{ success: boolean; error?: string; message?: ChatMessage }> {
  // Validate message
  if (!message || message.trim().length === 0) {
    return { success: false, error: 'Message cannot be empty' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` };
  }

  // Rate limiting
  const lastMessage = chatRateLimits.get(userId);
  if (lastMessage && Date.now() - lastMessage < RATE_LIMIT_SECONDS * 1000) {
    return { success: false, error: `Please wait ${RATE_LIMIT_SECONDS} seconds between messages` };
  }

  // Get or create guild
  const guild = await prisma.tribeGuild.upsert({
    where: { tribe },
    update: {},
    create: { tribe },
  });

  // Create message
  const chatMessage = await prisma.tribeChatMessage.create({
    data: {
      guildId: guild.id,
      userId,
      message: message.trim(),
    },
    include: {
      user: {
        select: { walletPubkey: true },
      },
    },
  });

  // Update rate limit
  chatRateLimits.set(userId, Date.now());

  return {
    success: true,
    message: {
      id: chatMessage.id,
      userId: chatMessage.userId,
      wallet: chatMessage.user.walletPubkey,
      message: chatMessage.message,
      createdAt: chatMessage.createdAt,
    },
  };
}

/**
 * Get recent chat messages for a tribe
 */
export async function getChatMessages(
  tribe: string,
  limit: number = 50,
  before?: string
): Promise<ChatMessage[]> {
  const guild = await prisma.tribeGuild.findUnique({
    where: { tribe },
  });

  if (!guild) return [];

  const whereClause: Record<string, unknown> = {
    guildId: guild.id,
  };

  if (before) {
    const beforeMessage = await prisma.tribeChatMessage.findUnique({
      where: { id: before },
    });
    if (beforeMessage) {
      whereClause.createdAt = { lt: beforeMessage.createdAt };
    }
  }

  const messages = await prisma.tribeChatMessage.findMany({
    where: whereClause,
    include: {
      user: {
        select: { walletPubkey: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.map(m => ({
    id: m.id,
    userId: m.userId,
    wallet: m.user.walletPubkey,
    message: m.message,
    createdAt: m.createdAt,
  })).reverse(); // Return in chronological order
}

// ============== TRIBE STATS ==============

/**
 * Get all tribe guild stats for comparison
 */
export async function getAllTribeStats(): Promise<GuildInfo[]> {
  const tribeKeys = Object.keys(TRIBES) as Array<keyof typeof TRIBES>;
  const guilds = await Promise.all(
    tribeKeys.map(tribe => getOrCreateGuild(tribe))
  );

  return guilds.sort((a, b) => b.totalPower - a.totalPower);
}

/**
 * Get tribe treasury balance
 */
export async function getTribeTreasury(tribe: string): Promise<number> {
  const guild = await prisma.tribeGuild.findUnique({
    where: { tribe },
  });

  return guild?.treasury || 0;
}
