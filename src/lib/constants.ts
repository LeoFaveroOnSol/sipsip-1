// ============== TIPOS (substituindo enums do Prisma para SQLite) ==============

export type Tribe = 'FOFO' | 'CAOS' | 'CHAD' | 'DEGEN';
export type Stage = 'EGG' | 'BABY' | 'TEEN' | 'ADULT' | 'LEGENDARY';
export type ReactionType = 'LOVE' | 'LOL' | 'CRINGE' | 'CHAD' | 'RIP';
export type ProposalStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'EXECUTED';
export type ProposalType = 'SEASON_THEME' | 'NEW_FORM' | 'LORE' | 'EVENT';

// ============== TRIBOS ==============

export const TRIBES = {
  FOFO: {
    id: 'FOFO' as Tribe,
    name: 'FOFO',
    emoji: '🧸',
    description: 'Os fofos dominam com carinho e amor incondicional',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-400',
  },
  CAOS: {
    id: 'CAOS' as Tribe,
    name: 'CAOS',
    emoji: '🔥',
    description: 'Destruição criativa é nossa filosofia de vida',
    color: '#ef4444',
    gradient: 'from-red-500 to-orange-400',
  },
  CHAD: {
    id: 'CHAD' as Tribe,
    name: 'CHAD',
    emoji: '🗿',
    description: 'Sigma grindset. Silêncio. Trabalho. Vitória.',
    color: '#22c55e',
    gradient: 'from-green-500 to-emerald-400',
  },
  DEGEN: {
    id: 'DEGEN' as Tribe,
    name: 'DEGEN',
    emoji: '💊',
    description: 'Degen pill. Charts go up. We follow.',
    color: '#00ff88',
    gradient: 'from-emerald-400 to-green-500',
  },
} as const;

// ============== FORMAS DOS PETS ==============

export interface PetForm {
  id: string;
  name: string;
  description: string;
  tribe: Tribe | null;
  stage: Stage;
  spriteUrl: string;
  isMythic: boolean;
}

export const PET_FORMS: PetForm[] = [
  // Egg (universal)
  {
    id: 'egg_default',
    name: 'Ovo Misterioso',
    description: 'Um ovo cheio de potencial esperando para eclodir',
    tribe: null,
    stage: 'EGG',
    spriteUrl: '/sprites/egg.png',
    isMythic: false,
  },

  // FOFO forms
  {
    id: 'fofo_baby',
    name: 'Fofinho',
    description: 'Uma bolinha de pelúcia que só quer abraços',
    tribe: 'FOFO',
    stage: 'BABY',
    spriteUrl: '/sprites/fofo_baby.png',
    isMythic: false,
  },
  {
    id: 'fofo_teen',
    name: 'Fofão',
    description: 'Adolescente carente que distribui corações',
    tribe: 'FOFO',
    stage: 'TEEN',
    spriteUrl: '/sprites/fofo_teen.png',
    isMythic: false,
  },
  {
    id: 'fofo_adult',
    name: 'Mega Fofo',
    description: 'O embaixador supremo do amor e carinho',
    tribe: 'FOFO',
    stage: 'ADULT',
    spriteUrl: '/sprites/fofo_adult.png',
    isMythic: false,
  },

  // CAOS forms
  {
    id: 'caos_baby',
    name: 'Faísca',
    description: 'Pequeno mas já causa incêndios emocionais',
    tribe: 'CAOS',
    stage: 'BABY',
    spriteUrl: '/sprites/caos_baby.png',
    isMythic: false,
  },
  {
    id: 'caos_teen',
    name: 'Turbilhão',
    description: 'Um furacão de energia destrutiva adolescente',
    tribe: 'CAOS',
    stage: 'TEEN',
    spriteUrl: '/sprites/caos_teen.png',
    isMythic: false,
  },
  {
    id: 'caos_adult',
    name: 'Apocalipse',
    description: 'O fim está próximo. E é lindo.',
    tribe: 'CAOS',
    stage: 'ADULT',
    spriteUrl: '/sprites/caos_adult.png',
    isMythic: false,
  },

  // CHAD forms
  {
    id: 'chad_baby',
    name: 'Grindlet',
    description: 'Já nasceu no grind. Nunca parou.',
    tribe: 'CHAD',
    stage: 'BABY',
    spriteUrl: '/sprites/chad_baby.png',
    isMythic: false,
  },
  {
    id: 'chad_teen',
    name: 'Sigma Jr',
    description: 'Silêncio. Academia. Repetir.',
    tribe: 'CHAD',
    stage: 'TEEN',
    spriteUrl: '/sprites/chad_teen.png',
    isMythic: false,
  },
  {
    id: 'chad_adult',
    name: 'Ultra Chad',
    description: 'A forma final do sigma grindset',
    tribe: 'CHAD',
    stage: 'ADULT',
    spriteUrl: '/sprites/chad_adult.png',
    isMythic: false,
  },

  // DEGEN forms
  {
    id: 'degen_baby',
    name: 'Pill',
    description: 'Pequena pílula de potencial infinito',
    tribe: 'DEGEN',
    stage: 'BABY',
    spriteUrl: '/sprites/degen_baby.png',
    isMythic: false,
  },
  {
    id: 'degen_teen',
    name: 'Trader',
    description: 'Já vive nos charts 24/7',
    tribe: 'DEGEN',
    stage: 'TEEN',
    spriteUrl: '/sprites/degen_teen.png',
    isMythic: false,
  },
  {
    id: 'degen_adult',
    name: 'Diamond Hands',
    description: 'Nunca vende. Nunca dorme. Sempre hold.',
    tribe: 'DEGEN',
    stage: 'ADULT',
    spriteUrl: '/sprites/degen_adult.png',
    isMythic: false,
  },

  // LEGENDARY forms (1 por tribo)
  {
    id: 'fofo_legendary',
    name: 'Amor Cósmico',
    description: 'Transcendeu o plano físico e virou amor puro',
    tribe: 'FOFO',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/fofo_legendary.png',
    isMythic: false,
  },
  {
    id: 'caos_legendary',
    name: 'Entropia Viva',
    description: 'A personificação do caos universal',
    tribe: 'CAOS',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/caos_legendary.png',
    isMythic: false,
  },
  {
    id: 'chad_legendary',
    name: 'Gigachad Omega',
    description: 'Além do sigma. Além do alpha. É o ômega.',
    tribe: 'CHAD',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/chad_legendary.png',
    isMythic: false,
  },
  {
    id: 'degen_legendary',
    name: 'Whale',
    description: 'Movimenta o mercado. O mercado move ele.',
    tribe: 'DEGEN',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/degen_legendary.png',
    isMythic: false,
  },

  // MYTHIC (1 universal - evento secreto)
  {
    id: 'mythic_ascended',
    name: 'O Ascendido',
    description: 'Visitou 10 pets em 24h e transcendeu todas as tribos',
    tribe: null,
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/mythic.png',
    isMythic: true,
  },
];

