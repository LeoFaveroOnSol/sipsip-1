import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPetWithStats } from '@/lib/pet-logic';
import { prisma } from '@/lib/prisma';
import { PET_FORMS, RATE_LIMITS, ReactionType } from '@/lib/constants';

// GET - Obter perfil público de um pet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pet = await getPetWithStats(id);

    if (!pet) {
      return NextResponse.json({ success: false, error: 'Pet não encontrado' }, { status: 404 });
    }

    // Buscar owner
    const owner = await prisma.user.findUnique({
      where: { id: pet.userId },
      select: { id: true, walletPubkey: true },
    });

    // Buscar eventos recentes
    const recentEvents = await prisma.petEvent.findMany({
      where: { petId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Contar reactions
    const reactionCounts = await prisma.reaction.groupBy({
      by: ['type'],
      where: { petId: id },
      _count: true,
    });

    const reactions: Record<ReactionType, number> = {
      LOVE: 0,
      LOL: 0,
      DEGEN: 0,
      CHAD: 0,
      RIP: 0,
    };

    for (const r of reactionCounts) {
      reactions[r.type] = r._count;
    }

    // Contar visitas
    const visitCount = await prisma.visit.count({
      where: { targetPetId: id },
    });

    // Verificar se usuário atual pode visitar/reagir
    const currentUser = await getCurrentUser();
    let canVisit = false;
    let canReact = false;

    if (currentUser && currentUser.id !== pet.userId) {
      // Verificar cooldown de visita
      const lastVisit = await prisma.visit.findFirst({
        where: {
          visitorUserId: currentUser.id,
          targetPetId: id,
        },
        orderBy: { createdAt: 'desc' },
      });

      const visitCooldownMs = RATE_LIMITS.visitCooldownMinutes * 60 * 1000;
      canVisit = !lastVisit || Date.now() - lastVisit.createdAt.getTime() > visitCooldownMs;

      // Verificar cooldown de reaction
      const lastReaction = await prisma.reaction.findFirst({
        where: {
          userId: currentUser.id,
          petId: id,
        },
        orderBy: { createdAt: 'desc' },
      });

      const reactionCooldownMs = RATE_LIMITS.reactionCooldownMinutes * 60 * 1000;
      canReact = !lastReaction || Date.now() - lastReaction.createdAt.getTime() > reactionCooldownMs;
    }

    const form = PET_FORMS.find((f) => f.id === pet.formId);

    return NextResponse.json({
      success: true,
      data: {
        pet: {
          ...pet,
          form: form
            ? { name: form.name, description: form.description, spriteUrl: form.spriteUrl }
            : null,
        },
        owner,
        recentEvents: recentEvents.map((e) => ({
          id: e.id,
          type: e.type,
          payload: JSON.parse(e.payload),
          createdAt: e.createdAt.toISOString(),
        })),
        reactions,
        visitCount,
        canVisit,
        canReact,
      },
    });
  } catch (error) {
    console.error('Get pet profile error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

