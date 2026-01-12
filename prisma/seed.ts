import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos locais (SQLite não suporta enums)
type Tribe = 'FOFO' | 'CAOS' | 'CHAD' | 'CRINGE';
type Stage = 'EGG' | 'BABY' | 'TEEN' | 'ADULT' | 'LEGENDARY';

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

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpar dados existentes
  console.log('🧹 Limpando dados existentes...');
  await prisma.vote.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.tribeScore.deleteMany();
  await prisma.week.deleteMany();
  await prisma.season.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.petEvent.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.session.deleteMany();
  await prisma.nonce.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuários fake
  console.log('👥 Criando usuários...');
  const users = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const walletPubkey = `FakeWallet${String(i + 1).padStart(3, '0')}${Math.random().toString(36).substring(2, 10)}`;
      return prisma.user.create({
        data: {
          walletPubkey,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    })
  );
  console.log(`   ✅ ${users.length} usuários criados`);

  // Criar pets (1 por usuário, distribuídos entre tribos)
  console.log('🐣 Criando pets...');
  const tribes: Tribe[] = ['FOFO', 'CAOS', 'CHAD', 'CRINGE'];
  const stages: Stage[] = ['EGG', 'BABY', 'TEEN', 'ADULT'];
  const petNames = [
    'Fluffster', 'Destroyer', 'Gigachad', 'Cringelord', 'Fofinho',
    'Caos Jr', 'Sigma', 'Awkward', 'Bolinha', 'Inferno',
    'Grinder', 'Vergonha', 'Amor', 'Fogo', 'Pedra',
    'Palhaço', 'Coração', 'Lava', 'Diamante', 'Estrela'
  ];

  const pets = await Promise.all(
    users.map((user, i) => {
      const tribe = tribes[i % 4];
      const stage = stages[Math.floor(Math.random() * 4)];
      const formId = `${tribe.toLowerCase()}_${stage.toLowerCase()}`;

      return prisma.pet.create({
        data: {
          userId: user.id,
          name: petNames[i],
          tribe,
          stage,
          formId: stage === 'EGG' ? 'egg_default' : formId,
          eggSeed: Math.floor(Math.random() * 1000000),
          hunger: 30 + Math.floor(Math.random() * 60),
          mood: 30 + Math.floor(Math.random() * 60),
          energy: 30 + Math.floor(Math.random() * 60),
          reputation: Math.floor(Math.random() * 50),
          careStreak: Math.floor(Math.random() * 14),
          totalActions: 5 + Math.floor(Math.random() * 100),
          lastActionAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        },
      });
    })
  );
  console.log(`   ✅ ${pets.length} pets criados`);

  // Criar eventos para os pets
  console.log('📝 Criando eventos...');
  let eventCount = 0;
  for (const pet of pets) {
    const numEvents = 3 + Math.floor(Math.random() * 10);
    for (let i = 0; i < numEvents; i++) {
      const eventTypes = ['action', 'evolution', 'created'];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      await prisma.petEvent.create({
        data: {
          petId: pet.id,
          type,
          payload: JSON.stringify(
            type === 'action'
              ? { action: ['feed', 'play', 'sleep', 'socialize'][Math.floor(Math.random() * 4)] }
              : type === 'evolution'
              ? { fromStage: 'BABY', toStage: 'TEEN' }
              : { name: pet.name, tribe: pet.tribe }
          ),
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      eventCount++;
    }
  }
  console.log(`   ✅ ${eventCount} eventos criados`);

  // Criar visitas
  console.log('👀 Criando visitas...');
  let visitCount = 0;
  for (let i = 0; i < 50; i++) {
    const visitor = users[Math.floor(Math.random() * users.length)];
    const targetPet = pets[Math.floor(Math.random() * pets.length)];

    if (visitor.id !== targetPet.userId) {
      try {
        await prisma.visit.create({
          data: {
            visitorUserId: visitor.id,
            targetPetId: targetPet.id,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
        visitCount++;
      } catch {
        // Ignorar duplicatas
      }
    }
  }
  console.log(`   ✅ ${visitCount} visitas criadas`);

  // Criar reactions
  console.log('💬 Criando reactions...');
  const reactionTypes = ['LOVE', 'LOL', 'CRINGE', 'CHAD', 'RIP'] as const;
  let reactionCount = 0;
  for (let i = 0; i < 100; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const targetPet = pets[Math.floor(Math.random() * pets.length)];

    if (user.id !== targetPet.userId) {
      await prisma.reaction.create({
        data: {
          userId: user.id,
          petId: targetPet.id,
          type: reactionTypes[Math.floor(Math.random() * reactionTypes.length)],
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      reactionCount++;
    }
  }
  console.log(`   ✅ ${reactionCount} reactions criadas`);

  // Criar semana atual
  console.log('📅 Criando semana atual...');
  const now = new Date();
  const { start, end } = getWeekBoundaries(now);
  const weekNumber = getWeekNumber(now);

  const week = await prisma.week.create({
    data: {
      weekNumber,
      year: now.getFullYear(),
      startAt: start,
      endAt: end,
      isActive: true,
    },
  });

  // Criar scores iniciais para a semana
  for (const tribe of tribes) {
    await prisma.tribeScore.create({
      data: {
        weekId: week.id,
        tribe,
        scoreActivity: Math.floor(Math.random() * 500),
        scoreSocial: Math.floor(Math.random() * 300),
        scoreConsistency: Math.floor(Math.random() * 200),
        scoreEvent: Math.floor(Math.random() * 100),
        total: Math.floor(Math.random() * 1000),
      },
    });
  }
  console.log(`   ✅ Semana ${weekNumber}/${now.getFullYear()} criada com scores`);

  // Criar temporada atual
  console.log('🏆 Criando temporada...');
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const seasonNumber = now.getFullYear() * 100 + (now.getMonth() + 1);

  await prisma.season.create({
    data: {
      seasonNumber,
      theme: 'Era do Despertar',
      description: 'A primeira temporada do SipSip! Todas as tribos lutam para estabelecer dominância.',
      startAt: monthStart,
      endAt: monthEnd,
      isActive: true,
    },
  });
  console.log(`   ✅ Temporada ${seasonNumber} criada`);

  // Criar propostas do Council
  console.log('🏛️ Criando propostas do Council...');
  const proposals = await Promise.all([
    prisma.proposal.create({
      data: {
        title: 'Tema da Próxima Temporada',
        description: 'Vote no tema que definirá a próxima temporada do SipSip!',
        type: 'SEASON_THEME',
        status: 'ACTIVE',
        options: JSON.stringify(['Era do Caos', 'Reino Fofo', 'Ascensão Chad', 'Festival Cringe']),
        startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.proposal.create({
      data: {
        title: 'Nova Forma de Pet',
        description: 'Qual forma especial devemos adicionar ao jogo?',
        type: 'NEW_FORM',
        status: 'ACTIVE',
        options: JSON.stringify(['Dragão Cósmico', 'Slime Arco-Íris', 'Fantasma Neon', 'Robô Kawaii']),
        startAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.proposal.create({
      data: {
        title: 'Frase da Comunidade',
        description: 'Escolha a frase que aparecerá na landing page!',
        type: 'LORE',
        status: 'CLOSED',
        options: JSON.stringify([
          'Cuide. Evolua. Domine.',
          'Sua tribo, sua família.',
          'Pets unidos jamais serão vencidos!',
        ]),
        startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        result: JSON.stringify({ 0: 45, 1: 32, 2: 23 }),
      },
    }),
  ]);
  console.log(`   ✅ ${proposals.length} propostas criadas`);

  // Criar alguns votos nas propostas ativas
  console.log('🗳️ Criando votos...');
  let voteCount = 0;
  for (const user of users.slice(0, 10)) {
    for (const proposal of proposals.filter(p => p.status === 'ACTIVE')) {
      try {
        await prisma.vote.create({
          data: {
            proposalId: proposal.id,
            userId: user.id,
            choice: Math.floor(Math.random() * 4),
            signature: `fake_sig_${Math.random().toString(36).substring(2)}`,
          },
        });
        voteCount++;
      } catch {
        // Ignorar duplicatas
      }
    }
  }
  console.log(`   ✅ ${voteCount} votos criados`);

  // Criar alguns badges
  console.log('🎖️ Criando badges...');
  let badgeCount = 0;
  for (const user of users.slice(0, 5)) {
    await prisma.badge.create({
      data: {
        userId: user.id,
        type: 'early_adopter',
        metadata: JSON.stringify({ reason: 'Participou do seed inicial' }),
      },
    });
    badgeCount++;
  }
  console.log(`   ✅ ${badgeCount} badges criadas`);

  console.log('\n✨ Seed completo!\n');
  console.log('📊 Resumo:');
  console.log(`   - ${users.length} usuários`);
  console.log(`   - ${pets.length} pets`);
  console.log(`   - ${eventCount} eventos`);
  console.log(`   - ${visitCount} visitas`);
  console.log(`   - ${reactionCount} reactions`);
  console.log(`   - 1 semana`);
  console.log(`   - 1 temporada`);
  console.log(`   - ${proposals.length} propostas`);
  console.log(`   - ${voteCount} votos`);
  console.log(`   - ${badgeCount} badges`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
