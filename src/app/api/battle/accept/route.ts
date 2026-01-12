import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { acceptBattle } from '@/lib/battle-logic';
import { prisma } from '@/lib/prisma';
import { parseSipAmount } from '@/lib/token';

// POST - Accept a battle challenge
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
    const { battleId, txSignature } = body;

    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required' },
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

    // Accept battle
    const result = await acceptBattle(battleId, user.id, pet.id, txSignature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get updated battle from DB
    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battleId },
    });

    return NextResponse.json({
      success: true,
      data: {
        battleId: battleId,
        status: updatedBattle?.status,
        winnerId: result.result?.winnerId,
        winnerPetId: result.result?.winnerPetId,
        prizePool: result.result?.prizeAmount,
        burnedAmount: result.result?.burnedAmount,
        replayData: result.result?.replayData,
        message: result.result?.winnerId === user.id
          ? 'Victory! You won the battle!'
          : 'Defeat! Better luck next time.',
      },
    });
  } catch (error) {
    console.error('Accept battle error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
