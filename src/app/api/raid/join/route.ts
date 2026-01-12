import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { joinRaid, getCurrentRaid } from '@/lib/raid-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';
import { RAID_CONFIG, SHAME_CONFIG } from '@/lib/constants';

// POST - Join current raid
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

    if (pet.isNeglected) {
      return NextResponse.json(
        { success: false, error: SHAME_CONFIG.raidDisabled
          ? 'Cannot join raids with a neglected pet. Take care of it first!'
          : 'Pet is neglected' },
        { status: 400 }
      );
    }

    // Get current raid
    const currentRaid = await getCurrentRaid();

    if (!currentRaid) {
      return NextResponse.json(
        { success: false, error: 'No active raid to join' },
        { status: 404 }
      );
    }

    // Join the raid
    const result = await joinRaid(currentRaid.id, user.id, pet.id, txSignature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        raidId: currentRaid.id,
        bossName: currentRaid.bossName,
        entryFee: formatSipAmount(RAID_CONFIG.entryFee),
        message: `Joined the raid against ${currentRaid.bossName}! Entry fee: ${formatSipAmount(RAID_CONFIG.entryFee)} $SIP`,
      },
    });
  } catch (error) {
    console.error('Join raid error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
