import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { acceptBattle } from '@/lib/battle-logic';
import { prisma } from '@/lib/prisma';
import { verifyTokenTransfer, SIP_DECIMALS } from '@/lib/token';

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

    // SECURITY: Transaction signature is REQUIRED
    if (!txSignature) {
      return NextResponse.json(
        { success: false, error: 'Transaction signature is required. Please send tokens first.' },
        { status: 400 }
      );
    }

    // Get the battle to know required bet amount
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
    });

    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'Battle not found' },
        { status: 404 }
      );
    }

    if (battle.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Battle is no longer available' },
        { status: 400 }
      );
    }

    if (battle.challengerId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot accept your own battle' },
        { status: 400 }
      );
    }

    // SECURITY: Check if this transaction was already used (prevent double-spending)
    const existingBattleWithTx = await prisma.battle.findFirst({
      where: {
        OR: [
          { escrowPda: txSignature },
          { settleTxSignature: txSignature },
        ],
      },
    });

    if (existingBattleWithTx) {
      return NextResponse.json(
        { success: false, error: 'This transaction has already been used' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the token transfer on-chain
    const verification = await verifyTokenTransfer(
      txSignature,
      user.walletPubkey // Sender must be the authenticated user
    );

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Transaction verification failed' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the defender sent the same bet amount as the challenger
    const requiredAmount = battle.betAmount;
    const actualAmount = verification.amount || 0;

    // Allow 1% tolerance for rounding
    const tolerance = requiredAmount * 0.01;
    if (Math.abs(actualAmount - requiredAmount) > tolerance) {
      const requiredUI = requiredAmount / Math.pow(10, SIP_DECIMALS);
      const actualUI = actualAmount / Math.pow(10, SIP_DECIMALS);
      return NextResponse.json(
        { success: false, error: `Amount mismatch. Battle requires ${requiredUI.toLocaleString()} $SIP but you sent ${actualUI.toLocaleString()} $SIP` },
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

    // Accept battle with verified transaction
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
        txSignature,
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
