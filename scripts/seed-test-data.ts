// Script para gerar dados de teste - bosses, battles, pets para teste
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRIBES = ['FOFO', 'CAOS', 'CHAD', 'DEGEN'];
const STAGES = ['EGG', 'BABY', 'TEEN', 'ADULT', 'LEGENDARY'];

const BOSS_NAMES = [
  { name: 'Hydra do Caos', formId: 'boss_hydra', element: 'chaos' },
  { name: 'Wyrm Ancestral', formId: 'boss_wyrm', element: 'fire' },
  { name: 'Golem de Obsidiana', formId: 'boss_golem', element: 'earth' },
  { name: 'Fênix Negra', formId: 'boss_phoenix', element: 'fire' },
  { name: 'Kraken Abissal', formId: 'boss_kraken', element: 'ice' },
];

const PET_NAMES = [
  'ShadowFang', 'CryptoKitty', 'DegenLord', 'MoonBoi', 'DiamondHands',
  'ApePunks', 'SolSlayer', 'NFTDegen', 'TokenKing', 'ChainBreaker',
  'BlockBuster', 'HashMaster', 'CryptoWolf', 'MetaVerse', 'Web3Warrior',
  'DAODestroyer', 'YieldYak', 'StakeSage', 'MintMaster', 'GasFighter',
];

