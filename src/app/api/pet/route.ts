import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createPet, getUserPetWithStats } from '@/lib/pet-logic';
import { PET_FORMS, Tribe } from '@/lib/constants';
import { validatePetName } from '@/lib/utils';
import { z } from 'zod';

const createPetSchema = z.object({
  name: z.string().min(2).max(20),
  tribe: z.enum(['FOFO', 'CAOS', 'CHAD', 'CRINGE']),
});

// GET - Obter pet do usuário atual
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const pet = await getUserPetWithStats(user.id);

    if (!pet) {
      return NextResponse.json({ success: false, error: 'Você não tem um pet' }, { status: 404 });
    }

    const form = PET_FORMS.find((f) => f.id === pet.formId);

    return NextResponse.json({
      success: true,
      data: {
        ...pet,
        form: form
          ? { name: form.name, description: form.description, spriteUrl: form.spriteUrl }
          : null,
      },
    });
  } catch (error) {
    console.error('Get pet error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo pet
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
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
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

