/**
 * Testes de decaimento on-read do pet
 */

import { describe, it, expect, vi } from 'vitest';
import { Pet, Tribe, Stage } from '@prisma/client';

// Constantes de decaimento (copiadas para isolamento do teste)
const DECAY_CONFIG = {
  hungerPerHour: 4,
  moodPerHour: 3,
  energyPerHour: 2,
  reputationPerHour: 0,
  neglectThresholdHours: 48,
};

// Função de decaimento isolada para teste
function computeDecayedStats(pet: Pet): {
  hunger: number;
  mood: number;
  energy: number;
  reputation: number;
  isNeglected: boolean;
  hoursSinceLastAction: number;
} {
  const now = new Date();
  const lastAction = new Date(pet.lastActionAt);
  const hoursSinceLastAction = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

  const hungerDecay = Math.floor(hoursSinceLastAction * DECAY_CONFIG.hungerPerHour);
  const moodDecay = Math.floor(hoursSinceLastAction * DECAY_CONFIG.moodPerHour);
  const energyDecay = Math.floor(hoursSinceLastAction * DECAY_CONFIG.energyPerHour);

  const hunger = Math.max(0, Math.min(100, pet.hunger - hungerDecay));
  const mood = Math.max(0, Math.min(100, pet.mood - moodDecay));
  const energy = Math.max(0, Math.min(100, pet.energy - energyDecay));
  const reputation = pet.reputation;

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

// Helper para criar pet mock
function createMockPet(overrides: Partial<Pet> = {}): Pet {
  const now = new Date();
  return {
    id: 'test-pet-id',
    userId: 'test-user-id',
    name: 'TestPet',
    tribe: 'FOFO' as Tribe,
    stage: 'BABY' as Stage,
    formId: 'fofo_baby',
    eggSeed: 123456,
    hunger: 80,
    mood: 70,
    energy: 60,
    reputation: 30,
    lastFeedAt: now,
    lastPlayAt: now,
    lastSleepAt: now,
    lastSocializeAt: now,
    lastActionAt: now,
    careStreak: 5,
    totalActions: 50,
    neglectedAt: null,
    isNeglected: false,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: now,
    ...overrides,
  };
}

describe('Decaimento de Stats do Pet', () => {
  describe('Cálculo de decaimento', () => {
    it('não deve decair se ação foi recente', () => {
      const pet = createMockPet({
        lastActionAt: new Date(),
        hunger: 80,
        mood: 70,
        energy: 60,
      });

      const stats = computeDecayedStats(pet);

      expect(stats.hunger).toBe(80);
      expect(stats.mood).toBe(70);
      expect(stats.energy).toBe(60);
    });

    it('deve decair corretamente após 1 hora', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const pet = createMockPet({
        lastActionAt: oneHourAgo,
        hunger: 80,
        mood: 70,
        energy: 60,
      });

      const stats = computeDecayedStats(pet);

      // Decay: hunger -4, mood -3, energy -2
      expect(stats.hunger).toBe(76);
      expect(stats.mood).toBe(67);
      expect(stats.energy).toBe(58);
    });

    it('deve decair corretamente após 6 horas', () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const pet = createMockPet({
        lastActionAt: sixHoursAgo,
        hunger: 80,
        mood: 70,
        energy: 60,
      });

      const stats = computeDecayedStats(pet);

      // Decay: hunger -24, mood -18, energy -12
      expect(stats.hunger).toBe(56);
      expect(stats.mood).toBe(52);
      expect(stats.energy).toBe(48);
    });

    it('não deve permitir stats negativos', () => {
      const longTimeAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const pet = createMockPet({
        lastActionAt: longTimeAgo,
        hunger: 50,
        mood: 40,
        energy: 30,
      });

      const stats = computeDecayedStats(pet);

      expect(stats.hunger).toBeGreaterThanOrEqual(0);
      expect(stats.mood).toBeGreaterThanOrEqual(0);
      expect(stats.energy).toBeGreaterThanOrEqual(0);
    });

    it('reputação não deve decair', () => {
      const longTimeAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pet = createMockPet({
        lastActionAt: longTimeAgo,
        reputation: 50,
      });

      const stats = computeDecayedStats(pet);

      expect(stats.reputation).toBe(50);
    });
  });

  describe('Detecção de negligência', () => {
    it('não deve estar negligenciado se ação foi recente', () => {
      const pet = createMockPet({
        lastActionAt: new Date(),
      });

      const stats = computeDecayedStats(pet);

      expect(stats.isNeglected).toBe(false);
    });

    it('não deve estar negligenciado antes de 48h', () => {
      const fortySevenHoursAgo = new Date(Date.now() - 47 * 60 * 60 * 1000);
      const pet = createMockPet({
        lastActionAt: fortySevenHoursAgo,
      });

      const stats = computeDecayedStats(pet);

      expect(stats.isNeglected).toBe(false);
    });

    it('deve estar negligenciado após 48h', () => {
      const fortyNineHoursAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);
      const pet = createMockPet({
        lastActionAt: fortyNineHoursAgo,
      });

      const stats = computeDecayedStats(pet);

      expect(stats.isNeglected).toBe(true);
    });

    it('deve calcular corretamente horas desde última ação', () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pet = createMockPet({
        lastActionAt: twentyFourHoursAgo,
      });

      const stats = computeDecayedStats(pet);

      expect(stats.hoursSinceLastAction).toBeCloseTo(24, 1);
    });
  });

  describe('Clamp de valores', () => {
    it('não deve exceder 100', () => {
      const pet = createMockPet({
        lastActionAt: new Date(),
        hunger: 150, // Valor inválido que deveria ser clampado
        mood: 120,
        energy: 200,
      });

      const stats = computeDecayedStats(pet);

      expect(stats.hunger).toBeLessThanOrEqual(100);
      expect(stats.mood).toBeLessThanOrEqual(100);
      expect(stats.energy).toBeLessThanOrEqual(100);
    });
  });
});

