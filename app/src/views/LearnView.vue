<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
const isDiagnosticModalOpen = ref<boolean>(false);
const diagnosticDismissed = ref<boolean>(false);
const isClaimingChest = ref<boolean>(false);
const isClaimingDailyQuest = ref<boolean>(false);
const selectedUnitIndex = ref<number>(0);

// Real Weekly Leaderboard State (synced with Firestore /users just like Leagues tab)
const rawWeeklyLeaderboard = ref<LeagueLeaderboardEntry[]>([]);
const isLoadingLeaderboard = ref<boolean>(true);
let unsubscribeLeaderboard: (() => void) | null = null;

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

onMounted(async () => {
  if (gamificationStore.units.length < 7) {
    await gamificationStore.loadGamificationData();
  }

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
    gamificationStore.units.length >= 7
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
  if (activeLesson.value) {
    handleNodeClick(activeLesson.value);
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
  if (courseIndex >= 0 && courseIndex < allUnits.value.length) {
    selectedUnitIndex.value = courseIndex;
  }
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
                @click="selectedUnitIndex = diagnosticProfile.recommendedCourseIndex"
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

          <!-- Selector Rápido de los 7 Cursos / Módulos -->
          <div class="w-full bg-surface-container-lowest p-3 rounded-3xl border border-outline-variant/40 shadow-xs">
            <div class="flex flex-wrap items-center justify-between gap-1 px-1 mb-2.5">
              <span class="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] icon-filled">hub</span>
                <span>7 Cursos · Incluyendo Zona Arcade Clásica</span>
              </span>
              <span class="text-[10px] font-bold text-on-surface-variant">
                Selecciona un módulo para explorar su teoría y videojuegos
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
                    : u.unitNumber === 7
                      ? 'bg-tertiary/10 text-on-surface border-tertiary/40 hover:border-tertiary'
                      : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:border-primary/50'
                "
                @click="selectedUnitIndex = idx"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-[10px] font-black uppercase tracking-wider opacity-90">
                    Curso {{ u.unitNumber }}
                  </span>
                  <span
                    v-if="u.unitNumber === 7"
                    class="text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase"
                    :class="selectedUnitIndex === idx ? 'bg-white/25 text-white' : 'bg-tertiary text-white'"
                  >
                    ¡Clásicos!
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
                                : 'Zona Arcade 🎮'
                  }}
                </span>
                <div class="flex items-center justify-between text-[10px] font-black mt-0.5 opacity-90">
                  <span>Progreso</span>
                  <span>{{ u.progressPercentage }}%</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Unit Banner con Botón de Manual Teórico del Curso -->
          <div class="w-full">
            <div class="relative overflow-hidden bg-surface-container-high rounded-3xl p-5 lg:p-6 shadow-xs border border-outline-variant/30">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div class="flex-1 min-w-0">
                  <div class="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-0.5 rounded-full mb-2">
                    <span class="material-symbols-outlined text-[15px] icon-filled">{{ currentUnit.icon || 'shield' }}</span>
                    <span class="text-[10px] font-black uppercase tracking-wider">{{ currentUnit.moduleBadge }}</span>
                  </div>
                  <h2 class="text-base lg:text-lg font-black text-on-surface">
                    {{ currentUnit.title }}
                  </h2>
                  <p class="text-xs text-on-surface-variant mt-1 leading-snug">
                    {{ currentUnit.description }}
                  </p>
                </div>

                <!-- Botón Destacado para Abrir el Códice / Manual Teórico del Curso -->
                <button
                  type="button"
                  class="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-primary font-black text-xs shadow-sm border-2 border-primary/40 hover:bg-primary hover:text-white active:scale-95 transition-all shrink-0 flex items-center gap-2"
                  title="Abrir Códice y Teoría Completa del Curso"
                  @click="isTheoryModalOpen = true"
                >
                  <span class="material-symbols-outlined text-[20px] icon-filled">menu_book</span>
                  <div class="text-left leading-tight">
                    <span class="block">Manual Teórico</span>
                    <span class="text-[10px] opacity-80 font-bold">
                      {{ currentUnit.theoryGuide?.estimatedStudyMinutes || 15 }} min lectura
                    </span>
                  </div>
                </button>
              </div>

              <!-- Unit Progress Meter -->
              <div class="mt-4 relative z-10">
                <div class="flex justify-between items-center text-on-surface-variant text-xs mb-1.5 font-bold">
                  <span>Progreso del Curso {{ currentUnit.unitNumber }}</span>
                  <span class="text-primary font-black">{{ currentUnit.progressPercentage }}%</span>
                </div>
                <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    class="h-full bg-primary rounded-full relative overflow-hidden transition-all duration-700"
                    :style="{ width: `${currentUnit.progressPercentage}%` }"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Daily Quest Chip Banner (Tied to Real Daily Goal) -->
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

          <!-- Main Zig-Zag Path Canvas: Centrado y holgado -->
          <div class="relative w-full py-4 flex flex-col items-center min-h-[620px]">
            <!-- SVG Sinusoidal Connecting Thread with Cyber Currents -->
            <svg
              class="absolute top-8 left-1/2 -translate-x-1/2 w-80 h-[620px] pointer-events-none z-0"
              fill="none"
              viewBox="0 0 280 650"
            >
              <path
                d="M 75 55 C 75 110, 140 115, 140 170 C 140 225, 205 230, 205 285 C 205 340, 140 345, 140 400 C 140 455, 75 460, 75 515 C 75 570, 140 575, 140 610"
                stroke="var(--color-outline-variant, #d4c4b2)"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="12"
              ></path>
              <path
                d="M 75 55 C 75 110, 140 115, 140 170 C 140 225, 205 230, 205 285"
                stroke="#e1a653"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="12"
              ></path>
              <path
                d="M 75 55 C 75 110, 140 115, 140 170 C 140 225, 205 230, 205 285"
                stroke="#ffffff"
                stroke-dasharray="6 12"
                stroke-linecap="round"
                stroke-width="4"
              ></path>
            </svg>

            <!-- Dynamic Nodes List -->
            <div
              v-for="node in currentUnit.nodes"
              :key="node.id"
              class="relative z-10 w-full flex flex-col mb-8"
              :class="{
                'items-start pl-8 sm:pl-16': node.lanePosition === 'left',
                'items-center': node.lanePosition === 'center',
                'items-end pr-8 sm:pr-16': node.lanePosition === 'right',
              }"
            >
              <!-- Case A: Reward Chest -->
              <template v-if="node.type === 'reward_chest'">
                <!-- Claimed Chest -->
                <div
                  v-if="isChestClaimed(node)"
                  class="relative flex flex-col items-center opacity-60 select-none cursor-default"
                  title="Cofre de unidad ya reclamado"
                >
                  <button
                    type="button"
                    class="relative w-[64px] h-[64px] rounded-2xl bg-surface-container flex items-center justify-center shadow-inner border border-outline-variant/30 cursor-not-allowed"
                    disabled
                  >
                    <span class="material-symbols-outlined text-[28px] text-on-surface-variant">lock_open</span>
                  </button>
                  <span class="mt-2 text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span class="material-symbols-outlined text-[12px] text-shield-green icon-filled">check_circle</span>
                    <span>Reclamado</span>
                  </span>
                </div>

                <!-- Active / Available Chest -->
                <div
                  v-else-if="node.status === 'active'"
                  class="relative flex flex-col items-center group cursor-pointer"
                  :class="{ 'opacity-50 pointer-events-none': isClaimingChest }"
                  @click="handleNodeClick(node)"
                >
                  <button
                    type="button"
                    class="relative w-[64px] h-[64px] rounded-2xl bg-surface-container flex items-center justify-center shadow-md active:translate-y-1 transition-transform border border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="isClaimingChest"
                  >
                    <div class="absolute inset-0 rounded-2xl bg-outline-variant -bottom-1 -z-10"></div>
                    <span class="material-symbols-outlined text-[30px] text-primary icon-filled">inventory_2</span>
                    <span v-if="!isClaimingChest" class="absolute -top-1 -right-1 flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </button>
                  <span class="mt-2 text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full shadow-xs">
                    {{ isClaimingChest ? 'Abriendo...' : `+${node.bitsReward || 50} Bits` }}
                  </span>
                </div>

                <!-- Locked Chest -->
                <div
                  v-else
                  class="relative flex flex-col items-center opacity-60 cursor-not-allowed"
                  @click="handleNodeClick(node)"
                >
                  <button
                    type="button"
                    class="relative w-[64px] h-[64px] rounded-2xl bg-surface-container-highest flex items-center justify-center shadow-inner cursor-not-allowed"
                    disabled
                  >
                    <div class="absolute inset-0 rounded-2xl bg-outline-variant -bottom-1 -z-10"></div>
                    <span class="material-symbols-outlined text-[26px] text-outline icon-filled">lock</span>
                  </button>
                  <span class="mt-2 text-xs text-outline bg-surface-container-low px-2.5 py-0.5 rounded-full font-medium">
                    {{ node.title }} (+{{ node.bitsReward || 50 }} Bits)
                  </span>
                </div>
              </template>

              <!-- Case B: Lesson Node -->
              <template v-else>
                <!-- 1. COMPLETED Lesson Node -->
                <div
                  v-if="node.status === 'completed'"
                  class="relative flex flex-col items-center group cursor-pointer"
                  @click="handleNodeClick(node)"
                >
                  <div class="absolute -top-5 flex items-center gap-0.5 bg-surface-container-lowest px-2 py-0.5 rounded-full shadow-xs border border-outline-variant/30 z-20">
                    <span
                      v-for="starIdx in 3"
                      :key="starIdx"
                      class="material-symbols-outlined text-[13px] icon-filled"
                      :class="starIdx <= (node.stars || 3) ? 'text-primary' : 'text-outline-variant/40'"
                    >
                      star
                    </span>
                  </div>

                  <button
                    type="button"
                    class="relative w-[68px] h-[68px] rounded-full bg-shield-green text-white flex items-center justify-center shadow-md active:translate-y-1 transition-all"
                  >
                    <div class="absolute inset-0 rounded-full bg-[#15803d] -bottom-1 -z-10"></div>
                    <span class="material-symbols-outlined text-[30px] font-black">check</span>
                  </button>
                  <span class="mt-2 text-xs font-bold text-on-surface bg-surface-container-low px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <span>{{ node.title }}</span>
                    <span class="material-symbols-outlined text-[13px] text-shield-green icon-filled">check_circle</span>
                  </span>
                </div>

                <!-- 2. ACTIVE / CURRENT Lesson Node -->
                <div
                  v-else-if="node.status === 'active'"
                  class="relative flex flex-col items-center"
                >
                  <!-- Suri Live Animated Speech Bubble on first active node -->
                  <div
                    v-if="activeLesson?.id === node.id"
                    class="relative flex flex-col items-center mb-1"
                  >
                    <div class="bg-surface-container-lowest px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 mb-1 relative border border-outline-variant/20">
                      <span class="text-xs font-extrabold text-primary">
                        {{ node.isVideoGame ? '🎮 ¡Videojuego Listo!' : '¡Te toca a ti!' }}
                      </span>
                      <span class="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                      <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-[6px] border-t-surface-container-lowest"></div>
                    </div>
                    <SuriMascotAnimated
                      :pose="node.isVideoGame ? 'cool' : 'idle'"
                      size="sm"
                      :interactive="true"
                      :auto-blink="true"
                      :show-shadow="false"
                    />
                  </div>

                  <!-- Pulsing Target Node -->
                  <div
                    class="relative flex flex-col items-center cursor-pointer"
                    @click="handleNodeClick(node)"
                  >
                    <div class="absolute -inset-2.5 rounded-full bg-primary/30 animate-ping pointer-events-none"></div>
                    <button
                      type="button"
                      class="relative w-[76px] h-[76px] rounded-full text-white flex items-center justify-center shadow-lg active:translate-y-1.5 transition-transform"
                      :class="node.isVideoGame ? 'bg-tertiary shadow-[0_4px_0_#004b55]' : 'bg-primary btn-tactile-primary'"
                    >
                      <span class="material-symbols-outlined text-[36px] icon-filled">{{ node.icon || 'play_arrow' }}</span>
                    </button>
                    <div class="mt-2 flex flex-col items-center max-w-[230px] text-center">
                      <span class="text-xs font-black text-on-primary-fixed bg-primary-fixed px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-[15px]">
                          {{ node.isVideoGame ? 'sports_esports' : 'play_arrow' }}
                        </span>
                        <span>{{ node.title }}</span>
                      </span>
                      <span
                        v-if="node.gameTypeLabel"
                        class="text-[10px] font-black text-tertiary bg-tertiary/10 px-2.5 py-0.5 rounded-full mt-1"
                      >
                        {{ node.gameTypeLabel }} • 📘 Teoría
                      </span>
                      <span class="text-[10px] text-on-surface-variant font-bold mt-0.5">
                        +{{ node.expReward }} EXP • {{ node.estimatedMinutes }} min
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 3. LOCKED Lesson Node -->
                <div
                  v-else
                  class="relative flex flex-col items-center opacity-65 cursor-not-allowed"
                  @click="handleNodeClick(node)"
                >
                  <button
                    type="button"
                    class="relative w-[64px] h-[64px] rounded-full bg-surface-container-highest flex items-center justify-center shadow-inner cursor-not-allowed"
                    disabled
                  >
                    <div class="absolute inset-0 rounded-full bg-outline-variant -bottom-1 -z-10"></div>
                    <span class="material-symbols-outlined text-[26px] text-outline icon-filled">lock</span>
                  </button>
                  <span class="mt-2 text-xs text-outline bg-surface-container-low px-2.5 py-0.5 rounded-full font-medium">
                    {{ node.title }}
                  </span>
                  <span v-if="node.gameTypeLabel" class="text-[10px] text-on-surface-variant/70 font-bold mt-0.5">
                    {{ node.gameTypeLabel }}
                  </span>
                </div>
              </template>
            </div>
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
      :unit="currentUnit"
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
