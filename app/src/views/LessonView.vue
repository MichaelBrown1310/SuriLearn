<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useUserStore } from '../stores/useUserStore';
import { useFirestore } from '../composables/useFirestore';
import { Exercise, LessonSessionSummary, InboxVerdict } from '../types/exercises';
import SuriFeedbackModal from '../components/common/SuriFeedbackModal.vue';
import LessonVictoryModal from '../components/common/LessonVictoryModal.vue';
import OutOfHeartsModal from '../components/common/OutOfHeartsModal.vue';
import SuspendedAccountModal from '../components/common/SuspendedAccountModal.vue';
import LessonTheoryBriefing from '../components/common/LessonTheoryBriefing.vue';
import InboxThreatScanner from '../components/games/InboxThreatScanner.vue';
import UrlInspector from '../components/games/UrlInspector.vue';
import PasswordVaultBuilder from '../components/games/PasswordVaultBuilder.vue';
import SocialEngineeringChat from '../components/games/SocialEngineeringChat.vue';
import PermissionGatekeeper from '../components/games/PermissionGatekeeper.vue';
import RapidTriageRadar from '../components/games/RapidTriageRadar.vue';
import FirewallDefenseGame from '../components/games/FirewallDefenseGame.vue';
import NetworkMazeGame from '../components/games/NetworkMazeGame.vue';
import IncidentCommandGame from '../components/games/IncidentCommandGame.vue';
import CodePatcherGame from '../components/games/CodePatcherGame.vue';
import ForensicInvestigatorGame from '../components/games/ForensicInvestigatorGame.vue';
import { getSuriImage } from '../utils/suriAssets';
import { getNextLessonId, getLessonNode } from '../data/curriculum';

const route = useRoute();
const router = useRouter();
const gamificationStore = useGamificationStore();
const userStore = useUserStore();
const firestore = useFirestore();

const lessonId = ref<string>((route.params.id as string) || 'inbox-scanner-1');
const exercises = ref<Exercise[]>([]);
const currentExerciseIndex = ref<number>(0);
const mistakesCount = ref<number>(0);
const isModalOpen = ref<boolean>(false);
const showVictoryModal = ref<boolean>(false);
const isOutOfHeartsModalOpen = ref<boolean>(false);
const isSuspendedModalOpen = ref<boolean>(false);
const isCurrentCorrect = ref<boolean>(false);
const isSessionFinished = ref<boolean>(false);
const lastSessionSummary = ref<LessonSessionSummary | null>(null);
const lastSessionOutcome = ref<{
  passed: boolean;
  earnedXp: number;
  earnedBits: number;
  stars: number;
  leaguePromoted: boolean;
  newLeague: string;
} | null>(null);
const correctIdsInSession = ref<string[]>([]);
const isShowingTheory = ref<boolean>(true);

const suriImg = getSuriImage('idle');

const isErrorReview = computed(() => lessonId.value === 'error-review');
const currentLessonNode = computed(() => (isErrorReview.value ? undefined : getLessonNode(lessonId.value)));
const nextLessonId = computed(() => (isErrorReview.value ? null : getNextLessonId(lessonId.value)));
const nextLessonNode = computed(() => (nextLessonId.value ? getLessonNode(nextLessonId.value) : null));
const currentUnitLabel = computed(() => {
  if (isErrorReview.value) return 'Centro de Errores · Repaso Dirigido';
  const unitId = currentLessonNode.value?.unitId || 'unit_01';
  const num = Number(unitId.replace('unit_', '')) || 1;
  return `Curso ${num} · Lección Superada`;
});

const hasTheorySlides = computed(() => {
  return !isErrorReview.value && (currentLessonNode.value?.theorySlides?.length || 0) > 0;
});

const currentExercise = computed(() => {
  return exercises.value[currentExerciseIndex.value];
});

const progressPercentage = computed(() => {
  if (isShowingTheory.value && hasTheorySlides.value) return 5;
  if (exercises.value.length === 0) return 0;
  return Math.round(((currentExerciseIndex.value + 0.2) / exercises.value.length) * 100);
});

