/**
 * Pinia Store: Gamification Engine & Economy
 * SuriLearn - Quantitative Gamification State
 *
 * Implements:
 * - Hearts system with passive regeneration (1 heart every 4 hours)
 * - Active Reinforcement Mode when hearts == 0
 * - Infinite hearts for Pro / SME users
 * - Streak multiplier (x1.0, x1.2, x1.5, x2.0)
 * - Economy (Bits and XP)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useUserStore } from './useUserStore';
import { useFirestore, getLocalDateString } from '../composables/useFirestore';
import {
  UserGamificationState,
  GAMIFICATION_RULES,
  calculateStreakMultiplier,
  ShopItemCode,
  LeagueLeaderboardEntry,
  LearningUnit,
  Badge,
} from '../types/gamification';
import { LessonSessionSummary } from '../types/exercises';

export const useGamificationStore = defineStore('gamification', () => {
  const userStore = useUserStore();
  const firestore = useFirestore();

  // State
  const state = ref<UserGamificationState>({
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
  });

  const units = ref<LearningUnit[]>([]);
  const leaderboard = ref<LeagueLeaderboardEntry[]>([]);
  const badges = ref<Badge[]>([]);
  const isReinforcementMode = ref<boolean>(false);
  const isLoading = ref<boolean>(false);

  // Toast / notification feedback
  const toastMessage = ref<string | null>(null);
  const toastSuccess = ref<boolean>(true);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Getters
  const hasInfiniteHearts = computed(() => userStore.isPro);
  const hearts = computed(() => (hasInfiniteHearts.value ? 5 : state.value.hearts));
  const maxHearts = computed(() => state.value.maxHearts);
  const bits = computed(() => state.value.bits);
  const xp = computed(() => state.value.xp);
  const level = computed(() => state.value.level);
  const levelTitle = computed(() => state.value.levelTitle);
  const streakDays = computed<number>(() => {
    if (state.value.streakDays > 0) return state.value.streakDays;
    if ((userStore.profile.streakDays || 0) > 0) return userStore.profile.streakDays || 0;
    const hasCompleted =
      (state.value.completedLessons?.length || 0) > 0 ||
      (userStore.profile.completedLessons?.length || 0) > 0;
    return hasCompleted ? 1 : 0;
  });
  const streakMultiplier = computed(() => calculateStreakMultiplier(streakDays.value));
  const hasStreakFreeze = computed(() => !!state.value.hasStreakFreeze);

  const dailyLessonsCompletedToday = computed(() => {
    const today = getLocalDateString();
    return state.value.dailyLessonsDate === today ? state.value.dailyLessonsCompleted || 0 : 0;
  });

  const failedExerciseCount = computed(() => (state.value.failedExerciseIds || []).length);

  const canStartLesson = computed(() => {
    return hasInfiniteHearts.value || state.value.hearts > 0 || isReinforcementMode.value;
  });

  // Calculate remaining time until next passive heart refill
  const timeUntilNextHeart = computed(() => {
    if (state.value.hearts >= GAMIFICATION_RULES.HEARTS.MAX_CAPACITY || hasInfiniteHearts.value) {
      return 0;
    }
    const lastRefill = new Date(state.value.lastHeartRefill).getTime();
    const nextRefill = lastRefill + GAMIFICATION_RULES.HEARTS.REFILL_INTERVAL_MS;
    return Math.max(0, nextRefill - Date.now());
  });

  const formattedHeartTimer = computed(() => {
    const ms = timeUntilNextHeart.value;
    if (ms <= 0) return 'Lleno';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  });

  // Actions
  function clearToast() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toastMessage.value = null;
  }

  function showToast(msg: string, success = true) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastMessage.value = msg;
    toastSuccess.value = success;
    toastTimer = setTimeout(() => {
      toastMessage.value = null;
      toastTimer = null;
    }, 3200);
  }

  async function loadGamificationData(uid?: string) {
    const userId = uid || userStore.profile.uid;
    if (!userId) return;

    try {
      isLoading.value = true;
      const gamState = await firestore.getGamificationState(userId, userStore.isPro);
      state.value = gamState;

      // Sync userStore profile with latest gamification numbers
      userStore.profile.completedLessons = gamState.completedLessons || [];
      userStore.profile.xp = gamState.xp ?? 0;
      userStore.profile.bits = gamState.bits ?? 0;
      userStore.profile.streakDays = gamState.streakDays ?? 0;
      userStore.profile.lastActiveDate = gamState.lastActiveDate ?? '';
      userStore.profile.activeDates = gamState.activeDates ?? [];
      userStore.profile.hearts = gamState.hearts ?? 5;
      userStore.profile.accuracyRate = gamState.accuracyRate ?? 0;
      userStore.profile.currentLeague = gamState.currentLeague || 'Bronce';
      userStore.profile.hasStreakFreeze = gamState.hasStreakFreeze;
      userStore.profile.failedExerciseIds = gamState.failedExerciseIds || [];
      userStore.profile.dailyLessonsCompleted = gamState.dailyLessonsCompleted || 0;
      userStore.profile.dailyLessonsDate = gamState.dailyLessonsDate || '';
      userStore.profile.lessonStars = gamState.lessonStars || {};

      const claimed = userStore.profile.claimedRewards || gamState.claimedRewards || [];
      const [learningUnits, leaderData, badgeData] = await Promise.all([
        firestore.getLearningUnits(
          gamState.completedLessons || [],
          claimed,
          gamState.lessonStars || {}
        ),
        firestore.getLeaderboard(
          gamState.currentLeague || userStore.profile.currentLeague || 'Bronce',
          userId
        ),
        firestore.getBadges(userId, gamState),
      ]);

      units.value = learningUnits;
      leaderboard.value = leaderData;
      badges.value = badgeData;
    } catch (err) {
      console.warn('[useGamificationStore] Error loading gamification data:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Deducts 1 life per mistake, unless user has infinite hearts or is in reinforcement mode
   */
  async function deductHeart(): Promise<boolean> {
    if (hasInfiniteHearts.value || isReinforcementMode.value) return true;

    if (state.value.hearts > 0) {
      const wasAtMax = state.value.hearts >= GAMIFICATION_RULES.HEARTS.MAX_CAPACITY;
      state.value.hearts = Math.max(0, state.value.hearts - GAMIFICATION_RULES.HEARTS.COST_PER_MISTAKE);
      userStore.profile.hearts = state.value.hearts;

      const payload: Partial<UserGamificationState> = {
        hearts: state.value.hearts,
      };

      if (wasAtMax) {
        const nowIso = new Date().toISOString();
        state.value.lastHeartRefill = nowIso;
        userStore.profile.lastHeartRefill = nowIso;
        payload.lastHeartRefill = nowIso;
      }

      if (userStore.profile.uid) {
        await firestore.saveGamificationState(userStore.profile.uid, payload);
      }
      return true;
    }

    return false;
  }

  /**
   * Restores hearts (e.g. through review mode or purchase)
   */
  async function restoreHeart(amount = 1): Promise<void> {
    const newHearts = Math.min(GAMIFICATION_RULES.HEARTS.MAX_CAPACITY, state.value.hearts + amount);
    state.value.hearts = newHearts;
    userStore.profile.hearts = newHearts;
    if (newHearts > 0) {
      isReinforcementMode.value = false;
    }
    await firestore.saveGamificationState(userStore.profile.uid, {
      hearts: newHearts,
    });
  }

  /**
   * Completes a reinforcement lesson with 100% accuracy -> restores +1 heart
   */
  async function completeReinforcementSession(isPerfect: boolean): Promise<boolean> {
    if (isPerfect) {
      await restoreHeart(GAMIFICATION_RULES.HEARTS.REINFORCEMENT_RESTORE_AMOUNT);
      showToast('¡Lección de refuerzo superada! Recuperaste +1 Vida 🛡️', true);
      isReinforcementMode.value = false;
      return true;
    }
    showToast('Necesitas 100% de precisión para recuperar una vida en repaso.', false);
    return false;
  }

  async function recordExerciseFailure(exerciseId: string): Promise<void> {
    if (!exerciseId) return;
    const current = Array.isArray(state.value.failedExerciseIds) ? state.value.failedExerciseIds : [];
    const nextList = Array.from(new Set([exerciseId, ...current])).slice(0, 30);
    state.value.failedExerciseIds = nextList;
    userStore.profile.failedExerciseIds = nextList;
    if (userStore.profile.uid) {
      await firestore.recordFailedExercise(userStore.profile.uid, exerciseId);
    }
  }

  async function clearResolvedErrors(exerciseIds: string[]): Promise<void> {
    if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) return;
    const resolved = new Set(exerciseIds);
    const nextList = (state.value.failedExerciseIds || []).filter((id) => !resolved.has(id));
    state.value.failedExerciseIds = nextList;
    userStore.profile.failedExerciseIds = nextList;
    if (userStore.profile.uid) {
      await firestore.resolveFailedExercises(userStore.profile.uid, exerciseIds);
    }
  }

  /**
   * Completes normal lesson, enforces >=60% accuracy, updates XP, Bits, Streak, League and persists to Firestore
   */
  async function completeLesson(summary: LessonSessionSummary): Promise<{
    passed: boolean;
    earnedXp: number;
    earnedBits: number;
    stars: number;
    leaguePromoted: boolean;
    newLeague: string;
  }> {
    try {
      const result = await firestore.recordLessonCompletion(
        userStore.profile.uid,
        summary,
        userStore.isPro
      );
      const updatedState = result.state;
      state.value = updatedState;

      // Sync userStore profile
      userStore.profile.completedLessons = updatedState.completedLessons || [];
      userStore.profile.xp = updatedState.xp ?? 0;
      userStore.profile.bits = updatedState.bits ?? 0;
      userStore.profile.streakDays = updatedState.streakDays ?? 0;
      userStore.profile.lastActiveDate = updatedState.lastActiveDate ?? '';
      userStore.profile.activeDates = updatedState.activeDates ?? [];
      userStore.profile.hearts = updatedState.hearts ?? 5;
      userStore.profile.accuracyRate = updatedState.accuracyRate ?? 0;
      userStore.profile.currentLeague = updatedState.currentLeague || 'Bronce';
      userStore.profile.hasStreakFreeze = updatedState.hasStreakFreeze;
      userStore.profile.dailyLessonsCompleted = updatedState.dailyLessonsCompleted || 0;
      userStore.profile.dailyLessonsDate = updatedState.dailyLessonsDate || '';
      userStore.profile.lessonStars = updatedState.lessonStars || {};

      // Refresh badges and dynamic learning tree
      badges.value = await firestore.getBadges(userStore.profile.uid, updatedState);
      const claimed = userStore.profile.claimedRewards || state.value.claimedRewards || [];
      units.value = await firestore.getLearningUnits(
        updatedState.completedLessons || [],
        claimed,
        updatedState.lessonStars || {}
      );

      if (!result.passed) {
        showToast('Necesitas ≥60% de precisión para aprobar la lección. +5 XP de práctica.', false);
      } else if (result.leaguePromoted) {
        showToast(`¡Ascendiste a Liga ${result.newLeague}! +${result.earnedXp} XP · +${result.earnedBits} Bits 🏆`, true);
      } else {
        showToast(`¡Misión completada! +${result.earnedXp} XP · +${result.earnedBits} Bits`, true);
      }

      return {
        passed: result.passed,
        earnedXp: result.earnedXp,
        earnedBits: result.earnedBits,
        stars: result.stars,
        leaguePromoted: result.leaguePromoted,
        newLeague: result.newLeague,
      };
    } catch (err) {
      console.warn('[useGamificationStore] Error completing lesson:', err);
      return {
        passed: true,
        earnedXp: summary.earnedXp ?? 15,
        earnedBits: summary.earnedBits ?? 10,
        stars: 2,
        leaguePromoted: false,
        newLeague: state.value.currentLeague || 'Bronce',
      };
    }
  }

  /**
   * Claim daily mission or chest through atomic userStore persistence
   */
  async function claimChest(nodeId: string, bitsReward = 50): Promise<void> {
    await userStore.claimChestReward(nodeId, bitsReward);
  }

  async function refreshLearningUnits(): Promise<void> {
    const claimed = userStore.profile.claimedRewards || state.value.claimedRewards || [];
    units.value = await firestore.getLearningUnits(
      state.value.completedLessons || [],
      claimed,
      state.value.lessonStars || {}
    );
  }

  /**
   * Purchase an item in the shop with virtual bits
   */
  async function buyShopItem(itemCode: ShopItemCode): Promise<boolean> {
    try {
      const result = await firestore.purchaseItem(userStore.profile.uid, itemCode, userStore.isPro);
      if (result.success) {
        if (result.updatedState) {
          state.value = result.updatedState;
          userStore.profile.hearts = result.updatedState.hearts;
          userStore.profile.bits = result.updatedState.bits;
          userStore.profile.hasStreakFreeze = result.updatedState.hasStreakFreeze;
          if (result.updatedState.hearts > 0) {
            isReinforcementMode.value = false;
          }
        }
        showToast(result.message, true);
        return true;
      } else {
        showToast(result.message, false);
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Error al comprar artículo', false);
      return false;
    }
  }

  return {
    state,
    units,
    leaderboard,
    badges,
    isReinforcementMode,
    isLoading,
    toastMessage,
    toastSuccess,
    hasInfiniteHearts,
    hearts,
    maxHearts,
    bits,
    xp,
    level,
    levelTitle,
    streakDays,
    streakMultiplier,
    hasStreakFreeze,
    dailyLessonsCompletedToday,
    failedExerciseCount,
    canStartLesson,
    timeUntilNextHeart,
    formattedHeartTimer,
    showToast,
    clearToast,
    loadGamificationData,
    deductHeart,
    restoreHeart,
    completeReinforcementSession,
    recordExerciseFailure,
    clearResolvedErrors,
    completeLesson,
    claimChest,
    refreshLearningUnits,
    buyShopItem,
  };
});

