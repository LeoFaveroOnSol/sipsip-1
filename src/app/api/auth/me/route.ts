import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { computeDecayedStats } from '@/lib/pet-logic';
import { PET_FORMS } from '@/lib/constants';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    let petData = null;

    if (user.pet) {
      const pet = user.pet;
      const form = PET_FORMS.find((f) => f.id === pet.formId);
      const computedStats = computeDecayedStats(pet);

      petData = {
        id: pet.id,
        name: pet.name,
        tribe: pet.tribe,
        stage: pet.stage,
        formId: pet.formId,
        eggSeed: pet.eggSeed,
        hunger: pet.hunger,
        mood: pet.mood,
        energy: pet.energy,
        reputation: pet.reputation,
        isNeglected: pet.isNeglected,
        careStreak: pet.careStreak,
        totalActions: pet.totalActions,
        createdAt: pet.createdAt,
        computedStats,
        form: form
          ? { name: form.name, description: form.description, spriteUrl: form.spriteUrl }
          : null,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletPubkey: user.walletPubkey,
          createdAt: user.createdAt,
        },
        pet: petData,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

