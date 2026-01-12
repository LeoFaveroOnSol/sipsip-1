import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PET_FORMS } from '@/lib/constants';
import { computeDecayedStats } from '@/lib/pet-logic';

// GET - Listar pets (para exploração)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const tribe = searchParams.get('tribe');
    const cursor = searchParams.get('cursor');

    const where: Record<string, unknown> = {};

    if (tribe && ['FOFO', 'CAOS', 'CHAD', 'CRINGE'].includes(tribe)) {
      where.tribe = tribe;
    }

    const pets = await prisma.pet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const hasMore = pets.length > limit;
    const petsToReturn = hasMore ? pets.slice(0, -1) : pets;

    return NextResponse.json({
      success: true,
      data: {
        pets: petsToReturn.map((pet) => {
          const form = PET_FORMS.find((f) => f.id === pet.formId);
          const stats = computeDecayedStats(pet);

          return {
            id: pet.id,
            name: pet.name,
            tribe: pet.tribe,
            stage: pet.stage,
            isNeglected: stats.isNeglected,
            form: form
              ? { name: form.name, spriteUrl: form.spriteUrl }
              : null,
            createdAt: pet.createdAt.toISOString(),
          };
        }),
        nextCursor: hasMore ? petsToReturn[petsToReturn.length - 1].id : null,
      },
    });
  } catch (error) {
    console.error('List pets error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

