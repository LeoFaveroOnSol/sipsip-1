import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createBattle } from '@/lib/battle-logic';
import { prisma } from '@/lib/prisma';
import { parseSipAmount, verifyTokenTransfer, SIP_DECIMALS } from '@/lib/token';
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

    // SECURITY: Transaction signature is REQUIRED
    if (!txSignature) {
      return NextResponse.json(
        { success: false, error: 'Transaction signature is required. Please send tokens first.' },
        { status: 400 }
      );
    }

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

    // SECURITY: Check if this transaction was already used (prevent double-spending)
    const existingBattle = await prisma.battle.findFirst({
      where: { escrowPda: txSignature },
    });

    if (existingBattle) {
      return NextResponse.json(
        { success: false, error: 'This transaction has already been used for a battle' },
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

    // SECURITY: Verify the amount matches what was sent
    const expectedRawAmount = parseSipAmount(betAmount);
    const actualAmount = verification.amount || 0;

    // Allow 1% tolerance for rounding
    const tolerance = expectedRawAmount * 0.01;
    if (Math.abs(actualAmount - expectedRawAmount) > tolerance) {
      return NextResponse.json(
        { success: false, error: `Amount mismatch. Expected ${betAmount} $SIP but received ${(actualAmount / Math.pow(10, SIP_DECIMALS)).toFixed(2)} $SIP` },
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

    // Create battle with verified amount
    const result = await createBattle(user.id, pet.id, actualAmount, txSignature);

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
        betAmount: verification.amountUI,
        verifiedAmount: actualAmount,
        txSignature,
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
