import { Pet } from '@prisma/client';
import { prisma } from './prisma';
import { DECAY_CONFIG, ACTIONS, PET_FORMS, ActionType, Tribe, Stage } from './constants';
import { clamp } from './utils';

// ============== DECAIMENTO ON-READ ==============

export interface ComputedPetStats {
  hunger: number;
  mood: number;
  energy: number;
  reputation: number;
  isNeglected: boolean;
  hoursSinceLastAction: number;
}

export function computeDecayedStats(pet: Pet): ComputedPetStats {
  const now = new Date();
  const lastAction = new Date(pet.lastActionAt);
  const hoursSinceLastAction = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

  // Calcular decaimento
  const hungerDecay = Math.floor(hoursSinceLastAction * DECAY_CONFIG.hungerPerHour);
  const moodDecay = Math.floor(hoursSinceLastAction * DECAY_CONFIG.moodPerHour);
  const energyDecay = Math.floor(hoursSinceLastAction * DECAY_CONFIG.energyPerHour);

  // Aplicar decaimento com clamp
  const hunger = clamp(pet.hunger - hungerDecay, 0, 100);
  const mood = clamp(pet.mood - moodDecay, 0, 100);
  const energy = clamp(pet.energy - energyDecay, 0, 100);
  const reputation = pet.reputation; // Não decai

  // Verificar negligência
  const isNeglected = hoursSinceLastAction >= DECAY_CONFIG.neglectThresholdHours;

  return {
    hunger,
    mood,
    energy,
    reputation,
    isNeglected,
    hoursSinceLastAction,
  };
}

// ============== AÇÕES ==============

export interface ActionResult {
  success: boolean;
  error?: string;
  cooldownEndsAt?: Date;
  newStats?: ComputedPetStats;
  evolved?: boolean;
  newForm?: string;
}

