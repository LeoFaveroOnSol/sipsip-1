// ============== TYPES (replacing Prisma enums for SQLite) ==============

export type Tribe = 'FOFO' | 'CAOS' | 'CHAD' | 'DEGEN';
export type Stage = 'EGG' | 'BABY' | 'TEEN' | 'ADULT' | 'LEGENDARY';
export type ReactionType = 'LOVE' | 'LOL' | 'CRINGE' | 'CHAD' | 'RIP';
export type ProposalStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'EXECUTED';
export type ProposalType = 'SEASON_THEME' | 'NEW_FORM' | 'LORE' | 'EVENT';

// ============== TRIBES ==============

export const TRIBES = {
  FOFO: {
    id: 'FOFO' as Tribe,
    name: 'FOFO',
    emoji: '🧸',
    description: 'The softies dominate with affection and unconditional love',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-400',
  },
  CAOS: {
    id: 'CAOS' as Tribe,
    name: 'CAOS',
    emoji: '🔥',
    description: 'Creative destruction is our philosophy of life',
    color: '#ef4444',
    gradient: 'from-red-500 to-orange-400',
  },
  CHAD: {
    id: 'CHAD' as Tribe,
    name: 'CHAD',
    emoji: '🗿',
    description: 'Sigma grindset. Silence. Work. Victory.',
    color: '#22c55e',
    gradient: 'from-green-500 to-emerald-400',
  },
  DEGEN: {
    id: 'DEGEN' as Tribe,
    name: 'DEGEN',
    emoji: '🤡',
    description: 'We embrace the degen life and transform it into art',
    color: '#eab308',
    gradient: 'from-yellow-500 to-amber-400',
  },
} as const;

// ============== PET FORMS ==============

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
    name: 'Mysterious Egg',
    description: 'An egg full of potential waiting to hatch',
    tribe: null,
    stage: 'EGG',
    spriteUrl: '/sprites/egg.png',
    isMythic: false,
  },

  // FOFO forms
  {
    id: 'fofo_baby',
    name: 'Cuddly',
    description: 'A ball of plush that just wants hugs',
    tribe: 'FOFO',
    stage: 'BABY',
    spriteUrl: '/sprites/fofo_baby.png',
    isMythic: false,
  },
  {
    id: 'fofo_teen',
    name: 'Softy',
    description: 'Needy teen that distributes hearts',
    tribe: 'FOFO',
    stage: 'TEEN',
    spriteUrl: '/sprites/fofo_teen.png',
    isMythic: false,
  },
  {
    id: 'fofo_adult',
    name: 'Mega Cute',
    description: 'The supreme ambassador of love and affection',
    tribe: 'FOFO',
    stage: 'ADULT',
    spriteUrl: '/sprites/fofo_adult.png',
    isMythic: false,
  },

  // CAOS forms
  {
    id: 'caos_baby',
    name: 'Spark',
    description: 'Small but already causes emotional fires',
    tribe: 'CAOS',
    stage: 'BABY',
    spriteUrl: '/sprites/caos_baby.png',
    isMythic: false,
  },
  {
    id: 'caos_teen',
    name: 'Whirlwind',
    description: 'A hurricane of destructive teenage energy',
    tribe: 'CAOS',
    stage: 'TEEN',
    spriteUrl: '/sprites/caos_teen.png',
    isMythic: false,
  },
  {
    id: 'caos_adult',
    name: 'Apocalypse',
    description: 'The end is near. And it is beautiful.',
    tribe: 'CAOS',
    stage: 'ADULT',
    spriteUrl: '/sprites/caos_adult.png',
    isMythic: false,
  },

  // CHAD forms
  {
    id: 'chad_baby',
    name: 'Grindlet',
    description: 'Was born in the grind. Never stopped.',
    tribe: 'CHAD',
    stage: 'BABY',
    spriteUrl: '/sprites/chad_baby.png',
    isMythic: false,
  },
  {
    id: 'chad_teen',
    name: 'Sigma Jr',
    description: 'Silence. Gym. Repeat.',
    tribe: 'CHAD',
    stage: 'TEEN',
    spriteUrl: '/sprites/chad_teen.png',
    isMythic: false,
  },
  {
    id: 'chad_adult',
    name: 'Ultra Chad',
    description: 'The final form of sigma grindset',
    tribe: 'CHAD',
    stage: 'ADULT',
    spriteUrl: '/sprites/chad_adult.png',
    isMythic: false,
  },

  // DEGEN forms
  {
    id: 'degen_baby',
    name: 'Awkward',
    description: 'So uncomfortable it is adorable',
    tribe: 'DEGEN',
    stage: 'BABY',
    spriteUrl: '/sprites/degen_baby.png',
    isMythic: false,
  },
  {
    id: 'degen_teen',
    name: 'Secondhand Shame',
    description: 'Makes you feel degen just looking at it',
    tribe: 'DEGEN',
    stage: 'TEEN',
    spriteUrl: '/sprites/degen_teen.png',
    isMythic: false,
  },
  {
    id: 'degen_adult',
    name: 'Degen Lord',
    description: 'King of the degens. A work of art.',
    tribe: 'DEGEN',
    stage: 'ADULT',
    spriteUrl: '/sprites/degen_adult.png',
    isMythic: false,
  },

  // LEGENDARY forms (1 per tribe)
  {
    id: 'fofo_legendary',
    name: 'Cosmic Love',
    description: 'Transcended the physical plane and became pure love',
    tribe: 'FOFO',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/fofo_legendary.png',
    isMythic: false,
  },
  {
    id: 'caos_legendary',
    name: 'Living Entropy',
    description: 'The personification of universal chaos',
    tribe: 'CAOS',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/caos_legendary.png',
    isMythic: false,
  },
  {
    id: 'chad_legendary',
    name: 'Gigachad Omega',
    description: 'Beyond sigma. Beyond alpha. It is omega.',
    tribe: 'CHAD',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/chad_legendary.png',
    isMythic: false,
  },
  {
    id: 'degen_legendary',
    name: 'Mega Degen',
    description: 'So degen it came around and became cool',
    tribe: 'DEGEN',
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/degen_legendary.png',
    isMythic: false,
  },

  // MYTHIC (1 universal - secret event)
  {
    id: 'mythic_ascended',
    name: 'The Ascended',
    description: 'Visited 10 pets in 24h and transcended all tribes',
    tribe: null,
    stage: 'LEGENDARY',
    spriteUrl: '/sprites/mythic.png',
    isMythic: true,
  },
];

