<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { CodePatcherExercise, CodeExploitWave, CodePatchOption } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  exercise: CodePatcherExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

const currentWaveIdx = ref<number>(0);
const serverIntegrity = ref<number>(100);
const payloadProgress = ref<number>(10); // 10% to 100% impact
const score = ref<number>(0);
const patchedWavesCount = ref<number>(0);
const selectedPatchId = ref<string | null>(null);
const appliedCodeLine = ref<string | null>(null);
const waveStatus = ref<'incoming' | 'patched' | 'breached'>('incoming');
const feedbackBanner = ref<{ text: string; isGood: boolean } | null>(null);
const isFinished = ref<boolean>(false);

const suriDevImg = getSuriImage('shield');

let attackTimer: ReturnType<typeof setInterval> | null = null;

const currentWave = computed<CodeExploitWave | undefined>(() => {
  return props.exercise.waves[currentWaveIdx.value];
});

const totalWaves = computed(() => props.exercise.waves.length);

function startWaveTimer() {
  stopWaveTimer();
  attackTimer = setInterval(() => {
    if (isFinished.value || props.disabled || waveStatus.value !== 'incoming') return;
    payloadProgress.value = Math.min(100, payloadProgress.value + 2.2);

    if (payloadProgress.value >= 100) {
      handlePayloadImpactTimeout();
    }
  }, 450);
}

function stopWaveTimer() {
  if (attackTimer) {
    clearInterval(attackTimer);
    attackTimer = null;
  }
}

function handlePayloadImpactTimeout() {
  waveStatus.value = 'breached';
  serverIntegrity.value = Math.max(0, serverIntegrity.value - 35);
  feedbackBanner.value = {
    text: `💥 ¡Tiempo agotado! El exploit "${currentWave.value?.attackerPayload}" impactó el endpoint sin parchear (-35% Integridad).`,
    isGood: false,
  };

  setTimeout(() => {
    advanceNextWave();
  }, 1400);
}

function deployHotfix(option: CodePatchOption) {
  if (isFinished.value || props.disabled || waveStatus.value !== 'incoming') return;
  selectedPatchId.value = option.id;

  if (option.isCorrect) {
    waveStatus.value = 'patched';
    appliedCodeLine.value = option.codeReplacement;
    patchedWavesCount.value += 1;
    const speedBonus = Math.max(20, Math.round(100 - payloadProgress.value));
    score.value += 150 + speedBonus;
    feedbackBanner.value = {
      text: `🛡️ ¡HOTFIX DESPLEGADO (${option.securityLayer})! Exploit neutralizado (+${150 + speedBonus} PTS). ${option.explanation}`,
      isGood: true,
    };

    setTimeout(() => {
      advanceNextWave();
    }, 1500);
  } else {
    waveStatus.value = 'breached';
    serverIntegrity.value = Math.max(0, serverIntegrity.value - 35);
    feedbackBanner.value = {
      text: `🚨 ¡Parche Vulnerable! ${option.explanation} (-35% Integridad).`,
      isGood: false,
    };

    setTimeout(() => {
      advanceNextWave();
    }, 1600);
  }
}

function advanceNextWave() {
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
  isFinished.value = true;
  stopWaveTimer();
  const minPass = Math.ceil(props.exercise.waves.length * 0.7);
  const won =
    typeof forcedResult === 'boolean'
      ? forcedResult
      : serverIntegrity.value > 0 && patchedWavesCount.value >= minPass;
  emit('submit', won);
}

function resetAndInit() {
  currentWaveIdx.value = 0;
  serverIntegrity.value = 100;
  payloadProgress.value = 10;
  score.value = 0;
  patchedWavesCount.value = 0;
  selectedPatchId.value = null;
  appliedCodeLine.value = null;
  waveStatus.value = 'incoming';
  feedbackBanner.value = null;
  isFinished.value = false;
  startWaveTimer();
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
  stopWaveTimer();
});
</script>

