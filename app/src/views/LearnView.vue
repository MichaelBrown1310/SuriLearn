<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useUserStore } from '../stores/useUserStore';
import { useFirestore, getLocalDateString, normalizeLocalDateString } from '../composables/useFirestore';
import { auth } from '../firebase/config';
import HeaderHud from '../components/common/HeaderHud.vue';
import OutOfHeartsModal from '../components/common/OutOfHeartsModal.vue';
import SuspendedAccountModal from '../components/common/SuspendedAccountModal.vue';
import UnitTheoryModal from '../components/common/UnitTheoryModal.vue';
import DiagnosticModal from '../components/common/DiagnosticModal.vue';
import SuriMascotAnimated from '../components/common/SuriMascotAnimated.vue';
import CourseWindingPath from '../components/learn/CourseWindingPath.vue';
import {
  LearningNode,
  LearningUnit,
  LeagueLeaderboardEntry,
  DAILY_GOAL_CONFIGS,
  DailyGoalType,
} from '../types/gamification';
import { getSuriImage } from '../utils/suriAssets';
import { buildAllLearningUnits } from '../data/curriculum';

const router = useRouter();
const gamificationStore = useGamificationStore();
const userStore = useUserStore();
const firestore = useFirestore();
const suriImg = getSuriImage('idle');
const isOutOfHeartsModalOpen = ref<boolean>(false);
const isSuspendedModalOpen = ref<boolean>(false);
const isTheoryModalOpen = ref<boolean>(false);
const theoryModalUnit = ref<LearningUnit | null>(null);
const isDiagnosticModalOpen = ref<boolean>(false);
const diagnosticDismissed = ref<boolean>(false);
const isClaimingChest = ref<boolean>(false);
const isClaimingDailyQuest = ref<boolean>(false);
const selectedUnitIndex = ref<number>(0);

// Real Weekly Leaderboard State (synced with Firestore /users just like Leagues tab)
const rawWeeklyLeaderboard = ref<LeagueLeaderboardEntry[]>([]);
const isLoadingLeaderboard = ref<boolean>(true);
let unsubscribeLeaderboard: (() => void) | null = null;
let sectionObserver: IntersectionObserver | null = null;
let scrollUnlockTimer: ReturnType<typeof setTimeout> | null = null;
let isProgrammaticScroll = false;

const currentUserId = computed(() => userStore.profile.uid || auth.currentUser?.uid || '');
const currentUserDisplayName = computed(() => userStore.profile.displayName || auth.currentUser?.displayName || 'Centinela');
const currentUserXp = computed(() => {
  return typeof userStore.profile.xp === 'number' && userStore.profile.xp > 0
    ? userStore.profile.xp
    : (gamificationStore.xp || 0);
});

const weeklyRankedUsers = computed<LeagueLeaderboardEntry[]>(() => {
  const myUid = currentUserId.value;
  let pool = [...rawWeeklyLeaderboard.value];

  if (myUid && !pool.some((e) => e.userId === myUid)) {
    pool.push({
      id: `lb_${myUid}`,
      userId: myUid,
      displayName: currentUserDisplayName.value,
      avatarUrl: userStore.profile.photoURL || userStore.profile.avatarUrl || suriImg,
      xp: currentUserXp.value,
      streakDays: userStore.profile.streakDays || gamificationStore.streakDays || 0,
      accuracyRate: userStore.profile.accuracyRate || gamificationStore.state.accuracyRate || 0,
      rank: pool.length + 1,
      isCurrentUser: true,
      trend: 'same',
      zone: 'safe',
    });
  }

  pool = pool.map((item) => {
    if (myUid && item.userId === myUid) {
      return {
        ...item,
        isCurrentUser: true,
        displayName: currentUserDisplayName.value || item.displayName,
        xp: Math.max(item.xp, currentUserXp.value),
      };
    }
    return { ...item, isCurrentUser: false };
  });

  pool.sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if ((b.accuracyRate || 0) !== (a.accuracyRate || 0)) return (b.accuracyRate || 0) - (a.accuracyRate || 0);
    return (b.streakDays || 0) - (a.streakDays || 0);
  });

  return pool.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
});

const displayedWeeklyRanking = computed<LeagueLeaderboardEntry[]>(() => {
  const all = weeklyRankedUsers.value;
  const topFour = all.slice(0, 4);
  const myEntry = all.find((e) => e.isCurrentUser);
  if (myEntry && myEntry.rank > 4) {
    return [...all.slice(0, 3), myEntry];
  }
  return topFour;
});

