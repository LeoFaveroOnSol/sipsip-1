import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTribeTreasury, getOrCreateGuild } from '@/lib/guild-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';

// GET - Get tribe treasury info
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tribe = searchParams.get('tribe');

    // Get user's pet to determine tribe if not specified
    let targetTribe = tribe;

    if (!targetTribe) {
      const pet = await prisma.pet.findUnique({
        where: { userId: user.id },
      });

      if (!pet) {
        return NextResponse.json(
          { success: false, error: 'No pet found' },
          { status: 404 }
        );
      }

      targetTribe = pet.tribe;
    }

    const guild = await getOrCreateGuild(targetTribe);
    const treasury = guild.treasury;

    // Get recent treasury contributions (from battle wins)
    const recentContributions = await prisma.stakeHistory.findMany({
      where: {
        action: 'BURN_PENALTY', // Treasury contributions come from burns
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { walletPubkey: true },
        },
      },
    });

    // Get treasury sources breakdown (simplified)
    const treasurySources = {
      battleWins: treasury * 0.7, // Estimate: 70% from battles
      raidRewards: treasury * 0.2, // Estimate: 20% from raids
      other: treasury * 0.1, // Estimate: 10% from other sources
    };

    return NextResponse.json({
      success: true,
      data: {
        tribe: targetTribe,
        treasury: formatSipAmount(treasury),
        treasuryRaw: treasury,
        memberCount: guild.memberCount,
        totalPower: guild.totalPower,
        sources: {
          battleWins: formatSipAmount(treasurySources.battleWins),
          raidRewards: formatSipAmount(treasurySources.raidRewards),
          other: formatSipAmount(treasurySources.other),
        },
        recentActivity: recentContributions.map(c => ({
          wallet: c.user.walletPubkey.slice(0, 4) + '...' + c.user.walletPubkey.slice(-4),
          amount: formatSipAmount(c.amount),
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Treasury error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
