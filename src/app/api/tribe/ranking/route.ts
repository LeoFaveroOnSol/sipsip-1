import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGuildRanking } from '@/lib/guild-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';

// GET - Get tribe ranking for current/specified week
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
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const tribe = searchParams.get('tribe');
    const weekId = searchParams.get('weekId');

    // Get user's pet to determine tribe if not specified
    const pet = await prisma.pet.findUnique({
      where: { userId: user.id },
      include: {
        stakes: true,
      },
    });

    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'No pet found' },
        { status: 404 }
      );
    }

    const targetTribe = tribe || pet.tribe;

    // Get current week if not specified
    let targetWeekId: string | null = weekId;
    if (!targetWeekId) {
      const currentWeek = await prisma.week.findFirst({
        where: { isActive: true },
      });
      targetWeekId = currentWeek?.id || null;
    }

    if (!targetWeekId) {
      return NextResponse.json({
        success: true,
        data: {
          tribe: targetTribe,
          ranking: [],
          userRank: null,
          message: 'No active week found',
        },
      });
    }

    // Get ranking
    const ranking = await getGuildRanking(targetTribe, targetWeekId, limit);

    // Find user's rank in their tribe
    let userRank = null;
    if (pet.tribe === targetTribe) {
      const userInRanking = ranking.findIndex(r => r.userId === user.id);
      if (userInRanking !== -1) {
        userRank = {
          position: userInRanking + 1,
          ...ranking[userInRanking],
        };
      } else {
        // User not in top N, get their actual rank
        const userRankData = await prisma.tribeMemberRank.findFirst({
          where: {
            userId: user.id,
            weekId: targetWeekId,
            guild: { tribe: targetTribe },
          },
        });

        if (userRankData) {
          // Count how many are above
          const aboveCount = await prisma.tribeMemberRank.count({
            where: {
              weekId: targetWeekId,
              guild: { tribe: targetTribe },
              powerContribution: { gt: userRankData.powerContribution },
            },
          });

          userRank = {
            position: aboveCount + 1,
            userId: user.id,
            petId: pet.id,
            petName: pet.name,
            wallet: user.walletPubkey,
            power: userRankData.powerContribution,
            battlesWon: userRankData.battlesWon,
            battlesLost: userRankData.battlesLost,
            sipContributed: userRankData.sipContributed,
          };
        }
      }
    }

    // Format ranking for client
    const formattedRanking = ranking.map((r, index) => ({
      position: index + 1,
      petName: r.petName,
      wallet: r.wallet.slice(0, 4) + '...' + r.wallet.slice(-4),
      power: r.power.toFixed(2),
      battlesWon: r.battlesWon,
      battlesLost: r.battlesLost,
      winRate: r.battlesWon + r.battlesLost > 0
        ? ((r.battlesWon / (r.battlesWon + r.battlesLost)) * 100).toFixed(1)
        : '0.0',
      sipContributed: formatSipAmount(r.sipContributed),
      isUser: r.userId === user.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tribe: targetTribe,
        weekId: targetWeekId,
        ranking: formattedRanking,
        userRank: userRank ? {
          position: userRank.position,
          petName: pet.name,
          power: userRank.power.toFixed(2),
          battlesWon: userRank.battlesWon,
          battlesLost: userRank.battlesLost,
          sipContributed: formatSipAmount(userRank.sipContributed),
        } : null,
      },
    });
  } catch (error) {
    console.error('Ranking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
