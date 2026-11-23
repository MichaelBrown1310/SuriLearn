<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { CodePatcherExercise, CodeExploitWave, CodePatchOption, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CodePatcherExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

const currentWaveIdx = ref<number>(0);
const serverIntegrity = ref<number>(100);
const payloadProgress = ref<number>(10);
const score = ref<number>(0);
const patchedWavesCount = ref<number>(0);
const selectedPatchId = ref<string | null>(null);
const appliedCodeLine = ref<string | null>(null);
const waveStatus = ref<'incoming' | 'patched' | 'breached'>('incoming');
const feedbackBanner = ref<{ text: string; isGood: boolean } | null>(null);
const isStarted = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const isFinished = ref<boolean>(false);

const suriPose = ref<SuriPose>('shield');
const suriReactionKey = ref<number>(0);

let attackTimer: ReturnType<typeof setInterval> | null = null;
let waveAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

const currentWave = computed<CodeExploitWave | undefined>(() => {
  return props.exercise.waves[currentWaveIdx.value];
});

const totalWaves = computed(() => props.exercise.waves.length);

function clearTimers() {
  if (attackTimer) {
    clearInterval(attackTimer);
    attackTimer = null;
  }
  if (waveAdvanceTimer) {
    clearTimeout(waveAdvanceTimer);
    waveAdvanceTimer = null;
  }
}

function startWaveTimer() {
  if (attackTimer) clearInterval(attackTimer);
  attackTimer = setInterval(() => {
    if (!isStarted.value || isPaused.value || isFinished.value || props.disabled || waveStatus.value !== 'incoming') {
      return;
    }
    payloadProgress.value = Math.min(100, payloadProgress.value + 2.2);

    if (payloadProgress.value >= 100) {
      handlePayloadImpactTimeout();
    }
  }, 450);
}

function startGame() {
  if (props.disabled || isFinished.value) return;
  isStarted.value = true;
  isPaused.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  startWaveTimer();
}

function togglePause() {
  if (!isStarted.value || isFinished.value || props.disabled) return;
  isPaused.value = !isPaused.value;
}

function handlePayloadImpactTimeout() {
  if (isFinished.value || waveStatus.value !== 'incoming') return;
  waveStatus.value = 'breached';
  serverIntegrity.value = Math.max(0, serverIntegrity.value - 35);
  suriPose.value = 'surprised';
  suriReactionKey.value += 1;
  feedbackBanner.value = {
    text: `💥 ¡Tiempo agotado! El exploit "${currentWave.value?.attackerPayload}" impactó el endpoint sin parchear (-35% Integridad).`,
    isGood: false,
  };

  waveAdvanceTimer = setTimeout(() => {
    advanceNextWave();
  }, 1300);
}

function deployHotfix(option: CodePatchOption) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled || waveStatus.value !== 'incoming') {
    return;
  }
  selectedPatchId.value = option.id;

  if (option.isCorrect) {
    waveStatus.value = 'patched';
    appliedCodeLine.value = option.codeReplacement;
    patchedWavesCount.value += 1;
    const speedBonus = Math.max(20, Math.round(100 - payloadProgress.value));
    score.value += 150 + speedBonus;
    suriPose.value = 'ok';
    suriReactionKey.value += 1;
    feedbackBanner.value = {
      text: `🛡️ ¡HOTFIX DESPLEGADO (${option.securityLayer})! Exploit neutralizado (+${150 + speedBonus} PTS). ${option.explanation}`,
      isGood: true,
    };

    waveAdvanceTimer = setTimeout(() => {
      advanceNextWave();
    }, 1400);
  } else {
    waveStatus.value = 'breached';
    serverIntegrity.value = Math.max(0, serverIntegrity.value - 35);
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    feedbackBanner.value = {
      text: `🚨 ¡Parche Vulnerable! ${option.explanation} (-35% Integridad).`,
      isGood: false,
    };

    waveAdvanceTimer = setTimeout(() => {
      advanceNextWave();
    }, 1500);
  }
}

function advanceNextWave() {
  if (isFinished.value) return;
  if (serverIntegrity.value <= 0) {
    finishGame(false);
    return;
  }

  if (currentWaveIdx.value < props.exercise.waves.length - 1) {
    currentWaveIdx.value += 1;
    payloadProgress.value = 10;
    selectedPatchId.value = null;
    appliedCodeLine.value = null;
    waveStatus.value = 'incoming';
  } else {
    finishGame();
  }
}

function finishGame(forcedResult?: boolean) {
  if (isFinished.value) return;
  isFinished.value = true;
  clearTimers();
  const minPass = Math.ceil(props.exercise.waves.length * 0.7);
  const won =
    typeof forcedResult === 'boolean'
      ? forcedResult
      : serverIntegrity.value > 0 && patchedWavesCount.value >= minPass;

  suriPose.value = won ? 'victory' : 'error';
  suriReactionKey.value += 1;
  emit('submit', won);
}

