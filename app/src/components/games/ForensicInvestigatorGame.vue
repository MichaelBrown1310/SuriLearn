<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ForensicInvestigatorExercise, ForensicProcessArtifact } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

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
const isFinished = ref<boolean>(false);

const suriForensicImg = getSuriImage('idea');

let exfilTimer: ReturnType<typeof setInterval> | null = null;

function initForensicLab() {
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
  isFinished.value = false;
  consoleAlert.value = {
    text: `🔍 CSI CYBER: ${props.exercise.incidentBrief}`,
    tone: 'info',
  };
  startExfilTimer();
}

const selectedProcess = computed(() =>
  processesState.value.find((p) => p.pid === selectedPid.value)
);

const remainingMaliciousCount = computed(
  () => processesState.value.filter((p) => p.isMalicious && p.status === 'running').length
);

function startExfilTimer() {
  stopExfilTimer();
  exfilTimer = setInterval(() => {
    if (isFinished.value || props.disabled) return;
    const activeMalware = remainingMaliciousCount.value;
    if (activeMalware <= 0 && phase.value === 'hunt_ram') {
      return;
    }

    const step = phase.value === 'hunt_ram' ? activeMalware * 1.4 + 0.6 : 0.8;
    exfiltrationProgress.value = Math.min(100, Math.round((exfiltrationProgress.value + step) * 10) / 10);

    if (exfiltrationProgress.value >= 100) {
      isFinished.value = true;
      stopExfilTimer();
      consoleAlert.value = {
        text: '🚨 ¡Exfiltración completada al 100%! Los atacantes extrajeron la base de datos antes de contener los procesos C2.',
        tone: 'bad',
      };
      emit('submit', false);
    }
  }, 1000);
}

function stopExfilTimer() {
  if (exfilTimer) {
    clearInterval(exfilTimer);
    exfilTimer = null;
  }
}

function inspectProcess(proc: RuntimeProcess) {
  if (isFinished.value || props.disabled) return;
  selectedPid.value = proc.pid;
  proc.inspected = true;
}

