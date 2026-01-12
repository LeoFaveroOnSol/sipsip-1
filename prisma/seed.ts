import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Local types (SQLite doesn't support enums)
type Tribe = 'FOFO' | 'CAOS' | 'CHAD' | 'DEGEN';
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
  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
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

  // Create fake users
  console.log('👥 Creating users...');
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
  console.log(`   ✅ ${users.length} users created`);

  // Create pets (1 per user, distributed among tribes)
  console.log('🐣 Creating pets...');
  const tribes: Tribe[] = ['FOFO', 'CAOS', 'CHAD', 'DEGEN'];
  const stages: Stage[] = ['EGG', 'BABY', 'TEEN', 'ADULT'];
  const petNames = [
    'Fluffster', 'Destroyer', 'Gigachad', 'Cringelord', 'Cuddly',
    'Caos Jr', 'Sigma', 'Awkward', 'Puffball', 'Inferno',
    'Grinder', 'Cringe', 'Love', 'Fire', 'Stone',
    'Clown', 'Heart', 'Lava', 'Diamond', 'Star'
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
  console.log(`   ✅ ${pets.length} pets created`);

  // Create events for pets
  console.log('📝 Creating events...');
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
  console.log(`   ✅ ${eventCount} events created`);

  // Create visits
  console.log('👀 Creating visits...');
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
        // Ignore duplicates
      }
    }
  }
  console.log(`   ✅ ${visitCount} visits created`);

  // Create reactions
  console.log('💬 Creating reactions...');
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
  console.log(`   ✅ ${reactionCount} reactions created`);

  // Create current week
  console.log('📅 Creating current week...');
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

  // Create initial scores for the week (starting at zero for fresh start)
  for (const tribe of tribes) {
    await prisma.tribeScore.create({
      data: {
        weekId: week.id,
        tribe,
        scoreActivity: 0,
        scoreSocial: 0,
        scoreConsistency: 0,
        scoreEvent: 0,
        total: 0,
      },
    });
  }
  console.log(`   ✅ Week ${weekNumber}/${now.getFullYear()} created with scores`);

  // Create current season
  console.log('🏆 Creating season...');
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const seasonNumber = now.getFullYear() * 100 + (now.getMonth() + 1);

  await prisma.season.create({
    data: {
      seasonNumber,
      theme: 'Era of Awakening',
      description: 'The first SipSip season! All tribes fight to establish dominance.',
      startAt: monthStart,
      endAt: monthEnd,
      isActive: true,
    },
  });
  console.log(`   ✅ Season ${seasonNumber} created`);

  // Create Council proposals
  console.log('🏛️ Creating Council proposals...');
  const proposals = await Promise.all([
    prisma.proposal.create({
      data: {
        title: 'Next Season Theme',
        description: 'Vote on the theme that will define the next SipSip season!',
        type: 'SEASON_THEME',
        status: 'ACTIVE',
        options: JSON.stringify(['Era of Chaos', 'Cute Kingdom', 'Chad Ascension', 'Cringe Festival']),
        startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.proposal.create({
      data: {
        title: 'New Pet Form',
        description: 'What special form should we add to the game?',
        type: 'NEW_FORM',
        status: 'ACTIVE',
        options: JSON.stringify(['Cosmic Dragon', 'Rainbow Slime', 'Neon Ghost', 'Kawaii Robot']),
        startAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.proposal.create({
      data: {
        title: 'Community Phrase',
        description: 'Choose the phrase that will appear on the landing page!',
        type: 'LORE',
        status: 'CLOSED',
        options: JSON.stringify([
          'Care. Evolve. Dominate.',
          'Your tribe, your family.',
          'United pets will never be defeated!',
        ]),
        startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        result: JSON.stringify({ 0: 45, 1: 32, 2: 23 }),
      },
    }),
  ]);
  console.log(`   ✅ ${proposals.length} proposals created`);

  // Skip creating fake votes - start fresh with 0 votes
  console.log('🗳️ Skipping fake votes - starting fresh');
  const voteCount = 0;

  // Create some badges
  console.log('🎖️ Creating badges...');
  let badgeCount = 0;
  for (const user of users.slice(0, 5)) {
    await prisma.badge.create({
      data: {
        userId: user.id,
        type: 'early_adopter',
        metadata: JSON.stringify({ reason: 'Participated in initial seed' }),
      },
    });
    badgeCount++;
  }
  console.log(`   ✅ ${badgeCount} badges created`);

  console.log('\n✨ Seed complete!\n');
  console.log('📊 Summary:');
  console.log(`   - ${users.length} users`);
  console.log(`   - ${pets.length} pets`);
  console.log(`   - ${eventCount} events`);
  console.log(`   - ${visitCount} visits`);
  console.log(`   - ${reactionCount} reactions`);
  console.log(`   - 1 week`);
  console.log(`   - 1 season`);
  console.log(`   - ${proposals.length} proposals`);
  console.log(`   - ${voteCount} votes`);
  console.log(`   - ${badgeCount} badges`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
