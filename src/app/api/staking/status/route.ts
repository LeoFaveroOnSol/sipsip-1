import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStakingSummary } from '@/lib/staking';
import { prisma } from '@/lib/prisma';

// GET - Get staking status for current user's pet
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

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

    // Get staking summary
    const summary = await getStakingSummary(user.id, pet.id, isWinningTribe);

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Failed to get staking summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        stake: {
          amount: summary.stake.amount,
          power: summary.stake.power,
          stakedAt: summary.stake.stakedAt.toISOString(),
        },
        power: {
          basePower: summary.power.basePower,
          stageMultiplier: summary.power.stageMultiplier,
          tribeMultiplier: summary.power.tribeMultiplier,
          finalPower: summary.power.finalPower,
          breakdown: summary.power.breakdown,
        },
        rewards: {
          pending: summary.rewards.pendingRewards,
          daily: summary.rewards.dailyRewards,
          effectiveAPY: summary.rewards.effectiveAPY,
          daysStaked: summary.rewards.daysStaked,
        },
        penalty: {
          amount: summary.penalty.penaltyAmount,
          daysNeglected: summary.penalty.daysNeglected,
          shouldApply: summary.penalty.shouldApply,
        },
        tier: summary.tier,
        pet: summary.pet,
        isWinningTribe,
      },
    });
  } catch (error) {
    console.error('Staking status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