function terminateProcess(proc: RuntimeProcess) {
  if (isFinished.value || props.disabled || proc.status !== 'running') return;

  if (proc.isMalicious) {
    proc.status = 'killed_correct';
    consoleAlert.value = {
      text: `⚡ [PID ${proc.pid} TERMINADO] "${proc.processName}" neutralizado y conexión C2 (${proc.remoteEndpoint}) bloqueada. ${proc.forensicClue}`,
      tone: 'good',
    };

    if (remainingMaliciousCount.value === 0) {
      setTimeout(() => {
        phase.value = 'root_cause';
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
    consoleAlert.value = {
      text: `⚠️ ¡Falso Positivo! "${proc.processName}" (PID ${proc.pid}) era un proceso legítimo del sistema. ${proc.forensicClue}`,
      tone: 'bad',
    };
  }
}

function submitRootCause(option: { id: string; text: string; isCorrect: boolean; explanation: string }) {
  if (isFinished.value || props.disabled) return;
  selectedRootCauseId.value = option.id;
  isFinished.value = true;
  stopExfilTimer();

  if (option.isCorrect && mistakes.value <= 1) {
    consoleAlert.value = {
      text: `🏆 ¡Caso Forense Resuelto! ${option.explanation}`,
      tone: 'good',
    };
    setTimeout(() => {
      emit('submit', true);
    }, 900);
  } else {
    consoleAlert.value = {
      text: `🚨 Dictamen incorrecto: ${option.explanation}`,
      tone: 'bad',
    };
    setTimeout(() => {
      emit('submit', false);
    }, 1100);
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
  stopExfilTimer();
});
</script>

<template>
  <div class="w-full max-w-full flex flex-col gap-3.5 select-none overflow-hidden">
    <!-- Top Forensic CSI Header -->
    <div class="bg-[#101820] text-white rounded-3xl p-3.5 sm:p-4 border-2 border-teal-500/40 shadow-lg flex flex-col gap-2.5 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/50 p-1 flex items-center justify-center shrink-0">
            <img :src="suriForensicImg" alt="Suri CSI Forense" class="w-full h-full object-contain" />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-teal-400/40 w-fit max-w-full truncate">
              🎮 Laboratorio CSI Cyber · Threat Hunter
            </span>
            <span class="text-xs sm:text-sm font-black text-amber-300 break-words leading-tight mt-0.5">
              Host: {{ exercise.hostName }}
            </span>
          </div>
        </div>

        <span class="text-[11px] sm:text-xs font-black bg-white/10 px-3 py-1 rounded-xl shrink-0">
          Amenazas en RAM: <strong class="text-error">{{ remainingMaliciousCount }}</strong>
        </span>
      </div>

      <!-- Data Exfiltration Danger Meter -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] sm:text-[11px] font-black uppercase text-amber-300 truncate">
            Exfiltración de Datos hacia Servidor C2:
          </span>
          <span class="text-xs font-black text-rose-400 shrink-0">{{ exfiltrationProgress }}%</span>
        </div>
        <div class="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-teal-500/30">
          <div
            class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-teal-400 via-amber-400 to-error"
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

    <!-- PHASE 1: LIVE RAM PROCESS & C2 SOCKET HUNTER -->
    <div
      v-if="phase === 'hunt_ram'"
      class="bg-[#0B1118] text-white rounded-3xl p-3.5 sm:p-4 border-2 border-slate-700 flex flex-col gap-3 overflow-hidden"
    >
      <div class="flex flex-wrap items-center justify-between gap-1">
        <span class="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">memory</span>
          <span>Fase 1: Escáner de Procesos en Memoria Volátil (RAM)</span>
        </span>
        <span class="text-[10px] text-slate-400 font-bold">
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
                  ? 'bg-slate-800/95 border-teal-400 ring-2 ring-teal-400/40'
                  : 'bg-slate-900/90 border-slate-700 hover:border-slate-500',
          ]"
          @click="inspectProcess(proc)"
        >
          <div class="flex items-center justify-between gap-2 min-w-0">
            <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg bg-black/50 text-teal-300 shrink-0">
              PID {{ proc.pid }} · CPU {{ proc.cpuUsage }}
            </span>

            <span
              class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full truncate"
              :class="
                proc.signatureStatus === 'signed_microsoft'
                  ? 'bg-shield-green/20 text-shield-green border border-shield-green/30'
                  : proc.signatureStatus === 'spoofed_cert'
                    ? 'bg-error/25 text-rose-300 border border-error/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
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
            <h4 class="text-xs sm:text-sm font-mono font-black text-white break-words">
              {{ proc.processName }}
            </h4>
            <p class="text-[10px] font-mono text-amber-300 break-words mt-0.5">
              Socket: {{ proc.remoteEndpoint }}
            </p>
          </div>

          <p class="text-[10px] sm:text-[11px] text-slate-300 bg-black/40 p-2 rounded-xl break-words leading-snug">
            {{ proc.behaviorAlert }}
          </p>

          <!-- Action Button per Process -->
          <div class="pt-0.5">
            <button
              v-if="proc.status === 'running'"
              type="button"
              class="w-full py-2 px-3 rounded-xl bg-error hover:bg-rose-600 text-white font-black text-[11px] shadow-[0_3px_0_#881337] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
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
      class="bg-[#0B1118] text-white rounded-3xl p-4 border-2 border-teal-400/50 flex flex-col gap-3 overflow-hidden"
    >
      <div class="flex items-center gap-2 text-teal-300">
        <span class="material-symbols-outlined text-[22px] icon-filled">biotech</span>
        <h3 class="text-sm font-black uppercase tracking-wider">
          Fase 2: Dictamen Forense de Causa Raíz (IoC)
        </h3>
      </div>

      <p class="text-xs sm:text-sm font-bold text-slate-200 break-words leading-relaxed">
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
                ? 'bg-shield-green/20 border-shield-green text-white'
                : 'bg-error/20 border-error text-white'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-teal-400 text-white'
          "
          :disabled="disabled || isFinished"
          @click="submitRootCause(opt)"
        >
          {{ opt.text }}
        </button>
      </div>
    </div>
  </div>
</template>
