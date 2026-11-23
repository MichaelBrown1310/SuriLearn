/**
 * SuriLearn Gamification System Contracts & Interfaces
 * Phase 1 - MVP Architecture
 * Strictly adheres to PRD and Game Design Mathematical Rules.
 */

// ==========================================
// 1. SYSTEM CONFIGURATION & MATHEMATICAL RULES
// ==========================================

export const GAMIFICATION_RULES = {
  // System of Lives (Hearts)
  HEARTS: {
    MAX_CAPACITY: 5,
    COST_PER_MISTAKE: 1,
    REFILL_INTERVAL_HOURS: 4,
    REFILL_INTERVAL_MS: 4 * 60 * 60 * 1000,
    REINFORCEMENT_RESTORE_AMOUNT: 1, // Restores +1 heart upon 100% score in review mode
  },
  // Economy and Progression
  ECONOMY: {
    XP_LESSON_BASE: 15,
    XP_PERFECT_BONUS: 5,
    BITS_LESSON_COMPLETED: 10,
    BITS_UNIT_COMPLETED: 50,
    BITS_7_DAY_STREAK: 100,
  },
  // Streak Multipliers
  STREAK_TIERS: [
    { minDays: 1, maxDays: 3, multiplier: 1.0, label: 'Iniciación' },
    { minDays: 4, maxDays: 7, multiplier: 1.2, label: 'En guardia' },
    { minDays: 8, maxDays: 14, multiplier: 1.5, label: 'Centinela alerta' },
    { minDays: 15, maxDays: Infinity, multiplier: 2.0, label: 'Guardián veterano' },
  ],
} as const;

/**
 * Calculates current streak multiplier based on active days
 */
export function calculateStreakMultiplier(streakDays: number): number {
  if (streakDays <= 0) return 1.0;
  for (const tier of GAMIFICATION_RULES.STREAK_TIERS) {
    if (streakDays >= tier.minDays && streakDays <= tier.maxDays) {
      return tier.multiplier;
    }
  }
  return 2.0;
}

// ==========================================
// 2. DAILY GOAL CONTRACTS
// ==========================================

export type DailyGoalType = 'casual' | 'constante' | 'pro';

export interface DailyGoalConfig {
  id: DailyGoalType;
  title: string;
  minutesPerDay: number;
  lessonsPerDay: number;
  description: string;
  recommended?: boolean;
}

export const DAILY_GOAL_CONFIGS: Record<DailyGoalType, DailyGoalConfig> = {
  casual: {
    id: 'casual',
    title: 'Casual',
    minutesPerDay: 3,
    lessonsPerDay: 1,
    description: '3 min/día • 1 lección diaria',
  },
  constante: {
    id: 'constante',
    title: 'Constante',
    minutesPerDay: 5,
    lessonsPerDay: 2,
    description: '5 min/día • 2 lecciones diarias',
    recommended: true,
  },
  pro: {
    id: 'pro',
    title: 'Centinela Pro',
    minutesPerDay: 10,
    lessonsPerDay: 3,
    description: '10 min/día • 3 lecciones diarias',
  },
};

// ==========================================
// 3. USER PROFILE & GAMIFICATION STATE
// ==========================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  avatarUrl?: string | null;
  companyName?: string; // Targeted for SMEs (5-50 employees)
  organizationId?: string; // Multi-tenant Organization ID (e.g. 'albion')
  role: 'sme_member' | 'sme_admin' | 'individual';
  isPro: boolean; // Pro / SME users have infinite hearts
  proExpiresAt?: string | null; // ISO string
  dailyGoal: DailyGoalType;
  currentLeague?: string;
  accuracyRate?: number;
  completedLessons?: string[];
  hearts?: number;
  lastHeartRefill?: any;
  xp?: number;
  bits?: number;
  streakDays?: number;
  hasStreakFreeze?: boolean;
  createdAt: any;
  lastLoginAt?: any;
  claimedRewards?: string[]; // IDs of claimed chests/bonuses (e.g. 'unit_1_completion_chest')
  status?: 'active' | 'suspended';
  suspendedAt?: string | null;
  lastActiveDate?: string | null;
  activeDates?: string[]; // List of 'YYYY-MM-DD' local dates with completed lessons
}

// ==========================================
// 3.1. ORGANIZATIONS / PYMES (MULTI-TENANT)
// ==========================================

export type OrganizationPlan = 'free_pilot' | 'micro_pyme' | 'growth_pyme' | 'enterprise';

