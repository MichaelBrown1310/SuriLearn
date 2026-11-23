<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ForensicInvestigatorExercise, ForensicProcessArtifact, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: ForensicInvestigatorExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

interface RuntimeProcess extends ForensicProcessArtifact {
  status: 'running' | 'killed_correct' | 'killed_false_positive';
  inspected: boolean;
}

const processesState = ref<RuntimeProcess[]>([]);
const selectedPid = ref<number | null>(null);
const exfiltrationProgress = ref<number>(15);
const phase = ref<'hunt_ram' | 'root_cause'>('hunt_ram');
const selectedRootCauseId = ref<string | null>(null);
const consoleAlert = ref<{ text: string; tone: 'info' | 'good' | 'bad' }>({
  text: '',
  tone: 'info',
});
const mistakes = ref<number>(0);
const isStarted = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const isFinished = ref<boolean>(false);

const suriPose = ref<SuriPose>('idea');
const suriReactionKey = ref<number>(0);

let exfilTimer: ReturnType<typeof setInterval> | null = null;
let transitionTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (exfilTimer) {
    clearInterval(exfilTimer);
    exfilTimer = null;
  }
  if (transitionTimer) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
  }
}

function initForensicLab() {
  clearTimers();
  processesState.value = props.exercise.processes.map((p) => ({
    ...p,
    status: 'running',
    inspected: false,
  }));
  selectedPid.value = processesState.value[0]?.pid ?? null;
  exfiltrationProgress.value = 15;
  phase.value = 'hunt_ram';
  selectedRootCauseId.value = null;
  mistakes.value = 0;
  isStarted.value = false;
  isPaused.value = false;
  isFinished.value = false;
  suriPose.value = 'idea';
  suriReactionKey.value += 1;
  consoleAlert.value = {
    text: `🔍 CSI CYBER: ${props.exercise.incidentBrief}`,
    tone: 'info',
  };
}

function startForensicLab() {
  if (props.disabled || isFinished.value) return;
  isStarted.value = true;
  isPaused.value = false;
  suriPose.value = 'idea';
  suriReactionKey.value += 1;
  startExfilTimer();
}

function togglePause() {
  if (!isStarted.value || isFinished.value || props.disabled) return;
  isPaused.value = !isPaused.value;
}

const remainingMaliciousCount = computed(
  () => processesState.value.filter((p) => p.isMalicious && p.status === 'running').length
);

function startExfilTimer() {
  if (exfilTimer) clearInterval(exfilTimer);
  exfilTimer = setInterval(() => {
    if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
    const activeMalware = remainingMaliciousCount.value;
    if (activeMalware <= 0 && phase.value === 'hunt_ram') {
      return;
    }

    const step = phase.value === 'hunt_ram' ? activeMalware * 1.4 + 0.6 : 0.8;
    exfiltrationProgress.value = Math.min(100, Math.round((exfiltrationProgress.value + step) * 10) / 10);

    if (exfiltrationProgress.value >= 100) {
      isFinished.value = true;
      clearTimers();
      suriPose.value = 'error';
      suriReactionKey.value += 1;
      consoleAlert.value = {
        text: '🚨 ¡Exfiltración completada al 100%! Los atacantes extrajeron la base de datos antes de contener los procesos C2.',
        tone: 'bad',
      };
      emit('submit', false);
    }
  }, 1000);
}

function inspectProcess(proc: RuntimeProcess) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  selectedPid.value = proc.pid;
  proc.inspected = true;
}

function terminateProcess(proc: RuntimeProcess) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled || proc.status !== 'running') {
    return;
  }

  if (proc.isMalicious) {
    proc.status = 'killed_correct';
    suriPose.value = 'ok';
    suriReactionKey.value += 1;
    consoleAlert.value = {
      text: `⚡ [PID ${proc.pid} TERMINADO] "${proc.processName}" neutralizado y conexión C2 (${proc.remoteEndpoint}) bloqueada. ${proc.forensicClue}`,
      tone: 'good',
    };

    if (remainingMaliciousCount.value === 0) {
      transitionTimer = setTimeout(() => {
        if (isFinished.value) return;
        phase.value = 'root_cause';
        suriPose.value = 'idea';
        suriReactionKey.value += 1;
        consoleAlert.value = {
          text: '✅ ¡Memoria RAM limpia de procesos C2! Fase Final: Dictamina el vector raíz de la intrusión para cerrar el caso forense.',
          tone: 'good',
        };
      }, 900);
    }
  } else {
    proc.status = 'killed_false_positive';
    mistakes.value += 1;
    exfiltrationProgress.value = Math.min(100, exfiltrationProgress.value + 18);
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    consoleAlert.value = {
      text: `⚠️ ¡Falso Positivo! "${proc.processName}" (PID ${proc.pid}) era un proceso legítimo del sistema. ${proc.forensicClue}`,
      tone: 'bad',
    };
  }
}

