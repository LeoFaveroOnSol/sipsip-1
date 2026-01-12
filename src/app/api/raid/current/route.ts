import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentRaid } from '@/lib/raid-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';
import { RAID_CONFIG } from '@/lib/constants';

// GET - Get current active raid
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const raid = await getCurrentRaid();

    if (!raid) {
      return NextResponse.json({
        success: true,
        data: {
          raid: null,
          message: 'No active raid currently',
        },
      });
    }

    // Check if user is participating
    const pet = await prisma.pet.findUnique({
      where: { userId: user.id },
    });

    let userParticipation = null;
    if (pet) {
      const participation = await prisma.bossRaidParticipant.findUnique({
        where: {
          raidId_userId: {
            raidId: raid.id,
            userId: user.id,
          },
        },
      });

      if (participation) {
        userParticipation = {
          totalDamage: participation.totalDamage,
          attackCount: participation.attackCount,
          sipContributed: formatSipAmount(participation.sipContributed),
          rewardClaimed: participation.rewardClaimed > 0,
        };
      }
    }

    // Calculate time remaining
    const now = new Date();
    const endTime = new Date(raid.endAt);
    const timeRemainingMs = Math.max(0, endTime.getTime() - now.getTime());
    const hoursRemaining = Math.floor(timeRemainingMs / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));

    // Calculate HP percentage
    const hpPercent = (raid.hpCurrent / raid.hpMax) * 100;

    return NextResponse.json({
      success: true,
      data: {
        raid: {
          id: raid.id,
          bossName: raid.bossName,
          bossFormId: raid.bossFormId,
          bossElement: raid.bossElement,
          hp: {
            current: raid.hpCurrent,
            max: raid.hpMax,
            percent: hpPercent.toFixed(2),
          },
          entryFee: formatSipAmount(RAID_CONFIG.entryFee),
          entryFeeRaw: RAID_CONFIG.entryFee,
          rewardPool: formatSipAmount(raid.rewardPool),
          rewardPoolRaw: raid.rewardPool,
          participantCount: raid.participantCount,
          status: raid.status,
          timeRemaining: {
            hours: hoursRemaining,
            minutes: minutesRemaining,
            formatted: `${hoursRemaining}h ${minutesRemaining}m`,
          },
          startAt: raid.startAt,
          endAt: raid.endAt,
        },
        userParticipation,
        canJoin: !userParticipation && pet && !pet.isNeglected,
        canAttack: !!userParticipation && raid.status === 'ACTIVE',
      },
    });
  } catch (error) {
    console.error('Current raid error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
