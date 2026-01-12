import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createPet, getUserPetWithStats } from '@/lib/pet-logic';
import { PET_FORMS, ACTIONS, Tribe } from '@/lib/constants';
import { validatePetName } from '@/lib/utils';
import { z } from 'zod';

// Calculate cooldown end times for all actions
function calculateCooldowns(pet: {
  createdAt: Date;
  lastFeedAt: Date;
  lastPlayAt: Date;
  lastSleepAt: Date;
  lastSocializeAt: Date;
}) {
  const cooldowns: Record<string, string | null> = {};
  const now = new Date();
  const createdAt = new Date(pet.createdAt);

  const actionFields = {
    feed: { field: 'lastFeedAt', minutes: ACTIONS.feed.cooldownMinutes },
    play: { field: 'lastPlayAt', minutes: ACTIONS.play.cooldownMinutes },
    sleep: { field: 'lastSleepAt', minutes: ACTIONS.sleep.cooldownMinutes },
    socialize: { field: 'lastSocializeAt', minutes: ACTIONS.socialize.cooldownMinutes },
  };

  for (const [action, config] of Object.entries(actionFields)) {
    const lastActionTime = new Date(pet[config.field as keyof typeof pet] as Date);

    // Check if action was never performed (timestamp matches creation time)
    const neverPerformed = Math.abs(lastActionTime.getTime() - createdAt.getTime()) < 1000;

    if (neverPerformed) {
      cooldowns[action] = null; // No cooldown
    } else {
      const cooldownEndsAt = new Date(lastActionTime.getTime() + config.minutes * 60 * 1000);
      if (now < cooldownEndsAt) {
        cooldowns[action] = cooldownEndsAt.toISOString();
      } else {
        cooldowns[action] = null; // Cooldown expired
      }
    }
  }

  return cooldowns;
}

const createPetSchema = z.object({
  name: z.string().min(2).max(20),
  tribe: z.enum(['FOFO', 'CAOS', 'CHAD', 'DEGEN']),
});

// GET - Obter pet do usuário atual
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const pet = await getUserPetWithStats(user.id);

    if (!pet) {
      return NextResponse.json({ success: false, error: 'You do not have a pet' }, { status: 404 });
    }

    const form = PET_FORMS.find((f) => f.id === pet.formId);

    return NextResponse.json({
      success: true,
      data: {
        ...pet,
        form: form
          ? { name: form.name, description: form.description, spriteUrl: form.spriteUrl }
          : null,
        cooldowns: calculateCooldowns(pet),
      },
    });
  } catch (error) {
    console.error('Get pet error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// POST - Criar novo pet
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const { name, tribe } = parsed.data;

    // Validar nome
    const nameValidation = validatePetName(name);
    if (!nameValidation.valid) {
      return NextResponse.json({ success: false, error: nameValidation.error }, { status: 400 });
    }

    // Criar pet
    const result = await createPet(user.id, name.trim(), tribe as Tribe);

    if ('error' in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const form = PET_FORMS.find((f) => f.id === result.formId);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        form: form
          ? { name: form.name, description: form.description, spriteUrl: form.spriteUrl }
          : null,
      },
    });
  } catch (error) {
    console.error('Create pet error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

