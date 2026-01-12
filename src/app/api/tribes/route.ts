import { NextResponse } from 'next/server';
import { getWeekLeaderboard, getOrCreateCurrentWeek, computeWeekScores, saveWeekScores } from '@/lib/tribe-logic';
import { TRIBES } from '@/lib/constants';

export async function GET() {
  try {
    const week = await getOrCreateCurrentWeek();

    // Auto-compute scores if not computed recently (within last 1 minute)
    // This ensures scores are always fresh without manual script execution
    const shouldRecompute = !week.computedAt ||
      (new Date().getTime() - new Date(week.computedAt).getTime()) > 1 * 60 * 1000;

    let leaderboard;
    if (shouldRecompute && week.isActive) {
      console.log('Recomputing tribe scores...');
      const scores = await computeWeekScores(week.startAt, week.endAt);
      await saveWeekScores(week.id, scores);

      // Build leaderboard directly from computed scores (fresh data)
      leaderboard = scores
        .sort((a, b) => b.total - a.total)
        .map((score, index) => ({
          tribe: score.tribe,
          emoji: TRIBES[score.tribe as keyof typeof TRIBES]?.emoji,
          name: TRIBES[score.tribe as keyof typeof TRIBES]?.name,
          color: TRIBES[score.tribe as keyof typeof TRIBES]?.color,
          gradient: TRIBES[score.tribe as keyof typeof TRIBES]?.gradient,
          total: score.total,
          position: index + 1,
          isWinner: false,
        }));
    } else {
      // Use cached leaderboard
      const leaderboardData = await getWeekLeaderboard(week.id);
      leaderboard = leaderboardData.map((entry) => ({
        tribe: entry.tribe,
        emoji: entry.tribeInfo.emoji,
        name: entry.tribeInfo.name,
        color: entry.tribeInfo.color,
        gradient: entry.tribeInfo.gradient,
        total: entry.total,
        position: entry.position,
        isWinner: entry.isWinner,
      }));
    }

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
          emoji: entry.emoji,
          name: entry.name,
          color: entry.color,
          gradient: entry.gradient,
          total: entry.total,
          position: entry.position,
          isWinner: entry.isWinner,
        })),
        tribes: Object.values(TRIBES),
      },
    });
  } catch (error) {
    console.error('Tribes error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

