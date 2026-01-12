import { NextResponse } from 'next/server';
import { getOrCreateCurrentSeason } from '@/lib/tribe-logic';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const season = await getOrCreateCurrentSeason();

    // Calcular progresso
    const now = new Date();
    const totalMs = season.endAt.getTime() - season.startAt.getTime();
    const elapsedMs = now.getTime() - season.startAt.getTime();
    const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

    // Buscar vitórias semanais na temporada
    const weeks = await prisma.week.findMany({
      where: {
        startAt: { gte: season.startAt },
        endAt: { lte: season.endAt },
        isActive: false,
      },
      orderBy: { weekNumber: 'asc' },
    });

    // Contar vitórias por tribo
    const tribeWins: Record<string, number> = {
      FOFO: 0,
      CAOS: 0,
      CHAD: 0,
      DEGEN: 0,
    };

    for (const week of weeks) {
      if (week.winnerTribe) {
        tribeWins[week.winnerTribe]++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        season: {
          id: season.id,
          seasonNumber: season.seasonNumber,
          theme: season.theme,
          description: season.description,
          startAt: season.startAt.toISOString(),
          endAt: season.endAt.toISOString(),
          isActive: season.isActive,
          winnerTribe: season.winnerTribe,
          progress,
        },
        weeklyWins: tribeWins,
        weeksCompleted: weeks.length,
      },
    });
  } catch (error) {
    console.error('Season error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

