import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyTokenTransfer, getTreasuryInfo, SIP_DECIMALS } from '@/lib/token';
import { rollForSkill } from '@/lib/skill-logic';
import { getTierName, getTierColor } from '@/lib/constants';

export async function GET() {
  // Return treasury info for the frontend
  const treasury = getTreasuryInfo();
  return NextResponse.json({
    success: true,
    data: {
      treasuryWallet: treasury.wallet,
      tokenMint: treasury.tokenMint,
      configured: treasury.configured,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { txSignature, expectedAmount } = await req.json();

    if (!txSignature) {
      return NextResponse.json(
        { success: false, error: 'Transaction signature is required' },
        { status: 400 }
      );
    }

    // Check if this transaction was already used
    const existingTx = await prisma.petAction.findFirst({
      where: { txSignature },
    });

    if (existingTx) {
      return NextResponse.json(
        { success: false, error: 'This transaction has already been used' },
        { status: 400 }
      );
    }

    // Get user's pet
    const pet = await prisma.pet.findFirst({
      where: { userId: user.id },
    });

    if (!pet) {
      return NextResponse.json({ success: false, error: 'No pet found' }, { status: 404 });
    }

    // Verify the token transfer on-chain
    const verification = await verifyTokenTransfer(
      txSignature,
      user.walletPubkey // Sender must be the authenticated user
    );

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Transaction verification failed' },
        { status: 400 }
      );
    }

    const amount = verification.amountUI || 0;

    if (amount < 1000) {
      return NextResponse.json(
        { success: false, error: 'Minimum feeding amount is 1,000 $SIP' },
        { status: 400 }
      );
    }

    // Calculate power gain (1 power per 1000 $SIP - adjusted for low market cap tokens)
    const powerGained = Math.floor(amount / 1000);

    // 10% is burned (already sent to treasury, we just track the effective amount)
    const burnedAmount = amount * 0.1;

    // Update pet stats (scaled for larger token amounts)
    const newHunger = Math.min(100, (pet.hunger || 50) + Math.floor(amount / 2000));
    const newMood = Math.min(100, (pet.mood || 50) + Math.floor(amount / 4000));

    await prisma.pet.update({
      where: { id: pet.id },
      data: {
        hunger: newHunger,
        mood: newMood,
        totalActions: pet.totalActions + 1,
        lastActionAt: new Date(),
      },
    });

    // Get or create TokenStake record for power tracking
    let tokenStake = await prisma.tokenStake.findUnique({
      where: { userId_petId: { userId: user.id, petId: pet.id } },
    });

    const currentPower = tokenStake?.power || 0;
    const newPower = currentPower + powerGained;

    if (tokenStake) {
      await prisma.tokenStake.update({
        where: { userId_petId: { userId: user.id, petId: pet.id } },
        data: {
          power: newPower,
          lastClaimAt: new Date(),
        },
      });
    } else {
      tokenStake = await prisma.tokenStake.create({
        data: {
          userId: user.id,
          petId: pet.id,
          amountStaked: 0,
          power: powerGained,
          pendingRewards: 0,
        },
      });
    }

    // Record the feeding action with tx signature to prevent reuse
    await prisma.petAction.create({
      data: {
        petId: pet.id,
        action: 'feed_token',
        statAffected: 'power',
        change: powerGained,
        oldValue: currentPower,
        newValue: newPower,
        txSignature, // Store tx signature to prevent double-spending
      },
    });

    // Create PetEvent for tribe scoring (this is what the tribe war system uses)
    await prisma.petEvent.create({
      data: {
        petId: pet.id,
        type: 'action',
        payload: JSON.stringify({
          action: 'feed_token',
          amount,
          powerGained,
          txSignature,
        }),
      },
    });

    // Roll for skill acquisition! (Chance based on power gained)
    // Higher power = better chances for rare skills
    let skillAcquired = null;
    if (powerGained >= 10) { // Minimum 10 power to roll
      const skillRoll = await rollForSkill(pet.id, powerGained, newPower);
      if (skillRoll.success && skillRoll.skill) {
        skillAcquired = {
          name: skillRoll.skill.name,
          emoji: skillRoll.skill.emoji,
          tier: skillRoll.tier,
          tierName: getTierName(skillRoll.tier!),
          tierColor: getTierColor(skillRoll.tier!),
          description: skillRoll.skill.description,
          isNewSkill: skillRoll.isNewSkill,
          levelUp: skillRoll.levelUp,
          newLevel: skillRoll.newLevel,
        };
      }
    }

    // Build response message
    let message = `Fed ${amount.toLocaleString()} $SIP! +${powerGained} Power`;
    if (skillAcquired) {
      if (skillAcquired.isNewSkill) {
        message += ` | NEW SKILL: ${skillAcquired.emoji} ${skillAcquired.name} (${skillAcquired.tierName})!`;
      } else if (skillAcquired.levelUp) {
        message += ` | SKILL UP: ${skillAcquired.emoji} ${skillAcquired.name} Lv.${skillAcquired.newLevel}!`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        amountFed: amount,
        powerGained,
        burnedAmount,
        newHunger,
        newMood,
        newPower,
        txSignature,
        message,
        skillAcquired,
      },
    });
  } catch (error) {
    console.error('Token feed error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to process token feed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
