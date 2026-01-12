import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRaidLeaderboard, getCurrentRaid } from '@/lib/raid-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';
import { RAID_CONFIG } from '@/lib/constants';

// GET - Get raid damage leaderboard
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
    const raidId = searchParams.get('raidId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get raid ID from params or current raid
    let targetRaidId = raidId;

    if (!targetRaidId) {
      const currentRaid = await getCurrentRaid();
      if (!currentRaid) {
        return NextResponse.json({
          success: true,
          data: {
            leaderboard: [],
            userRank: null,
            message: 'No active raid',
          },
        });
      }
      targetRaidId = currentRaid.id;
    }

    // Get leaderboard
    const leaderboard = await getRaidLeaderboard(targetRaidId, limit);

    // Get user's position if not in top N
    let userRank = null;
    const userInLeaderboard = leaderboard.find(p => p.userId === user.id);

    if (userInLeaderboard) {
      userRank = {
        position: leaderboard.indexOf(userInLeaderboard) + 1,
        ...userInLeaderboard,
      };
    } else {
      // Check if user participated
      const participation = await prisma.bossRaidParticipant.findUnique({
        where: {
          raidId_userId: {
            raidId: targetRaidId,
            userId: user.id,
          },
        },
        include: {
          pet: {
            select: { name: true, tribe: true },
          },
        },
      });

      if (participation) {
        // Count how many are above
        const aboveCount = await prisma.bossRaidParticipant.count({
          where: {
            raidId: targetRaidId,
            totalDamage: { gt: participation.totalDamage },
          },
        });

        userRank = {
          position: aboveCount + 1,
          petName: participation.pet.name,
          tribe: participation.pet.tribe,
          totalDamage: participation.totalDamage,
          attackCount: participation.attackCount,
          isKillingBlow: participation.isKillingBlow,
        };
      }
    }

    // Format leaderboard
    const formattedLeaderboard = leaderboard.map((p, index) => ({
      position: index + 1,
      petName: p.petName,
      tribe: p.tribe,
      wallet: p.wallet.slice(0, 4) + '...' + p.wallet.slice(-4),
      totalDamage: p.totalDamage.toLocaleString(),
      totalDamageRaw: p.totalDamage,
      attackCount: p.attackCount,
      isKillingBlow: p.isKillingBlow,
      isTop10: index < RAID_CONFIG.top10BadgeThreshold,
      isUser: p.userId === user.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        raidId: targetRaidId,
        leaderboard: formattedLeaderboard,
        userRank: userRank ? {
          position: userRank.position,
          petName: userRank.petName,
          tribe: userRank.tribe,
          totalDamage: userRank.totalDamage.toLocaleString(),
          attackCount: userRank.attackCount,
          isKillingBlow: userRank.isKillingBlow,
          isTop10: userRank.position <= RAID_CONFIG.top10BadgeThreshold,
        } : null,
        top10Threshold: RAID_CONFIG.top10BadgeThreshold,
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
