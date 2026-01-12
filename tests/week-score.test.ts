/**
 * Testes de cálculo de score semanal
 */

import { describe, it, expect } from 'vitest';
import { Tribe } from '@prisma/client';

// Constantes de scoring (copiadas para isolamento do teste)
const SCORING = {
  weights: {
    activity: 30,
    social: 25,
    consistency: 25,
    event: 20,
  },
  points: {
    action: 10,
    visitReceived: 5,
    reactionReceived: 3,
    streakDay: 15,
    ritualBonus: 20,
  },
};

// Função de cálculo isolada para teste
interface TribeData {
  actionCount: number;
  visitsReceived: number;
  reactionsReceived: number;
  totalStreak: number;
  evolutionCount: number;
}

function calculateTribeScore(data: TribeData): {
  scoreActivity: number;
  scoreSocial: number;
  scoreConsistency: number;
  scoreEvent: number;
  total: number;
} {
  const scoreActivity = data.actionCount * SCORING.points.action;
  const scoreSocial =
    data.visitsReceived * SCORING.points.visitReceived +
    data.reactionsReceived * SCORING.points.reactionReceived;
  const scoreConsistency = data.totalStreak * SCORING.points.streakDay;
  const scoreEvent = data.evolutionCount * SCORING.points.ritualBonus;

  const total = Math.round(
    (scoreActivity * SCORING.weights.activity +
      scoreSocial * SCORING.weights.social +
      scoreConsistency * SCORING.weights.consistency +
      scoreEvent * SCORING.weights.event) /
      100
  );

  return {
    scoreActivity,
    scoreSocial,
    scoreConsistency,
    scoreEvent,
    total,
  };
}

describe('Cálculo de Score Semanal', () => {
  describe('Score de Atividade', () => {
    it('deve calcular corretamente baseado em ações', () => {
      const data: TribeData = {
        actionCount: 100,
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 100 ações * 10 pontos = 1000
      expect(score.scoreActivity).toBe(1000);
    });

    it('deve ter peso de 30% no total', () => {
      const data: TribeData = {
        actionCount: 100,
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 1000 * 30% = 300
      expect(score.total).toBe(300);
    });
  });

  describe('Score Social', () => {
    it('deve calcular visitas corretamente', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 50,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 50 visitas * 5 pontos = 250
      expect(score.scoreSocial).toBe(250);
    });

    it('deve calcular reações corretamente', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 0,
        reactionsReceived: 100,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 100 reações * 3 pontos = 300
      expect(score.scoreSocial).toBe(300);
    });

    it('deve somar visitas e reações', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 20,
        reactionsReceived: 30,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // (20 * 5) + (30 * 3) = 100 + 90 = 190
      expect(score.scoreSocial).toBe(190);
    });

    it('deve ter peso de 25% no total', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 40,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 200 * 25% = 50
      expect(score.total).toBe(50);
    });
  });

  describe('Score de Consistência', () => {
    it('deve calcular streak corretamente', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 14, // 14 dias de streak total na tribo
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 14 * 15 = 210
      expect(score.scoreConsistency).toBe(210);
    });

    it('deve ter peso de 25% no total', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 20,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 300 * 25% = 75
      expect(score.total).toBe(75);
    });
  });

  describe('Score de Eventos', () => {
    it('deve calcular evoluções corretamente', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 5,
      };

      const score = calculateTribeScore(data);

      // 5 * 20 = 100
      expect(score.scoreEvent).toBe(100);
    });

    it('deve ter peso de 20% no total', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 10,
      };

      const score = calculateTribeScore(data);

      // 200 * 20% = 40
      expect(score.total).toBe(40);
    });
  });

  describe('Score Total', () => {
    it('deve calcular total com todas as categorias', () => {
      const data: TribeData = {
        actionCount: 100,   // 1000 pontos
        visitsReceived: 50,  // 250 pontos
        reactionsReceived: 50, // 150 pontos (total social: 400)
        totalStreak: 20,     // 300 pontos
        evolutionCount: 5,   // 100 pontos
      };

      const score = calculateTribeScore(data);

      // Atividade: 1000 * 0.30 = 300
      // Social: 400 * 0.25 = 100
      // Consistência: 300 * 0.25 = 75
      // Evento: 100 * 0.20 = 20
      // Total: 300 + 100 + 75 + 20 = 495
      expect(score.total).toBe(495);
    });

    it('deve arredondar o total para inteiro', () => {
      const data: TribeData = {
        actionCount: 33, // 330 pontos
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      // 330 * 0.30 = 99
      expect(Number.isInteger(score.total)).toBe(true);
    });

    it('deve retornar 0 se não houver atividade', () => {
      const data: TribeData = {
        actionCount: 0,
        visitsReceived: 0,
        reactionsReceived: 0,
        totalStreak: 0,
        evolutionCount: 0,
      };

      const score = calculateTribeScore(data);

      expect(score.total).toBe(0);
      expect(score.scoreActivity).toBe(0);
      expect(score.scoreSocial).toBe(0);
      expect(score.scoreConsistency).toBe(0);
      expect(score.scoreEvent).toBe(0);
    });
  });

  describe('Comparação entre tribos', () => {
    it('tribo com mais atividade deve ter score maior', () => {
      const tribeA: TribeData = {
        actionCount: 200,
        visitsReceived: 50,
        reactionsReceived: 50,
        totalStreak: 20,
        evolutionCount: 5,
      };

      const tribeB: TribeData = {
        actionCount: 100,
        visitsReceived: 50,
        reactionsReceived: 50,
        totalStreak: 20,
        evolutionCount: 5,
      };

      const scoreA = calculateTribeScore(tribeA);
      const scoreB = calculateTribeScore(tribeB);

      expect(scoreA.total).toBeGreaterThan(scoreB.total);
    });

    it('empate deve resultar em scores iguais', () => {
      const data: TribeData = {
        actionCount: 100,
        visitsReceived: 50,
        reactionsReceived: 50,
        totalStreak: 20,
        evolutionCount: 5,
      };

      const scoreA = calculateTribeScore(data);
      const scoreB = calculateTribeScore(data);

      expect(scoreA.total).toBe(scoreB.total);
    });
  });
});

