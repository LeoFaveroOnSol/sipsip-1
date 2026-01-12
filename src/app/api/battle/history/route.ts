import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';

// GET - Get user's battle history
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
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status'); // Filter by status

    // Build where clause
    const whereClause: Record<string, unknown> = {
      OR: [
        { challengerId: user.id },
        { defenderId: user.id },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    // Get battles
    const [battles, total] = await Promise.all([
      prisma.battle.findMany({
        where: whereClause,
        include: {
          challengerPet: {
            select: { id: true, name: true, tribe: true, stage: true, formId: true },
          },
          defenderPet: {
            select: { id: true, name: true, tribe: true, stage: true, formId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.battle.count({ where: whereClause }),
    ]);

    // Calculate stats
    const completedBattles = battles.filter(b => b.status === 'COMPLETED');
    const wins = completedBattles.filter(b => b.winnerId === user.id).length;
    const losses = completedBattles.length - wins;

    // Format battles
    const formattedBattles = battles.map(battle => ({
      id: battle.id,
      status: battle.status,
      betAmount: formatSipAmount(battle.betAmount),
      betAmountRaw: battle.betAmount,
      isChallenger: battle.challengerId === user.id,
      opponent: battle.challengerId === user.id
        ? battle.defenderPet
        : battle.challengerPet,
      myPet: battle.challengerId === user.id
        ? battle.challengerPet
        : battle.defenderPet,
      myPower: battle.challengerId === user.id
        ? battle.challengerPower
        : battle.defenderPower,
      opponentPower: battle.challengerId === user.id
        ? battle.defenderPower
        : battle.challengerPower,
      won: battle.winnerId === user.id,
      prizePool: battle.prizePool ? formatSipAmount(battle.prizePool) : null,
      createdAt: battle.createdAt,
      completedAt: battle.completedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        battles: formattedBattles,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + battles.length < total,
        },
        stats: {
          totalBattles: total,
          wins,
          losses,
          winRate: completedBattles.length > 0
            ? (wins / completedBattles.length * 100).toFixed(1)
            : '0.0',
        },
      },
    });
  } catch (error) {
    console.error('Battle history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