function resolveLeaderboardAvatar(url?: string | null): string {
  if (
    url &&
    url !== '/src/assets/images/suri/suri-idle.png' &&
    (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/'))
  ) {
    return url;
  }
  return suriImg;
}

// Daily Suri Tips Carousel / Selector
const suriTips = [
  'Verifica siempre el dominio del remitente. Los atacantes suelen sustituir caracteres (ej. "micr0soft.com" en lugar de "microsoft.com").',
  'Nunca descargues archivos adjuntos con extensiones sospechosas (.exe, .scr, .vbs, .xlsm) provenientes de correos inesperados.',
  'En redes Wi-Fi públicas (aeropuertos, hoteles, cafeterías), activa siempre el túnel VPN corporativo antes de trabajar.',
  'Ante un incidente de Ransomware, aplica el orden NIST: 1° Aislar red (VLAN), 2° Purgar con EDR y 3° Restaurar Backup 3-2-1.',
  'Con la IA Generativa, una nota de voz en WhatsApp puede ser un Deepfake. Exige siempre palabra clave o verificación interna.',
  'En desarrollo DevSecOps, jamás concatenes variables de usuario en consultas SQL: usa siempre Prepared Statements ($1, ?).',
  'Durante el Threat Hunting en memoria RAM, revisa procesos hijos inusuales (ej. winword.exe lanzando powershell.exe -enc).',
];
const currentTipIndex = ref<number>(0);
const dailyTip = computed(() => suriTips[currentTipIndex.value]);

function nextTip() {
  currentTipIndex.value = (currentTipIndex.value + 1) % suriTips.length;
}

// Dynamic Day-Aware Streak Tracker (Lunes a Domingo de la semana actual)
const todayDateObj = new Date();
const todayDateStr = getLocalDateString(todayDateObj);

const todayFullLabel = computed(() => {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date();
  return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
});

const effectiveStreakDays = computed(() => {
  const storeStreak = gamificationStore.streakDays || userStore.profile.streakDays || 0;
  if (storeStreak > 0) return storeStreak;
  const completedCount =
    (gamificationStore.state.completedLessons?.length || 0) +
    (userStore.profile.completedLessons?.length || 0);
  return completedCount > 0 ? 1 : 0;
});

const activeDateSet = computed<Set<string>>(() => {
  const set = new Set<string>();
  const storeDates = gamificationStore.state.activeDates || [];
  const profileDates = userStore.profile.activeDates || [];
  storeDates.forEach((d) => set.add(d));
  profileDates.forEach((d) => set.add(d));

  const streak = effectiveStreakDays.value;
  const rawLastActive =
    gamificationStore.state.lastActiveDate ||
    userStore.profile.lastActiveDate ||
    (streak > 0 ? todayDateStr : '');
  const normalizedAnchor = normalizeLocalDateString(rawLastActive) || (streak > 0 ? todayDateStr : '');

  if (streak > 0 && normalizedAnchor) {
    const anchor = new Date(`${normalizedAnchor}T12:00:00`);
    for (let i = 0; i < Math.min(streak, 14); i++) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      set.add(getLocalDateString(d));
    }
  }
  return set;
});

const isTodayStreakDone = computed(() => activeDateSet.value.has(todayDateStr));

const weekDays = computed(() => {
  const now = new Date();
  const jsDay = now.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sáb
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);

  const labels = [
    { label: 'L', name: 'Lun' },
    { label: 'M', name: 'Mar' },
    { label: 'M', name: 'Mié' },
    { label: 'J', name: 'Jue' },
    { label: 'V', name: 'Vie' },
    { label: 'S', name: 'Sáb' },
    { label: 'D', name: 'Dom' },
  ];

  return labels.map((item, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dStr = getLocalDateString(d);
    const isToday = dStr === todayDateStr;
    const isActive = activeDateSet.value.has(dStr);
    return {
      ...item,
      dateStr: dStr,
      dayNumber: d.getDate(),
      isToday,
      active: isActive,
    };
  });
});

function setupSectionObserver() {
  if (sectionObserver) {
    sectionObserver.disconnect();
    sectionObserver = null;
  }
  if (typeof IntersectionObserver === 'undefined') return;

  sectionObserver = new IntersectionObserver(
    (entries) => {
      if (isProgrammaticScroll) return;
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const unitId = visible.target.id.replace('course-section-', '');
      const idx = allUnits.value.findIndex((u) => u.id === unitId);
      if (idx >= 0) {
        selectedUnitIndex.value = idx;
      }
    },
    { rootMargin: '-25% 0px -55% 0px', threshold: [0.05, 0.25] }
  );

  for (const u of allUnits.value) {
    const el = document.getElementById(`course-section-${u.id}`);
    if (el) sectionObserver.observe(el);
  }
}