async function main() {
  console.log('🌱 Seeding test data...\n');

  // 1. Get or create current week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

  let week = await prisma.week.findFirst({
    where: { weekNumber, year: now.getFullYear() },
  });

  if (!week) {
    week = await prisma.week.create({
      data: {
        weekNumber,
        year: now.getFullYear(),
        startAt: startOfWeek,
        endAt: endOfWeek,
        isActive: true,
      },
    });
    console.log(`✅ Created week ${weekNumber}/${now.getFullYear()}`);
  } else {
    console.log(`📅 Week ${weekNumber}/${now.getFullYear()} already exists`);
  }

  // 2. Create tribe scores
  for (const tribe of TRIBES) {
    const existing = await prisma.tribeScore.findFirst({
      where: { weekId: week.id, tribe },
    });

    if (!existing) {
      await prisma.tribeScore.create({
        data: {
          weekId: week.id,
          tribe,
          scoreActivity: Math.floor(Math.random() * 1000),
          scoreSocial: Math.floor(Math.random() * 500),
          scoreConsistency: Math.floor(Math.random() * 500),
          scoreEvent: Math.floor(Math.random() * 300),
          scorePower: Math.floor(Math.random() * 800),
          total: 0,
        },
      });
    }
  }

  // Update totals
  const scores = await prisma.tribeScore.findMany({
    where: { weekId: week.id },
  });

  for (const score of scores) {
    const total = score.scoreActivity + score.scoreSocial + score.scoreConsistency + score.scoreEvent + score.scorePower;
    await prisma.tribeScore.update({
      where: { id: score.id },
      data: { total },
    });
  }
  console.log('✅ Tribe scores created/updated');

  // 3. Create boss raid
  let raid = await prisma.bossRaid.findFirst({
    where: { weekId: week.id, status: 'ACTIVE' },
  });

  if (!raid) {
    const boss = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
    raid = await prisma.bossRaid.create({
      data: {
        weekId: week.id,
        bossName: boss.name,
        bossFormId: boss.formId,
        bossElement: boss.element,
        bossHpMax: 1_000_000,
        bossHpCurrent: 850_000 + Math.floor(Math.random() * 100000), // Already some damage
        entryFee: 50,
        rewardPool: 2500 + Math.floor(Math.random() * 1000),
        status: 'ACTIVE',
        startAt: startOfWeek,
        endAt: endOfWeek,
      },
    });
    console.log(`✅ Created boss raid: ${boss.name}`);
  } else {
    console.log(`🐉 Boss raid already exists: ${raid.bossName}`);
  }

  // 4. Create test users and pets
  const testWallets = [
    'Test1111111111111111111111111111111111111111',
    'Test2222222222222222222222222222222222222222',
    'Test3333333333333333333333333333333333333333',
    'Test4444444444444444444444444444444444444444',
    'Test5555555555555555555555555555555555555555',
  ];

  for (let i = 0; i < testWallets.length; i++) {
    const wallet = testWallets[i];

    let user = await prisma.user.findUnique({
      where: { walletPubkey: wallet },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletPubkey: wallet,
        },
      });
    }

    let pet = await prisma.pet.findFirst({
      where: { userId: user.id },
    });

    if (!pet) {
      const tribe = TRIBES[i % 4];
      const stage = STAGES[Math.min(4, Math.floor(Math.random() * 4) + 1)];
      const petName = PET_NAMES[i];

      pet = await prisma.pet.create({
        data: {
          userId: user.id,
          name: petName,
          tribe,
          stage,
          formId: `${tribe.toLowerCase()}_${stage.toLowerCase()}`,
          hunger: 50 + Math.floor(Math.random() * 50),
          mood: 50 + Math.floor(Math.random() * 50),
          energy: 50 + Math.floor(Math.random() * 50),
          reputation: Math.floor(Math.random() * 100),
          careStreak: Math.floor(Math.random() * 10),
          totalActions: Math.floor(Math.random() * 100),
        },
      });
      console.log(`✅ Created test pet: ${petName} (${tribe})`);
    }

    // Create stake for pet
    const existingStake = await prisma.stake.findFirst({
      where: { walletPubkey: wallet },
    });

    if (!existingStake) {
      await prisma.stake.create({
        data: {
          walletPubkey: wallet,
          amount: 1000 + Math.floor(Math.random() * 5000),
          power: 50 + Math.floor(Math.random() * 200),
          apy: 0.03,
        },
      });
    }

    // Add to raid
    const participation = await prisma.bossRaidParticipant.findFirst({
      where: { raidId: raid.id, userId: user.id },
    });

    if (!participation) {
      await prisma.bossRaidParticipant.create({
        data: {
          raidId: raid.id,
          userId: user.id,
          petId: pet.id,
          totalDamage: 10000 + Math.floor(Math.random() * 50000),
          attackCount: 5 + Math.floor(Math.random() * 20),
          sipContributed: 50,
        },
      });
    }
  }
  console.log('✅ Test users and raid participants created');

  // 5. Clean old battles and create new pending battles with correct token amounts
  // Delete old pending battles with incorrect amounts
  const deletedBattles = await prisma.battle.deleteMany({
    where: {
      status: 'PENDING',
      betAmount: { lt: 1000 }, // Old format was < 1000 (display amounts)
    },
  });
  console.log(`🗑️ Deleted ${deletedBattles.count} old pending battles`);

  const users = await prisma.user.findMany({
    where: { walletPubkey: { in: testWallets } },
    include: { pet: true },
  });

  // Create TokenStake for test users (so they have power)
  for (const user of users) {
    if (!user.pet) continue;

    const power = 50 + Math.floor(Math.random() * 200);

    await prisma.tokenStake.upsert({
      where: { userId_petId: { userId: user.id, petId: user.pet.id } },
      update: { power },
      create: {
        userId: user.id,
        petId: user.pet.id,
        amountStaked: 0,
        power,
        pendingRewards: 0,
      },
    });
  }
  console.log('✅ TokenStake records created for test users');

  // Create new battles with raw token amounts (10K, 50K, 100K)
  const betAmounts = [10000, 50000, 100000]; // In display format
  const SIP_DECIMALS = 6;

  for (let i = 0; i < 3 && i < users.length; i++) {
    const challenger = users[i];
    if (!challenger.pet) continue;

    const tokenStake = await prisma.tokenStake.findUnique({
      where: { userId_petId: { userId: challenger.id, petId: challenger.pet.id } },
    });

    const existingBattle = await prisma.battle.findFirst({
      where: {
        challengerId: challenger.id,
        status: 'PENDING',
      },
    });

    if (!existingBattle) {
      // Convert display amount to raw (with 6 decimals)
      const rawBetAmount = betAmounts[i] * Math.pow(10, SIP_DECIMALS);

      await prisma.battle.create({
        data: {
          challengerId: challenger.id,
          challengerPetId: challenger.pet.id,
          betAmount: rawBetAmount,
          challengerPower: tokenStake?.power || 100,
          status: 'PENDING',
        },
      });
      console.log(`✅ Created pending battle by ${challenger.pet.name}: ${betAmounts[i].toLocaleString()} $SIP`);
    }
  }

  // 6. Add some chat messages
  const chatMessages = [
    { message: 'Bora derrubar esse boss! 🔥', tribe: 'CAOS' },
    { message: 'FOFO DOMINA 💖', tribe: 'FOFO' },
    { message: 'Silêncio. Grind. Vitória. 🗿', tribe: 'CHAD' },
    { message: 'NGMI se não entrar no raid 🤡', tribe: 'DEGEN' },
    { message: 'Quem quer battle? 50 SIP', tribe: null },
  ];

  for (let i = 0; i < chatMessages.length && i < users.length; i++) {
    const user = users[i];
    if (!user.pet) continue;

    const existing = await prisma.chatMessage.findFirst({
      where: { petId: user.pet.id },
    });

    if (!existing) {
      await prisma.chatMessage.create({
        data: {
          wallet: user.walletPubkey,
          petId: user.pet.id,
          message: chatMessages[i].message,
          tribe: chatMessages[i].tribe,
        },
      });
    }
  }
  console.log('✅ Chat messages created');

  // 7. Create tribe guilds
  for (const tribe of TRIBES) {
    const existing = await prisma.tribeGuild.findFirst({
      where: { tribe },
    });

    if (!existing) {
      const memberCount = users.filter(u => u.pet?.tribe === tribe).length;
      await prisma.tribeGuild.create({
        data: {
          tribe,
          treasury: Math.floor(Math.random() * 1000),
          totalPower: Math.floor(Math.random() * 5000),
          memberCount,
        },
      });
    }
  }
  console.log('✅ Tribe guilds created');

  console.log('\n🎉 Test data seeding complete!');
  console.log('\nSummary:');
  console.log(`- Week: ${weekNumber}/${now.getFullYear()}`);
  console.log(`- Boss: ${raid.bossName} (${raid.bossHpCurrent.toLocaleString()}/${raid.bossHpMax.toLocaleString()} HP)`);
  console.log(`- Test users: ${testWallets.length}`);
  console.log(`- Pending battles: 3`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
