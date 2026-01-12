import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SIP_DECIMALS = 6;

// GET - Seed test battles (temporary endpoint for testing)
export async function GET() {
  try {
    // 1. Delete ALL pending battles from test users to recreate with correct amounts
    // Also delete battles with incorrect amounts (< 1 million means not in raw format)
    const deletedBattles = await prisma.battle.deleteMany({
      where: {
        OR: [
          { status: 'PENDING', betAmount: { lt: 1000000 } }, // Old format - display amounts
          {
            status: 'PENDING',
            challenger: { walletPubkey: { startsWith: 'Test' } }
          },
        ],
      },
    });

    // 2. Get or create test users
    const testWallets = [
      'Test1111111111111111111111111111111111111111',
      'Test2222222222222222222222222222222222222222',
      'Test3333333333333333333333333333333333333333',
    ];

    const TRIBES = ['FOFO', 'CAOS', 'CHAD', 'DEGEN'];
    const PET_NAMES = ['ShadowFang', 'CryptoKitty', 'DegenLord'];
    const betAmounts = [10000, 50000, 100000]; // Display format

    const results: string[] = [];
    results.push(`Deleted ${deletedBattles.count} old pending battles`);

    for (let i = 0; i < testWallets.length; i++) {
      const wallet = testWallets[i];

      // Get or create user
      let user = await prisma.user.findUnique({
        where: { walletPubkey: wallet },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { walletPubkey: wallet },
        });
        results.push(`Created user: ${wallet.slice(0, 8)}...`);
      }

      // Get or create pet
      let pet = await prisma.pet.findFirst({
        where: { userId: user.id },
      });

      if (!pet) {
        const tribe = TRIBES[i % 4];
        pet = await prisma.pet.create({
          data: {
            userId: user.id,
            name: PET_NAMES[i],
            tribe,
            stage: 'ADULT',
            formId: `${tribe.toLowerCase()}_adult`,
            hunger: 80,
            mood: 80,
            energy: 80,
            reputation: 50,
            careStreak: 5,
            totalActions: 50,
          },
        });
        results.push(`Created pet: ${PET_NAMES[i]} (${tribe})`);
      }

      // Create or update TokenStake
      const power = 50 + Math.floor(Math.random() * 200);
      await prisma.tokenStake.upsert({
        where: { userId_petId: { userId: user.id, petId: pet.id } },
        update: { power },
        create: {
          userId: user.id,
          petId: pet.id,
          amountStaked: 0,
          power,
          pendingRewards: 0,
        },
      });

      // Delete any existing pending battle for this user first
      await prisma.battle.deleteMany({
        where: {
          challengerId: user.id,
          status: 'PENDING',
        },
      });

      // Create battle with raw amount (with 6 decimals)
      const rawBetAmount = betAmounts[i] * Math.pow(10, SIP_DECIMALS);

      await prisma.battle.create({
        data: {
          challengerId: user.id,
          challengerPetId: pet.id,
          betAmount: rawBetAmount,
          challengerPower: power,
          status: 'PENDING',
        },
      });
      results.push(`Created battle: ${betAmounts[i].toLocaleString()} $SIP (raw: ${rawBetAmount}) by ${PET_NAMES[i]} (power: ${power})`);
    }

    // Get current pending battles
    const pendingBattles = await prisma.battle.findMany({
      where: { status: 'PENDING' },
      include: {
        challengerPet: { select: { name: true, tribe: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Test data seeded successfully',
      results,
      pendingBattles: pendingBattles.map(b => ({
        id: b.id,
        pet: b.challengerPet?.name,
        tribe: b.challengerPet?.tribe,
        betAmount: b.betAmount,
        betAmountDisplay: `${(b.betAmount / Math.pow(10, SIP_DECIMALS)).toLocaleString()} $SIP`,
        power: b.challengerPower,
      })),
    });
  } catch (error) {
    console.error('Seed battles error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
