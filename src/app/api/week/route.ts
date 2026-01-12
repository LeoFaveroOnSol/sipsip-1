import { NextResponse } from 'next/server';
import { getOrCreateCurrentWeek, getWeekHistory, getWeekLeaderboard } from '@/lib/tribe-logic';

export async function GET() {
  try {
    const currentWeek = await getOrCreateCurrentWeek();
    const leaderboard = await getWeekLeaderboard();
    const history = await getWeekHistory(5);

    // Calcular progresso da semana
    const now = new Date();
    const weekStart = new Date(currentWeek.startAt);
    const weekEnd = new Date(currentWeek.endAt);
    const totalMs = weekEnd.getTime() - weekStart.getTime();
    const elapsedMs = now.getTime() - weekStart.getTime();
    const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

    return NextResponse.json({
      success: true,
      data: {
        currentWeek: {
          id: currentWeek.id,
          weekNumber: currentWeek.weekNumber,
          year: currentWeek.year,
          startAt: currentWeek.startAt.toISOString(),
          endAt: currentWeek.endAt.toISOString(),
          isActive: currentWeek.isActive,
          winnerTribe: currentWeek.winnerTribe,
          progress,
          scores: currentWeek.scores.map((s) => ({
            tribe: s.tribe,
            scoreActivity: s.scoreActivity,
            scoreSocial: s.scoreSocial,
            scoreConsistency: s.scoreConsistency,
            scoreEvent: s.scoreEvent,
            total: s.total,
          })),
        },
        leaderboard: leaderboard.map((entry) => ({
          tribe: entry.tribe,
          emoji: entry.tribeInfo.emoji,
          name: entry.tribeInfo.name,
          color: entry.tribeInfo.color,
          total: entry.total,
          position: entry.position,
          isWinner: entry.isWinner,
        })),
        history: history.map((w) => ({
          id: w.id,
          weekNumber: w.weekNumber,
          year: w.year,
          winnerTribe: w.winnerTribe,
          endAt: w.endAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Week error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

