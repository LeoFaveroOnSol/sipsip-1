import { NextResponse } from 'next/server';
import { getWeekLeaderboard, getOrCreateCurrentWeek } from '@/lib/tribe-logic';
import { TRIBES } from '@/lib/constants';

export async function GET() {
  try {
    const week = await getOrCreateCurrentWeek();
    const leaderboard = await getWeekLeaderboard();

    return NextResponse.json({
      success: true,
      data: {
        week: {
          id: week.id,
          weekNumber: week.weekNumber,
          year: week.year,
          startAt: week.startAt.toISOString(),
          endAt: week.endAt.toISOString(),
          isActive: week.isActive,
          winnerTribe: week.winnerTribe,
        },
        leaderboard: leaderboard.map((entry) => ({
          tribe: entry.tribe,
          emoji: entry.tribeInfo.emoji,
          name: entry.tribeInfo.name,
          color: entry.tribeInfo.color,
          gradient: entry.tribeInfo.gradient,
          total: entry.total,
          position: entry.position,
          isWinner: entry.isWinner,
        })),
        tribes: Object.values(TRIBES),
      },
    });
  } catch (error) {
    console.error('Tribes error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

