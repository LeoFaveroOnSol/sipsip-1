import { prisma } from './prisma';
import { SCORING, TRIBES, Tribe } from './constants';
import { getWeekBoundaries, getWeekNumber } from './utils';

// ============== CALCULAR SCORES DA SEMANA ==============

export interface TribeWeekScore {
  tribe: Tribe;
  scoreActivity: number;
  scoreSocial: number;
  scoreConsistency: number;
  scoreEvent: number;
  total: number;
}

export async function computeWeekScores(weekStart: Date, weekEnd: Date): Promise<TribeWeekScore[]> {
  const tribes: Tribe[] = ['FOFO', 'CAOS', 'CHAD', 'DEGEN'];
  const scores: TribeWeekScore[] = [];

  for (const tribe of tribes) {
    // Buscar pets da tribo
    const pets = await prisma.pet.findMany({
      where: { tribe },
      include: {
        events: {
          where: {
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        },
        visitsReceived: {
          where: {
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        },
        reactions: {
          where: {
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        },
      },
    });

    let scoreActivity = 0;
    let scoreSocial = 0;
    let scoreConsistency = 0;
    let scoreEvent = 0;

    for (const pet of pets) {
      // Atividade: contar ações
      const actionEvents = pet.events.filter((e) => e.type === 'action');
      scoreActivity += actionEvents.length * SCORING.points.action;

      // Social: visitas e reactions recebidas
      scoreSocial += pet.visitsReceived.length * SCORING.points.visitReceived;
      scoreSocial += pet.reactions.length * SCORING.points.reactionReceived;

      // Consistência: streak
      scoreConsistency += pet.careStreak * SCORING.points.streakDay;

      // Eventos: evoluções e desbloqueios
      const evolutionEvents = pet.events.filter(
        (e) => e.type === 'evolution' || e.type === 'mythic_unlock'
      );
      scoreEvent += evolutionEvents.length * SCORING.points.ritualBonus;
    }

    // Calcular total ponderado
    const total = Math.round(
      (scoreActivity * SCORING.weights.activity +
        scoreSocial * SCORING.weights.social +
        scoreConsistency * SCORING.weights.consistency +
        scoreEvent * SCORING.weights.event) /
        100
    );

    scores.push({
      tribe,
      scoreActivity,
      scoreSocial,
      scoreConsistency,
      scoreEvent,
      total,
    });
  }

  // Ordenar por total
  scores.sort((a, b) => b.total - a.total);

  return scores;
}

// ============== SALVAR SCORES NO BANCO ==============

export async function saveWeekScores(weekId: string, scores: TribeWeekScore[]): Promise<void> {
  for (const score of scores) {
    await prisma.tribeScore.upsert({
      where: {
        weekId_tribe: { weekId, tribe: score.tribe },
      },
      update: {
        scoreActivity: score.scoreActivity,
        scoreSocial: score.scoreSocial,
        scoreConsistency: score.scoreConsistency,
        scoreEvent: score.scoreEvent,
        total: score.total,
      },
      create: {
        weekId,
        tribe: score.tribe,
        scoreActivity: score.scoreActivity,
        scoreSocial: score.scoreSocial,
        scoreConsistency: score.scoreConsistency,
        scoreEvent: score.scoreEvent,
        total: score.total,
      },
    });
  }

  await prisma.week.update({
    where: { id: weekId },
    data: { computedAt: new Date() },
  });
}

// ============== OBTER OU CRIAR SEMANA ATUAL ==============

export async function getOrCreateCurrentWeek() {
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const year = now.getFullYear();
  const { start, end } = getWeekBoundaries(now);

  let week = await prisma.week.findUnique({
    where: { weekNumber_year: { weekNumber, year } },
    include: { scores: true },
  });

  if (!week) {
    week = await prisma.week.create({
      data: {
        weekNumber,
        year,
        startAt: start,
        endAt: end,
        isActive: true,
      },
      include: { scores: true },
    });
  }

  return week;
}

// ============== FINALIZAR SEMANA ==============

export async function finalizeWeek(weekId: string): Promise<Tribe | null> {
  const week = await prisma.week.findUnique({
    where: { id: weekId },
    include: { scores: true },
  });

  if (!week || !week.isActive) return null;

  // Encontrar vencedor
  const sortedScores = [...week.scores].sort((a, b) => b.total - a.total);
  const winner = (sortedScores[0]?.tribe as Tribe) || null;

  // Atualizar semana
  await prisma.week.update({
    where: { id: weekId },
    data: {
      winnerTribe: winner,
      isActive: false,
    },
  });

  // Criar badges para os membros da tribo vencedora
  if (winner) {
    const winnerPets = await prisma.pet.findMany({
      where: { tribe: winner },
      select: { userId: true },
    });

    for (const pet of winnerPets) {
      await prisma.badge.create({
        data: {
          userId: pet.userId,
          type: 'week_winner',
          weekId,
          metadata: JSON.stringify({ tribe: winner, weekNumber: week.weekNumber }),
        },
      });
    }
  }

  return winner;
}

// ============== LEADERBOARD ==============

export interface LeaderboardEntry {
  tribe: Tribe;
  tribeInfo: (typeof TRIBES)[keyof typeof TRIBES];
  total: number;
  position: number;
  isWinner: boolean;
}

export async function getWeekLeaderboard(weekId?: string): Promise<LeaderboardEntry[]> {
  let week: Awaited<ReturnType<typeof getOrCreateCurrentWeek>> | null = null;

  if (weekId) {
    week = await prisma.week.findUnique({
      where: { id: weekId },
      include: { scores: true },
    });
  } else {
    week = await getOrCreateCurrentWeek();
  }

  if (!week) return [];

  const winnerTribe = week.winnerTribe;
  const entries: LeaderboardEntry[] = week.scores
    .sort((a, b) => b.total - a.total)
    .map((score, index) => ({
      tribe: score.tribe as Tribe,
      tribeInfo: TRIBES[score.tribe as keyof typeof TRIBES],
      total: score.total,
      position: index + 1,
      isWinner: winnerTribe === score.tribe,
    }));

  // Se não há scores ainda, retornar todas as tribos com 0
  if (entries.length === 0) {
    return Object.values(TRIBES).map((tribe, index) => ({
      tribe: tribe.id,
      tribeInfo: tribe,
      total: 0,
      position: index + 1,
      isWinner: false,
    }));
  }

  return entries;
}

// ============== HISTÓRICO DE SEMANAS ==============

export async function getWeekHistory(limit = 10) {
  return prisma.week.findMany({
    where: { isActive: false },
    orderBy: { endAt: 'desc' },
    take: limit,
    include: { scores: true },
  });
}

// ============== TEMPORADAS ==============

export async function getOrCreateCurrentSeason() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const seasonNumber = now.getFullYear() * 100 + (now.getMonth() + 1); // Ex: 202601

  let season = await prisma.season.findUnique({
    where: { seasonNumber },
  });

  if (!season) {
    // Temas de temporada
    const themes = [
      { theme: 'Era do Caos', description: 'O caos reina supremo nesta temporada' },
      { theme: 'Reino Fofo', description: 'Carinho e amor dominam tudo' },
      { theme: 'Ascensão Chad', description: 'Grind e disciplina são recompensados' },
      { theme: 'Festival Cringe', description: 'Abrace o constrangimento' },
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    season = await prisma.season.create({
      data: {
        seasonNumber,
        theme: randomTheme.theme,
        description: randomTheme.description,
        startAt: monthStart,
        endAt: monthEnd,
        isActive: true,
      },
    });
  }

  return season;
}

export async function finalizeSeason(seasonId: string): Promise<Tribe | null> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season || !season.isActive) return null;

  // Contar vitórias semanais por tribo no período
  const weeks = await prisma.week.findMany({
    where: {
      startAt: { gte: season.startAt },
      endAt: { lte: season.endAt },
      isActive: false,
      winnerTribe: { not: null },
    },
  });

  const wins: Record<Tribe, number> = {
    FOFO: 0,
    CAOS: 0,
    CHAD: 0,
    DEGEN: 0,
  };

  for (const week of weeks) {
    if (week.winnerTribe) {
      wins[week.winnerTribe as Tribe]++;
    }
  }

  // Encontrar vencedor
  const winner = (Object.entries(wins) as [Tribe, number][]).sort((a, b) => b[1] - a[1])[0][0];

  // Atualizar temporada
  await prisma.season.update({
    where: { id: seasonId },
    data: {
      winnerTribe: winner,
      isActive: false,
    },
  });

  // Criar badges para todos
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const winnerUsers = await prisma.pet.findMany({
    where: { tribe: winner },
    select: { userId: true },
  });
  const winnerUserIds = new Set(winnerUsers.map((p) => p.userId));

  for (const user of allUsers) {
    await prisma.badge.create({
      data: {
        userId: user.id,
        type: winnerUserIds.has(user.id) ? 'season_champion' : 'season_participant',
        seasonId,
        metadata: JSON.stringify({
          season: season.seasonNumber,
          theme: season.theme,
          winner,
          isChampion: winnerUserIds.has(user.id),
        }),
      },
    });
  }

  return winner;
}