// ============== ACTIONS AND COOLDOWNS ==============

export const ACTIONS = {
  feed: {
    id: 'feed',
    name: 'Feed',
    emoji: '🍖',
    stat: 'hunger' as const,
    change: 25,
    cooldownMinutes: 5, // Was 30 - now 5 min
    energyCost: 0,
  },
  play: {
    id: 'play',
    name: 'Play',
    emoji: '🎮',
    stat: 'mood' as const,
    change: 20,
    cooldownMinutes: 5, // Was 60 - now 5 min
    energyCost: 15,
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    emoji: '💤',
    stat: 'energy' as const,
    change: 40,
    cooldownMinutes: 10, // Was 120 - now 10 min
    energyCost: 0,
  },
  socialize: {
    id: 'socialize',
    name: 'Socialize',
    emoji: '💬',
    stat: 'reputation' as const,
    change: 10,
    cooldownMinutes: 5, // Was 180 - now 5 min
    energyCost: 10,
  },
} as const;

export type ActionType = keyof typeof ACTIONS;

// ============== DECAY ==============

export const DECAY_CONFIG = {
  // Points lost per hour
  hungerPerHour: 4,
  moodPerHour: 3,
  energyPerHour: 2,
  // Reputation doesn't decay, only increases
  reputationPerHour: 0,
  // Hours without action to enter shame mode
  neglectThresholdHours: 48,
};

// ============== REACTIONS ==============

export const REACTIONS = {
  LOVE: { id: 'LOVE' as ReactionType, emoji: '❤️', name: 'Love' },
  LOL: { id: 'LOL' as ReactionType, emoji: '😂', name: 'LOL' },
  CRINGE: { id: 'CRINGE' as ReactionType, emoji: '😬', name: 'Cringe' },
  CHAD: { id: 'CHAD' as ReactionType, emoji: '🗿', name: 'Chad' },
  RIP: { id: 'RIP' as ReactionType, emoji: '💀', name: 'RIP' },
} as const;