// ============== AÇÕES E COOLDOWNS ==============

export const ACTIONS = {
  feed: {
    id: 'feed',
    name: 'Alimentar',
    emoji: '🍖',
    stat: 'hunger' as const,
    change: 25,
    cooldownMinutes: 30,
    energyCost: 0,
  },
  play: {
    id: 'play',
    name: 'Brincar',
    emoji: '🎮',
    stat: 'mood' as const,
    change: 20,
    cooldownMinutes: 60,
    energyCost: 15,
  },
  sleep: {
    id: 'sleep',
    name: 'Dormir',
    emoji: '💤',
    stat: 'energy' as const,
    change: 40,
    cooldownMinutes: 120,
    energyCost: 0,
  },
  socialize: {
    id: 'socialize',
    name: 'Socializar',
    emoji: '💬',
    stat: 'reputation' as const,
    change: 10,
    cooldownMinutes: 180,
    energyCost: 10,
  },
} as const;

export type ActionType = keyof typeof ACTIONS;

// ============== DECAIMENTO ==============

export const DECAY_CONFIG = {
  // Pontos perdidos por hora
  hungerPerHour: 4,
  moodPerHour: 3,
  energyPerHour: 2,
  // Reputação não decai, só aumenta
  reputationPerHour: 0,
  // Horas sem ação para entrar em modo vergonha
  neglectThresholdHours: 48,
};

// ============== REACTIONS ==============

export const REACTIONS = {
  LOVE: { id: 'LOVE' as ReactionType, emoji: '❤️', name: 'Adorei' },
  LOL: { id: 'LOL' as ReactionType, emoji: '😂', name: 'kkk' },
  CRINGE: { id: 'CRINGE' as ReactionType, emoji: '😬', name: 'Cringe' },
  CHAD: { id: 'CHAD' as ReactionType, emoji: '🗿', name: 'Chad' },
  RIP: { id: 'RIP' as ReactionType, emoji: '💀', name: 'RIP' },
} as const;

// ============== RITUAIS SEMANAIS ==============

