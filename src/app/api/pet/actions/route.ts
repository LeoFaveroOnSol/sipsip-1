import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkRateLimit } from '@/lib/auth';
import { performAction, getUserPetWithStats } from '@/lib/pet-logic';
import { ACTIONS, RATE_LIMITS } from '@/lib/constants';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['feed', 'play', 'sleep', 'socialize']),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      `action:${user.id}`,
      RATE_LIMITS.apiRequestsPerMinute,
      60 * 1000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisições. Aguarde um momento.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
    }

    const { action } = parsed.data;

    // Verificar se tem pet
    const pet = await getUserPetWithStats(user.id);

    if (!pet) {
      return NextResponse.json({ success: false, error: 'Você não tem um pet' }, { status: 404 });
    }

    // Executar ação
    const result = await performAction(pet.id, action);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          cooldownEndsAt: result.cooldownEndsAt?.toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newStats: result.newStats,
        evolved: result.evolved,
        newForm: result.newForm,
        actionInfo: ACTIONS[action],
      },
    });
  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