// ============== WEEKLY RITUALS ==============

export const WEEKLY_RITUALS = [
  {
    id: 'mutation_wednesday',
    name: 'Mutation Wednesday',
    description: 'Pets can undergo random mutations every Wednesday',
    dayOfWeek: 3, // Wednesday
    emoji: '🧬',
  },
  {
    id: 'chaos_friday',
    name: 'Chaos Friday',
    description: 'Bonus points for chaotic actions on Fridays',
    dayOfWeek: 5, // Friday
    emoji: '🔥',
  },
  {
    id: 'social_saturday',
    name: 'Social Saturday',
    description: 'Visits are worth double on Saturdays',
    dayOfWeek: 6, // Saturday
    emoji: '🎉',
  },
  {
    id: 'rest_sunday',
    name: 'Rest Sunday',
    description: 'Sleep restores 50% more energy on Sundays',
    dayOfWeek: 0, // Sunday
    emoji: '😴',
  },
  {
    id: 'grind_monday',
    name: 'Grind Monday',
    description: 'Streaks count double on Mondays',
    dayOfWeek: 1, // Monday
    emoji: '💪',
  },
];

// ============== SHARE CARDS ==============

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
    name: 'Became Chad',
    trigger: 'evolution_to_chad',
    title: '🗿 I ASCENDED TO CHAD',
    subtitle: 'Silence. Grind. Evolution.',
    bgGradient: 'from-green-600 to-emerald-800',
  },
  {
    id: 'neglect_mode',
    name: 'Shame Mode',
    trigger: 'became_neglected',
    title: '💀 I WAS ABANDONED',
    subtitle: 'My owner forgot me...',
    bgGradient: 'from-gray-700 to-gray-900',
  },
  {
    id: 'troll_mutation',
    name: 'Troll Mutation',
    trigger: 'mutation_special',
    title: '🧬 EPIC MUTATION',
    subtitle: 'Mutation Wednesday transformed me!',
    bgGradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'tribe_won',
    name: 'Tribe Won',
    trigger: 'week_winner',
    title: '🏆 MY TRIBE WON!',
    subtitle: 'We dominated the week!',
    bgGradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'legendary_form',
    name: 'Legendary Form',
    trigger: 'evolution_legendary',
    title: '⭐ I BECAME LEGENDARY',
    subtitle: 'The final form was reached!',
    bgGradient: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'mythic_unlock',
    name: 'Mythic Form',
    trigger: 'unlock_mythic',
    title: '✨ I TRANSCENDED',
    subtitle: 'I unlocked the mythic form!',
    bgGradient: 'from-violet-600 to-purple-800',
  },
  {
    id: 'first_pet',
    name: 'First Pet',
    trigger: 'pet_created',
    title: '🥚 MY PET WAS BORN!',
    subtitle: 'Starting my journey!',
    bgGradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    trigger: 'streak_7_days',
    title: '🔥 7 DAY STREAK',
    subtitle: 'A week of dedication!',
    bgGradient: 'from-red-500 to-orange-600',
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    trigger: 'visits_received_50',
    title: '🦋 50 VISITS!',
    subtitle: 'My pet is popular!',
    bgGradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'season_champion',
    name: 'Season Champion',
    trigger: 'season_winner',
    title: '👑 SEASON CHAMPION',
    subtitle: 'My tribe reigns supreme!',
    bgGradient: 'from-amber-500 to-red-600',
  },
];

// ============== RATE LIMITS ==============

export const RATE_LIMITS = {
  // Visits per user per pet
  visitCooldownMinutes: 60,
  // Reactions per user per pet
  reactionCooldownMinutes: 5,
  // General requests per minute
  apiRequestsPerMinute: 60,
  // Login attempts per minute
  loginAttemptsPerMinute: 5,
};

// ============== WEEKLY SCORING ==============

export const SCORING = {
  // Weights for each category (sum = 100)
  weights: {
    activity: 25,
    social: 20,
    consistency: 20,
    event: 15,
    power: 20, // NEW: Power-based scoring
  },
  // Points per action
  points: {
    action: 10,
    visitReceived: 5,
    reactionReceived: 3,
    streakDay: 15,
    ritualBonus: 20,
    powerPer100: 5, // 5 points per 100 power
  },
};