export const WEEKLY_RITUALS = [
  {
    id: 'mutation_wednesday',
    name: 'Quarta da Mutação',
    description: 'Pets podem sofrer mutações aleatórias toda quarta-feira',
    dayOfWeek: 3, // Wednesday
    emoji: '🧬',
  },
  {
    id: 'chaos_friday',
    name: 'Sexta do Caos',
    description: 'Bônus de pontos para ações caóticas às sextas',
    dayOfWeek: 5, // Friday
    emoji: '🔥',
  },
  {
    id: 'social_saturday',
    name: 'Sábado Social',
    description: 'Visitas valem o dobro aos sábados',
    dayOfWeek: 6, // Saturday
    emoji: '🎉',
  },
  {
    id: 'rest_sunday',
    name: 'Domingo de Descanso',
    description: 'Sleep restaura 50% mais energia aos domingos',
    dayOfWeek: 0, // Sunday
    emoji: '😴',
  },
  {
    id: 'grind_monday',
    name: 'Segunda do Grind',
    description: 'Streaks contam em dobro às segundas',
    dayOfWeek: 1, // Monday
    emoji: '💪',
  },
];

// ============== CARDS DE SHARE ==============

export interface ShareCardTemplate {
  id: string;
  name: string;
  trigger: string;
  title: string;
  subtitle: string;
  bgGradient: string;
}

export const SHARE_CARDS: ShareCardTemplate[] = [
  {
    id: 'became_chad',
    name: 'Virou Chad',
    trigger: 'evolution_to_chad',
    title: '🗿 ASCENDI AO CHAD',
    subtitle: 'Silêncio. Grind. Evolução.',
    bgGradient: 'from-green-600 to-emerald-800',
  },
  {
    id: 'neglect_mode',
    name: 'Modo Vergonha',
    trigger: 'became_neglected',
    title: '💀 FUI ABANDONADO',
    subtitle: 'Meu dono me esqueceu...',
    bgGradient: 'from-gray-700 to-gray-900',
  },
  {
    id: 'troll_mutation',
    name: 'Mutação Troll',
    trigger: 'mutation_special',
    title: '🧬 MUTAÇÃO ÉPICA',
    subtitle: 'Quarta da Mutação me transformou!',
    bgGradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'tribe_won',
    name: 'Tribo Venceu',
    trigger: 'week_winner',
    title: '🏆 MINHA TRIBO VENCEU!',
    subtitle: 'Dominamos a semana!',
    bgGradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'legendary_form',
    name: 'Forma Lendária',
    trigger: 'evolution_legendary',
    title: '⭐ VIREI LENDÁRIO',
    subtitle: 'A forma final foi alcançada!',
    bgGradient: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'mythic_unlock',
    name: 'Forma Mítica',
    trigger: 'unlock_mythic',
    title: '✨ TRANSCENDI',
    subtitle: 'Desbloqueei a forma mítica!',
    bgGradient: 'from-violet-600 to-purple-800',
  },
  {
    id: 'first_pet',
    name: 'Primeiro Pet',
    trigger: 'pet_created',
    title: '🥚 MEU PET NASCEU!',
    subtitle: 'Começando minha jornada!',
    bgGradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'streak_master',
    name: 'Mestre do Streak',
    trigger: 'streak_7_days',
    title: '🔥 7 DIAS DE STREAK',
    subtitle: 'Uma semana de dedicação!',
    bgGradient: 'from-red-500 to-orange-600',
  },
  {
    id: 'social_butterfly',
    name: 'Borboleta Social',
    trigger: 'visits_received_50',
    title: '🦋 50 VISITAS!',
    subtitle: 'Meu pet é popular!',
    bgGradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'season_champion',
    name: 'Campeão da Temporada',
    trigger: 'season_winner',
    title: '👑 CAMPEÃO DA TEMPORADA',
    subtitle: 'Minha tribo reina suprema!',
    bgGradient: 'from-amber-500 to-red-600',
  },
];

// ============== RATE LIMITS ==============

export const RATE_LIMITS = {
  // Visitas por usuário por pet
  visitCooldownMinutes: 60,
  // Reactions por usuário por pet
  reactionCooldownMinutes: 5,
  // Requests gerais por minuto
  apiRequestsPerMinute: 60,
  // Login attempts por minuto
  loginAttemptsPerMinute: 5,
};

// ============== PONTUAÇÃO SEMANAL ==============

export const SCORING = {
  // Pesos para cada categoria (soma = 100)
  weights: {
    activity: 30,
    social: 25,
    consistency: 25,
    event: 20,
  },
  // Pontos por ação
  points: {
    action: 10,
    visitReceived: 5,
    reactionReceived: 3,
    streakDay: 15,
    ritualBonus: 20,
  },
};
