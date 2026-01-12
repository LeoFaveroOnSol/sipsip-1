/**
 * Script para finalizar a semana atual e criar uma nova
 * Executar: npm run rollover:week
 */

import { PrismaClient } from '@prisma/client';

// Local type (SQLite doesn't support enums)
type Tribe = 'FOFO' | 'CAOS' | 'CHAD' | 'DEGEN';

const prisma = new PrismaClient();

function getWeekBoundaries(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

async function rolloverWeek() {
  console.log('🔄 Iniciando rollover de semana...\n');

  // Buscar semana ativa
  const currentWeek = await prisma.week.findFirst({
    where: { isActive: true },
    include: { scores: true },
  });

  if (!currentWeek) {
    console.log('⚠️ Nenhuma semana ativa encontrada. Criando nova...');
  } else {
    console.log(`📅 Semana atual: ${currentWeek.weekNumber}/${currentWeek.year}`);

    // Encontrar vencedor
    const sortedScores = [...currentWeek.scores].sort((a, b) => b.total - a.total);
    const winner = sortedScores[0]?.tribe || null;

    console.log(`\n🏆 Finalizando semana...`);
    if (winner) {
      console.log(`   Vencedor: ${winner}`);
    }

    // Finalizar semana
    await prisma.week.update({
      where: { id: currentWeek.id },
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

      console.log(`   Criando badges para ${winnerPets.length} membros da tribo vencedora...`);

      for (const pet of winnerPets) {
        await prisma.badge.create({
          data: {
            userId: pet.userId,
            type: 'week_winner',
            weekId: currentWeek.id,
            metadata: JSON.stringify({
              tribe: winner,
              weekNumber: currentWeek.weekNumber,
              year: currentWeek.year,
            }),
          },
        });
      }
    }

    console.log('   ✅ Semana finalizada!');
  }

  // Criar nova semana
  console.log('\n📅 Criando nova semana...');

  const now = new Date();
  const nextWeekDate = new Date(now);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  const { start, end } = getWeekBoundaries(nextWeekDate);
  const weekNumber = getWeekNumber(nextWeekDate);
  const year = nextWeekDate.getFullYear();

  // Verificar se já existe
  const existing = await prisma.week.findUnique({
    where: { weekNumber_year: { weekNumber, year } },
  });

  if (existing) {
    console.log(`   ⚠️ Semana ${weekNumber}/${year} já existe`);
    
    // Ativar se não estiver ativa
    if (!existing.isActive) {
      await prisma.week.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      console.log('   ✅ Semana ativada');
    }
  } else {
    const newWeek = await prisma.week.create({
      data: {
        weekNumber,
        year,
        startAt: start,
        endAt: end,
        isActive: true,
      },
    });

    // Criar scores iniciais zerados
    const tribes: Tribe[] = ['FOFO', 'CAOS', 'CHAD', 'DEGEN'];
    for (const tribe of tribes) {
      await prisma.tribeScore.create({
        data: {
          weekId: newWeek.id,
          tribe,
          scoreActivity: 0,
          scoreSocial: 0,
          scoreConsistency: 0,
          scoreEvent: 0,
          total: 0,
        },
      });
    }

    console.log(`   ✅ Semana ${weekNumber}/${year} criada`);
    console.log(`   De: ${start.toLocaleDateString('pt-BR')}`);
    console.log(`   Até: ${end.toLocaleDateString('pt-BR')}`);
  }

  // Mostrar histórico recente
  const history = await prisma.week.findMany({
    where: { isActive: false },
    orderBy: { endAt: 'desc' },
    take: 5,
  });

  if (history.length > 0) {
    console.log('\n📜 Histórico recente:');
    history.forEach((w) => {
      const emoji = w.winnerTribe === 'FOFO' ? '🧸' :
                   w.winnerTribe === 'CAOS' ? '🔥' :
                   w.winnerTribe === 'CHAD' ? '🗿' :
                   w.winnerTribe === 'DEGEN' ? '🤡' : '❓';
      console.log(`   Semana ${w.weekNumber}/${w.year}: ${emoji} ${w.winnerTribe || 'Empate'}`);
    });
  }

  console.log('\n✅ Rollover completo!');
}

rolloverWeek()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

