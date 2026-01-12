import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatSipAmount, SIP_DECIMALS } from '@/lib/token';

// GET - Get all pending battles available to join
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
    const minBet = searchParams.get('minBet');
    const maxBet = searchParams.get('maxBet');

    // Get user's pet for power comparison
    const userPet = await prisma.pet.findUnique({
      where: { userId: user.id },
    });

    // Get user's power from TokenStake (where token feeding saves it)
    let userPower = 0;
    if (userPet) {
      const tokenStake = await prisma.tokenStake.findUnique({
        where: { userId_petId: { userId: user.id, petId: userPet.id } },
      });
      userPower = tokenStake?.power || 0;
    }

    // Build where clause for pending battles (not created by current user)
    const whereClause: Record<string, unknown> = {
      status: 'PENDING',
      challengerId: { not: user.id },
    };

    if (minBet) {
      whereClause.betAmount = {
        ...((whereClause.betAmount as object) || {}),
        gte: parseFloat(minBet),
      };
    }

    if (maxBet) {
      whereClause.betAmount = {
        ...((whereClause.betAmount as object) || {}),
        lte: parseFloat(maxBet),
      };
    }

    // Get pending battles
    const battles = await prisma.battle.findMany({
      where: whereClause,
      include: {
        challenger: {
          select: { walletPubkey: true },
        },
        challengerPet: {
          select: { id: true, name: true, tribe: true, stage: true, formId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculate power band match for each battle
    const formattedBattles = battles.map(battle => {
      const powerDiff = battle.challengerPower > 0
        ? Math.abs(userPower - battle.challengerPower) / battle.challengerPower
        : 0;
      const isInPowerBand = powerDiff <= 0.2; // ±20%

      // Format bet amount - detect if it's raw (new system) or display (old system)
      // Raw amounts have 6 decimals, so 10K display = 10,000,000,000 raw
      // If betAmount > 1,000,000 assume it's raw format
      const isRawAmount = battle.betAmount > 1000000;
      let displayAmount: string;

      if (isRawAmount) {
        // New format: raw amount with 6 decimals
        displayAmount = formatSipAmount(battle.betAmount);
      } else {
        // Old format: display amount directly, format with K suffix
        const amount = battle.betAmount;
        if (amount >= 1000) {
          displayAmount = `${(amount / 1000).toFixed(0)}K`;
        } else {
          displayAmount = amount.toLocaleString();
        }
      }

      return {
        id: battle.id,
        betAmount: displayAmount,
        betAmountRaw: battle.betAmount,
        challenger: {
          wallet: battle.challenger.walletPubkey.slice(0, 4) + '...' + battle.challenger.walletPubkey.slice(-4),
          pet: battle.challengerPet,
          power: battle.challengerPower,
        },
        powerMatch: {
          userPower,
          challengerPower: battle.challengerPower,
          isInPowerBand,
          powerDiffPercent: (powerDiff * 100).toFixed(1),
        },
        createdAt: battle.createdAt,
      };
    });

    // Sort by power band match (in-band first)
    formattedBattles.sort((a, b) => {
      if (a.powerMatch.isInPowerBand && !b.powerMatch.isInPowerBand) return -1;
      if (!a.powerMatch.isInPowerBand && b.powerMatch.isInPowerBand) return 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        battles: formattedBattles,
        userPower,
      },
    });
  } catch (error) {
    console.error('Pending battles error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