// ============== $SIP TOKEN CONFIG ==============

export const TOKEN_CONFIG = {
  symbol: '$SIP',
  decimals: 9,
  minStake: 10,
  maxStake: 1_000_000,
};

// ============== STAKING CONFIG ==============

export const STAKING_CONFIG = {
  // APY rates
  baseAPY: 0.03,              // 3% base APY
  winningTribeBonus: 0.20,    // +20% APY for winning tribe members

  // Neglect penalty
  neglectPenaltyPerDay: 0.01, // 1% burned per day of neglect

  // Power formula multipliers
  powerMultipliers: {
    stage: {
      EGG: 0.5,
      BABY: 0.75,
      TEEN: 1.0,
      ADULT: 1.25,
      LEGENDARY: 1.5,
    },
    tribeWinnerBonus: 1.1,    // +10% power for winning tribe
  },
};

// ============== TRIBE BONUSES ==============

export const TRIBE_BONUSES = {
  FOFO: {
    type: 'care_efficiency' as const,
    bonus: 0.10,
    description: '+10% stat gain from care actions',
    emoji: '💖',
  },
  CAOS: {
    type: 'battle_damage' as const,
    bonus: 0.10,
    description: '+10% damage in PvP battles',
    emoji: '⚔️',
  },
  CHAD: {
    type: 'staking_apy' as const,
    bonus: 0.10,
    description: '+10% staking APY',
    emoji: '📈',
  },
  DEGEN: {
    type: 'raid_damage' as const,
    bonus: 0.10,
    description: '+10% damage in boss raids',
    emoji: '👹',
  },
} as const;

export type TribeBonusType = typeof TRIBE_BONUSES[keyof typeof TRIBE_BONUSES]['type'];

// ============== TRIBE WAR CONFIG ==============

export const TRIBE_WAR_CONFIG = {
  victoryAPYBonus: 0.20,       // +20% APY for winning tribe (1 week)
  treasuryContribution: 0.02,  // 2% of battle wins go to tribe treasury
  weeklyBadge: true,           // Winners get weekly badge
  cosmeticAccess: true,        // Winners get access to special cosmetics
};

// ============== PVP BATTLE CONFIG ==============

export const BATTLE_CONFIG = {
  // Betting (same as token feeding - 10K minimum for real token transfers)
  minBet: 10000,               // Minimum 10,000 $SIP (10K)
  maxBet: 1000000,             // Maximum 1,000,000 $SIP (1M)

  // Prize distribution
  winnerShare: 0.90,           // 90% goes to winner
  burnShare: 0.10,             // 10% burned

  // Matchmaking
  powerBandPercent: 0.20,      // Match within ±20% power

  // Win probability
  baseWinChance: 0.50,         // 50% base chance
  maxWinChance: 0.80,          // Cap at 80%
  minWinChance: 0.20,          // Floor at 20%
  powerDiffMultiplier: 0.0003, // 0.03% per power difference

  // Timeouts
  matchTimeoutMinutes: 30,     // Cancel pending battle after 30min
  battleDurationSeconds: 30,   // Visual battle duration
};

// ============== BOSS RAID CONFIG ==============

export const RAID_CONFIG = {
  // Entry
  entryFee: 50,                // 50 $SIP entry fee

  // Boss stats
  bossHpBase: 1_000_000,       // 1 million base HP
  bossHpScaling: 1.5,          // HP scales with participant count

  // Damage formula: power * 10 * (1 + bonuses)
  baseDamageMultiplier: 10,

  // Rewards
  top10BadgeThreshold: 10,     // Top 10 get NFT badge
  killingBlowMultiplier: 2.0,  // 2x rewards for killing blow
  mythicFormForKiller: true,   // Killing blow unlocks mythic form

  // Timing
  raidDurationDays: 7,         // 1 week per raid
  attackCooldownMinutes: 60,   // 1 attack per hour
};

// ============== SHAME MODE CONFIG ==============

export const SHAME_CONFIG = {
  // Recovery
  recoveryDaysRequired: 3,     // Need 3 consecutive days of care

  // Penalties while in shame
  statReduction: 0.50,         // 50% reduced stats
  battleDisabled: true,        // Cannot battle
  raidDisabled: true,          // Cannot raid

  // Stake penalty
  stakePenaltyPerDay: 0.01,    // 1% stake burned per day
};

