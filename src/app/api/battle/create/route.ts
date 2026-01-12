import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createBattle } from '@/lib/battle-logic';
import { prisma } from '@/lib/prisma';
import { parseSipAmount } from '@/lib/token';
import { BATTLE_CONFIG } from '@/lib/constants';

// POST - Create a battle challenge
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
    const { betAmount, txSignature } = body;

    if (!betAmount || typeof betAmount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Bet amount is required' },
        { status: 400 }
      );
    }

    if (betAmount < BATTLE_CONFIG.minBet) {
      return NextResponse.json(
        { success: false, error: `Minimum bet is ${BATTLE_CONFIG.minBet} $SIP` },
        { status: 400 }
      );
    }

    if (betAmount > BATTLE_CONFIG.maxBet) {
      return NextResponse.json(
        { success: false, error: `Maximum bet is ${BATTLE_CONFIG.maxBet} $SIP` },
        { status: 400 }
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

    if (pet.isNeglected) {
      return NextResponse.json(
        { success: false, error: 'Cannot battle with a neglected pet. Take care of it first!' },
        { status: 400 }
      );
    }

    // Convert to raw amount
    const rawAmount = parseSipAmount(betAmount);

    // Create battle
    const result = await createBattle(user.id, pet.id, rawAmount, txSignature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        battleId: result.battle?.id,
        betAmount,
        message: `Battle challenge created! Waiting for opponent...`,
      },
    });
  } catch (error) {
    console.error('Create battle error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
