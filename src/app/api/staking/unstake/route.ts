import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { unstakeTokens } from '@/lib/staking';
import { prisma } from '@/lib/prisma';
import { parseSipAmount } from '@/lib/token';

// POST - Unstake $SIP from pet
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
    const { amount, txSignature } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
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

    // Convert to raw amount (with decimals)
    const rawAmount = parseSipAmount(amount);

    // Unstake tokens
    const result = await unstakeTokens(user.id, pet.id, rawAmount, txSignature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        amountStaked: result.stake?.amountStaked,
        power: result.stake?.power,
        message: `Successfully unstaked ${amount} $SIP`,
      },
    });
  } catch (error) {
    console.error('Unstake error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
