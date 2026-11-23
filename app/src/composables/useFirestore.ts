/**
 * Firestore Composable with Spark Plan ($0 Cost) Optimization
 *
 * Implements:
 * 1. In-Memory Reactive Cache with configurable TTL (Time-To-Live)
 * 2. Automatic passive heart regeneration (1 heart every 4 hours)
 * 3. Fallback Seed Data for offline/demo/development execution
 * 4. Minimized reads and batched writes
 */

import { ref } from 'vue';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  runTransaction,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  UserProfile,
  UserGamificationState,
  LearningUnit,
  LeagueLeaderboardEntry,
  LeagueDivision,
  ShopItem,
  Badge,
  GAMIFICATION_RULES,
  calculateStreakMultiplier,
  ShopItemCode,
  DailyGoalType,
  Organization,
  OrganizationPlan,
} from '../types/gamification';
import { Exercise, LessonSessionSummary } from '../types/exercises';
import {
  buildLearningUnit,
  buildAllLearningUnits,
  LESSON_EXERCISES_MAP,
  getExercisesByIds,
} from '../data/curriculum';
import { getSuriImage } from '../utils/suriAssets';
import {
  applyStreakTransition,
  computeDynamicBadges,
  computeLeagueFromXp,
  computeLessonOutcome,
  computePassiveHeartRefill,
} from '../utils/gamificationEngine';

// ==========================================
// IN-MEMORY TTL CACHE ENGINE
// ==========================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  const isFresh = Date.now() - entry.timestamp < ttlMs;
  if (!isFresh) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// TTL Durations (ms)
const TTL_STATIC_CONTENT = 1000 * 60 * 60; // 1 hour for lessons, units, shop
const TTL_LEADERBOARD = 1000 * 60 * 5; // 5 minutes for leaderboard
const TTL_USER_STATE = 1000 * 60 * 2; // 2 minutes for user state

// ==========================================
// SEED FALLBACK DATA (For Initial Setup & Offline)
// ==========================================
const SEED_LEARNING_UNITS: LearningUnit[] = [
  {
    id: 'unit_01',
    unitNumber: 1,
    title: 'Unidad 1: Anatomía de la Trampa',
    description: 'Identifica remitentes falsos y enlaces sospechosos',
    moduleBadge: 'Módulo Básico',
    progressPercentage: 45,
    nodes: [
      {
        id: 'lesson_01',
        unitId: 'unit_01',
        order: 1,
        title: 'Señales Clave',
        subtitle: 'Fundamentos de detección visual',
        type: 'lesson',
        status: 'completed',
        stars: 3,
        icon: 'check',
        lanePosition: 'left',
        expReward: 15,
        estimatedMinutes: 3,
      },
      {
        id: 'lesson_02',
        unitId: 'unit_01',
        order: 2,
        title: 'Scanner de Phishing',
        subtitle: 'Test de Phishing Visual en bandeja',
        type: 'lesson',
        status: 'active',
        stars: 0,
        icon: 'radar',
        lanePosition: 'center',
        expReward: 15,
        estimatedMinutes: 3,
      },
      {
        id: 'chest_01',
        unitId: 'unit_01',
        order: 3,
        title: 'Cofre Alerta',
        subtitle: 'Recompensa de la Madriguera',
        type: 'reward_chest',
        status: 'active',
        stars: 0,
        icon: 'inventory_2',
        lanePosition: 'right',
        expReward: 0,
        estimatedMinutes: 1,
        isClaimed: false,
        bitsReward: 50,
      },
      {
        id: 'lesson_03',
        unitId: 'unit_01',
        order: 4,
        title: 'Bóveda Claves',
        subtitle: 'Construcción y fuerza bruta',
        type: 'lesson',
        status: 'locked',
        stars: 0,
        icon: 'lock',
        lanePosition: 'center',
        expReward: 15,
        estimatedMinutes: 4,
      },
      {
        id: 'lesson_04',
        unitId: 'unit_01',
        order: 5,
        title: 'Wi-Fi Fantasma',
        subtitle: 'Redes gemelas y puntos trampa',
        type: 'lesson',
        status: 'locked',
        stars: 0,
        icon: 'wifi_tethering_off',
        lanePosition: 'left',
        expReward: 15,
        estimatedMinutes: 4,
      },
    ],
  },
];

const SEED_EXERCISES_LESSON_02: Exercise[] = [
  {
    id: 'ex_inbox_01',
    type: 'inbox_simulator',
    title: 'Misión de Detección',
    instruction: '¿Es un correo auténtico o una trampa oculta?',
    suriPrompt: 'Revisa con lupa las letras "0" sustituyendo a la "o" en el dominio oficial.',
    suriPoseInitial: 'idea',
    header: {
      visualSender: 'Recursos Humanos - Nómina Oficial',
      actualSender: 'soporte@banc0-alert.xyz',
      isSenderSpoofed: true,
      spfStatus: 'fail',
      dkimStatus: 'fail',
      receivedTime: '10:42 AM',
    },
    subject: '⚠️ URGENTE: Actualización para nómina',
    isUrgentFlag: true,
    bodyText:
      'Estimado colaborador, hemos detectado una inconsistencia en su cuenta bancaria para el abono salarial de este mes. Su pago ha sido temporalmente retenido.',
    actionButtonText: '[Verificar mis datos bancarios aquí]',
    link: {
      displayedText: 'http://phish-site.banc0-alert.xyz/login',
      actualDestinationUrl: 'http://phish-site.banc0-alert.xyz/login',
      isSuspicious: true,
      inspectWarning: 'Dominio engañoso banc0-alert.xyz con HTTP no seguro',
    },
    footnoteWarning: 'Límite perentorio: menos de 24 horas',
    correctVerdict: 'phish',
    clues: [
      'Remitente banc0 con cero',
      'Sentido de urgencia artificial con amenaza de retención de nómina',
      'Enlace sin HTTPS con dominio no corporativo',
    ],
    feedback: {
      empathy: 'Los atacantes siempre usan la urgencia laboral para provocar pánico.',
      technicalIndicator:
        'El remitente real es soporte@banc0-alert.xyz (con un cero) y el SPF falló.',
      preventiveTip:
        'Nunca ingreses credenciales bancarias desde un enlace de correo. Consulta directamente a RRHH.',
    },
  },
  {
    id: 'ex_url_01',
    type: 'url_inspector',
    title: 'Inspector de Perímetro',
    instruction: 'Toca el bloque de la URL que contiene la trampa maliciosa:',
    suriPrompt: 'Mira atentamente la estructura del dominio principal y su terminación.',
    suriPoseInitial: 'shield',
    rawUrl: 'https://login.banco-seguro.com.cuentas-validar.xyz/auth',
    segments: [
      { id: 'seg_1', type: 'protocol', text: 'https://', isSuspicious: false },
      { id: 'seg_2', type: 'subdomain', text: 'login.banco-seguro.com.', isSuspicious: false },
      {
        id: 'seg_3',
        type: 'root_domain',
        text: 'cuentas-validar.xyz',
        isSuspicious: true,
        annotation: '¡Trampa de subdominio! El verdadero dominio es cuentas-validar.xyz, no banco-seguro.com',
      },
      { id: 'seg_4', type: 'path', text: '/auth', isSuspicious: false },
    ],
    maliciousSegmentId: 'seg_3',
    attackTechnique: 'deceptive_subdomain',
    hint: 'El dominio real es el que está inmediatamente a la izquierda del primer "/" o de la extensión final.',
    feedback: {
      empathy: 'Es muy común confundir los subdominios que imitan marcas legítimas.',
      technicalIndicator:
        'El dominio raíz real es "cuentas-validar.xyz", camuflado tras un subdominio extenso.',
      preventiveTip:
        'Revisa siempre el bloque final antes de la primera barra diagonal para ver la verdadera identidad del sitio.',
    },
  },
  {
    id: 'ex_pwd_01',
    type: 'password_builder',
    title: 'Bóveda de Resistencia',
    instruction: 'Construye una clave que resista más de 400 años de ataque por fuerza bruta:',
    suriPrompt: 'Combina palabras inesperadas, números y caracteres especiales centinela.',
    suriPoseInitial: 'idle',
    targetCrackYears: 400,
    minEntropyRequired: 65,
    contextScenario: 'Protege las credenciales de administración del correo corporativo',
    availableTokens: [
      { id: 't_1', text: 'Admin', label: 'Admin', category: 'predictable_pattern', entropyContributionBits: 5 },
      { id: 't_2', text: '2026!', label: '2026!', category: 'predictable_pattern', entropyContributionBits: 10 },
      { id: 't_3', text: 'Suricato', label: 'Suricato', category: 'passphrase_word', entropyContributionBits: 20 },
      { id: 't_4', text: '#Centinela', label: '#Centinela', category: 'passphrase_word', entropyContributionBits: 25 },
      { id: 't_5', text: 'Desierto$', label: 'Desierto$', category: 'passphrase_word', entropyContributionBits: 25 },
      { id: 't_6', text: '984', label: '984', category: 'number', entropyContributionBits: 12 },
      { id: 't_7', text: '&Vigilante', label: '&Vigilante', category: 'passphrase_word', entropyContributionBits: 26 },
    ],
    feedback: {
      empathy: 'Las contraseñas cortas o con años familiares son descifradas en microsegundos.',
      technicalIndicator:
        'Una contraseña de más de 16 caracteres compuesta por frases tiene entropía superior a 70 bits.',
      preventiveTip:
        'Utiliza frases de contraseña (Passphrases) largas y fáciles de recordar en lugar de palabras sueltas.',
    },
  },
];



