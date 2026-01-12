import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserPetWithStats } from '@/lib/pet-logic';
import { PET_FORMS } from '@/lib/constants';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    let petData = null;

    if (user.pet) {
      const petWithStats = await getUserPetWithStats(user.id);
      if (petWithStats) {
        const form = PET_FORMS.find((f) => f.id === petWithStats.formId);
        petData = {
          ...petWithStats,
          form: form
            ? { name: form.name, description: form.description, spriteUrl: form.spriteUrl }
            : null,
        };
      }
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
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