export async function performAction(petId: string, actionType: ActionType): Promise<ActionResult> {
  const pet = await prisma.pet.findUnique({ where: { id: petId } });

  if (!pet) {
    return { success: false, error: 'Pet not found' };
  }

  const action = ACTIONS[actionType];
  const now = new Date();

  // Verificar cooldown (skip for actions that were never performed)
  const lastActionField = `last${actionType.charAt(0).toUpperCase() + actionType.slice(1)}At` as
    | 'lastFeedAt'
    | 'lastPlayAt'
    | 'lastSleepAt'
    | 'lastSocializeAt';
  const lastActionTime = new Date(pet[lastActionField]);
  const createdAt = new Date(pet.createdAt);

  // Check if this specific action was never performed (timestamp matches creation time)
  const neverPerformedThisAction = Math.abs(lastActionTime.getTime() - createdAt.getTime()) < 1000;

  if (!neverPerformedThisAction) {
    const cooldownEndsAt = new Date(lastActionTime.getTime() + action.cooldownMinutes * 60 * 1000);
    if (now < cooldownEndsAt) {
      return { success: false, error: 'Action on cooldown', cooldownEndsAt };
    }
  }

  // Calcular stats atuais
  const currentStats = computeDecayedStats(pet);

  // Check energy for actions that cost energy
  if (action.energyCost > 0 && currentStats.energy < action.energyCost) {
    return { success: false, error: 'Insufficient energy' };
  }

  // Aplicar mudanças
  const statUpdates: Record<string, unknown> = {
    [action.stat]: clamp(currentStats[action.stat] + action.change, 0, 100),
    energy:
      action.energyCost > 0
        ? clamp(currentStats.energy - action.energyCost, 0, 100)
        : action.stat === 'energy'
          ? clamp(currentStats.energy + action.change, 0, 100)
          : currentStats.energy,
    [lastActionField]: now,
    lastActionAt: now,
    totalActions: pet.totalActions + 1,
    // Atualizar outros stats com valores decaídos
    hunger: action.stat === 'hunger' ? undefined : currentStats.hunger,
    mood: action.stat === 'mood' ? undefined : currentStats.mood,
    reputation: action.stat === 'reputation' ? undefined : currentStats.reputation,
  };

  // Remover undefined values
  Object.keys(statUpdates).forEach((key) => {
    if (statUpdates[key] === undefined) {
      delete statUpdates[key];
    }
  });

  // Resetar negligência se estava negligenciado
  if (pet.isNeglected) {
    statUpdates.isNeglected = false;
    statUpdates.neglectedAt = null;
  }

  // Atualizar streak (se última ação foi há menos de 24h)
  const hoursSinceLastAction =
    (now.getTime() - new Date(pet.lastActionAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastAction <= 24) {
    statUpdates.careStreak = pet.careStreak + 1;
  } else {
    statUpdates.careStreak = 1;
  }

  // Atualizar pet
  const updatedPet = await prisma.pet.update({
    where: { id: petId },
    data: statUpdates,
  });

  // Registrar evento
  await prisma.petEvent.create({
    data: {
      petId,
      type: 'action',
      payload: JSON.stringify({
        action: actionType,
        statChange: { [action.stat]: action.change },
      }),
    },
  });

  // Verificar evolução
  const evolutionResult = await checkEvolution(updatedPet);

  return {
    success: true,
    newStats: computeDecayedStats(updatedPet),
    evolved: evolutionResult.evolved,
    newForm: evolutionResult.newForm,
  };
}

// ============== EVOLUÇÃO ==============

interface EvolutionResult {
  evolved: boolean;
  newForm?: string;
  newStage?: Stage;
}

async function checkEvolution(pet: Pet): Promise<EvolutionResult> {
  const stats = computeDecayedStats(pet);

  // Evolution conditions based on current stage (Fast progression!)
  const evolutions: Record<Stage, { nextStage: Stage; condition: () => boolean }> = {
    EGG: {
      nextStage: 'BABY',
      condition: () => pet.totalActions >= 1, // Instant hatching: 1 action
    },
    BABY: {
      nextStage: 'TEEN',
      condition: () => pet.totalActions >= 5 && pet.careStreak >= 1, // Was 20/3 - now 5 actions, 1 streak
    },
    TEEN: {
      nextStage: 'ADULT',
      condition: () => pet.totalActions >= 15 && pet.careStreak >= 2 && stats.reputation >= 10, // Was 50/7/20 - now 15/2/10
    },
    ADULT: {
      nextStage: 'LEGENDARY',
      condition: () => pet.totalActions >= 30 && pet.careStreak >= 3 && stats.reputation >= 30, // Was 100/14/50 - now 30/3/30
    },
    LEGENDARY: {
      nextStage: 'LEGENDARY', // Max level
      condition: () => false,
    },
  };

  const currentStage = pet.stage as Stage;
  const evolution = evolutions[currentStage];

  console.log('[Evolution Check]', {
    petId: pet.id,
    currentStage,
    totalActions: pet.totalActions,
    tribe: pet.tribe,
    conditionMet: evolution.condition(),
  });

  if (evolution.condition()) {
    // Encontrar nova forma
    const newForm = PET_FORMS.find(
      (f) =>
        (f.tribe === pet.tribe || f.tribe === null) &&
        f.stage === evolution.nextStage &&
        !f.isMythic
    );

    if (newForm) {
      await prisma.pet.update({
        where: { id: pet.id },
        data: {
          stage: evolution.nextStage,
          formId: newForm.id,
        },
      });

      await prisma.petEvent.create({
        data: {
          petId: pet.id,
          type: 'evolution',
          payload: JSON.stringify({
            fromStage: pet.stage,
            toStage: evolution.nextStage,
            newForm: newForm.id,
          }),
        },
      });

      return {
        evolved: true,
        newForm: newForm.id,
        newStage: evolution.nextStage,
      };
    }
  }

  return { evolved: false };
}

// ============== VERIFICAR NEGLIGÊNCIA ==============

export async function checkAndMarkNeglect(pet: Pet): Promise<boolean> {
  const stats = computeDecayedStats(pet);

  if (stats.isNeglected && !pet.isNeglected) {
    await prisma.pet.update({
      where: { id: pet.id },
      data: {
        isNeglected: true,
        neglectedAt: new Date(),
      },
    });

    await prisma.petEvent.create({
      data: {
        petId: pet.id,
        type: 'neglect',
        payload: JSON.stringify({
          hoursSinceLastAction: stats.hoursSinceLastAction,
        }),
      },
    });

    return true;
  }

  return false;
}

// ============== VERIFICAR FORMA MÍTICA ==============

export async function checkMythicUnlock(userId: string): Promise<boolean> {
  // Condição: visitar 10 pets diferentes em 24 horas
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentVisits = await prisma.visit.findMany({
    where: {
      visitorUserId: userId,
      createdAt: { gte: twentyFourHoursAgo },
    },
    distinct: ['targetPetId'],
  });

  if (recentVisits.length >= 10) {
    const pet = await prisma.pet.findUnique({ where: { userId } });

    if (pet && pet.formId !== 'mythic_ascended') {
      await prisma.pet.update({
        where: { id: pet.id },
        data: { formId: 'mythic_ascended' },
      });

      await prisma.petEvent.create({
        data: {
          petId: pet.id,
          type: 'mythic_unlock',
          payload: JSON.stringify({
            visitsIn24h: recentVisits.length,
          }),
        },
      });

      // Criar badge
      await prisma.badge.create({
        data: {
          userId,
          type: 'mythic_form',
          metadata: JSON.stringify({ unlockedAt: new Date() }),
        },
      });

      return true;
    }
  }

  return false;
}

// ============== CRIAR PET ==============

export async function createPet(
  userId: string,
  name: string,
  tribe: Tribe
): Promise<Pet | { error: string }> {
  // Verificar se já tem pet
  const existingPet = await prisma.pet.findUnique({ where: { userId } });

  if (existingPet) {
    return { error: 'You already have a pet' };
  }

  const eggSeed = Math.floor(Math.random() * 1000000);

  const pet = await prisma.pet.create({
    data: {
      userId,
      name,
      tribe,
      eggSeed,
    },
  });

  await prisma.petEvent.create({
    data: {
      petId: pet.id,
      type: 'created',
      payload: JSON.stringify({ name, tribe }),
    },
  });

  return pet;
}

// ============== BUSCAR PET COM STATS COMPUTADOS ==============

export type PetWithComputedStats = Pet & { computedStats: ComputedPetStats };

export async function getPetWithStats(petId: string): Promise<PetWithComputedStats | null> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
  });

  if (!pet) return null;

  // Verificar negligência
  await checkAndMarkNeglect(pet);

  return {
    ...pet,
    computedStats: computeDecayedStats(pet),
  };
}

export async function getUserPetWithStats(userId: string): Promise<PetWithComputedStats | null> {
  const pet = await prisma.pet.findUnique({
    where: { userId },
  });

  if (!pet) return null;

  // Verificar negligência
  await checkAndMarkNeglect(pet);

  return {
    ...pet,
    computedStats: computeDecayedStats(pet),
  };
}
