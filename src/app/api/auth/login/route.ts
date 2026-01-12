import { NextRequest, NextResponse } from 'next/server';
import { verifyNonce, verifySignature, createSession, loginOrRegister, checkRateLimit } from '@/lib/auth';
import { generateLoginMessage, isValidSolanaAddress } from '@/lib/solana';
import { prisma } from '@/lib/prisma';
import { RATE_LIMITS } from '@/lib/constants';
import { z } from 'zod';

const loginSchema = z.object({
  wallet: z.string().min(32).max(44),
  signature: z.string().min(1),
  nonce: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid data' },
        { status: 400 }
      );
    }

    const { wallet, signature, nonce } = parsed.data;

    // Validar endereço
    if (!isValidSolanaAddress(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Solana address' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      `login:${wallet}`,
      RATE_LIMITS.loginAttemptsPerMinute,
      60 * 1000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Verificar nonce
    const nonceValid = await verifyNonce(nonce, wallet);
    if (!nonceValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired nonce' },
        { status: 401 }
      );
    }

    // Verificar assinatura
    const message = generateLoginMessage(nonce, wallet);
    const signatureValid = verifySignature(message, signature, wallet);

    if (!signatureValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Login ou registro
    const { user, isNew } = await loginOrRegister(wallet);

    // Criar sessão
    const token = await createSession(user.id);

    // Verificar se tem pet
    const pet = await prisma.pet.findUnique({ where: { userId: user.id } });

    // Criar response com cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, walletPubkey: user.walletPubkey },
        isNew,
        hasPet: !!pet,
      },
    });

    // Set cookie httpOnly
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