const SEED_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'shop_streak_freeze',
    code: 'streak_freeze',
    title: 'Congelador de Racha',
    description: 'Protege tu racha diaria si olvidas practicar un día.',
    costBits: 200,
    icon: 'ac_unit',
    category: 'protection',
  },
  {
    id: 'shop_heart_refill',
    code: 'heart_refill',
    title: 'Recarga Completa de Vidas',
    description: 'Restaura todas tus vidas para no detener tu entrenamiento.',
    costBits: 150,
    icon: 'favorite',
    category: 'consumable',
  },
  {
    id: 'shop_xp_boost',
    code: 'xp_boost_2x',
    title: 'Potenciador de XP (2X)',
    description: 'Doble de XP durante tus próximas 3 lecciones.',
    costBits: 100,
    icon: 'security',
    category: 'consumable',
  },
  {
    id: 'shop_suripro',
    code: 'suripro_monthly',
    title: 'SuriPro Centinela',
    description: 'Vidas infinitas, simulador avanzado y reportes de seguridad para tu equipo.',
    costBits: 0,
    icon: 'stars',
    category: 'subscription',
    isSubscription: true,
  },
];

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeLocalDateString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      return val.trim();
    }
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) {
      return getLocalDateString(parsed);
    }
    return '';
  }
  if (val?.toDate && typeof val.toDate === 'function') {
    return getLocalDateString(val.toDate());
  }
  if (typeof val?.seconds === 'number') {
    return getLocalDateString(new Date(val.seconds * 1000));
  }
  return '';
}