onMounted(async () => {
  if (gamificationStore.units.length < 8) {
    await gamificationStore.loadGamificationData();
  }

  await nextTick();
  setupSectionObserver();

  const league = gamificationStore.state.currentLeague || userStore.profile.currentLeague || 'Bronce';
  const myUid = currentUserId.value;

  try {
    rawWeeklyLeaderboard.value = await firestore.getLeaderboard(league, myUid);
  } catch (err) {
    console.warn('[LearnView] Error loading weekly ranking:', err);
  } finally {
    isLoadingLeaderboard.value = false;
  }

  if (unsubscribeLeaderboard) unsubscribeLeaderboard();
  unsubscribeLeaderboard = firestore.subscribeToLeaderboard(league, myUid, (entries) => {
    rawWeeklyLeaderboard.value = entries;
    isLoadingLeaderboard.value = false;
  });
});

onUnmounted(() => {
  if (unsubscribeLeaderboard) {
    unsubscribeLeaderboard();
    unsubscribeLeaderboard = null;
  }
  if (sectionObserver) {
    sectionObserver.disconnect();
    sectionObserver = null;
  }
  if (scrollUnlockTimer) {
    clearTimeout(scrollUnlockTimer);
    scrollUnlockTimer = null;
  }
});

function isChestClaimed(node: LearningNode): boolean {
  return (
    node.isClaimed ||
    userStore.isRewardClaimed(node.id) ||
    (node.id === 'chest_01' && userStore.isRewardClaimed('unit_1_completion_chest')) ||
    (gamificationStore.state.claimedRewards || []).includes(node.id)
  );
}

const allUnits = computed<LearningUnit[]>(() => {
  const claimed = userStore.profile.claimedRewards || gamificationStore.state.claimedRewards || [];
  const baseList =
    gamificationStore.units.length >= 8
      ? gamificationStore.units
      : buildAllLearningUnits(
          gamificationStore.state.completedLessons || [],
          claimed,
          gamificationStore.state.lessonStars || {}
        );

  return baseList.map((u) => ({
    ...u,
    nodes: u.nodes.map((n) => {
      if (n.type === 'reward_chest') {
        const claimedStatus =
          n.isClaimed ||
          claimed.includes(n.id) ||
          (n.id === 'chest_01' && claimed.includes('unit_1_completion_chest'));
        return {
          ...n,
          isClaimed: claimedStatus,
          status: (claimedStatus ? 'completed' : n.status) as any,
        };
      }
      return n;
    }),
  }));
});

const currentUnit = computed<LearningUnit>(() => {
  return allUnits.value[selectedUnitIndex.value] || allUnits.value[0];
});

const activeLesson = computed(() => {
  const nodes = currentUnit.value.nodes;
  const active = nodes.find((n) => n.status === 'active' && n.type === 'lesson');
  if (active) return active;
  const firstIncomplete = nodes.find((n) => n.status !== 'completed' && n.type === 'lesson');
  if (firstIncomplete) return firstIncomplete;
  return nodes.find((n) => n.type === 'lesson');
});

const globalActiveLesson = computed<LearningNode | undefined>(() => {
  for (const unit of allUnits.value) {
    const active = unit.nodes.find((n) => n.type === 'lesson' && n.status === 'active');
    if (active) return active;
  }
  for (const unit of allUnits.value) {
    const incomplete = unit.nodes.find((n) => n.type === 'lesson' && n.status !== 'completed');
    if (incomplete) return incomplete;
  }
  return allUnits.value[0]?.nodes.find((n) => n.type === 'lesson');
});

function openTheoryForUnit(unit: LearningUnit) {
  theoryModalUnit.value = unit;
  isTheoryModalOpen.value = true;
}

