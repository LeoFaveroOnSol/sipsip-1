import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stakeTokens } from '@/lib/staking';
import { prisma } from '@/lib/prisma';
import { parseSipAmount } from '@/lib/token';
import { TOKEN_CONFIG } from '@/lib/constants';

// POST - Stake $SIP on pet
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

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (amount < TOKEN_CONFIG.minStake) {
      return NextResponse.json(
        { success: false, error: `Minimum stake is ${TOKEN_CONFIG.minStake} $SIP` },
        { status: 400 }
      );
    }

    if (amount > TOKEN_CONFIG.maxStake) {
      return NextResponse.json(
        { success: false, error: `Maximum stake is ${TOKEN_CONFIG.maxStake} $SIP` },
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

    // Stake tokens
    const result = await stakeTokens(user.id, pet.id, rawAmount, txSignature);

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
        message: `Successfully staked ${amount} $SIP`,
      },
    });
  } catch (error) {
    console.error('Stake error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