const accuracyPercentage = computed(() => {
  if (!exercises.value.length) return 100;
  const correct = Math.max(0, exercises.value.length - mistakesCount.value);
  return Math.round((correct / exercises.value.length) * 100);
});

onMounted(async () => {
  if (userStore.isSuspended) {
    isSuspendedModalOpen.value = true;
    return;
  }

  if (
    gamificationStore.hearts <= 0 &&
    !gamificationStore.hasInfiniteHearts &&
    !gamificationStore.isReinforcementMode
  ) {
    isOutOfHeartsModalOpen.value = true;
    return;
  }
  exercises.value = await firestore.getLessonExercises(
    lessonId.value,
    gamificationStore.state.failedExerciseIds || []
  );
  correctIdsInSession.value = [];
  isShowingTheory.value = hasTheorySlides.value;
});

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      lessonId.value = newId as string;
      currentExerciseIndex.value = 0;
      mistakesCount.value = 0;
      correctIdsInSession.value = [];
      isModalOpen.value = false;
      showVictoryModal.value = false;
      isOutOfHeartsModalOpen.value = false;
      isSessionFinished.value = false;
      lastSessionSummary.value = null;
      lastSessionOutcome.value = null;

      if (
        gamificationStore.hearts <= 0 &&
        !gamificationStore.hasInfiniteHearts &&
        !gamificationStore.isReinforcementMode
      ) {
        isOutOfHeartsModalOpen.value = true;
        return;
      }

      exercises.value = await firestore.getLessonExercises(
        lessonId.value,
        gamificationStore.state.failedExerciseIds || []
      );
      isShowingTheory.value = hasTheorySlides.value;
    }
  }
);

function handleExit() {
  if (confirm('¿Deseas salir de la sesión? Perderás el progreso actual de esta misión.')) {
    gamificationStore.isReinforcementMode = false;
    router.push('/tabs/learn');
  }
}

// Handler for InboxThreatScanner
function handleInboxVerdict(verdict: InboxVerdict) {
  const ex = currentExercise.value;
  if (!ex || ex.type !== 'inbox_simulator') return;

  const isCorrect = verdict === ex.correctVerdict;
  processVerdict(isCorrect);
}

// Handler for UrlInspector
function handleUrlInspectorSubmit(selectedSegmentId: string) {
  const ex = currentExercise.value;
  if (!ex || ex.type !== 'url_inspector') return;

  const isCorrect = selectedSegmentId === ex.maliciousSegmentId;
  processVerdict(isCorrect);
}

// Handler for PasswordVaultBuilder
function handlePasswordSubmit(result: { isStrongEnough: boolean }) {
  processVerdict(result.isStrongEnough);
}

// Handler for PermissionGatekeeper
function handlePermissionSubmit(verdict: 'deny' | 'allow') {
  const ex = currentExercise.value;
  if (!ex || ex.type !== 'permission_swipe') return;
  const isCorrect = verdict === ex.expectedVerdict;
  processVerdict(isCorrect);
}

// Handler for Boolean minigames & new interactive video games (Chat, Triage, Firewall Arcade, Network Maze, Incident SOC)
function handleBooleanSubmit(isSuccess: boolean) {
  processVerdict(isSuccess);
}

async function processVerdict(isCorrect: boolean) {
  isCurrentCorrect.value = isCorrect;
  const exId = currentExercise.value?.id;

  if (isCorrect) {
    if (exId && !correctIdsInSession.value.includes(exId)) {
      correctIdsInSession.value.push(exId);
    }
  } else {
    mistakesCount.value += 1;
    if (exId) {
      gamificationStore.recordExerciseFailure(exId).catch(() => {});
    }
    await gamificationStore.deductHeart();

    // Block immediately if user has no hearts left (and is not Pro or Reinforcement)
    if (
      gamificationStore.hearts <= 0 &&
      !gamificationStore.hasInfiniteHearts &&
      !gamificationStore.isReinforcementMode
    ) {
      isModalOpen.value = false;
      isOutOfHeartsModalOpen.value = true;
      return;
    }
  }

  isModalOpen.value = true;
}

