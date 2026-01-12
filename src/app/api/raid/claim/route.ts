import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { claimRaidRewards } from '@/lib/raid-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';

// POST - Claim raid rewards
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
    const { raidId, txSignature } = body;

    // Get raid ID from params or use most recent completed raid
    let targetRaidId = raidId;

    if (!targetRaidId) {
      // Try to find the most recent completed raid user participated in
      const recentParticipation = await prisma.bossRaidParticipant.findFirst({
        where: {
          userId: user.id,
          rewardClaimed: 0,
          raid: {
            status: 'DEFEATED',
          },
        },
        include: {
          raid: true,
        },
        orderBy: {
          raid: { defeatedAt: 'desc' },
        },
      });

      if (recentParticipation) {
        targetRaidId = recentParticipation.raidId;
      }
    }

    if (!targetRaidId) {
      return NextResponse.json(
        { success: false, error: 'No raid rewards to claim' },
        { status: 404 }
      );
    }

    // Get raid info
    const raid = await prisma.bossRaid.findUnique({
      where: { id: targetRaidId },
    });

    if (!raid) {
      return NextResponse.json(
        { success: false, error: 'Raid not found' },
        { status: 404 }
      );
    }

    if (raid.status !== 'DEFEATED') {
      return NextResponse.json(
        { success: false, error: 'Raid has not been defeated yet' },
        { status: 400 }
      );
    }

    // Claim rewards
    const result = await claimRaidRewards(targetRaidId, user.id, txSignature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Build response with all reward info
    const responseData: Record<string, unknown> = {
      raidId: targetRaidId,
      bossName: raid.bossName,
      rewardAmount: formatSipAmount(result.reward || 0),
      rewardAmountRaw: result.reward,
      badges: [] as string[],
      message: `Successfully claimed ${formatSipAmount(result.reward || 0)} $SIP from the ${raid.bossName} raid!`,
    };

    // Check for special rewards
    if (result.mythicForm) {
      (responseData.badges as string[]).push('killing_blow');
      responseData.message = `LEGENDARY! You dealt the killing blow to ${raid.bossName}! Claimed ${formatSipAmount(result.reward || 0)} $SIP + Mythic Form unlocked!`;
      responseData.mythicFormUnlocked = true;
    }

    if (result.nftBadge) {
      (responseData.badges as string[]).push('top10_damage');
      responseData.nftBadgeAwarded = true;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Claim raid rewards error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
