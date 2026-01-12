import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkRateLimit } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RATE_LIMITS, ReactionType } from '@/lib/constants';
import { z } from 'zod';

const reactionSchema = z.object({
  petId: z.string().min(1),
  type: z.enum(['LOVE', 'LOL', 'CRINGE', 'CHAD', 'RIP']),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      `reaction:${user.id}`,
      RATE_LIMITS.apiRequestsPerMinute,
      60 * 1000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = reactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const { petId, type } = parsed.data;

    // Verificar se pet existe
    const pet = await prisma.pet.findUnique({ where: { id: petId } });

    if (!pet) {
      return NextResponse.json({ success: false, error: 'Pet not found' }, { status: 404 });
    }

    // Não pode reagir ao próprio pet
    if (pet.userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot react to your own pet' },
        { status: 400 }
      );
    }

    // Verificar cooldown
    const lastReaction = await prisma.reaction.findFirst({
      where: {
        userId: user.id,
        petId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const cooldownMs = RATE_LIMITS.reactionCooldownMinutes * 60 * 1000;

    if (lastReaction && Date.now() - lastReaction.createdAt.getTime() < cooldownMs) {
      const nextReactionAt = new Date(lastReaction.createdAt.getTime() + cooldownMs);
      return NextResponse.json(
        {
          success: false,
          error: 'Aguarde antes de reagir novamente',
          nextReactionAt: nextReactionAt.toISOString(),
        },
        { status: 400 }
      );
    }

    // Criar reaction
    await prisma.reaction.create({
      data: {
        userId: user.id,
        petId,
        type: type as ReactionType,
      },
    });

    // Registrar evento
    await prisma.petEvent.create({
      data: {
        petId,
        type: 'reaction',
        payload: JSON.stringify({ type, userId: user.id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { reacted: true, type },
    });
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

