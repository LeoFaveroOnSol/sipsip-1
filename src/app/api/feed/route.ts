import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Feed global de eventos recentes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

    // Buscar eventos recentes
    const events = await prisma.petEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            tribe: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        events: events.map((e) => ({
          id: e.id,
          type: e.type,
          petId: e.pet.id,
          petName: e.pet.name,
          tribe: e.pet.tribe,
          payload: JSON.parse(e.payload),
          createdAt: e.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