async function handleModalContinue() {
  isModalOpen.value = false;

  if (currentExerciseIndex.value < exercises.value.length - 1) {
    currentExerciseIndex.value += 1;
  } else {
    // Lesson Complete!
    isSessionFinished.value = true;
    const isPerfect = mistakesCount.value === 0;
    const baseXp = isErrorReview.value ? 15 : (currentLessonNode.value?.expReward || 15);
    const earnedXp = isPerfect ? baseXp + 5 : baseXp;
    const earnedBits = currentLessonNode.value?.isVideoGame ? 20 : 10;
    const totalEx = exercises.value.length || 1;
    const correctAnswers = Math.max(0, totalEx - mistakesCount.value);

    const summary: LessonSessionSummary = {
      lessonId: lessonId.value,
      unitId: currentLessonNode.value?.unitId || 'unit_01',
      totalExercises: totalEx,
      correctAnswersCount: correctAnswers,
      mistakesCount: mistakesCount.value,
      earnedXp,
      earnedBits,
      isPerfectScore: isPerfect,
      heartsRemaining: gamificationStore.hearts,
      streakAppliedMultiplier: gamificationStore.streakMultiplier,
      results: [],
      completedAt: new Date().toISOString(),
    };

    lastSessionSummary.value = summary;

    if (gamificationStore.isReinforcementMode) {
      const restored = await gamificationStore.completeReinforcementSession(isPerfect);
      lastSessionOutcome.value = {
        passed: restored,
        earnedXp: restored ? 10 : 5,
        earnedBits: 0,
        stars: restored ? 3 : 1,
        leaguePromoted: false,
        newLeague: gamificationStore.state.currentLeague || 'Bronce',
      };
      if (restored && correctIdsInSession.value.length > 0) {
        await gamificationStore.clearResolvedErrors(correctIdsInSession.value);
      }
    } else {
      const outcome = await gamificationStore.completeLesson(summary);
      lastSessionOutcome.value = outcome;
      if (outcome.passed && correctIdsInSession.value.length > 0) {
        await gamificationStore.clearResolvedErrors(correctIdsInSession.value);
      }
    }

    showVictoryModal.value = true;
  }
}

async function handleRetryLesson() {
  showVictoryModal.value = false;
  currentExerciseIndex.value = 0;
  mistakesCount.value = 0;
  correctIdsInSession.value = [];
  isModalOpen.value = false;
  isSessionFinished.value = false;
  lastSessionSummary.value = null;
  lastSessionOutcome.value = null;
  exercises.value = await firestore.getLessonExercises(
    lessonId.value,
    gamificationStore.state.failedExerciseIds || []
  );
}

function handleNextLesson(nextId: string) {
  showVictoryModal.value = false;
  router.push(`/lesson/${nextId}`);
}

function handleGoToMap() {
  showVictoryModal.value = false;
  gamificationStore.isReinforcementMode = false;
  router.push('/tabs/learn');
}

function handleOutOfHeartsShop() {
  isOutOfHeartsModalOpen.value = false;
  router.push('/tabs/shop');
}

async function handleOutOfHeartsReinforce() {
  isOutOfHeartsModalOpen.value = false;
  gamificationStore.isReinforcementMode = true;

  const reinforceLessonId =
    gamificationStore.state.completedLessons?.[0] || lessonId.value;

  if (reinforceLessonId === lessonId.value) {
    currentExerciseIndex.value = 0;
    mistakesCount.value = 0;
    isModalOpen.value = false;
    showVictoryModal.value = false;
    isSessionFinished.value = false;
    lastSessionSummary.value = null;
    exercises.value = await firestore.getLessonExercises(lessonId.value);
  } else {
    router.push(`/lesson/${reinforceLessonId}`);
  }
}

function handleOutOfHeartsMap() {
  isOutOfHeartsModalOpen.value = false;
  gamificationStore.isReinforcementMode = false;
  router.push('/tabs/learn');
}

