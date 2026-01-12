import type { Pet, User } from '@prisma/client';
import type { ComputedPetStats } from '@/lib/pet-logic';
import type { Tribe, Stage, ReactionType, ProposalStatus, ProposalType } from '@/lib/constants';

// ============== API RESPONSES ==============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============== AUTH ==============

export interface NonceResponse {
  nonce: string;
  message: string;
}

export interface LoginRequest {
  wallet: string;
  signature: string;
  nonce: string;
}

export interface LoginResponse {
  user: {
    id: string;
    walletPubkey: string;
  };
  isNew: boolean;
  hasPet: boolean;
}

// ============== PET ==============

export interface CreatePetRequest {
  name: string;
  tribe: Tribe;
}

export interface PetResponse extends Pet {
  computedStats: ComputedPetStats;
  form: {
    name: string;
    description: string;
    spriteUrl: string;
  };
}

export interface ActionRequest {
  petId: string;
  action: 'feed' | 'play' | 'sleep' | 'socialize';
}

export interface ActionResponse {
  success: boolean;
  newStats?: ComputedPetStats;
  cooldownEndsAt?: string;
  evolved?: boolean;
  newForm?: string;
  error?: string;
}

// ============== SOCIAL ==============

export interface VisitRequest {
  targetPetId: string;
}

export interface ReactionRequest {
  petId: string;
  type: ReactionType;
}

export interface PetProfileResponse {
  pet: PetResponse;
  owner: {
    id: string;
    walletPubkey: string;
  };
  recentEvents: Array<{
    id: string;
    type: string;
    payload: unknown;
    createdAt: string;
  }>;
  reactions: Record<ReactionType, number>;
  visitCount: number;
  canVisit: boolean;
  canReact: boolean;
}

// ============== TRIBES / WEEK ==============

export interface WeekResponse {
  id: string;
  weekNumber: number;
  year: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  winnerTribe: Tribe | null;
  scores: Array<{
    tribe: Tribe;
    scoreActivity: number;
    scoreSocial: number;
    scoreConsistency: number;
    scoreEvent: number;
    total: number;
  }>;
}

export interface LeaderboardResponse {
  week: WeekResponse;
  leaderboard: Array<{
    tribe: Tribe;
    emoji: string;
    name: string;
    color: string;
    total: number;
    position: number;
    isWinner: boolean;
  }>;
}

// ============== SEASON ==============

export interface SeasonResponse {
  id: string;
  seasonNumber: number;
  theme: string;
  description: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  winnerTribe: Tribe | null;
  progress: number; // 0-100
}

// ============== COUNCIL ==============

export interface ProposalResponse {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  options: string[];
  startAt: string;
  endAt: string;
  result: Record<number, number> | null;
  votes: number;
  userVote?: number;
}

export interface VoteRequest {
  proposalId: string;
  choice: number;
  signature: string;
  timestamp: number;
}

// ============== BADGES ==============

export interface BadgeResponse {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============== FEED ==============

export interface FeedEvent {
  id: string;
  type: 'visit' | 'evolution' | 'neglect' | 'recovery' | 'reaction' | 'week_win' | 'created';
  petId: string;
  petName: string;
  tribe: Tribe;
  payload: Record<string, unknown>;
  createdAt: string;
}

// ============== CLIENT STATE ==============

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  pet: Pet | null;
}

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
}