// ============== POWER TIERS ==============

export const POWER_TIERS = {
  NOVICE: { minPower: 0, color: '#6b7280', label: 'Novice' },
  COMMON: { minPower: 50, color: '#22c55e', label: 'Common' },
  RARE: { minPower: 200, color: '#3b82f6', label: 'Rare' },
  EPIC: { minPower: 500, color: '#a855f7', label: 'Epic' },
  LEGENDARY: { minPower: 1000, color: '#fbbf24', label: 'Legendary' },
} as const;

// ============== TRIBE CHAT CONFIG ==============

export const CHAT_CONFIG = {
  maxMessageLength: 280,       // Twitter-style limit
  messagesPerPage: 50,
  rateLimitPerMinute: 10,      // Max 10 messages per minute
};

// ============== PET SKILLS SYSTEM ==============

export type SkillTier = 1 | 2 | 3 | 4; // Common, Rare, Epic, Legendary
export type SkillCategory = 'offensive' | 'defensive' | 'utility' | 'luck';

export interface Skill {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tier: SkillTier;
  category: SkillCategory;
  effect: {
    type: 'damage_boost' | 'defense_boost' | 'crit_chance' | 'dodge_chance' | 'luck_modifier' | 'power_scaling';
    value: number;              // Base value (e.g., 0.05 = 5%)
    perLevel: number;           // Additional per level (e.g., 0.02 = 2%)
  };
  maxLevel: number;
}

// Tier unlock thresholds based on total power gained
export const SKILL_TIER_THRESHOLDS = {
  1: 0,       // Common: Available from start
  2: 100,     // Rare: 100+ power
  3: 500,     // Epic: 500+ power
  4: 1000,    // Legendary: 1000+ power
};

// Chance to get a skill per power gained (base %)
export const SKILL_ACQUISITION_CONFIG = {
  baseChancePerPower: 0.005,   // 0.5% chance per power gained
  minPowerForRoll: 10,         // Need at least 10 power gained to roll
  maxSkillsPerPet: 6,          // Maximum skills a pet can have
  tierDropRates: {
    1: 0.60,   // 60% chance for Common
    2: 0.28,   // 28% chance for Rare
    3: 0.10,   // 10% chance for Epic
    4: 0.02,   // 2% chance for Legendary
  },
  // Higher power = better drops
  powerScaling: {
    rareBonus: 0.0001,   // +0.01% rare chance per power
    epicBonus: 0.00005,  // +0.005% epic chance per power
    legendaryBonus: 0.00001, // +0.001% legendary chance per power
  },
};

