import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { findOpponents } from '@/lib/battle-logic';
import { prisma } from '@/lib/prisma';

// GET - Find potential opponents for matchmaking
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
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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
        { success: false, error: 'Cannot battle with a neglected pet' },
        { status: 400 }
      );
    }

    // Find opponents within power band
    const result = await findOpponents(user.id, pet.id, limit);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        opponents: result.opponents,
        userPower: result.userPower,
      },
    });
  } catch (error) {
    console.error('Matchmaking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