function scrollToUnit(idx: number) {
  if (idx < 0 || idx >= allUnits.value.length) return;
  selectedUnitIndex.value = idx;
  const targetUnit = allUnits.value[idx];
  isProgrammaticScroll = true;
  if (scrollUnlockTimer) clearTimeout(scrollUnlockTimer);
  scrollUnlockTimer = setTimeout(() => {
    isProgrammaticScroll = false;
  }, 750);

  nextTick(() => {
    document.getElementById(`course-section-${targetUnit.id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
}

async function handleNodeClick(node: LearningNode) {
  if (node.status === 'locked') {
    gamificationStore.showToast('Supera la lección anterior para desbloquear este nodo.', false);
    return;
  }

  if (node.type === 'reward_chest') {
    if (isChestClaimed(node)) {
      gamificationStore.showToast('Ya reclamaste este cofre de la madriguera.', true);
      return;
    }

    if (isClaimingChest.value) return;
    isClaimingChest.value = true;

    try {
      await userStore.claimChestReward(node.id, node.bitsReward || 50);
    } finally {
      isClaimingChest.value = false;
    }
    return;
  }

  if (userStore.isSuspended) {
    isSuspendedModalOpen.value = true;
    return;
  }

  if (gamificationStore.hearts <= 0 && !gamificationStore.hasInfiniteHearts) {
    if (node.status === 'completed') {
      gamificationStore.isReinforcementMode = true;
      router.push(`/lesson/${node.id}`);
      return;
    }
    isOutOfHeartsModalOpen.value = true;
    return;
  }

  router.push(`/lesson/${node.id}`);
}

function handleStartFromTheoryModal(lessonId: string) {
  isTheoryModalOpen.value = false;
  router.push(`/lesson/${lessonId}`);
}

function startCurrentLesson() {
  const next = activeLesson.value || globalActiveLesson.value;
  if (next) {
    handleNodeClick(next);
  }
}

function handleOutOfHeartsShop() {
  isOutOfHeartsModalOpen.value = false;
  router.push('/tabs/shop');
}

const dailyGoalConfig = computed(() => {
  const key = (userStore.currentDailyGoal || 'constante') as DailyGoalType;
  return DAILY_GOAL_CONFIGS[key] || DAILY_GOAL_CONFIGS.constante;
});
const dailyCompletedToday = computed(() => gamificationStore.dailyLessonsCompletedToday);
const isDailyGoalReached = computed(() => dailyCompletedToday.value >= dailyGoalConfig.value.lessonsPerDay);
const dailyQuestRewardId = computed(() => `daily_mission_${todayDateStr}`);
const diagnosticProfile = computed(() => userStore.profile.diagnosticProfile);

function handleDiagnosticCourseSelected(courseIndex: number) {
  scrollToUnit(courseIndex);
}

function handleOutOfHeartsReinforce() {
  isOutOfHeartsModalOpen.value = false;
  gamificationStore.isReinforcementMode = true;
  if (gamificationStore.failedExerciseCount > 0) {
    router.push('/lesson/error-review');
    return;
  }
  const reinforceLessonId =
    gamificationStore.state.completedLessons?.[0] || 'inbox-scanner-1';
  router.push(`/lesson/${reinforceLessonId}`);
}

async function claimDailyQuest() {
  if (!isDailyGoalReached.value) {
    gamificationStore.showToast(
      `Completa ${dailyGoalConfig.value.lessonsPerDay} lección(es) hoy para reclamar esta meta (${dailyCompletedToday.value}/${dailyGoalConfig.value.lessonsPerDay}).`,
      false
    );
    return;
  }
  if (userStore.isRewardClaimed(dailyQuestRewardId.value) || isClaimingDailyQuest.value) return;
  isClaimingDailyQuest.value = true;
  try {
    await userStore.claimChestReward(dailyQuestRewardId.value, 25, 10);
  } finally {
    isClaimingDailyQuest.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col w-full select-none text-left">
    <!-- Header HUD: Ancho completo de borde a borde -->
    <HeaderHud title="Ruta De Aprendizaje" />

    <!-- Contenedor Maestro de Vista -->
    <main class="view-master-container flex-1 w-full pb-12 flex flex-col gap-6">
      <!-- Layout de 2 Columnas para Pantallas >= 992px -->
      <div class="flex flex-col lg:flex-row gap-8 items-start w-full">
        <!-- Columna Principal (65% en >= 992px): Diagnóstico Adaptativo + Selector de 6 Cursos + Árbol de lecciones -->
        <div class="w-full lg:w-[65%] flex flex-col gap-5">
          <!-- Adaptive Diagnostic / Personalized Route Banner -->
          <div
            v-if="diagnosticProfile?.completed"
            class="w-full bg-surface-container-low rounded-2xl p-3.5 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[22px] icon-filled">tune</span>
              </div>
              <div class="min-w-0">
                <span class="text-[10px] font-black uppercase tracking-wider text-primary block">
                  Ruta Personalizada · Nivel {{ diagnosticProfile.levelLabel }}
                </span>
                <p class="text-xs font-extrabold text-on-surface truncate">
                  Recomendado: {{ diagnosticProfile.recommendedCourseTitle }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl bg-primary/15 text-primary text-xs font-black hover:bg-primary/25 transition-colors"
                @click="scrollToUnit(diagnosticProfile.recommendedCourseIndex)"
              >
                Ir al curso
              </button>
              <button
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface-variant text-xs font-bold border border-outline-variant/40 hover:text-on-surface"
                @click="isDiagnosticModalOpen = true"
              >
                Rehacer
              </button>
            </div>
          </div>

          <div
            v-else-if="!diagnosticDismissed"
            class="w-full bg-gradient-to-r from-primary/15 via-surface-container-high to-tertiary/10 rounded-2xl p-4 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-primary text-[#291800] flex items-center justify-center shrink-0 shadow-xs">
                <span class="material-symbols-outlined text-[22px] icon-filled">explore</span>
              </div>
              <div class="min-w-0">
                <span class="text-[10px] font-black uppercase tracking-wider text-primary block">
                  Personaliza Tu Entrenamiento
                </span>
                <p class="text-xs font-extrabold text-on-surface leading-snug">
                  Haz el diagnóstico rápido de 4 preguntas para descubrir qué curso priorizar.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="px-3.5 py-2 rounded-xl btn-tactile-primary text-xs font-black"
                @click="isDiagnosticModalOpen = true"
              >
                Hacer Diagnóstico
              </button>
              <button
                type="button"
                class="px-2.5 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface"
                @click="diagnosticDismissed = true"
              >
                Luego
              </button>
            </div>
          </div>

          <!-- Barra de Salto Rápido a los 8 Cursos / Módulos -->
          <div class="w-full bg-surface-container-lowest p-3 rounded-3xl border border-outline-variant/40 shadow-xs">
            <div class="flex flex-wrap items-center justify-between gap-1 px-1 mb-2.5">
              <span class="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] icon-filled">hub</span>
                <span>8 Cursos Continuos · Incluye 2 Zonas Arcade</span>
              </span>
              <span class="text-[10px] font-bold text-on-surface-variant">
                Salta rápido a un curso o baja por todo el caminito
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <button
                v-for="(u, idx) in allUnits"
                :key="u.id"
                type="button"
                class="p-2.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-1 relative"
                :class="
                  selectedUnitIndex === idx
                    ? 'bg-primary text-white border-primary shadow-[0_3px_0_#b87b2e]'
                    : u.unitNumber === 7 || u.unitNumber === 8
                      ? 'bg-tertiary/10 text-on-surface border-tertiary/40 hover:border-tertiary'
                      : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:border-primary/50'
                "
                @click="scrollToUnit(idx)"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-[10px] font-black uppercase tracking-wider opacity-90">
                    Curso {{ u.unitNumber }}
                  </span>
                  <span
                    v-if="u.unitNumber === 7 || u.unitNumber === 8"
                    class="text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase"
                    :class="
                      selectedUnitIndex === idx
                        ? 'bg-white/25 text-white'
                        : u.unitNumber === 8
                          ? 'bg-primary text-[#291800]'
                          : 'bg-tertiary text-white'
                    "
                  >
                    {{ u.unitNumber === 8 ? '¡Nuevos!' : '¡Clásicos!' }}
                  </span>
                  <span v-else class="material-symbols-outlined text-[16px] icon-filled">
                    {{ u.icon || 'shield' }}
                  </span>
                </div>
                <span class="text-xs font-extrabold leading-tight line-clamp-2">
                  {{
                    u.unitNumber === 1
                      ? 'Phishing & Ing. Social'
                      : u.unitNumber === 2
                        ? 'Criptografía & Firewall'
                        : u.unitNumber === 3
                          ? 'Redes & Laberinto VPN'
                          : u.unitNumber === 4
                            ? 'Consola SOC & IA'
                            : u.unitNumber === 5
                              ? 'DevSecOps & Parcheo'
                              : u.unitNumber === 6
                                ? 'Forense & Threat Hunting'
                                : u.unitNumber === 7
                                  ? 'Zona Arcade 🎮'
                                  : 'Arcade Acción 🕹️'
                  }}
                </span>
                <div class="flex items-center justify-between text-[10px] font-black mt-0.5 opacity-90">
                  <span>Progreso</span>
                  <span>{{ u.progressPercentage }}%</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Daily Quest Chip Banner (Encima del Caminito Continuo) -->
          <div class="w-full">
            <div class="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3 border border-outline-variant/30">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-tertiary/15 flex items-center justify-center text-tertiary shrink-0">
                  <span class="material-symbols-outlined text-[20px] icon-filled">target</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] uppercase tracking-wider text-secondary font-black">
                      Meta Diaria ({{ dailyGoalConfig.title }})
                    </span>
                    <span
                      class="text-[10px] font-bold px-2 py-0.2 rounded-full"
                      :class="isDailyGoalReached ? 'bg-shield-green/20 text-shield-green' : 'bg-surface-container-high text-on-surface'"
                    >
                      {{ Math.min(dailyCompletedToday, dailyGoalConfig.lessonsPerDay) }}/{{ dailyGoalConfig.lessonsPerDay }}
                    </span>
                  </div>
                  <p class="text-xs text-on-surface truncate font-extrabold mt-0.5">
                    Supera {{ dailyGoalConfig.lessonsPerDay }} {{ dailyGoalConfig.lessonsPerDay === 1 ? 'lección' : 'lecciones' }} hoy ({{ dailyGoalConfig.minutesPerDay }} min/día)
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="shrink-0 bg-tertiary text-on-tertiary text-xs font-black px-3.5 py-1.5 rounded-full shadow-xs active:scale-95 transition-transform flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!isDailyGoalReached || userStore.isRewardClaimed(dailyQuestRewardId) || isClaimingDailyQuest"
                @click="claimDailyQuest"
              >
                <span class="material-symbols-outlined text-[15px] icon-filled">
                  {{ userStore.isRewardClaimed(dailyQuestRewardId) ? 'check_circle' : 'redeem' }}
                </span>
                <span>
                  {{
                    userStore.isRewardClaimed(dailyQuestRewardId)
                      ? 'Reclamado'
                      : isClaimingDailyQuest
                        ? 'Reclamando...'
                        : isDailyGoalReached
                          ? 'Reclamar +25 Bits'
                          : 'En progreso'
                  }}
                </span>
              </button>
            </div>
          </div>

          <!-- Ruta Continua Estilo Duolingo: Todos los 8 Cursos uno debajo del otro -->
          <div class="w-full flex flex-col gap-6">
            <section
              v-for="(unit, uIdx) in allUnits"
              :id="`course-section-${unit.id}`"
              :key="unit.id"
              class="w-full scroll-mt-20"
            >
              <CourseWindingPath
                :unit="unit"
                :is-first-unit="uIdx === 0"
                :is-recommended="Boolean(diagnosticProfile?.completed && diagnosticProfile.recommendedCourseIndex === uIdx)"
                :highlighted-lesson-id="globalActiveLesson?.id || null"
                :is-claiming-chest="isClaimingChest"
                :is-chest-claimed-fn="isChestClaimed"
                @node-click="handleNodeClick"
                @open-theory="openTheoryForUnit"
              />
            </section>
          </div>

          <!-- Bottom Action Card for Next Challenge -->
          <div v-if="activeLesson" class="w-full mt-2">
            <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-md border border-outline-variant/30 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 shadow-xs">
                  <span class="material-symbols-outlined text-[26px]">{{ activeLesson.icon || 'security' }}</span>
                </div>
                <div class="min-w-0">
                  <span class="text-[10px] font-black uppercase tracking-wider text-primary">
                    Siguiente desafío · {{ currentUnit.moduleBadge }}
                  </span>
                  <h3 class="text-sm font-black text-on-surface truncate">{{ activeLesson.title }}</h3>
                  <p class="text-xs text-on-surface-variant truncate">{{ activeLesson.subtitle }}</p>
                </div>
              </div>
              <button
                type="button"
                class="relative shrink-0 h-11 px-5 bg-primary text-white font-black text-xs rounded-xl shadow-md active:translate-y-1 transition-all flex items-center justify-center gap-1.5 btn-tactile-primary"
                @click="startCurrentLesson"
              >
                <span>Comenzar</span>
                <span class="material-symbols-outlined text-[18px]">bolt</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Columna Lateral Derecha (35% en >= 992px): Racha, Ranking y Consejo de Suri -->
        <aside class="w-full lg:w-[35%] lg:sticky lg:top-20 flex flex-col gap-5">
          <!-- Widget 1: Racha Interactiva de Guardia (Dinámica por Día de la Semana) -->
          <div class="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-[24px] text-[#e1a653] icon-filled shrink-0">
                  local_fire_department
                </span>
                <div class="min-w-0">
                  <h3 class="text-sm font-black uppercase tracking-wider text-on-surface leading-tight">
                    Racha de Guardia
                  </h3>
                  <span class="text-[10px] font-bold text-on-surface-variant block">
                    Hoy: {{ todayFullLabel }}
                  </span>
                </div>
              </div>
              <span class="text-[11px] font-black text-primary px-2.5 py-0.5 rounded-full bg-primary/10 shrink-0">
                {{ gamificationStore.streakMultiplier }}x XP Activo
              </span>
            </div>

            <!-- Big Streak Display -->
            <div class="flex items-center justify-between bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
              <div class="min-w-0 pr-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-3xl font-black text-on-surface leading-none">
                    {{ effectiveStreakDays }} {{ effectiveStreakDays === 1 ? 'Día' : 'Días' }}
                  </span>
                  <span
                    class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                    :class="
                      isTodayStreakDone
                        ? 'bg-shield-green/15 text-shield-green'
                        : 'bg-primary/15 text-primary'
                    "
                  >
                    {{ isTodayStreakDone ? '✓ Guardia Hoy Lista' : '• Pendiente Hoy' }}
                  </span>
                </div>
                <span class="text-xs text-on-surface-variant font-medium mt-1.5 block">
                  {{
                    isTodayStreakDone
                      ? '¡Guardia del día completada! Vuelve mañana para extender tu racha.'
                      : effectiveStreakDays > 0
                        ? 'Completa una lección hoy para mantener encendida tu racha.'
                        : 'Comienza tu racha hoy completando tu primera misión.'
                  }}
                </span>
              </div>
              <div
                class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all"
                :class="
                  isTodayStreakDone
                    ? 'bg-primary text-white shadow-[0_3px_0_#b87b2e]'
                    : 'bg-primary/15 text-[#e1a653]'
                "
              >
                <span class="material-symbols-outlined text-[30px] icon-filled">local_fire_department</span>
              </div>
            </div>

            <!-- Weekdays Pills Tracker (Lunes a Domingo de la semana en curso) -->
            <div class="flex items-center justify-between gap-1 pt-1">
              <div
                v-for="d in weekDays"
                :key="d.dateStr"
                class="flex flex-col items-center gap-1 flex-1 py-1.5 rounded-xl transition-all"
                :class="d.isToday ? 'bg-primary/10 ring-1 ring-primary/40' : ''"
                :title="`${d.name} ${d.dayNumber}${d.isToday ? ' (Hoy)' : ''}`"
              >
                <span
                  class="text-[10px] font-black uppercase"
                  :class="d.isToday ? 'text-primary' : 'text-on-surface-variant'"
                >
                  {{ d.name }}
                </span>
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  :class="
                    d.active
                      ? 'bg-primary text-white shadow-xs'
                      : d.isToday
                        ? 'bg-surface-container-highest text-primary border-2 border-primary border-dashed'
                        : 'bg-surface-container text-on-surface-variant/60'
                  "
                >
                  <span v-if="d.active" class="material-symbols-outlined text-[15px] icon-filled">
                    local_fire_department
                  </span>
                  <span v-else class="text-[10px] font-extrabold">{{ d.dayNumber }}</span>
                </div>
                <span
                  class="text-[9px] font-black uppercase tracking-tighter h-3 leading-none"
                  :class="d.isToday ? 'text-primary' : 'text-transparent'"
                >
                  {{ d.isToday ? 'Hoy' : '·' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Widget 2: Ranking Semanal Rápido -->
          <div class="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-3.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[22px] text-primary icon-filled">emoji_events</span>
                <h3 class="text-sm font-black uppercase tracking-wider text-on-surface">Ranking Semanal</h3>
              </div>
              <router-link
                to="/tabs/leaderboard"
                class="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Ver tabla</span>
                <span class="material-symbols-outlined text-[15px]">chevron_right</span>
              </router-link>
            </div>

            <p class="text-xs text-on-surface-variant leading-tight">
              División <strong>Liga {{ gamificationStore.state.currentLeague || 'Bronce' }}</strong>. Los 5 primeros ascienden al finalizar la semana.
            </p>

            <!-- Quick Mini Leaderboard List (Real Firestore Users) -->
            <div class="flex flex-col gap-2 pt-1">
              <div
                v-for="entry in displayedWeeklyRanking"
                :key="entry.id"
                class="flex items-center justify-between p-2 rounded-xl text-xs transition-all"
                :class="
                  entry.isCurrentUser
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-surface-container-low/70'
                "
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span
                    class="w-5 text-center font-black shrink-0"
                    :class="
                      entry.rank === 1
                        ? 'text-amber-500'
                        : entry.rank === 2
                          ? 'text-stone-400'
                          : entry.rank === 3
                            ? 'text-amber-700'
                            : 'text-on-surface-variant'
                    "
                  >
                    {{ entry.rank }}
                  </span>
                  <div class="w-6 h-6 rounded-full bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant/30 flex items-center justify-center">
                    <img
                      :src="resolveLeaderboardAvatar(entry.avatarUrl)"
                      :alt="entry.displayName"
                      class="w-full h-full object-contain"
                    />
                  </div>
                  <span
                    class="font-extrabold truncate"
                    :class="entry.isCurrentUser ? 'text-primary' : 'text-on-surface'"
                  >
                    {{ entry.displayName }}
                    <span v-if="entry.isCurrentUser" class="text-[10px] font-black ml-0.5">(Tú)</span>
                  </span>
                </div>
                <span class="font-black text-primary shrink-0 ml-2">{{ entry.xp.toLocaleString() }} XP</span>
              </div>
            </div>
          </div>

          <!-- Widget 3: Centro de Errores (Repaso Dirigido) -->
          <div class="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[22px] text-error icon-filled">healing</span>
                <h3 class="text-sm font-black uppercase tracking-wider text-on-surface">Centro de Errores</h3>
              </div>
              <span
                class="text-[11px] font-black px-2.5 py-0.5 rounded-full"
                :class="gamificationStore.failedExerciseCount > 0 ? 'bg-error/15 text-error' : 'bg-shield-green/15 text-shield-green'"
              >
                {{
                  gamificationStore.failedExerciseCount > 0
                    ? `${gamificationStore.failedExerciseCount} pendientes`
                    : 'Sin fallos'
                }}
              </span>
            </div>

            <p class="text-xs text-on-surface-variant leading-relaxed">
              {{
                gamificationStore.failedExerciseCount > 0
                  ? 'Refuerza los escenarios donde cometiste errores recientes para blindar tus puntos débiles.'
                  : 'Tu historial de errores está limpio. También puedes hacer un repaso rápido sin perder vidas.'
              }}
            </p>

            <button
              type="button"
              class="w-full py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
              :class="gamificationStore.failedExerciseCount > 0 ? 'bg-error text-white hover:bg-error/90 shadow-xs' : 'bg-surface-container-high text-on-surface hover:bg-surface-container'"
              @click="router.push('/lesson/error-review')"
            >
              <span class="material-symbols-outlined text-[16px]">target</span>
              <span>{{ gamificationStore.failedExerciseCount > 0 ? 'Practicar Errores Reales' : 'Repaso Táctico Rápido' }}</span>
            </button>
          </div>

          <!-- Widget 4: Consejo Diario de Suri -->
          <div class="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-5 rounded-3xl border border-outline-variant/30 shadow-xs relative overflow-hidden flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                Consejo Diario de Suri
              </span>
              <button
                type="button"
                class="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                title="Siguiente consejo"
                @click="nextTip"
              >
                <span class="material-symbols-outlined text-[16px]">sync</span>
              </button>
            </div>

            <div class="flex items-start gap-3.5 mt-1">
              <div class="rounded-2xl bg-surface-container-lowest p-1 shadow-sm border border-outline-variant/30 shrink-0 flex items-center justify-center">
                <SuriMascotAnimated
                  pose="idea"
                  size="sm"
                  :interactive="true"
                  :show-shadow="false"
                  @interact="nextTip"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-on-surface leading-relaxed font-semibold">
                  "{{ dailyTip }}"
                </p>
                <span class="text-[10px] text-on-surface-variant font-bold block mt-1.5">
                  — Suri, Guardián de la Madriguera
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Códice / Manual Teórico del Curso Seleccionado -->
    <UnitTheoryModal
      :is-open="isTheoryModalOpen"
      :unit="theoryModalUnit || currentUnit"
      @close="isTheoryModalOpen = false"
      @select-lesson="handleStartFromTheoryModal"
    />

    <!-- Out of Hearts Blocking Modal -->
    <OutOfHeartsModal
      :is-open="isOutOfHeartsModalOpen"
      :next-heart-timer="gamificationStore.formattedHeartTimer"
      @go-to-shop="handleOutOfHeartsShop"
      @start-reinforcement="handleOutOfHeartsReinforce"
      @go-to-map="isOutOfHeartsModalOpen = false"
    />

    <!-- Suspended Account Modal for SME Collaborators -->
    <SuspendedAccountModal
      :is-open="isSuspendedModalOpen"
      @close="isSuspendedModalOpen = false"
    />

    <!-- Adaptive Diagnostic Modal -->
    <DiagnosticModal
      :is-open="isDiagnosticModalOpen"
      @close="isDiagnosticModalOpen = false"
      @select-course="handleDiagnosticCourseSelected"
    />
  </div>
</template>
