/**
 * Script para computar scores da semana atual
 * Executar: npm run compute:week
 */

import { PrismaClient } from '@prisma/client';
import { Tribe } from '../src/lib/constants';

const prisma = new PrismaClient();

// Pesos para cálculo de score (deve bater com constants.ts)
const SCORING = {
  weights: {
    activity: 30,
    social: 25,
    consistency: 25,
    event: 20,
  },
  points: {
    action: 10,
    visitReceived: 5,
    reactionReceived: 3,
    streakDay: 15,
    ritualBonus: 20,
  },
};

async function computeWeekScores() {
  console.log('🔄 Computando scores da semana atual...\n');

  // Buscar semana ativa
  const week = await prisma.week.findFirst({
    where: { isActive: true },
    orderBy: { startAt: 'desc' },
  });

  if (!week) {
    console.log('❌ Nenhuma semana ativa encontrada');
    return;
  }

  console.log(`📅 Semana ${week.weekNumber}/${week.year}`);
  console.log(`   De: ${week.startAt.toLocaleDateString('pt-BR')}`);
  console.log(`   Até: ${week.endAt.toLocaleDateString('pt-BR')}\n`);

  const tribes: Tribe[] = ['FOFO', 'CAOS', 'CHAD', 'DEGEN'];

  for (const tribe of tribes) {
    console.log(`\n🔹 Computando ${tribe}...`);

    // Buscar pets da tribo
    const pets = await prisma.pet.findMany({
      where: { tribe },
      include: {
        events: {
          where: {
            createdAt: { gte: week.startAt, lte: week.endAt },
          },
        },
        visitsReceived: {
          where: {
            createdAt: { gte: week.startAt, lte: week.endAt },
          },
        },
        reactions: {
          where: {
            createdAt: { gte: week.startAt, lte: week.endAt },
          },
        },
      },
    });

    console.log(`   Pets: ${pets.length}`);

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

    console.log(`   Activity: ${scoreActivity}`);
    console.log(`   Social: ${scoreSocial}`);
    console.log(`   Consistency: ${scoreConsistency}`);
    console.log(`   Event: ${scoreEvent}`);
    console.log(`   TOTAL: ${total}`);

    // Salvar/atualizar score
    await prisma.tribeScore.upsert({
      where: {
        weekId_tribe: { weekId: week.id, tribe },
      },
      update: {
        scoreActivity,
        scoreSocial,
        scoreConsistency,
        scoreEvent,
        total,
      },
      create: {
        weekId: week.id,
        tribe,
        scoreActivity,
        scoreSocial,
        scoreConsistency,
        scoreEvent,
        total,
      },
    });
  }

  // Atualizar timestamp de computação
  await prisma.week.update({
    where: { id: week.id },
    data: { computedAt: new Date() },
  });

  // Mostrar ranking
  const scores = await prisma.tribeScore.findMany({
    where: { weekId: week.id },
    orderBy: { total: 'desc' },
  });

  console.log('\n\n🏆 RANKING ATUAL:');
  console.log('================');
  scores.forEach((score, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
    console.log(`${medal} ${index + 1}. ${score.tribe}: ${score.total} pts`);
  });

  console.log('\n✅ Scores computados com sucesso!');
}

computeWeekScores()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