function submitRootCause(option: { id: string; text: string; isCorrect: boolean; explanation: string }) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  selectedRootCauseId.value = option.id;
  isFinished.value = true;
  clearTimers();

  if (option.isCorrect && mistakes.value <= 1) {
    suriPose.value = 'victory';
    suriReactionKey.value += 1;
    consoleAlert.value = {
      text: `🏆 ¡Caso Forense Resuelto! ${option.explanation}`,
      tone: 'good',
    };
    transitionTimer = setTimeout(() => {
      emit('submit', true);
    }, 850);
  } else {
    suriPose.value = 'error';
    suriReactionKey.value += 1;
    consoleAlert.value = {
      text: `🚨 Dictamen incorrecto: ${option.explanation}`,
      tone: 'bad',
    };
    transitionTimer = setTimeout(() => {
      emit('submit', false);
    }, 1050);
  }
}

watch(
  () => props.exercise.id,
  () => {
    initForensicLab();
  }
);

onMounted(() => {
  initForensicLab();
});

onUnmounted(() => {
  clearTimers();
});
</script>

<template>
  <div class="w-full max-w-full flex flex-col gap-3.5 select-none overflow-hidden text-left">
    <!-- Top Forensic CSI Header (Paleta SuriLearn) -->
    <div class="bg-surface-container-lowest text-on-surface rounded-3xl p-3.5 sm:p-4 border-2 border-outline-variant/40 shadow-md flex flex-col gap-2.5 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-11 h-11 rounded-2xl bg-tertiary/15 border border-tertiary/40 p-0.5 flex items-center justify-center shrink-0">
            <SuriMascotAnimated
              :pose="suriPose"
              size="xs"
              :reaction-key="suriReactionKey"
              :show-shadow="false"
            />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="bg-tertiary/15 text-tertiary text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-tertiary/35 w-fit max-w-full truncate">
              🔬 Laboratorio CSI Cyber · Threat Hunter
            </span>
            <span class="text-xs sm:text-sm font-black text-on-surface break-words leading-tight mt-0.5">
              Host: {{ exercise.hostName }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[11px] sm:text-xs font-black bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30">
            Amenazas en RAM: <strong class="text-error">{{ remainingMaliciousCount }}</strong>
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

      <!-- Data Exfiltration Danger Meter -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] sm:text-[11px] font-black uppercase text-error truncate">
            Exfiltración de Datos hacia Servidor C2:
          </span>
          <span class="text-xs font-black text-error shrink-0">{{ exfiltrationProgress }}%</span>
        </div>
        <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/40">
          <div
            class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#00E5FF] via-[#E1A653] to-error"
            :style="{ width: `${exfiltrationProgress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Forensic Status Console -->
    <div
      class="px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border flex items-start gap-2.5 overflow-hidden"
      :class="
        consoleAlert.tone === 'good'
          ? 'bg-shield-green/15 text-shield-green border-shield-green/40'
          : consoleAlert.tone === 'bad'
            ? 'bg-error/15 text-error border-error/40'
            : 'bg-surface-container-high text-on-surface border-outline-variant/40'
      "
    >
      <span class="material-symbols-outlined text-[18px] icon-filled shrink-0 mt-0.5">
        {{ consoleAlert.tone === 'good' ? 'task_alt' : consoleAlert.tone === 'bad' ? 'gpp_bad' : 'troubleshoot' }}
      </span>
      <span class="min-w-0 flex-1 break-words leading-snug">{{ consoleAlert.text }}</span>
    </div>

    <!-- Arena Forense (Warm Carbón / Arena Ocre SuriLearn) -->
    <div class="relative bg-[#1C1815] text-[#FDFBF7] rounded-3xl p-3.5 sm:p-4 border-2 border-[#E1A653]/45 overflow-hidden">
      <!-- PHASE 1: LIVE RAM PROCESS & C2 SOCKET HUNTER -->
      <div
        v-if="phase === 'hunt_ram'"
        class="flex flex-col gap-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-1">
          <span class="text-xs font-black text-[#F3B75B] uppercase tracking-wider flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">memory</span>
            <span>Fase 1: Escáner de Procesos en Memoria Volátil (RAM)</span>
          </span>
          <span class="text-[10px] text-[#D4C3B3] font-bold">
            Inspecciona cada PID y elimina solo los procesos maliciosos
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div
            v-for="proc in processesState"
            :key="proc.id"
            class="p-3 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2 cursor-pointer overflow-hidden"
            :class="[
              proc.status === 'killed_correct'
                ? 'bg-shield-green/15 border-shield-green/50 opacity-80'
                : proc.status === 'killed_false_positive'
                  ? 'bg-error/15 border-error/50 opacity-80'
                  : selectedPid === proc.pid
                    ? 'bg-[#2B241F] border-[#E1A653] ring-2 ring-[#E1A653]/40'
                    : 'bg-[#231D19] border-[#44352C] hover:border-[#E1A653]/60',
            ]"
            @click="inspectProcess(proc)"
          >
            <div class="flex items-center justify-between gap-2 min-w-0">
              <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg bg-[#161311] border border-[#44352C] text-[#00E5FF] shrink-0">
                PID {{ proc.pid }} · CPU {{ proc.cpuUsage }}
              </span>

              <span
                class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full truncate"
                :class="
                  proc.signatureStatus === 'signed_microsoft'
                    ? 'bg-shield-green/20 text-shield-green border border-shield-green/30'
                    : proc.signatureStatus === 'spoofed_cert'
                      ? 'bg-error/25 text-error border border-error/40'
                      : 'bg-[#E1A653]/20 text-[#F3B75B] border border-[#E1A653]/40'
                "
              >
                {{
                  proc.signatureStatus === 'signed_microsoft'
                    ? '✓ Firma Oficial Verificada'
                    : proc.signatureStatus === 'spoofed_cert'
                      ? '⚠️ Certificado Falsificado'
                      : '⚠️ Sin Firma Digital'
                }}
              </span>
            </div>

            <div class="min-w-0">
              <h4 class="text-xs sm:text-sm font-mono font-black text-[#FDFBF7] break-words">
                {{ proc.processName }}
              </h4>
              <p class="text-[10px] font-mono text-[#F3B75B] break-words mt-0.5">
                Socket: {{ proc.remoteEndpoint }}
              </p>
            </div>

            <p class="text-[10px] sm:text-[11px] text-[#FFF2DA] bg-[#161311] border border-[#44352C] p-2 rounded-xl break-words leading-snug">
              {{ proc.behaviorAlert }}
            </p>

            <!-- Action Button per Process -->
            <div class="pt-0.5">
              <button
                v-if="proc.status === 'running'"
                type="button"
                :disabled="disabled || !isStarted || isPaused || isFinished"
                class="w-full py-2 px-3 rounded-xl bg-error hover:bg-rose-600 text-white font-black text-[11px] shadow-[0_3px_0_#881337] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                @click.stop="terminateProcess(proc)"
              >
                <span class="material-symbols-outlined text-[16px] icon-filled">dangerous</span>
                <span>KILL PID {{ proc.pid }} + BLOQUEAR SOCKET</span>
              </button>
              <div
                v-else-if="proc.status === 'killed_correct'"
                class="w-full py-1.5 px-3 rounded-xl bg-shield-green/20 text-shield-green font-black text-[11px] text-center"
              >
                ✅ Amenaza Eliminada de RAM
              </div>
              <div
                v-else
                class="w-full py-1.5 px-3 rounded-xl bg-error/20 text-error font-black text-[11px] text-center"
              >
                ⚠️ Proceso del Sistema Interrumpido
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PHASE 2: FORENSIC ROOT CAUSE VERDICT -->
      <div
        v-else
        class="flex flex-col gap-3"
      >
        <div class="flex items-center gap-2 text-[#F3B75B]">
          <span class="material-symbols-outlined text-[22px] icon-filled">biotech</span>
          <h3 class="text-sm font-black uppercase tracking-wider">
            Fase 2: Dictamen Forense de Causa Raíz (IoC)
          </h3>
        </div>

        <p class="text-xs sm:text-sm font-bold text-[#FFF2DA] break-words leading-relaxed">
          {{ exercise.rootCauseQuestion }}
        </p>

        <div class="flex flex-col gap-2">
          <button
            v-for="opt in exercise.rootCauseOptions"
            :key="opt.id"
            type="button"
            class="w-full min-w-0 p-3.5 rounded-2xl border-2 text-left text-xs font-extrabold transition-all break-words"
            :class="
              selectedRootCauseId === opt.id
                ? opt.isCorrect
                  ? 'bg-shield-green/20 border-shield-green text-[#FDFBF7]'
                  : 'bg-error/20 border-error text-[#FDFBF7]'
                : 'bg-[#231D19] hover:bg-[#2B241F] border-[#44352C] hover:border-[#E1A653] text-[#FDFBF7]'
            "
            :disabled="disabled || isPaused || isFinished"
            @click="submitRootCause(opt)"
          >
            {{ opt.text }}
          </button>
        </div>
      </div>

      <!-- Start Overlay -->
      <div
        v-if="!isStarted"
        class="absolute inset-0 bg-[#161311]/90 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="idea" size="md" :auto-blink="false" :show-shadow="false" />
        <div class="max-w-md">
          <p class="text-sm font-black text-[#FDFBF7]">Laboratorio CSI Cyber — Memoria RAM</p>
          <p class="text-[11px] text-[#D4C3B3] mt-1 leading-relaxed">
            Revisa firma digital, socket remoto y comportamiento de cada proceso antes de pulsar <strong class="text-error">KILL PID</strong>. Luego concluye la <strong class="text-[#F3B75B]">Causa Raíz (IoC)</strong>.
          </p>
        </div>
        <button
          type="button"
          class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="startForensicLab"
        >
          ¡Iniciar Análisis RAM!
        </button>
      </div>

      <!-- Pause Overlay -->
      <div
        v-else-if="isPaused && !isFinished"
        class="absolute inset-0 bg-[#161311]/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="sleeping" size="sm" :auto-blink="false" :show-shadow="false" />
        <p class="text-sm font-black text-[#F3B75B]">Análisis Forense en Pausa</p>
        <button
          type="button"
          class="px-5 py-2 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="togglePause"
        >
          ▶ Reanudar Laboratorio
        </button>
      </div>
    </div>
  </div>
</template>