// ==========================================
// COMPOSABLE DEFINITION
// ==========================================
export function useFirestore() {
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * Helper to compute and apply passive heart refills based on timestamp
   */
  function applyPassiveHeartRegeneration(
    state: UserGamificationState,
    isPro: boolean
  ): { state: UserGamificationState; hasUpdated: boolean } {
    const refill = computePassiveHeartRefill(
      state.hearts,
      state.lastHeartRefill,
      isPro
    );
    if (refill.hasUpdated) {
      state.hearts = refill.hearts;
      state.lastHeartRefill = refill.lastHeartRefill;
      return { state, hasUpdated: true };
    }
    return { state, hasUpdated: false };
  }

  /**
   * Ensure user document exists in /users/{uid} with zero baseline metrics on first Google login
   */
  async function ensureUserDocument(user: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  }): Promise<UserProfile> {
    const uid = user.uid;
    const cacheKey = `user_profile_${uid}`;
    const userRef = doc(db, 'users', uid);

    try {
      isLoading.value = true;
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString());
        const lastHeartRefill = data.lastHeartRefill?.toDate ? data.lastHeartRefill.toDate().toISOString() : (data.lastHeartRefill || new Date().toISOString());
        const completedLessons = Array.isArray(data.completedLessons) ? data.completedLessons : [];
        const todayStr = getLocalDateString();
        let streakDays = typeof data.streakDays === 'number' ? data.streakDays : 0;
        let lastActiveDate = normalizeLocalDateString(data.lastActiveDate);
        let activeDates: string[] = Array.isArray(data.activeDates) ? data.activeDates : [];

        // If user already completed lessons previously while streakDays was stuck at 0, repair it for today
        const needsStreakRepair = completedLessons.length > 0 && streakDays === 0;
        if (needsStreakRepair) {
          streakDays = 1;
          lastActiveDate = todayStr;
          activeDates = Array.from(new Set([...activeDates, todayStr]));
        }

        const xpValue = typeof data.xp === 'number' ? data.xp : 0;
        const computedLeague = data.currentLeague || computeLeagueFromXp(xpValue).name;
        const profileData: UserProfile = {
          uid,
          displayName: data.displayName || user.displayName || 'Centinela',
          email: data.email || user.email || '',
          avatarUrl: data.avatarUrl || user.photoURL || 'suri-idle.png',
          photoURL: user.photoURL || data.avatarUrl || null,
          hearts: typeof data.hearts === 'number' ? data.hearts : 5,
          lastHeartRefill,
          xp: xpValue,
          bits: typeof data.bits === 'number' ? data.bits : 0,
          streakDays,
          hasStreakFreeze: typeof data.hasStreakFreeze === 'boolean' ? data.hasStreakFreeze : false,
          xpBoostMultiplier: typeof data.xpBoostMultiplier === 'number' ? data.xpBoostMultiplier : 1,
          xpBoostLessonsRemaining: typeof data.xpBoostLessonsRemaining === 'number' ? data.xpBoostLessonsRemaining : 0,
          failedExerciseIds: Array.isArray(data.failedExerciseIds) ? data.failedExerciseIds : [],
          dailyLessonsCompleted: typeof data.dailyLessonsCompleted === 'number' ? data.dailyLessonsCompleted : 0,
          dailyLessonsDate: typeof data.dailyLessonsDate === 'string' ? data.dailyLessonsDate : '',
          lessonStars: data.lessonStars && typeof data.lessonStars === 'object' ? data.lessonStars : {},
          diagnosticProfile: data.diagnosticProfile || null,
          notificationsEnabled: typeof data.notificationsEnabled === 'boolean' ? data.notificationsEnabled : true,
          currentLeague: computedLeague,
          accuracyRate: typeof data.accuracyRate === 'number' ? data.accuracyRate : 0,
          completedLessons,
          claimedRewards: Array.isArray(data.claimedRewards) ? data.claimedRewards : [],
          isPro: typeof data.isPro === 'boolean' ? data.isPro : false,
          companyName: data.companyName || '',
          organizationId: data.organizationId || undefined,
          dailyGoal: (data.dailyGoal as DailyGoalType) || 'constante',
          createdAt,
          lastLoginAt: new Date().toISOString(),
          role: data.role || 'individual',
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate().toISOString() : (data.suspendedAt || null),
          lastActiveDate,
          activeDates,
        };

        // Asynchronously update lastLoginAt (without clobbering lastActiveDate unless repairing streak)
        updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          ...(needsStreakRepair ? { streakDays: 1, lastActiveDate: todayStr, activeDates } : {}),
          ...(user.photoURL && (!data.avatarUrl || data.avatarUrl === 'suri-idle.png') ? { avatarUrl: user.photoURL } : {}),
        }).catch(() => {});

        setCached(cacheKey, profileData);
        localStorage.setItem(cacheKey, JSON.stringify(profileData));
        return profileData;
      } else {
        // Document does not exist: create mandatory zero-baseline initial user document
        const avatarUrl = user.photoURL || 'suri-idle.png';
        const initialDocData = {
          displayName: user.displayName || 'Centinela',
          email: user.email || '',
          avatarUrl,
          hearts: 5,
          lastHeartRefill: serverTimestamp(),
          xp: 0,
          bits: 0,
          streakDays: 0,
          hasStreakFreeze: false,
          xpBoostMultiplier: 1,
          xpBoostLessonsRemaining: 0,
          failedExerciseIds: [],
          dailyLessonsCompleted: 0,
          dailyLessonsDate: '',
          lessonStars: {},
          diagnosticProfile: null,
          notificationsEnabled: true,
          lastActiveDate: '',
          activeDates: [],
          currentLeague: 'Bronce',
          accuracyRate: 0,
          completedLessons: [],
          claimedRewards: [],
          isPro: false,
          companyName: '',
          dailyGoal: 'constante' as DailyGoalType,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          role: 'individual' as const,
          status: 'active' as const,
        };

        await setDoc(userRef, initialDocData);

        const newProfile: UserProfile = {
          uid,
          displayName: initialDocData.displayName,
          email: initialDocData.email,
          avatarUrl,
          photoURL: user.photoURL || null,
          hearts: 5,
          lastHeartRefill: new Date().toISOString(),
          xp: 0,
          bits: 0,
          streakDays: 0,
          hasStreakFreeze: false,
          xpBoostMultiplier: 1,
          xpBoostLessonsRemaining: 0,
          failedExerciseIds: [],
          dailyLessonsCompleted: 0,
          dailyLessonsDate: '',
          lessonStars: {},
          diagnosticProfile: null,
          notificationsEnabled: true,
          currentLeague: 'Bronce',
          accuracyRate: 0,
          completedLessons: [],
          claimedRewards: [],
          isPro: false,
          companyName: initialDocData.companyName,
          dailyGoal: initialDocData.dailyGoal,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          role: 'individual',
          status: 'active',
          suspendedAt: null,
          lastActiveDate: '',
          activeDates: [],
        };

        setCached(cacheKey, newProfile);
        localStorage.setItem(cacheKey, JSON.stringify(newProfile));
        return newProfile;
      }
    } catch (err) {
      console.warn('[useFirestore] Error in ensureUserDocument:', err);
      const fallbackProfile: UserProfile = {
        uid,
        displayName: user.displayName || 'Centinela',
        email: user.email || '',
        avatarUrl: user.photoURL || 'suri-idle.png',
        photoURL: user.photoURL || null,
        hearts: 5,
        lastHeartRefill: new Date().toISOString(),
        xp: 0,
        bits: 0,
        streakDays: 0,
        currentLeague: 'Bronce',
        accuracyRate: 0,
        completedLessons: [],
        claimedRewards: [],
        isPro: false,
        companyName: '',
        dailyGoal: 'constante',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'individual',
        status: 'active',
        suspendedAt: null,
        lastActiveDate: '',
        activeDates: [],
      };
      setCached(cacheKey, fallbackProfile);
      return fallbackProfile;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch User Profile with Cache and LocalStorage fallback
   */
  async function getUserProfile(uid: string): Promise<UserProfile> {
    const cacheKey = `user_profile_${uid}`;
    const cached = getCached<UserProfile>(cacheKey, TTL_USER_STATE);
    if (cached) return cached;

    try {
      isLoading.value = true;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString());
        const lastHeartRefill = data.lastHeartRefill?.toDate ? data.lastHeartRefill.toDate().toISOString() : (data.lastHeartRefill || new Date().toISOString());

        const xpVal = typeof data.xp === 'number' ? data.xp : 0;
        const profileData: UserProfile = {
          uid,
          displayName: data.displayName || 'Centinela',
          email: data.email || '',
          avatarUrl: data.avatarUrl || 'suri-idle.png',
          photoURL: data.photoURL || data.avatarUrl || null,
          hearts: typeof data.hearts === 'number' ? data.hearts : 5,
          lastHeartRefill,
          xp: xpVal,
          bits: typeof data.bits === 'number' ? data.bits : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
          currentLeague: data.currentLeague || computeLeagueFromXp(xpVal).name,
          accuracyRate: typeof data.accuracyRate === 'number' ? data.accuracyRate : 0,
          completedLessons: Array.isArray(data.completedLessons) ? data.completedLessons : [],
          claimedRewards: Array.isArray(data.claimedRewards) ? data.claimedRewards : [],
          isPro: typeof data.isPro === 'boolean' ? data.isPro : false,
          hasStreakFreeze: typeof data.hasStreakFreeze === 'boolean' ? data.hasStreakFreeze : false,
          xpBoostMultiplier: typeof data.xpBoostMultiplier === 'number' ? data.xpBoostMultiplier : 1,
          xpBoostLessonsRemaining: typeof data.xpBoostLessonsRemaining === 'number' ? data.xpBoostLessonsRemaining : 0,
          failedExerciseIds: Array.isArray(data.failedExerciseIds) ? data.failedExerciseIds : [],
          dailyLessonsCompleted: typeof data.dailyLessonsCompleted === 'number' ? data.dailyLessonsCompleted : 0,
          dailyLessonsDate: typeof data.dailyLessonsDate === 'string' ? data.dailyLessonsDate : '',
          lessonStars: data.lessonStars && typeof data.lessonStars === 'object' ? data.lessonStars : {},
          diagnosticProfile: data.diagnosticProfile || null,
          notificationsEnabled: typeof data.notificationsEnabled === 'boolean' ? data.notificationsEnabled : true,
          companyName: data.companyName || '',
          organizationId: data.organizationId || undefined,
          dailyGoal: (data.dailyGoal as DailyGoalType) || 'constante',
          createdAt,
          lastLoginAt: new Date().toISOString(),
          role: data.role || 'individual',
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate().toISOString() : (data.suspendedAt || null),
          lastActiveDate: data.lastActiveDate?.toDate ? data.lastActiveDate.toDate().toISOString() : (data.lastActiveDate || data.lastLoginAt || new Date().toISOString()),
          activeDates: Array.isArray(data.activeDates) ? data.activeDates : [],
        };

        setCached(cacheKey, profileData);
        localStorage.setItem(cacheKey, JSON.stringify(profileData));
        return profileData;
      }
    } catch (err) {
      console.warn('[useFirestore] Offline or Firestore read error, checking local fallback:', err);
    } finally {
      isLoading.value = false;
    }

    // Fallback: check localStorage or create initial default with 0 baseline
    const local = localStorage.getItem(cacheKey);
    if (local) {
      const data = JSON.parse(local) as UserProfile;
      setCached(cacheKey, data);
      return data;
    }

    const defaultProfile: UserProfile = {
      uid,
      email: '',
      displayName: 'Centinela',
      avatarUrl: 'suri-idle.png',
      photoURL: null,
      companyName: '',
      isPro: false,
      hasStreakFreeze: false,
      proExpiresAt: null,
      dailyGoal: 'constante',
      currentLeague: 'Bronce',
      accuracyRate: 0,
      completedLessons: [],
      claimedRewards: [],
      hearts: 5,
      lastHeartRefill: new Date().toISOString(),
      xp: 0,
      bits: 0,
      streakDays: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      role: 'individual',
      status: 'active',
    };

    setCached(cacheKey, defaultProfile);
    localStorage.setItem(cacheKey, JSON.stringify(defaultProfile));
    return defaultProfile;
  }

  /**
   * Save or Update User Profile
   */
  async function saveUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const cacheKey = `user_profile_${uid}`;
    const current = await getUserProfile(uid);
    const updated = { ...current, ...updates, lastLoginAt: new Date().toISOString() };

    setCached(cacheKey, updated);
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.warn('[useFirestore] Could not sync user profile to remote Firestore (queued locally):', err);
    }
  }

  /**
   * Fetch User Gamification State with Passive Heart Regeneration
   */
  async function getGamificationState(uid: string, isPro = false): Promise<UserGamificationState> {
    const cacheKey = `user_gamification_${uid}`;
    const cached = getCached<UserGamificationState>(cacheKey, TTL_USER_STATE);

    let state: UserGamificationState;
    let needsStreakSync = false;

    if (cached) {
      state = cached;
    } else {
      try {
        isLoading.value = true;
        // Priority: read from /users/{uid} first as per consolidated Spark schema
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          const xp = typeof data.xp === 'number' ? data.xp : 0;
          const bits = typeof data.bits === 'number' ? data.bits : 0;
          const completedLessons = Array.isArray(data.completedLessons) ? data.completedLessons : [];
          let streakDays = typeof data.streakDays === 'number' ? data.streakDays : 0;
          let lastActiveDate = normalizeLocalDateString(data.lastActiveDate);
          let activeDates: string[] = Array.isArray(data.activeDates) ? data.activeDates : [];
          const todayStr = getLocalDateString();

          // Repair streak if user already completed lessons while streakDays was stuck at 0
          if (completedLessons.length > 0 && streakDays === 0) {
            streakDays = 1;
            lastActiveDate = todayStr;
            activeDates = Array.from(new Set([...activeDates, todayStr]));
            needsStreakSync = true;
          } else if (streakDays > 0 && activeDates.length === 0) {
            // Backfill activeDates based on streakDays and lastActiveDate
            const anchorDate = lastActiveDate ? new Date(`${lastActiveDate}T12:00:00`) : new Date();
            const backfilled: string[] = [];
            for (let i = 0; i < Math.min(streakDays, 14); i++) {
              const d = new Date(anchorDate);
              d.setDate(d.getDate() - i);
              backfilled.push(getLocalDateString(d));
            }
            activeDates = Array.from(new Set(backfilled));
            if (!lastActiveDate) lastActiveDate = todayStr;
            needsStreakSync = true;
          }

          const hearts = typeof data.hearts === 'number' ? data.hearts : 5;
          const accuracyRate = typeof data.accuracyRate === 'number' ? data.accuracyRate : 0;
          const currentLeague = data.currentLeague || computeLeagueFromXp(xp).name;
          const lastHeartRefill = data.lastHeartRefill?.toDate
            ? data.lastHeartRefill.toDate().toISOString()
            : (data.lastHeartRefill || new Date().toISOString());
          const level = Math.floor(xp / 400) + 1;
          const levelTitle = level === 1
            ? 'Centinela Nivel 1 · Recluta de Perímetro'
            : `Centinela Nivel ${level} · Vigilante de Manada`;

          state = {
            hearts,
            maxHearts: GAMIFICATION_RULES.HEARTS.MAX_CAPACITY,
            lastHeartRefill,
            bits,
            xp,
            level,
            levelTitle,
            currentLeague,
            streakDays,
            lastActiveDate,
            activeDates,
            hasStreakFreeze: !!data.hasStreakFreeze,
            accuracyPercentage: accuracyRate,
            accuracyRate,
            totalLessonsCompleted: completedLessons.length,
            completedLessons,
            claimedRewards: Array.isArray(data.claimedRewards) ? data.claimedRewards : [],
            failedExerciseIds: Array.isArray(data.failedExerciseIds) ? data.failedExerciseIds : [],
            dailyLessonsCompleted: typeof data.dailyLessonsCompleted === 'number' ? data.dailyLessonsCompleted : 0,
            dailyLessonsDate: typeof data.dailyLessonsDate === 'string' ? data.dailyLessonsDate : '',
            lessonStars: data.lessonStars && typeof data.lessonStars === 'object' ? data.lessonStars : {},
            xpBoostMultiplier: data.xpBoostMultiplier || 1,
            xpBoostLessonsRemaining: data.xpBoostLessonsRemaining || 0,
          };
        } else {
          // Zero-baseline default for clean new user session
          state = {
            hearts: 5,
            maxHearts: GAMIFICATION_RULES.HEARTS.MAX_CAPACITY,
            lastHeartRefill: new Date().toISOString(),
            bits: 0,
            xp: 0,
            level: 1,
            levelTitle: 'Centinela Nivel 1 · Recluta de Perímetro',
            currentLeague: 'Bronce',
            streakDays: 0,
            lastActiveDate: '',
            activeDates: [],
            hasStreakFreeze: false,
            accuracyPercentage: 0,
            accuracyRate: 0,
            totalLessonsCompleted: 0,
            completedLessons: [],
            claimedRewards: [],
            failedExerciseIds: [],
            dailyLessonsCompleted: 0,
            dailyLessonsDate: '',
            lessonStars: {},
            xpBoostMultiplier: 1,
            xpBoostLessonsRemaining: 0,
          };
        }
      } catch (err) {
        console.warn('[useFirestore] Falling back to local zero gamification state:', err);
        const local = localStorage.getItem(cacheKey);
        state = local
          ? JSON.parse(local)
          : {
              hearts: 5,
              maxHearts: GAMIFICATION_RULES.HEARTS.MAX_CAPACITY,
              lastHeartRefill: new Date().toISOString(),
              bits: 0,
              xp: 0,
              level: 1,
              levelTitle: 'Centinela Nivel 1 · Recluta de Perímetro',
              currentLeague: 'Bronce',
              streakDays: 0,
              lastActiveDate: '',
              activeDates: [],
              hasStreakFreeze: false,
              accuracyPercentage: 0,
              accuracyRate: 0,
              totalLessonsCompleted: 0,
              completedLessons: [],
              claimedRewards: [],
              failedExerciseIds: [],
              dailyLessonsCompleted: 0,
              dailyLessonsDate: '',
              lessonStars: {},
              xpBoostMultiplier: 1,
              xpBoostLessonsRemaining: 0,
            };
      } finally {
        isLoading.value = false;
      }
    }

    // Apply passive regeneration
    const { state: updatedState, hasUpdated } = applyPassiveHeartRegeneration(state, isPro);

    setCached(cacheKey, updatedState);
    localStorage.setItem(cacheKey, JSON.stringify(updatedState));

    if (hasUpdated || needsStreakSync) {
      // Background async update to Firestore without blocking UI
      try {
        const userRef = doc(db, 'users', uid);
        updateDoc(userRef, {
          hearts: updatedState.hearts,
          lastHeartRefill: updatedState.lastHeartRefill,
          streakDays: updatedState.streakDays,
          lastActiveDate: updatedState.lastActiveDate,
          activeDates: updatedState.activeDates || [],
        }).catch(() => {});
      } catch {}
    }

    return updatedState;
  }

  /**
   * Save or Update Gamification State
   */
  async function saveGamificationState(
    uid: string,
    updates: Partial<UserGamificationState>
  ): Promise<void> {
    const cacheKey = `user_gamification_${uid}`;
    const current = await getGamificationState(uid);
    const updated = { ...current, ...updates };

    setCached(cacheKey, updated);
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        hearts: updated.hearts,
        lastHeartRefill: updated.lastHeartRefill,
        bits: updated.bits,
        xp: updated.xp,
        streakDays: updated.streakDays,
        currentLeague: updated.currentLeague || 'Bronce',
        accuracyRate: updated.accuracyRate ?? updated.accuracyPercentage ?? 0,
        completedLessons: updated.completedLessons || [],
        claimedRewards: updated.claimedRewards || [],
        lastActiveDate: updated.lastActiveDate,
        activeDates: updated.activeDates || [],
        hasStreakFreeze: updated.hasStreakFreeze,
        xpBoostMultiplier: updated.xpBoostMultiplier ?? 1,
        xpBoostLessonsRemaining: updated.xpBoostLessonsRemaining ?? 0,
        failedExerciseIds: updated.failedExerciseIds || [],
        dailyLessonsCompleted: updated.dailyLessonsCompleted ?? 0,
        dailyLessonsDate: updated.dailyLessonsDate || '',
        lessonStars: updated.lessonStars || {},
      }, { merge: true });
    } catch (err) {
      console.warn('[useFirestore] Firestore saveGamificationState queued locally:', err);
    }
  }

  /**
   * Fetch Learning Units & Nodes (All 6 Courses)
   */
  async function getLearningUnits(
    completedLessons: string[] = [],
    claimedRewards: string[] = [],
    lessonStars: Record<string, number> = {}
  ): Promise<LearningUnit[]> {
    return buildAllLearningUnits(completedLessons, claimedRewards, lessonStars);
  }

  /**
   * Fetch Exercises for a specific Lesson (or targeted Error Review Hub)
   */
  async function getLessonExercises(lessonId: string, failedIds: string[] = []): Promise<Exercise[]> {
    if (lessonId === 'error-review') {
      const targeted = getExercisesByIds(failedIds);
      if (targeted.length > 0) {
        return targeted.slice(0, 5);
      }
      return [
        ...(LESSON_EXERCISES_MAP['inbox-scanner-1']?.slice(0, 2) || []),
        ...(LESSON_EXERCISES_MAP['url-inspector-1']?.slice(0, 1) || []),
      ];
    }

    // Legacy mapping support:
    let resolvedId = lessonId;
    if (lessonId === 'lesson_01') resolvedId = 'inbox-scanner-1';
    if (lessonId === 'lesson_02') resolvedId = 'url-inspector-1';
    if (lessonId === 'lesson_03') resolvedId = 'chat-urgency-1';
    if (lessonId === 'lesson_04') resolvedId = 'attachment-phish-1';
    if (lessonId === 'lesson_05') resolvedId = 'password-builder-1';
    if (lessonId === 'lesson_06') resolvedId = 'permission-swipe-1';
    if (lessonId === 'lesson_07') resolvedId = 'rapid-triage-1';

    if (LESSON_EXERCISES_MAP[resolvedId]) {
      return LESSON_EXERCISES_MAP[resolvedId];
    }
    return LESSON_EXERCISES_MAP['inbox-scanner-1'] || SEED_EXERCISES_LESSON_02;
  }

  /**
   * Normalize league names between localized Spanish and internal keys
   */
  function normalizeLeagueName(league: string = 'Bronce'): string {
    const l = (league || 'Bronce').toLowerCase();
    if (l.includes('bronce') || l === 'bronze') return 'Bronce';
    if (l.includes('plata') || l === 'silver') return 'Plata';
    if (l.includes('oro') || l === 'gold') return 'Oro';
    if (l.includes('diamante') || l === 'diamond') return 'Diamante';
    if (l.includes('supremo') || l === 'sentinel') return 'Supremo';
    return league.charAt(0).toUpperCase() + league.slice(1);
  }

  /**
   * Sort and process user docs from Firestore /users into ranked LeagueLeaderboardEntry
   * Resolves ties by:
   * 1. XP (descending)
   * 2. Accuracy rate (descending)
   * 3. Streak days (descending)
   */
  function processLeaderboardDocs(
    docs: any[],
    currentUserId?: string
  ): LeagueLeaderboardEntry[] {
    const list = [...docs];

    list.sort((a, b) => {
      const xpA = typeof a.xp === 'number' ? a.xp : 0;
      const xpB = typeof b.xp === 'number' ? b.xp : 0;
      if (xpB !== xpA) return xpB - xpA;

      const accA = typeof a.accuracyRate === 'number' ? a.accuracyRate : 0;
      const accB = typeof b.accuracyRate === 'number' ? b.accuracyRate : 0;
      if (accB !== accA) return accB - accA;

      const strA = typeof a.streakDays === 'number' ? a.streakDays : 0;
      const strB = typeof b.streakDays === 'number' ? b.streakDays : 0;
      return strB - strA;
    });

    return list.map((u, index) => {
      const rank = index + 1;
      const uid = u.id || u.uid || `user_${index}`;
      const isCurrentUser = !!currentUserId && (uid === currentUserId || u.id === currentUserId);

      let avatarUrl = u.avatarUrl || u.photoURL || '';
      if (
        !avatarUrl ||
        avatarUrl === 'suri-idle.png' ||
        (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:') && !avatarUrl.startsWith('/'))
      ) {
        avatarUrl = getSuriImage('idle');
      }

      return {
        id: `lb_${uid}`,
        userId: uid,
        displayName: u.displayName || 'Centinela Anónimo',
        avatarUrl,
        xp: typeof u.xp === 'number' ? u.xp : 0,
        streakDays: typeof u.streakDays === 'number' ? u.streakDays : 0,
        accuracyRate: typeof u.accuracyRate === 'number' ? u.accuracyRate : 0,
        rank,
        isCurrentUser,
        trend: 'same' as const,
        zone: rank <= 5 ? ('promotion' as const) : ('safe' as const),
      };
    });
  }

  /**
   * Fetch Leaderboard for League directly from real users in Firestore (/users).
   * Absolutely NO mock or static bot data.
   */
  async function getLeaderboard(
    league: string = 'Bronce',
    currentUser?: string | { uid: string; displayName?: string; avatarUrl?: string; xp?: number }
  ): Promise<LeagueLeaderboardEntry[]> {
    const currentUserId = typeof currentUser === 'string' ? currentUser : currentUser?.uid;
    const leagueName = normalizeLeagueName(league);
    const usersCol = collection(db, 'users');

    try {
      // Primary attempt: indexed composite query (currentLeague == leagueName, orderBy xp DESC)
      const q = query(
        usersCol,
        where('currentLeague', '==', leagueName),
        orderBy('xp', 'desc'),
        limit(30)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return processLeaderboardDocs(docs, currentUserId);
    } catch (err: any) {
      console.warn('[useFirestore] Primary leaderboard query fallback:', err?.message || err);
      try {
        // Fallback: where clause without orderBy, sorted in-memory with tiebreakers
        const fallbackQ = query(
          usersCol,
          where('currentLeague', '==', leagueName),
          limit(50)
        );
        const snap = await getDocs(fallbackQ);
        let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Fallback if users in initial database have lowercase or default league
        if (docs.length === 0 && leagueName === 'Bronce') {
          const allSnap = await getDocs(query(usersCol, limit(50)));
          docs = allSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u: any) => normalizeLeagueName(u.currentLeague || 'Bronce') === leagueName);
        }

        return processLeaderboardDocs(docs, currentUserId);
      } catch (fallbackErr) {
        console.error('[useFirestore] Final fallback error querying users collection:', fallbackErr);
        return [];
      }
    }
  }

  /**
   * Realtime reactive subscription to users collection for live Leaderboard updates
   */
  function subscribeToLeaderboard(
    league: string = 'Bronce',
    currentUserId: string | undefined,
    onUpdate: (entries: LeagueLeaderboardEntry[]) => void
  ): () => void {
    const leagueName = normalizeLeagueName(league);
    const usersCol = collection(db, 'users');

    // Subscribe to users collection for this league
    const q = query(
      usersCol,
      where('currentLeague', '==', leagueName),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (docs.length === 0 && leagueName === 'Bronce') {
          getDocs(query(usersCol, limit(50)))
            .then((allSnap) => {
              const matched = allSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((u: any) => normalizeLeagueName(u.currentLeague || 'Bronce') === leagueName);
              onUpdate(processLeaderboardDocs(matched, currentUserId));
            })
            .catch(() => {
              onUpdate(processLeaderboardDocs(docs, currentUserId));
            });
          return;
        }
        onUpdate(processLeaderboardDocs(docs, currentUserId));
      },
      (error) => {
        console.warn('[useFirestore] Leaderboard snapshot error:', error);
      }
    );

    return unsubscribe;
  }

  // ==========================================
  // MULTI-TENANT ORGANIZATIONS / PYMES
  // ==========================================

  /**
   * Fetch Organization details by ID
   */
  async function getOrganization(orgId: string): Promise<Organization | null> {
    try {
      const orgRef = doc(db, 'organizations', orgId);
      const snap = await getDoc(orgRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: snap.id,
          name: data.name || 'Empresa',
          adminEmail: data.adminEmail || '',
          adminUid: data.adminUid || '',
          plan: data.plan || 'micro_pyme',
          maxSeats: typeof data.maxSeats === 'number' ? data.maxSeats : 10,
          usedSeats: typeof data.usedSeats === 'number' ? data.usedSeats : 1,
          subscriptionStatus: data.subscriptionStatus || 'active',
          inviteCode: data.inviteCode || 'SURI01',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          industry: data.industry || 'Servicios PYME',
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
        };
      }
      return null;
    } catch (err) {
      console.warn('[useFirestore] Error fetching organization:', err);
      return null;
    }
  }

  /**
   * Find Organization by 6-character Invite Code
   */
  async function getOrganizationByInviteCode(inviteCode: string): Promise<Organization | null> {
    try {
      const cleanCode = inviteCode.trim().toUpperCase();
      const q = query(
        collection(db, 'organizations'),
        where('inviteCode', '==', cleanCode),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Empresa',
          adminEmail: data.adminEmail || '',
          adminUid: data.adminUid || '',
          plan: data.plan || 'micro_pyme',
          maxSeats: typeof data.maxSeats === 'number' ? data.maxSeats : 10,
          usedSeats: typeof data.usedSeats === 'number' ? data.usedSeats : 1,
          subscriptionStatus: data.subscriptionStatus || 'active',
          inviteCode: data.inviteCode || cleanCode,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          industry: data.industry || 'Servicios PYME',
        };
      }
      return null;
    } catch (err) {
      console.warn('[useFirestore] Error finding organization by code:', err);
      return null;
    }
  }

  /**
   * Fetch all members enrolled in an organization
   */
  async function getOrganizationMembers(orgId: string): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('organizationId', '==', orgId),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          displayName: data.displayName || 'Centinela',
          email: data.email || '',
          avatarUrl: data.avatarUrl || data.photoURL || getSuriImage('idle'),
          photoURL: data.photoURL || null,
          hearts: typeof data.hearts === 'number' ? data.hearts : 5,
          xp: typeof data.xp === 'number' ? data.xp : 0,
          bits: typeof data.bits === 'number' ? data.bits : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
          currentLeague: data.currentLeague || 'Bronce',
          accuracyRate: typeof data.accuracyRate === 'number' ? data.accuracyRate : 0,
          completedLessons: Array.isArray(data.completedLessons) ? data.completedLessons : [],
          claimedRewards: Array.isArray(data.claimedRewards) ? data.claimedRewards : [],
          isPro: typeof data.isPro === 'boolean' ? data.isPro : true,
          companyName: data.companyName || 'Empresa',
          organizationId: data.organizationId || orgId,
          dailyGoal: (data.dailyGoal as DailyGoalType) || 'constante',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : (data.lastLoginAt || new Date().toISOString()),
          role: data.role || 'sme_member',
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate().toISOString() : (data.suspendedAt || null),
          lastActiveDate: normalizeLocalDateString(data.lastActiveDate || data.lastLoginAt) || '',
          activeDates: Array.isArray(data.activeDates) ? data.activeDates : [],
        };
      });
    } catch (err) {
      console.warn('[useFirestore] Error getting organization members:', err);
      return [];
    }
  }

  /**
   * Join an organization using an Invite Code
   */
  async function joinOrganizationWithCode(
    uid: string,
    inviteCode: string
  ): Promise<{ success: boolean; message: string; organization?: Organization }> {
    try {
      const org = await getOrganizationByInviteCode(inviteCode);
      if (!org) {
        return { success: false, message: 'Código de invitación no encontrado. Verifica con tu administrador.' };
      }

      const orgRef = doc(db, 'organizations', org.id);
      const userRef = doc(db, 'users', uid);

      const txResult = await runTransaction(db, async (transaction) => {
        const orgSnap = await transaction.get(orgRef);
        if (!orgSnap.exists()) {
          return { status: 'missing' as const };
        }
        const orgData = orgSnap.data();
        const usedSeats = typeof orgData.usedSeats === 'number' ? orgData.usedSeats : 0;
        const maxSeats = typeof orgData.maxSeats === 'number' ? orgData.maxSeats : 10;

        const userSnap = await transaction.get(userRef);
        const existingOrgId = userSnap.exists() ? userSnap.data().organizationId : null;
        if (existingOrgId === org.id) {
          return { status: 'already_member' as const };
        }
        if (usedSeats >= maxSeats) {
          return { status: 'full' as const, usedSeats, maxSeats };
        }

        // Firestore rules allow joining users to increment ONLY usedSeats by +1
        transaction.update(orgRef, {
          usedSeats: usedSeats + 1,
        });
        transaction.update(userRef, {
          organizationId: org.id,
          companyName: orgData.name || org.name,
          role: 'sme_member',
          isPro: true,
        });

        return { status: 'joined' as const, newUsedSeats: usedSeats + 1 };
      });

      if (txResult.status === 'missing') {
        return { success: false, message: 'La organización especificada no existe.' };
      }
      if (txResult.status === 'already_member') {
        return { success: false, message: `Ya perteneces al equipo de ${org.name}.` };
      }
      if (txResult.status === 'full') {
        return {
          success: false,
          message: `La organización ${org.name} ha alcanzado el límite de puestos (${txResult.usedSeats}/${txResult.maxSeats}).`,
        };
      }

      org.usedSeats = txResult.newUsedSeats;
      memoryCache.delete(`user_profile_${uid}`);
      localStorage.removeItem(`user_profile_${uid}`);

      return {
        success: true,
        message: `¡Te has unido exitosamente al equipo de ${org.name}! 🛡️`,
        organization: org,
      };
    } catch (err: any) {
      console.error('[useFirestore] Error joining organization:', err);
      return { success: false, message: err.message || 'Error al vincularse con la empresa.' };
    }
  }

  /**
   * Fetch private leaderboard for an organization
   */
  async function getOrganizationLeaderboard(
    orgId: string,
    currentUserId?: string
  ): Promise<LeagueLeaderboardEntry[]> {
    const members = await getOrganizationMembers(orgId);
    return processLeaderboardDocs(members, currentUserId);
  }

  /**
   * Realtime reactive subscription to private organization leaderboard
   */
  function subscribeToOrganizationLeaderboard(
    orgId: string,
    currentUserId: string | undefined,
    onUpdate: (entries: LeagueLeaderboardEntry[]) => void
  ): () => void {
    const usersCol = collection(db, 'users');
    const q = query(
      usersCol,
      where('organizationId', '==', orgId),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        onUpdate(processLeaderboardDocs(docs, currentUserId));
      },
      (error) => {
        console.warn('[useFirestore] Organization leaderboard snapshot error:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Create a new organization in Firestore
   */
  async function createOrganization(
    data: {
      name: string;
      adminEmail: string;
      adminUid: string;
      plan?: OrganizationPlan;
      maxSeats?: number;
      industry?: string;
    }
  ): Promise<Organization> {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'org';
    const suffix = Date.now().toString(36).slice(-4);
    const orgId = `${slug}_${suffix}`;
    const prefix = slug.toUpperCase().padEnd(3, 'S').slice(0, 3);
    const inviteCode = `${prefix}${Math.floor(100 + Math.random() * 900)}`;

    const newOrg: Organization = {
      id: orgId,
      name: data.name,
      adminEmail: data.adminEmail,
      adminUid: data.adminUid,
      plan: data.plan || 'micro_pyme',
      maxSeats: data.maxSeats || 10,
      usedSeats: 1,
      subscriptionStatus: data.plan && data.plan !== 'micro_pyme' ? 'active' : 'trialing',
      inviteCode,
      createdAt: new Date().toISOString(),
      industry: data.industry || 'Servicios PYME',
    };

    const orgRef = doc(db, 'organizations', orgId);
    await setDoc(orgRef, {
      ...newOrg,
      createdAt: serverTimestamp(),
    });

    // Make creator the sme_admin
    const userRef = doc(db, 'users', data.adminUid);
    await updateDoc(userRef, {
      organizationId: orgId,
      companyName: data.name,
      role: 'sme_admin',
      isPro: true,
    });

    return newOrg;
  }

  /**
   * Real-time listener on /users/{uid} for immediate suspension & org-status enforcement (RN-08)
   */
  function subscribeToUserProfile(
    uid: string,
    onUpdate: (partial: Partial<UserProfile>) => void
  ): Unsubscribe {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const xpVal = typeof data.xp === 'number' ? data.xp : 0;
        onUpdate({
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate().toISOString() : (data.suspendedAt || null),
          role: data.role || 'individual',
          organizationId: data.organizationId || undefined,
          companyName: data.companyName || '',
          isPro: typeof data.isPro === 'boolean' ? data.isPro : false,
          currentLeague: data.currentLeague || computeLeagueFromXp(xpVal).name,
          dailyGoal: (data.dailyGoal as DailyGoalType) || 'constante',
          notificationsEnabled: typeof data.notificationsEnabled === 'boolean' ? data.notificationsEnabled : true,
          diagnosticProfile: data.diagnosticProfile || null,
          failedExerciseIds: Array.isArray(data.failedExerciseIds) ? data.failedExerciseIds : [],
          lessonStars: data.lessonStars && typeof data.lessonStars === 'object' ? data.lessonStars : {},
        });
      },
      (err) => {
        console.warn('[useFirestore] subscribeToUserProfile snapshot error:', err);
      }
    );
  }

  /**
   * Update an existing organization
   */
  async function updateOrganization(orgId: string, data: Partial<Organization>): Promise<void> {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, data as any);
  }

  /**
   * Update a member's status (active vs suspended)
   */
  async function updateUserStatus(
    uid: string,
    status: 'active' | 'suspended'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        status,
        suspendedAt: status === 'suspended' ? serverTimestamp() : null,
      });
      localStorage.removeItem(`user_profile_${uid}`);
      return {
        success: true,
        message: status === 'suspended'
          ? 'Colaborador suspendido temporalmente.'
          : 'Colaborador reactivado con éxito.',
      };
    } catch (err: any) {
      console.error('[useFirestore] Error updating user status:', err);
      return { success: false, message: err.message || 'Error al actualizar el estado del colaborador.' };
    }
  }

  /**
   * Unlink/remove a member from the SME organization
   */
  async function removeMemberFromOrganization(
    orgId: string,
    memberUid: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userRef = doc(db, 'users', memberUid);
      await updateDoc(userRef, {
        organizationId: null,
        companyName: '',
        role: 'individual',
        isPro: false,
        status: 'active',
        suspendedAt: null,
      });

      const orgRef = doc(db, 'organizations', orgId);
      await updateDoc(orgRef, {
        usedSeats: increment(-1),
      }).catch((e) => console.warn('Could not decrement usedSeats:', e));

      localStorage.removeItem(`user_profile_${memberUid}`);
      return {
        success: true,
        message: 'Colaborador desvinculado de la empresa exitosamente.',
      };
    } catch (err: any) {
      console.error('[useFirestore] Error removing member from organization:', err);
      return { success: false, message: err.message || 'Error al desvincular al colaborador.' };
    }
  }

  /**
   * Fetch Shop Catalog
   */
  async function getShopCatalog(): Promise<ShopItem[]> {
    const cacheKey = 'shop_catalog';
    const cached = getCached<ShopItem[]>(cacheKey, TTL_STATIC_CONTENT);
    if (cached) return cached;

    setCached(cacheKey, SEED_SHOP_ITEMS);
    return SEED_SHOP_ITEMS;
  }

  /**
   * Compute Dynamic Badges based on user's actual verified progress (0 unlocked for 0-XP accounts)
   */
  async function getBadges(
    uid: string,
    gamState?: Pick<UserGamificationState, 'completedLessons' | 'xp' | 'streakDays' | 'accuracyRate' | 'failedExerciseIds'>
  ): Promise<Badge[]> {
    if (gamState) {
      return computeDynamicBadges(gamState);
    }
    const state = uid ? await getGamificationState(uid) : null;
    if (!state) {
      return computeDynamicBadges({
        completedLessons: [],
        xp: 0,
        streakDays: 0,
        accuracyRate: 0,
        failedExerciseIds: [],
      });
    }
    return computeDynamicBadges(state);
  }

  /**
   * Process Lesson Completion: enforces >=60% pass accuracy, calculates stars, streak freeze consumption,
   * daily goal progress, XP boosts, and automatic league promotion.
   */
  async function recordLessonCompletion(
    uid: string,
    summary: LessonSessionSummary,
    isPro: boolean
  ): Promise<{
    state: UserGamificationState;
    passed: boolean;
    earnedXp: number;
    earnedBits: number;
    stars: number;
    leaguePromoted: boolean;
    newLeague: string;
  }> {
    const currentState = await getGamificationState(uid, isPro);
    const today = getLocalDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDateString(yesterdayDate);
    const prevDate = normalizeLocalDateString(currentState.lastActiveDate);

    // Accuracy calculation
    const sessionAccuracy = summary.totalExercises > 0
      ? Math.round((summary.correctAnswersCount / summary.totalExercises) * 100)
      : 100;
    const outcome = computeLessonOutcome(sessionAccuracy);

    const isErrorReview = summary.lessonId === 'error-review';
    const newAccuracyRate = currentState.totalLessonsCompleted > 0
      ? Math.round(
          (currentState.accuracyRate * currentState.totalLessonsCompleted + sessionAccuracy) /
            (currentState.totalLessonsCompleted + 1)
        )
      : sessionAccuracy;

    if (!outcome.passed) {
      // Failed attempt (< 60%): award small practice XP, do NOT mark completed or advance daily goal
      const practiceXp = 5;
      const newXp = currentState.xp + practiceXp;
      const newLevel = Math.floor(newXp / 400) + 1;
      const updatedState: UserGamificationState = {
        ...currentState,
        xp: newXp,
        level: newLevel,
        levelTitle:
          newLevel === 1
            ? 'Centinela Nivel 1 · Recluta de Perímetro'
            : `Centinela Nivel ${newLevel} · Vigilante de Manada`,
        accuracyRate: newAccuracyRate,
        accuracyPercentage: newAccuracyRate,
        hearts: summary.heartsRemaining ?? currentState.hearts,
      };
      await saveGamificationState(uid, updatedState);
      return {
        state: updatedState,
        passed: false,
        earnedXp: practiceXp,
        earnedBits: 0,
        stars: 0,
        leaguePromoted: false,
        newLeague: updatedState.currentLeague,
      };
    }

    // Passed (>= 60%): apply streak multiplier, boost multiplier, freeze consumption & league promotion
    const streakTransition = applyStreakTransition({
      currentStreak: currentState.streakDays,
      lastActiveDate: prevDate,
      activeDates: currentState.activeDates || [],
      hasStreakFreeze: !!currentState.hasStreakFreeze,
      today,
      yesterday,
    });

    const streakMultiplier = calculateStreakMultiplier(streakTransition.streakDays);
    const hasBoost = (currentState.xpBoostLessonsRemaining || 0) > 0;
    const boostMultiplier = hasBoost ? Math.max(1, currentState.xpBoostMultiplier || 2) : 1;

    let baseXp: number = summary.earnedXp ?? GAMIFICATION_RULES.ECONOMY.XP_LESSON_BASE;
    if (summary.isPerfectScore && !summary.earnedXp) {
      baseXp += GAMIFICATION_RULES.ECONOMY.XP_PERFECT_BONUS;
    }
    const earnedXp = Math.round(baseXp * streakMultiplier * boostMultiplier);
    const earnedBits =
      (summary.earnedBits ?? GAMIFICATION_RULES.ECONOMY.BITS_LESSON_COMPLETED) +
      streakTransition.streakBitsBonus;

    // Update completedLessons and lessonStars (skip for virtual error-review mode)
    const currentCompleted = Array.isArray(currentState.completedLessons)
      ? [...currentState.completedLessons]
      : [];
    const currentStars = { ...(currentState.lessonStars || {}) };

    if (!isErrorReview && summary.lessonId) {
      if (!currentCompleted.includes(summary.lessonId)) {
        currentCompleted.push(summary.lessonId);
      }
      currentStars[summary.lessonId] = Math.max(
        currentStars[summary.lessonId] || 0,
        outcome.stars
      );
    }

    const dailyLessonsCompleted =
      currentState.dailyLessonsDate === today
        ? (currentState.dailyLessonsCompleted || 0) + 1
        : 1;

    const newXp = currentState.xp + earnedXp;
    const previousLeague = currentState.currentLeague || 'Bronce';
    const nextLeagueInfo = computeLeagueFromXp(newXp);
    const leaguePromoted = nextLeagueInfo.name !== previousLeague;

    const remainingBoostLessons = Math.max(0, (currentState.xpBoostLessonsRemaining || 0) - 1);
    const nextBoostMultiplier = remainingBoostLessons > 0 ? boostMultiplier : 1;

    const updatedState: UserGamificationState = {
      ...currentState,
      xp: newXp,
      bits: currentState.bits + earnedBits,
      streakDays: streakTransition.streakDays,
      lastActiveDate: streakTransition.lastActiveDate,
      activeDates: streakTransition.activeDates,
      hasStreakFreeze: streakTransition.hasStreakFreeze,
      totalLessonsCompleted: currentCompleted.length,
      completedLessons: currentCompleted,
      lessonStars: currentStars,
      dailyLessonsCompleted,
      dailyLessonsDate: today,
      accuracyRate: newAccuracyRate,
      accuracyPercentage: newAccuracyRate,
      hearts: summary.heartsRemaining ?? currentState.hearts,
      currentLeague: nextLeagueInfo.name,
      xpBoostMultiplier: nextBoostMultiplier,
      xpBoostLessonsRemaining: remainingBoostLessons,
    };

    updatedState.level = Math.floor(updatedState.xp / 400) + 1;
    updatedState.levelTitle =
      updatedState.level === 1
        ? 'Centinela Nivel 1 · Recluta de Perímetro'
        : `Centinela Nivel ${updatedState.level} · Vigilante de Manada`;

    await saveGamificationState(uid, updatedState);
    return {
      state: updatedState,
      passed: true,
      earnedXp,
      earnedBits,
      stars: outcome.stars,
      leaguePromoted,
      newLeague: updatedState.currentLeague,
    };
  }

  /**
   * Persists a failed exercise ID into the user's Error Review Hub list
   */
  async function recordFailedExercise(uid: string, exerciseId: string): Promise<string[]> {
    if (!uid || !exerciseId) return [];
    const current = await getGamificationState(uid);
    const existing = Array.isArray(current.failedExerciseIds) ? current.failedExerciseIds : [];
    const nextList = Array.from(new Set([exerciseId, ...existing])).slice(0, 30);
    await saveGamificationState(uid, { failedExerciseIds: nextList });
    const profKey = `user_profile_${uid}`;
    const cachedProf = getCached<UserProfile>(profKey, TTL_USER_STATE);
    if (cachedProf) {
      cachedProf.failedExerciseIds = nextList;
      setCached(profKey, cachedProf);
      localStorage.setItem(profKey, JSON.stringify(cachedProf));
    }
    return nextList;
  }

  /**
   * Removes resolved exercise IDs from the Error Review Hub after mastery
   */
  async function resolveFailedExercises(uid: string, exerciseIds: string[]): Promise<string[]> {
    if (!uid || !Array.isArray(exerciseIds) || exerciseIds.length === 0) return [];
    const current = await getGamificationState(uid);
    const resolvedSet = new Set(exerciseIds);
    const nextList = (current.failedExerciseIds || []).filter((id) => !resolvedSet.has(id));
    await saveGamificationState(uid, { failedExerciseIds: nextList });
    const profKey = `user_profile_${uid}`;
    const cachedProf = getCached<UserProfile>(profKey, TTL_USER_STATE);
    if (cachedProf) {
      cachedProf.failedExerciseIds = nextList;
      setCached(profKey, cachedProf);
      localStorage.setItem(profKey, JSON.stringify(cachedProf));
    }
    return nextList;
  }

  /**
   * Purchase Shop Item with Bits
   */
  async function purchaseItem(
    uid: string,
    itemCode: ShopItemCode,
    isPro: boolean
  ): Promise<{ success: boolean; message: string; updatedState?: UserGamificationState }> {
    const state = await getGamificationState(uid, isPro);
    const shop = await getShopCatalog();
    const item = shop.find((i) => i.code === itemCode);

    if (!item) {
      return { success: false, message: 'Artículo no encontrado en el catálogo' };
    }

    if (item.isSubscription) {
      // Mock checkout stub for Phase 1 as requested in constraints
      return {
        success: true,
        message: '¡Prueba gratuita de 7 días de SuriPro activada con éxito!',
      };
    }

    // Specific validation: Heart Refill (+5 Hearts for 150 Bits)
    if (itemCode === 'heart_refill') {
      if (state.hearts >= GAMIFICATION_RULES.HEARTS.MAX_CAPACITY) {
        return {
          success: false,
          message: '¡Tus defensas ya están al máximo! (5/5 Vidas ❤️)',
        };
      }
      if (state.bits < 150) {
        return {
          success: false,
          message: `Bits insuficientes. Necesitas 150 Bits (tienes ${state.bits} Bits).`,
        };
      }
    }

    // Specific validation: Streak Freeze (200 Bits)
    if (itemCode === 'streak_freeze') {
      if (state.hasStreakFreeze) {
        return {
          success: false,
          message: '¡Ya tienes un Congelador de Racha equipado y activo!',
        };
      }
      if (state.bits < 200) {
        return {
          success: false,
          message: `Bits insuficientes. Necesitas 200 Bits (tienes ${state.bits} Bits).`,
        };
      }
    }

    // General cost validation
    if (state.bits < item.costBits) {
      return {
        success: false,
        message: `Bits insuficientes. Necesitas ${item.costBits} Bits (tienes ${state.bits} Bits).`,
      };
    }

    const updates: Partial<UserGamificationState> = {
      bits: Math.max(0, state.bits - item.costBits),
    };

    let successMsg = `¡${item.title} equipado con éxito!`;

    if (itemCode === 'streak_freeze') {
      updates.hasStreakFreeze = true;
      successMsg = '¡Congelador de Racha equipado! Tu racha está protegida.';
    } else if (itemCode === 'heart_refill') {
      updates.hearts = GAMIFICATION_RULES.HEARTS.MAX_CAPACITY; // 5 hearts
      updates.lastHeartRefill = new Date().toISOString();
      successMsg = '¡Vidas restauradas al 100%! +5 Corazones listos para la acción 🛡️';
    } else if (itemCode === 'xp_boost_2x') {
      updates.xpBoostMultiplier = 2;
      updates.xpBoostLessonsRemaining = (state.xpBoostLessonsRemaining || 0) + 3;
      successMsg = '¡Potenciador 2X XP activo para tus próximas 3 lecciones!';
    }

    await saveGamificationState(uid, updates);
    await saveUserProfile(uid, {
      bits: updates.bits,
      ...(updates.hearts !== undefined ? { hearts: updates.hearts } : {}),
      ...(updates.hasStreakFreeze !== undefined ? { hasStreakFreeze: updates.hasStreakFreeze } : {}),
      ...(updates.xpBoostMultiplier !== undefined ? { xpBoostMultiplier: updates.xpBoostMultiplier } : {}),
      ...(updates.xpBoostLessonsRemaining !== undefined
        ? { xpBoostLessonsRemaining: updates.xpBoostLessonsRemaining }
        : {}),
    });

    const updatedState = await getGamificationState(uid, isPro);

    return {
      success: true,
      message: successMsg,
      updatedState,
    };
  }

  /**
   * Atomic Claim of a one-time reward (e.g. Unit completion chest or daily mission)
   * Prevents infinite-claim exploit by checking and updating claimedRewards in a Firestore transaction.
   */
  async function claimReward(
    uid: string,
    rewardId: string,
    reward: { bits?: number; xp?: number }
  ): Promise<{
    success: boolean;
    message: string;
    alreadyClaimed?: boolean;
    claimedRewards: string[];
    updatedBits: number;
    updatedXp: number;
  }> {
    if (!uid) {
      return {
        success: false,
        message: 'Usuario no identificado',
        claimedRewards: [],
        updatedBits: 0,
        updatedXp: 0,
      };
    }

    const userRef = doc(db, 'users', uid);
    const bitsToAdd = reward.bits || 0;
    const xpToAdd = reward.xp || 0;

    try {
      const result = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('El perfil de usuario no existe en la base de datos.');
        }

        const data = userDoc.data();
        const existingClaimed: string[] = Array.isArray(data.claimedRewards) ? data.claimedRewards : [];

        const isAlreadyClaimed =
          existingClaimed.includes(rewardId) ||
          (rewardId === 'chest_01' && existingClaimed.includes('unit_1_completion_chest')) ||
          (rewardId === 'unit_1_completion_chest' && existingClaimed.includes('chest_01'));

        if (isAlreadyClaimed) {
          return {
            alreadyClaimed: true,
            claimedRewards: existingClaimed,
            bits: typeof data.bits === 'number' ? data.bits : 0,
            xp: typeof data.xp === 'number' ? data.xp : 0,
          };
        }

        const newBits = (typeof data.bits === 'number' ? data.bits : 0) + bitsToAdd;
        const newXp = (typeof data.xp === 'number' ? data.xp : 0) + xpToAdd;
        const idsToAdd = rewardId === 'chest_01' ? ['chest_01', 'unit_1_completion_chest'] : [rewardId];
        const newClaimed = Array.from(new Set([...existingClaimed, ...idsToAdd]));

        transaction.update(userRef, {
          bits: newBits,
          xp: newXp,
          claimedRewards: arrayUnion(...idsToAdd),
        });

        return {
          alreadyClaimed: false,
          claimedRewards: newClaimed,
          bits: newBits,
          xp: newXp,
        };
      });

      if (result.alreadyClaimed) {
        return {
          success: false,
          alreadyClaimed: true,
          message: 'Esta recompensa ya fue reclamada.',
          claimedRewards: result.claimedRewards,
          updatedBits: result.bits,
          updatedXp: result.xp,
        };
      }

      // Update in-memory caches and localStorage
      const userProfileCacheKey = `user_profile_${uid}`;
      const gamCacheKey = `user_gamification_${uid}`;

      const currentProfile = getCached<UserProfile>(userProfileCacheKey, TTL_USER_STATE);
      if (currentProfile) {
        currentProfile.bits = result.bits;
        currentProfile.xp = result.xp;
        currentProfile.claimedRewards = result.claimedRewards;
        setCached(userProfileCacheKey, currentProfile);
        localStorage.setItem(userProfileCacheKey, JSON.stringify(currentProfile));
      }

      const currentGam = getCached<UserGamificationState>(gamCacheKey, TTL_USER_STATE);
      if (currentGam) {
        currentGam.bits = result.bits;
        currentGam.xp = result.xp;
        currentGam.claimedRewards = result.claimedRewards;
        setCached(gamCacheKey, currentGam);
        localStorage.setItem(gamCacheKey, JSON.stringify(currentGam));
      }

      return {
        success: true,
        message: `¡Cofre abierto con éxito! +${bitsToAdd} Bits${xpToAdd ? ` · +${xpToAdd} XP` : ''} 💎`,
        claimedRewards: result.claimedRewards,
        updatedBits: result.bits,
        updatedXp: result.xp,
      };
    } catch (err: any) {
      console.warn('[useFirestore] claimReward transaction failed, using local sync:', err);
      const current = await getUserProfile(uid);
      const claimed = current.claimedRewards || [];
      const isAlreadyClaimed =
        claimed.includes(rewardId) ||
        (rewardId === 'chest_01' && claimed.includes('unit_1_completion_chest')) ||
        (rewardId === 'unit_1_completion_chest' && claimed.includes('chest_01'));

      if (isAlreadyClaimed) {
        return {
          success: false,
          alreadyClaimed: true,
          message: 'Esta recompensa ya fue reclamada.',
          claimedRewards: claimed,
          updatedBits: current.bits || 0,
          updatedXp: current.xp || 0,
        };
      }
      const newBits = (current.bits || 0) + bitsToAdd;
      const newXp = (current.xp || 0) + xpToAdd;
      const idsToAdd = rewardId === 'chest_01' ? ['chest_01', 'unit_1_completion_chest'] : [rewardId];
      const newClaimed = Array.from(new Set([...claimed, ...idsToAdd]));
      await saveUserProfile(uid, { bits: newBits, xp: newXp, claimedRewards: newClaimed });
      await saveGamificationState(uid, { bits: newBits, xp: newXp, claimedRewards: newClaimed });
      return {
        success: true,
        message: `¡Cofre abierto con éxito! +${bitsToAdd} Bits 💎`,
        claimedRewards: newClaimed,
        updatedBits: newBits,
        updatedXp: newXp,
      };
    }
  }

  return {
    isLoading,
    error,
    ensureUserDocument,
    getUserProfile,
    saveUserProfile,
    subscribeToUserProfile,
    getGamificationState,
    saveGamificationState,
    getLearningUnits,
    getLessonExercises,
    getLeaderboard,
    subscribeToLeaderboard,
    getOrganization,
    getOrganizationByInviteCode,
    getOrganizationMembers,
    createOrganization,
    updateOrganization,
    updateUserStatus,
    removeMemberFromOrganization,
    joinOrganizationWithCode,
    getOrganizationLeaderboard,
    subscribeToOrganizationLeaderboard,
    getShopCatalog,
    getBadges,
    recordLessonCompletion,
    recordFailedExercise,
    resolveFailedExercises,
    purchaseItem,
    claimReward,
  };
}