// All available skills
export const PET_SKILLS: Skill[] = [
  // ============ COMMON (Tier 1) ============
  {
    id: 'quick_jab',
    name: 'Quick Jab',
    description: 'Fast attack that deals extra damage',
    emoji: '👊',
    tier: 1,
    category: 'offensive',
    effect: { type: 'damage_boost', value: 0.05, perLevel: 0.02 },
    maxLevel: 5,
  },
  {
    id: 'thick_skin',
    name: 'Thick Skin',
    description: 'Reduces incoming damage',
    emoji: '🛡️',
    tier: 1,
    category: 'defensive',
    effect: { type: 'defense_boost', value: 0.05, perLevel: 0.02 },
    maxLevel: 5,
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Slightly increases critical hit chance',
    emoji: '🍀',
    tier: 1,
    category: 'luck',
    effect: { type: 'crit_chance', value: 0.03, perLevel: 0.015 },
    maxLevel: 5,
  },
  {
    id: 'nimble_feet',
    name: 'Nimble Feet',
    description: 'Increases dodge chance',
    emoji: '💨',
    tier: 1,
    category: 'defensive',
    effect: { type: 'dodge_chance', value: 0.03, perLevel: 0.015 },
    maxLevel: 5,
  },

  // ============ RARE (Tier 2) ============
  {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'Heavy attack with significant damage boost',
    emoji: '💥',
    tier: 2,
    category: 'offensive',
    effect: { type: 'damage_boost', value: 0.10, perLevel: 0.03 },
    maxLevel: 5,
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Greatly reduces incoming damage',
    emoji: '🔰',
    tier: 2,
    category: 'defensive',
    effect: { type: 'defense_boost', value: 0.10, perLevel: 0.03 },
    maxLevel: 5,
  },
  {
    id: 'fortune_favor',
    name: "Fortune's Favor",
    description: 'Luck modifier that affects battle outcome',
    emoji: '🎰',
    tier: 2,
    category: 'luck',
    effect: { type: 'luck_modifier', value: 0.05, perLevel: 0.02 },
    maxLevel: 5,
  },
  {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: 'High dodge chance through evasion',
    emoji: '👤',
    tier: 2,
    category: 'defensive',
    effect: { type: 'dodge_chance', value: 0.08, perLevel: 0.025 },
    maxLevel: 5,
  },

  // ============ EPIC (Tier 3) ============
  {
    id: 'berserker_rage',
    name: 'Berserker Rage',
    description: 'Massive damage boost in combat',
    emoji: '😤',
    tier: 3,
    category: 'offensive',
    effect: { type: 'damage_boost', value: 0.18, perLevel: 0.04 },
    maxLevel: 5,
  },
  {
    id: 'diamond_body',
    name: 'Diamond Body',
    description: 'Near-impenetrable defense',
    emoji: '💎',
    tier: 3,
    category: 'defensive',
    effect: { type: 'defense_boost', value: 0.18, perLevel: 0.04 },
    maxLevel: 5,
  },
  {
    id: 'critical_eye',
    name: 'Critical Eye',
    description: 'Greatly increases critical hit chance',
    emoji: '🎯',
    tier: 3,
    category: 'luck',
    effect: { type: 'crit_chance', value: 0.12, perLevel: 0.03 },
    maxLevel: 5,
  },
  {
    id: 'power_surge',
    name: 'Power Surge',
    description: 'Power has greater effect on battles',
    emoji: '⚡',
    tier: 3,
    category: 'utility',
    effect: { type: 'power_scaling', value: 0.15, perLevel: 0.04 },
    maxLevel: 5,
  },

  // ============ LEGENDARY (Tier 4) ============
  {
    id: 'death_blow',
    name: 'Death Blow',
    description: 'Devastating damage that can turn any battle',
    emoji: '💀',
    tier: 4,
    category: 'offensive',
    effect: { type: 'damage_boost', value: 0.30, perLevel: 0.05 },
    maxLevel: 5,
  },
  {
    id: 'immortal_shield',
    name: 'Immortal Shield',
    description: 'Legendary defense that blocks massive damage',
    emoji: '🏆',
    tier: 4,
    category: 'defensive',
    effect: { type: 'defense_boost', value: 0.30, perLevel: 0.05 },
    maxLevel: 5,
  },
  {
    id: 'fate_bender',
    name: 'Fate Bender',
    description: 'Manipulates luck in your favor',
    emoji: '🌟',
    tier: 4,
    category: 'luck',
    effect: { type: 'luck_modifier', value: 0.15, perLevel: 0.04 },
    maxLevel: 5,
  },
  {
    id: 'ascendant_power',
    name: 'Ascendant Power',
    description: 'Your power becomes legendary in battle',
    emoji: '👑',
    tier: 4,
    category: 'utility',
    effect: { type: 'power_scaling', value: 0.25, perLevel: 0.05 },
    maxLevel: 5,
  },
];

// Helper function to get skill by ID
export function getSkillById(skillId: string): Skill | undefined {
  return PET_SKILLS.find(s => s.id === skillId);
}

// Helper to get skills by tier
export function getSkillsByTier(tier: SkillTier): Skill[] {
  return PET_SKILLS.filter(s => s.tier === tier);
}

// Get tier name
export function getTierName(tier: SkillTier): string {
  const names = { 1: 'Common', 2: 'Rare', 3: 'Epic', 4: 'Legendary' };
  return names[tier];
}

// Get tier color
export function getTierColor(tier: SkillTier): string {
  const colors = {
    1: '#9ca3af', // Gray (Common)
    2: '#3b82f6', // Blue (Rare)
    3: '#a855f7', // Purple (Epic)
    4: '#f59e0b', // Gold (Legendary)
  };
  return colors[tier];
}