onUnmounted(() => {
  gamificationStore.isReinforcementMode = false;
});
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col justify-between w-full select-none">
    <!-- Header HUD: Progress, Theory Toggle & Hearts Full Width -->
    <header class="sticky top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-xs">
      <div class="header-content-wrapper h-14 gap-2">
        <!-- Close Button -->
        <button
          type="button"
          class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-transform"
          @click="handleExit"
        >
          <span class="material-symbols-outlined text-[24px]">close</span>
        </button>

        <!-- Progress Bar & Hearts -->
        <div class="flex-1 min-w-0 flex flex-col justify-center px-1">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-secondary truncate min-w-0">
              <template v-if="isShowingTheory && hasTheorySlides">
                📘 Fase 1: Briefing Teórico ({{ currentLessonNode?.title }})
              </template>
              <template v-else-if="isErrorReview">
                🛡️ Centro de Errores · Repaso {{ currentExerciseIndex + 1 }} de {{ exercises.length }}
              </template>
              <template v-else>
                🎮 Fase 2: Misión {{ currentExerciseIndex + 1 }} de {{ exercises.length }}
              </template>
            </span>

            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <!-- Toggle Theory Button during gameplay -->
              <button
                v-if="hasTheorySlides && !isShowingTheory"
                type="button"
                class="flex items-center gap-1 text-primary font-black text-[10px] sm:text-[11px] bg-primary/15 px-2 sm:px-2.5 py-0.5 rounded-full hover:bg-primary/25 transition-colors shrink-0"
                @click="isShowingTheory = true"
              >
                <span class="material-symbols-outlined text-[14px] icon-filled">menu_book</span>
                <span>Ver Teoría</span>
              </button>

              <div
                v-if="gamificationStore.isReinforcementMode"
                class="flex items-center gap-1 text-secondary font-black text-xs bg-secondary/15 px-2 py-0.5 rounded-full shrink-0"
              >
                <span class="material-symbols-outlined text-[15px] icon-filled">healing</span>
                <span>Modo Refuerzo</span>
              </div>
              <div v-else class="flex items-center gap-1 text-error font-extrabold text-xs shrink-0">
                <span class="material-symbols-outlined text-[16px] icon-filled">favorite</span>
                <span>{{ gamificationStore.hasInfiniteHearts ? '∞' : gamificationStore.hearts }}</span>
              </div>
            </div>
          </div>
          <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden shadow-inner p-0.5">
            <div
              class="h-full bg-primary-container rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Suri Avatar -->
        <div class="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed border border-primary/20 shrink-0">
          <img :src="suriImg" alt="Suri" class="w-full h-full object-contain" />
        </div>
      </div>
    </header>

    <!-- Dynamic Container: Phase 1 (Theory Briefing) OR Phase 2 (Interactive Video Game / Exercise) -->
    <main class="flex-1 w-full max-w-3xl mx-auto py-5 px-3 sm:px-5 flex flex-col justify-center overflow-x-hidden">
      <!-- PHASE 1: Interactive Theory Briefing Slides -->
      <LessonTheoryBriefing
        v-if="isShowingTheory && hasTheorySlides && currentLessonNode?.theorySlides"
        :key="lessonId"
        :lesson-title="currentLessonNode.title"
        :lesson-subtitle="currentLessonNode.subtitle"
        :game-type-label="currentLessonNode.gameTypeLabel"
        :slides="currentLessonNode.theorySlides"
        @start-mission="isShowingTheory = false"
      />

      <!-- PHASE 2: Interactive Exercise / Video Game Engine -->
      <div v-else-if="currentExercise" class="w-full my-auto py-space-sm">
        <!-- 1. Inbox Threat Scanner -->
        <InboxThreatScanner
          v-if="currentExercise.type === 'inbox_simulator'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleInboxVerdict"
        />

        <!-- 2. URL Inspector -->
        <UrlInspector
          v-else-if="currentExercise.type === 'url_inspector'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleUrlInspectorSubmit"
        />

        <!-- 3. Password Vault Builder -->
        <PasswordVaultBuilder
          v-else-if="currentExercise.type === 'password_builder'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handlePasswordSubmit"
        />

        <!-- 4. Social Engineering Chat -->
        <SocialEngineeringChat
          v-else-if="currentExercise.type === 'chat_simulator'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleBooleanSubmit"
        />

        <!-- 5. Permission Gatekeeper -->
        <PermissionGatekeeper
          v-else-if="currentExercise.type === 'permission_swipe'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handlePermissionSubmit"
        />

        <!-- 6. Rapid Triage Radar -->
        <RapidTriageRadar
          v-else-if="currentExercise.type === 'rapid_triage'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleBooleanSubmit"
        />

        <!-- 7. NEW VIDEO GAME: Firewall Defense Arcade (3-Lane Real-Time Packet Filtering) -->
        <FirewallDefenseGame
          v-else-if="currentExercise.type === 'firewall_arcade'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleBooleanSubmit"
        />

        <!-- 8. NEW VIDEO GAME: Network Maze 2D (VPN, MFA & Evil Twin Wi-Fi) -->
        <NetworkMazeGame
          v-else-if="currentExercise.type === 'network_maze'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleBooleanSubmit"
        />

        <!-- 9. NEW VIDEO GAME: Incident Command SOC (Real-Time Ransomware Containment) -->
        <IncidentCommandGame
          v-else-if="currentExercise.type === 'incident_soc'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleBooleanSubmit"
        />

        <!-- 10. NEW VIDEO GAME (Curso 5): Code Patcher DevSecOps Live -->
        <CodePatcherGame
          v-else-if="currentExercise.type === 'code_patcher'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleBooleanSubmit"
        />

        <!-- 11. NEW VIDEO GAME (Curso 6): Forensic Investigator Threat Hunter -->
        <ForensicInvestigatorGame
          v-else-if="currentExercise.type === 'forensic_investigator'"
          :key="currentExercise.id"
          :exercise="currentExercise"
          :disabled="isModalOpen"
          @submit="handleBooleanSubmit"
        />
      </div>

      <!-- Loading State -->
      <div v-else class="flex flex-col items-center justify-center gap-2 py-16">
        <span class="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
        <span class="text-xs text-on-surface-variant font-bold">Cargando desafío centinela...</span>
      </div>
    </main>

    <!-- Suri 3-Step Feedback Bottom Sheet Modal -->
    <SuriFeedbackModal
      :is-open="isModalOpen"
      :is-correct="isCurrentCorrect"
      :feedback="currentExercise?.feedback"
      :earned-xp="isCurrentCorrect ? 15 : 0"
      :earned-bits="isCurrentCorrect ? 10 : 0"
      :hearts-remaining="gamificationStore.hearts"
      :max-hearts="gamificationStore.maxHearts"
      @continue="handleModalContinue"
    />

    <!-- Celebratory Lesson Victory / Retry Modal -->
    <LessonVictoryModal
      :is-open="showVictoryModal"
      :lesson-id="lessonId"
      :lesson-title="isErrorReview ? 'Centro de Errores' : currentLessonNode?.title"
      :unit-label="currentUnitLabel"
      :next-lesson-id="nextLessonId"
      :next-lesson-title="nextLessonNode?.title"
      :earned-xp="lastSessionOutcome?.earnedXp ?? lastSessionSummary?.earnedXp ?? 15"
      :earned-bits="lastSessionOutcome?.earnedBits ?? lastSessionSummary?.earnedBits ?? 10"
      :accuracy-percentage="accuracyPercentage"
      :is-perfect-score="mistakesCount === 0"
      :hearts-remaining="gamificationStore.hearts"
      :passed="lastSessionOutcome?.passed ?? true"
      :stars="lastSessionOutcome?.stars ?? 3"
      :league-promoted="lastSessionOutcome?.leaguePromoted ?? false"
      :new-league="lastSessionOutcome?.newLeague"
      @next-lesson="handleNextLesson"
      @go-to-map="handleGoToMap"
      @retry="handleRetryLesson"
    />

    <!-- Full-screen Out of Hearts Blocking Modal -->
    <OutOfHeartsModal
      :is-open="isOutOfHeartsModalOpen"
      :next-heart-timer="gamificationStore.formattedHeartTimer"
      @go-to-shop="handleOutOfHeartsShop"
      @start-reinforcement="handleOutOfHeartsReinforce"
      @go-to-map="handleOutOfHeartsMap"
    />

    <!-- Suspended Corporate Account Modal -->
    <SuspendedAccountModal
      :is-open="isSuspendedModalOpen"
      @close="isSuspendedModalOpen = false"
    />
  </div>
</template>
