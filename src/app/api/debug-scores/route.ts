import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateCurrentWeek, computeWeekScores } from '@/lib/tribe-logic';

// GET - Debug tribe scores calculation
export async function GET() {
  try {
    const week = await getOrCreateCurrentWeek();

    // Get all pets with their events
    const pets = await prisma.pet.findMany({
      include: {
        events: {
          where: {
            createdAt: { gte: week.startAt, lte: week.endAt },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        user: {
          select: { walletPubkey: true },
        },
      },
    });

    // Group by tribe
    const tribeData: Record<string, { pets: number; events: number; petDetails: any[] }> = {
      FOFO: { pets: 0, events: 0, petDetails: [] },
      CAOS: { pets: 0, events: 0, petDetails: [] },
      CHAD: { pets: 0, events: 0, petDetails: [] },
      DEGEN: { pets: 0, events: 0, petDetails: [] },
    };

    for (const pet of pets) {
      const tribe = pet.tribe as string;
      if (tribeData[tribe]) {
        tribeData[tribe].pets++;
        tribeData[tribe].events += pet.events.length;
        tribeData[tribe].petDetails.push({
          id: pet.id,
          name: pet.name,
          wallet: pet.user?.walletPubkey?.slice(0, 8) + '...',
          careStreak: pet.careStreak,
          eventsThisWeek: pet.events.length,
          recentEvents: pet.events.slice(0, 3).map(e => ({
            type: e.type,
            createdAt: e.createdAt,
            payload: e.payload ? JSON.parse(e.payload) : null,
          })),
        });
      }
    }

    // Compute scores
    const computedScores = await computeWeekScores(week.startAt, week.endAt);

    // Get saved scores
    const savedScores = await prisma.tribeScore.findMany({
      where: { weekId: week.id },
    });

    // Get total events this week
    const totalEventsThisWeek = await prisma.petEvent.count({
      where: {
        createdAt: { gte: week.startAt, lte: week.endAt },
      },
    });

    // Get action events specifically
    const actionEventsThisWeek = await prisma.petEvent.count({
      where: {
        createdAt: { gte: week.startAt, lte: week.endAt },
        type: 'action',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        week: {
          id: week.id,
          number: week.weekNumber,
          year: week.year,
          start: week.startAt.toISOString(),
          end: week.endAt.toISOString(),
          computedAt: week.computedAt?.toISOString() || null,
          now: new Date().toISOString(),
          isNowInRange: new Date() >= week.startAt && new Date() <= week.endAt,
        },
        totalEventsThisWeek,
        actionEventsThisWeek,
        tribeData,
        computedScores,
        savedScores: savedScores.map(s => ({
          tribe: s.tribe,
          activity: s.scoreActivity,
          social: s.scoreSocial,
          consistency: s.scoreConsistency,
          event: s.scoreEvent,
          total: s.total,
        })),
      },
    });
  } catch (error) {
    console.error('Debug scores error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