<template>
  <div class="w-full max-w-full flex flex-col gap-3.5 select-none overflow-hidden">
    <!-- Top DevSecOps Live HUD -->
    <div class="bg-[#121622] text-white rounded-3xl p-3.5 sm:p-4 border-2 border-indigo-500/40 shadow-lg flex flex-col gap-2.5 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 p-1 flex items-center justify-center shrink-0">
            <img :src="suriDevImg" alt="Suri DevSecOps" class="w-full h-full object-contain" />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="bg-indigo-500/25 text-indigo-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/40 w-fit max-w-full truncate">
              🎮 Escudo DevSecOps · Caza-Exploits en Vivo
            </span>
            <span class="text-xs sm:text-sm font-black text-amber-300 break-words leading-tight mt-0.5">
              {{ exercise.appName }} · Oleada {{ currentWaveIdx + 1 }}/{{ totalWaves }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs font-black bg-white/10 px-3 py-1 rounded-xl">
            SCORE: <strong class="text-tech-cyan">{{ score }}</strong>
          </span>
        </div>
      </div>

      <!-- Server Integrity & Incoming Payload Progress -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div class="flex flex-col gap-1 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-700">
          <div class="flex items-center justify-between text-[10px] font-black uppercase">
            <span class="text-slate-300">Integridad Backend:</span>
            <span :class="serverIntegrity > 50 ? 'text-shield-green' : 'text-error'">{{ serverIntegrity }}%</span>
          </div>
          <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="serverIntegrity > 50 ? 'bg-shield-green' : 'bg-error'"
              :style="{ width: `${serverIntegrity}%` }"
            ></div>
          </div>
        </div>

        <div class="flex flex-col gap-1 bg-slate-900/80 p-2.5 rounded-2xl border border-rose-500/30">
          <div class="flex items-center justify-between text-[10px] font-black uppercase">
            <span class="text-rose-300">Impacto de Exploit en Curso:</span>
            <span class="text-rose-400">{{ Math.round(payloadProgress) }}%</span>
          </div>
          <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-amber-400 to-error"
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

    <!-- Active Exploit + Vulnerable Code Terminal -->
    <div
      v-if="currentWave"
      class="bg-[#0B0F19] text-white rounded-3xl p-4 border-2 border-slate-700 shadow-inner flex flex-col gap-3 overflow-hidden"
    >
      <!-- Incoming HTTP Request & Malicious Payload -->
      <div class="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 flex flex-col gap-1.5 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-error text-white">
            🚨 {{ currentWave.vulnerabilityName }}
          </span>
          <span class="text-[11px] font-mono text-amber-300 font-bold break-all">
            Endpoint: {{ currentWave.endpoint }}
          </span>
        </div>

        <div class="text-[11px] font-mono bg-black/60 p-2 rounded-xl border border-rose-500/30 break-words">
          <span class="text-rose-400 font-bold">Payload Inyectado: </span>
          <span class="text-amber-200">{{ currentWave.attackerPayload }}</span>
        </div>
      </div>

      <!-- Source Code Inspector Window -->
      <div class="flex flex-col gap-1.5 overflow-hidden">
        <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
          <span>💻 Terminal de Código del Servidor (Línea Vulnerable Resaltada)</span>
          <span :class="waveStatus === 'patched' ? 'text-shield-green' : 'text-amber-400'">
            {{ waveStatus === 'patched' ? '✅ PARCHEADO' : '⚠️ VULNERABLE' }}
          </span>
        </div>

        <div class="bg-[#111827] rounded-2xl p-3 border border-slate-700 font-mono text-[11px] sm:text-xs flex flex-col gap-1.5 overflow-x-auto">
          <div
            v-for="(line, idx) in currentWave.vulnerableCodeLines"
            :key="idx"
            class="px-2.5 py-1.5 rounded-xl flex items-start gap-2.5 transition-all min-w-0"
            :class="
              idx === currentWave.vulnerableLineIndex
                ? waveStatus === 'patched'
                  ? 'bg-shield-green/20 border border-shield-green text-emerald-200 font-bold'
                  : 'bg-error/20 border border-error text-amber-200 font-bold animate-pulse'
                : 'text-slate-300'
            "
          >
            <span class="text-slate-500 select-none shrink-0 w-4 text-right">{{ idx + 1 }}</span>
            <span class="min-w-0 flex-1 break-words whitespace-pre-wrap">
              {{ idx === currentWave.vulnerableLineIndex && appliedCodeLine ? appliedCodeLine : line }}
            </span>
          </div>
        </div>
      </div>

      <!-- Hotfix Deployment Deck -->
      <div class="flex flex-col gap-2 pt-1">
        <span class="text-xs font-black text-indigo-300 flex items-center gap-1.5">
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
                  ? 'bg-shield-green/20 border-shield-green text-white'
                  : 'bg-error/20 border-error text-white'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 hover:border-indigo-400 text-white'
            "
            :disabled="disabled || waveStatus !== 'incoming'"
            @click="deployHotfix(opt)"
          >
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <span class="text-xs font-black text-tech-cyan break-words">{{ opt.label }}</span>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {{ opt.securityLayer }}
              </span>
            </div>
            <code class="text-[10px] sm:text-[11px] font-mono text-emerald-300 bg-black/50 p-2 rounded-xl block break-words whitespace-pre-wrap">
              {{ opt.codeReplacement }}
            </code>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
