import { NextRequest, NextResponse } from 'next/server';
import { createNonce, checkRateLimit } from '@/lib/auth';
import { generateLoginMessage, isValidSolanaAddress } from '@/lib/solana';
import { RATE_LIMITS } from '@/lib/constants';
import { z } from 'zod';

const requestSchema = z.object({
  wallet: z.string().min(32).max(44),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet' },
        { status: 400 }
      );
    }

    const { wallet } = parsed.data;

    // Validar endereço Solana
    if (!isValidSolanaAddress(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Solana address' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      `nonce:${wallet}`,
      RATE_LIMITS.loginAttemptsPerMinute,
      60 * 1000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Criar nonce
    const nonce = await createNonce(wallet);
    const message = generateLoginMessage(nonce, wallet);

    return NextResponse.json({
      success: true,
      data: { nonce, message },
    });
  } catch (error) {
    console.error('Nonce error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

