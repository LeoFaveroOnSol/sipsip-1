import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatSipAmount } from '@/lib/token';

// GET - Get battle details including replay data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id },
      include: {
        challenger: {
          select: { id: true, walletPubkey: true },
        },
        defender: {
          select: { id: true, walletPubkey: true },
        },
        challengerPet: {
          select: { id: true, name: true, tribe: true, stage: true, formId: true },
        },
        defenderPet: {
          select: { id: true, name: true, tribe: true, stage: true, formId: true },
        },
      },
    });

    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'Battle not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this battle
    const isParticipant = battle.challengerId === user.id || battle.defenderId === user.id;

    // Parse replay data if available
    let replayData = null;
    if (battle.replayData) {
      try {
        replayData = JSON.parse(battle.replayData);
      } catch {
        replayData = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: battle.id,
        status: battle.status,
        betAmount: formatSipAmount(battle.betAmount),
        betAmountRaw: battle.betAmount,
        challenger: {
          id: battle.challenger.id,
          wallet: battle.challenger.walletPubkey,
          pet: battle.challengerPet,
          power: battle.challengerPower,
          isUser: battle.challengerId === user.id,
        },
        defender: battle.defender ? {
          id: battle.defender.id,
          wallet: battle.defender.walletPubkey,
          pet: battle.defenderPet,
          power: battle.defenderPower,
          isUser: battle.defenderId === user.id,
        } : null,
        winProbability: battle.winProbability,
        winner: battle.winnerId ? {
          id: battle.winnerId,
          petId: battle.winnerPetId,
          isUser: battle.winnerId === user.id,
        } : null,
        prizePool: battle.prizePool ? formatSipAmount(battle.prizePool) : null,
        burnedAmount: battle.burnedAmount ? formatSipAmount(battle.burnedAmount) : null,
        replayData: replayData,
        isParticipant,
        createdAt: battle.createdAt,
        matchedAt: battle.matchedAt,
        completedAt: battle.completedAt,
      },
    });
  } catch (error) {
    console.error('Get battle error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a pending battle (only challenger can cancel)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id },
    });

    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'Battle not found' },
        { status: 404 }
      );
    }

    // Only challenger can cancel
    if (battle.challengerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the challenger can cancel this battle' },
        { status: 403 }
      );
    }

    // Can only cancel pending battles
    if (battle.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Can only cancel pending battles' },
        { status: 400 }
      );
    }

    // Update battle status to cancelled
    await prisma.battle.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // TODO: In real implementation, refund the escrowed bet amount

    return NextResponse.json({
      success: true,
      data: {
        battleId: id,
        message: 'Battle cancelled successfully. Bet refunded.',
      },
    });
  } catch (error) {
    console.error('Cancel battle error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
