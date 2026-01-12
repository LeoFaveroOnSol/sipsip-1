import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { attackBoss, getCurrentRaid } from '@/lib/raid-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';

// POST - Attack the boss
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get current raid
    const currentRaid = await getCurrentRaid();

    if (!currentRaid) {
      return NextResponse.json(
        { success: false, error: 'No active raid' },
        { status: 404 }
      );
    }

    if (currentRaid.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'This raid is not active' },
        { status: 400 }
      );
    }

    // Attack the boss
    const result = await attackBoss(currentRaid.id, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Check if boss was defeated
    const updatedRaid = await prisma.bossRaid.findUnique({
      where: { id: currentRaid.id },
    });

    const wasDefeated = updatedRaid?.status === 'DEFEATED';
    const isKillingBlow = result.isKillingBlow;

    // Get user's updated participation for total damage and attack count
    const participation = await prisma.bossRaidParticipant.findUnique({
      where: {
        raidId_userId: {
          raidId: currentRaid.id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        damage: result.damage,
        damageFormatted: result.damage?.toLocaleString(),
        totalDamage: participation?.totalDamage || 0,
        attackCount: participation?.attackCount || 0,
        bossHpRemaining: updatedRaid?.bossHpCurrent || 0,
        bossHpPercent: updatedRaid
          ? ((updatedRaid.bossHpCurrent / updatedRaid.bossHpMax) * 100).toFixed(2)
          : '0.00',
        wasDefeated,
        isKillingBlow,
        message: wasDefeated
          ? isKillingBlow
            ? `KILLING BLOW! You dealt the final ${result.damage?.toLocaleString()} damage and defeated the ${currentRaid.bossName}! Legendary rewards await!`
            : `The ${currentRaid.bossName} has been DEFEATED! Claim your rewards!`
          : `You dealt ${result.damage?.toLocaleString()} damage to the ${currentRaid.bossName}!`,
      },
    });
  } catch (error) {
    console.error('Attack boss error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
