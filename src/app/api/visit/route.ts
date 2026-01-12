import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkRateLimit } from '@/lib/auth';
import { checkMythicUnlock } from '@/lib/pet-logic';
import { prisma } from '@/lib/prisma';
import { RATE_LIMITS } from '@/lib/constants';
import { z } from 'zod';

const visitSchema = z.object({
  targetPetId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      `visit:${user.id}`,
      RATE_LIMITS.apiRequestsPerMinute,
      60 * 1000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisições' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = visitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const { targetPetId } = parsed.data;

    // Verificar se pet existe
    const targetPet = await prisma.pet.findUnique({ where: { id: targetPetId } });

    if (!targetPet) {
      return NextResponse.json({ success: false, error: 'Pet não encontrado' }, { status: 404 });
    }

    // Não pode visitar o próprio pet
    if (targetPet.userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não pode visitar seu próprio pet' },
        { status: 400 }
      );
    }

    // Verificar cooldown
    const lastVisit = await prisma.visit.findFirst({
      where: {
        visitorUserId: user.id,
        targetPetId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const cooldownMs = RATE_LIMITS.visitCooldownMinutes * 60 * 1000;

    if (lastVisit && Date.now() - lastVisit.createdAt.getTime() < cooldownMs) {
      const nextVisitAt = new Date(lastVisit.createdAt.getTime() + cooldownMs);
      return NextResponse.json(
        {
          success: false,
          error: 'Você já visitou este pet recentemente',
          nextVisitAt: nextVisitAt.toISOString(),
        },
        { status: 400 }
      );
    }

    // Registrar visita
    await prisma.visit.create({
      data: {
        visitorUserId: user.id,
        targetPetId,
      },
    });

    // Registrar evento no pet visitado
    await prisma.petEvent.create({
      data: {
        petId: targetPetId,
        type: 'visit',
        payload: JSON.stringify({ visitorId: user.id }),
      },
    });

    // Verificar desbloqueio mítico para o visitante
    const mythicUnlocked = await checkMythicUnlock(user.id);

    return NextResponse.json({
      success: true,
      data: {
        visited: true,
        mythicUnlocked,
      },
    });
  } catch (error) {
    console.error('Visit error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

