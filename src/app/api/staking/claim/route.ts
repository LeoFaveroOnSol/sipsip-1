import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { claimRewards } from '@/lib/staking';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';

// POST - Claim staking rewards
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { txSignature } = body;

    // Get user's pet
    const pet = await prisma.pet.findUnique({
      where: { userId: user.id },
    });

    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'No pet found' },
        { status: 404 }
      );
    }

    // Check if user's tribe won last week
    const lastWeek = await prisma.week.findFirst({
      where: { isActive: false },
      orderBy: { endAt: 'desc' },
    });
    const isWinningTribe = lastWeek?.winnerTribe === pet.tribe;

    // Claim rewards
    const result = await claimRewards(user.id, pet.id, isWinningTribe, txSignature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        claimedAmount: result.claimedAmount,
        formattedAmount: formatSipAmount(result.claimedAmount || 0),
        message: `Successfully claimed ${formatSipAmount(result.claimedAmount || 0)} $SIP`,
      },
    });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