function resetAndInit() {
  clearTimers();
  currentWaveIdx.value = 0;
  serverIntegrity.value = 100;
  payloadProgress.value = 10;
  score.value = 0;
  patchedWavesCount.value = 0;
  selectedPatchId.value = null;
  appliedCodeLine.value = null;
  waveStatus.value = 'incoming';
  feedbackBanner.value = null;
  isStarted.value = false;
  isPaused.value = false;
  isFinished.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
}

watch(
  () => props.exercise.id,
  () => {
    resetAndInit();
  }
);

onMounted(() => {
  resetAndInit();
});

onUnmounted(() => {
  clearTimers();
});
</script>

<template>
  <div class="w-full max-w-full flex flex-col gap-3.5 select-none overflow-hidden text-left">
    <!-- Top DevSecOps Live HUD (Paleta SuriLearn) -->
    <div class="bg-surface-container-lowest text-on-surface rounded-3xl p-3.5 sm:p-4 border-2 border-outline-variant/40 shadow-md flex flex-col gap-2.5 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/40 p-0.5 flex items-center justify-center shrink-0">
            <SuriMascotAnimated
              :pose="suriPose"
              size="xs"
              :reaction-key="suriReactionKey"
              :show-shadow="false"
            />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="bg-primary/15 text-primary text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-primary/35 w-fit max-w-full truncate">
              🛡️ Escudo DevSecOps · Caza-Exploits en Vivo
            </span>
            <span class="text-xs sm:text-sm font-black text-on-surface break-words leading-tight mt-0.5">
              {{ exercise.appName }} · Oleada {{ currentWaveIdx + 1 }}/{{ totalWaves }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs font-black bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30">
            SCORE: <strong class="text-primary">{{ score }}</strong>
          </span>
          <button
            v-if="isStarted && !isFinished"
            type="button"
            class="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] text-on-surface text-[11px] font-black border border-outline-variant/40 transition-colors"
            @click="togglePause"
          >
            {{ isPaused ? '▶ Reanudar' : '⏸ Pausar' }}
          </button>
        </div>
      </div>

      <!-- Server Integrity & Incoming Payload Progress -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div class="flex flex-col gap-1 bg-surface-container-low p-2.5 rounded-2xl border border-outline-variant/40">
          <div class="flex items-center justify-between text-[10px] font-black uppercase">
            <span class="text-on-surface-variant">Integridad Backend:</span>
            <span :class="serverIntegrity > 50 ? 'text-shield-green' : 'text-error'">{{ serverIntegrity }}%</span>
          </div>
          <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="serverIntegrity > 50 ? 'bg-shield-green' : 'bg-error'"
              :style="{ width: `${serverIntegrity}%` }"
            ></div>
          </div>
        </div>

        <div class="flex flex-col gap-1 bg-surface-container-low p-2.5 rounded-2xl border border-error/30">
          <div class="flex items-center justify-between text-[10px] font-black uppercase">
            <span class="text-error">Impacto de Exploit en Curso:</span>
            <span class="text-error">{{ Math.round(payloadProgress) }}%</span>
          </div>
          <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5">
            <div
              class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#E1A653] to-error"
              :style="{ width: `${payloadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-Time Feedback Banner -->
    <div
      v-if="feedbackBanner"
      class="px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border flex items-start gap-2.5 overflow-hidden"
      :class="
        feedbackBanner.isGood
          ? 'bg-shield-green/15 text-shield-green border-shield-green/40'
          : 'bg-error/15 text-error border-error/40'
      "
    >
      <span class="material-symbols-outlined text-[18px] icon-filled shrink-0 mt-0.5">
        {{ feedbackBanner.isGood ? 'verified_user' : 'bug_report' }}
      </span>
      <span class="min-w-0 flex-1 break-words leading-snug">{{ feedbackBanner.text }}</span>
    </div>

    <!-- Active Exploit + Vulnerable Code Terminal (Warm Carbón / Arena Ocre SuriLearn) -->
    <div
      v-if="currentWave"
      class="relative bg-[#1C1815] text-[#FDFBF7] rounded-3xl p-4 border-2 border-[#E1A653]/45 shadow-inner flex flex-col gap-3 overflow-hidden"
    >
      <!-- Incoming HTTP Request & Malicious Payload -->
      <div class="bg-[#2B241F] border border-error/45 rounded-2xl p-3 flex flex-col gap-1.5 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-error text-white">
            🚨 {{ currentWave.vulnerabilityName }}
          </span>
          <span class="text-[11px] font-mono text-[#F3B75B] font-bold break-all">
            Endpoint: {{ currentWave.endpoint }}
          </span>
        </div>

        <div class="text-[11px] font-mono bg-[#161311] p-2 rounded-xl border border-[#44352C] break-words">
          <span class="text-error font-bold">Payload Inyectado: </span>
          <span class="text-[#FFF2DA]">{{ currentWave.attackerPayload }}</span>
        </div>
      </div>

      <!-- Source Code Inspector Window -->
      <div class="flex flex-col gap-1.5 overflow-hidden">
        <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#D4C3B3] px-1">
          <span>💻 Terminal de Código del Servidor (Línea Vulnerable)</span>
          <span :class="waveStatus === 'patched' ? 'text-shield-green' : 'text-[#F3B75B]'">
            {{ waveStatus === 'patched' ? '✅ PARCHEADO' : '⚠️ VULNERABLE' }}
          </span>
        </div>

        <div class="bg-[#161311] rounded-2xl p-3 border border-[#44352C] font-mono text-[11px] sm:text-xs flex flex-col gap-1.5 overflow-x-auto">
          <div
            v-for="(line, idx) in currentWave.vulnerableCodeLines"
            :key="idx"
            class="px-2.5 py-1.5 rounded-xl flex items-start gap-2.5 transition-all min-w-0"
            :class="
              idx === currentWave.vulnerableLineIndex
                ? waveStatus === 'patched'
                  ? 'bg-shield-green/20 border border-shield-green text-emerald-200 font-bold'
                  : 'bg-error/20 border border-error text-[#FFF2DA] font-bold animate-pulse'
                : 'text-[#D4C3B3]'
            "
          >
            <span class="text-[#827566] select-none shrink-0 w-4 text-right">{{ idx + 1 }}</span>
            <span class="min-w-0 flex-1 break-words whitespace-pre-wrap">
              {{ idx === currentWave.vulnerableLineIndex && appliedCodeLine ? appliedCodeLine : line }}
            </span>
          </div>
        </div>
      </div>

      <!-- Hotfix Deployment Deck -->
      <div class="flex flex-col gap-2 pt-1">
        <span class="text-xs font-black text-[#F3B75B] flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] icon-filled">build_circle</span>
          <span>Selecciona e Inyecta el Parche DevSecOps Correcto:</span>
        </span>

        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="opt in currentWave.options"
            :key="opt.id"
            type="button"
            class="w-full min-w-0 p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 overflow-hidden"
            :class="
              selectedPatchId === opt.id
                ? opt.isCorrect
                  ? 'bg-shield-green/20 border-shield-green text-[#FDFBF7]'
                  : 'bg-error/20 border-error text-[#FDFBF7]'
                : 'bg-[#231D19] hover:bg-[#2B241F] border-[#44352C] hover:border-[#E1A653] text-[#FDFBF7]'
            "
            :disabled="disabled || !isStarted || isPaused || waveStatus !== 'incoming'"
            @click="deployHotfix(opt)"
          >
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <span class="text-xs font-black text-[#00E5FF] break-words">{{ opt.label }}</span>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#3D2D1E] text-[#F3B75B] border border-[#E1A653]/40">
                {{ opt.securityLayer }}
              </span>
            </div>
            <code class="text-[10px] sm:text-[11px] font-mono text-[#FFF2DA] bg-[#161311] border border-[#44352C] p-2 rounded-xl block break-words whitespace-pre-wrap">
              {{ opt.codeReplacement }}
            </code>
          </button>
        </div>
      </div>

      <!-- Start Overlay -->
      <div
        v-if="!isStarted"
        class="absolute inset-0 bg-[#161311]/90 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="shield" size="md" :auto-blink="false" :show-shadow="false" />
        <div class="max-w-md">
          <p class="text-sm font-black text-[#FDFBF7]">Escudo DevSecOps en Vivo ({{ exercise.appName }})</p>
          <p class="text-[11px] text-[#D4C3B3] mt-1 leading-relaxed">
            Inspecta la línea resaltada en rojo y despliega el <strong class="text-[#F3B75B]">parche seguro</strong> (consultas parametrizadas, sanitización o validación RBAC) antes de que el exploit alcance el <strong class="text-error">100%</strong>.
          </p>
        </div>
        <button
          type="button"
          class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="startGame"
        >
          ¡Iniciar Parcheo!
        </button>
      </div>

      <!-- Pause Overlay -->
      <div
        v-else-if="isPaused && !isFinished"
        class="absolute inset-0 bg-[#161311]/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="sleeping" size="sm" :auto-blink="false" :show-shadow="false" />
        <p class="text-sm font-black text-[#F3B75B]">Parcheo en Pausa</p>
        <button
          type="button"
          class="px-5 py-2 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="togglePause"
        >
          ▶ Reanudar Auditoría
        </button>
      </div>
    </div>
  </div>
</template>