export type OrganizationSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export interface Organization {
  id: string; // ej: 'albion'
  name: string; // 'Albion'
  adminEmail: string; // 'albionreferidos2@gmail.com'
  adminUid: string;
  plan: OrganizationPlan;
  maxSeats: number; // Cantidad de puestos contratados
  usedSeats: number; // Cantidad de colaboradores activos
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: OrganizationSubscriptionStatus;
  inviteCode: string; // Código de 6 caracteres alfanuméricos para unirse
  createdAt: any; // serverTimestamp()
  industry?: string;
  avgAccuracyRate?: number;
  totalTeamXp?: number;
}

export interface UserGamificationState {
  // Lives System
  hearts: number;
  maxHearts: number;
  lastHeartRefill: string; // ISO string for passive regeneration calculation
  
  // Economy & Telemetry
  bits: number; // Virtual currency
  xp: number; // Experience points
  level: number;
  levelTitle: string; // e.g. "Centinela Nivel 1 · Recluta de Perímetro"
  currentLeague: string; // e.g. "Bronce"
  
  // Streak System
  streakDays: number;
  lastActiveDate: string; // Format: 'YYYY-MM-DD' (local time)
  hasStreakFreeze: boolean;
  activeDates?: string[]; // Format: ['YYYY-MM-DD', ...]
  
  // Performance Metrics
  accuracyPercentage: number; // Overall percentage (0% for new accounts)
  accuracyRate: number; // Numeric accuracy (0 to 100)
  totalLessonsCompleted: number;
  completedLessons: string[];
  claimedRewards?: string[];
  
  // Temporary Boosters
  xpBoostMultiplier: number; // 1 = normal, 2 = 2X Boost active
  xpBoostLessonsRemaining: number;
}

// ==========================================
// 4. LEAGUES & LEADERBOARD
// ==========================================

export type LeagueDivision = 'bronze' | 'silver' | 'gold' | 'diamond' | 'sentinel';

export interface LeagueLeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  xp: number;
  rank: number;
  isCurrentUser: boolean;
  trend: 'up' | 'same' | 'down';
  zone: 'promotion' | 'safe' | 'demotion';
  streakDays?: number;
  accuracyRate?: number;
}

export interface LeagueDetails {
  id: LeagueDivision;
  name: string;
  divisionRoman: string; // e.g., "División V"
  promotionThreshold: number; // Top X (e.g., 5)
  nextLeagueName: string;
  seasonEndsAt: string; // ISO timestamp
}

// ==========================================
// 5. SHOP & REWARDS ECONOMY
// ==========================================

export type ShopItemCode = 'streak_freeze' | 'heart_refill' | 'xp_boost_2x' | 'suripro_monthly';

export interface ShopItem {
  id: string;
  code: ShopItemCode;
  title: string;
  description: string;
  costBits: number;
  icon: string;
  category: 'consumable' | 'protection' | 'subscription';
  isSubscription?: boolean;
}

export interface InventoryItem {
  itemCode: ShopItemCode;
  quantity: number;
  acquiredAt: string;
  expiresAt?: string | null;
}

// ==========================================
// 6. BADGES & ACHIEVEMENTS
// ==========================================

export interface Badge {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  iconUrl: string;
  level: number;
  maxLevel: number;
  isUnlocked: boolean;
  unlockedAt?: string | null;
  progressCurrent: number;
  progressTarget: number;
}

// ==========================================
// 7. LEARNING PATHWAY & NODES
// ==========================================

export type LearningNodeType = 'lesson' | 'reward_chest' | 'checkpoint';
export type LearningNodeStatus = 'completed' | 'active' | 'locked';
export type NodeLanePosition = 'left' | 'center' | 'right';

export interface TheorySlide {
  id: string;
  badge: string;
  title: string;
  icon: string;
  content: string;
  standardRef?: string;
  safeExample: string;
  trapExample: string;
  suriTip: string;
}

export interface UnitTheorySection {
  title: string;
  icon: string;
  summary: string;
  keyPoints: string[];
  realWorldCase: string;
}

export interface UnitTheoryGuide {
  subtitle: string;
  frameworkBadge: string;
  estimatedStudyMinutes: number;
  overview: string;
  sections: UnitTheorySection[];
  goldenRules: string[];
}

export interface LearningNode {
  id: string;
  unitId: string;
  order: number;
  title: string;
  subtitle?: string;
  type: LearningNodeType;
  status: LearningNodeStatus;
  stars: number; // 0 to 3 stars
  icon: string;
  lanePosition: NodeLanePosition;
  expReward: number;
  estimatedMinutes: number;
  isClaimed?: boolean; // For reward chests
  bitsReward?: number; // For reward chests
  gameTypeLabel?: string; // e.g., "🎮 Videojuego Arcade", "🎮 Laberinto 2D"
  isVideoGame?: boolean;
  theorySlides?: TheorySlide[];
}

export interface LearningUnit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  moduleBadge: string;
  icon?: string;
  progressPercentage: number;
  nodes: LearningNode[];
  theoryGuide?: UnitTheoryGuide;
}

