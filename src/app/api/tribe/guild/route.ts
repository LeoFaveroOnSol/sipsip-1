import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrCreateGuild, getAllTribeStats } from '@/lib/guild-logic';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';
import { TRIBE_BONUSES } from '@/lib/constants';

// GET - Get guild info for user's tribe or all tribes
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
    const tribe = searchParams.get('tribe');
    const all = searchParams.get('all') === 'true';

    // If requesting all tribes
    if (all) {
      const allStats = await getAllTribeStats();

      return NextResponse.json({
        success: true,
        data: {
          tribes: allStats.map(guild => ({
            tribe: guild.tribe,
            treasury: formatSipAmount(guild.treasury),
            treasuryRaw: guild.treasury,
            totalPower: guild.totalPower,
            memberCount: guild.memberCount,
            bonus: TRIBE_BONUSES[guild.tribe as keyof typeof TRIBE_BONUSES],
          })),
        },
      });
    }

    // Get specific tribe or user's tribe
    let targetTribe = tribe;

    if (!targetTribe) {
      // Get user's pet tribe
      const pet = await prisma.pet.findUnique({
        where: { userId: user.id },
      });

      if (!pet) {
        return NextResponse.json(
          { success: false, error: 'No pet found' },
          { status: 404 }
        );
      }

      targetTribe = pet.tribe;
    }

    const guild = await getOrCreateGuild(targetTribe);
    const bonus = TRIBE_BONUSES[targetTribe as keyof typeof TRIBE_BONUSES];

    // Check if user is member of this tribe
    const userPet = await prisma.pet.findUnique({
      where: { userId: user.id },
    });
    const isMember = userPet?.tribe === targetTribe;

    return NextResponse.json({
      success: true,
      data: {
        tribe: guild.tribe,
        treasury: formatSipAmount(guild.treasury),
        treasuryRaw: guild.treasury,
        totalPower: guild.totalPower,
        memberCount: guild.memberCount,
        bonus,
        isMember,
      },
    });
  } catch (error) {
    console.error('Guild info error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
