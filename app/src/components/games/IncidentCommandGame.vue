<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { IncidentCommandExercise, SocActionType, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: IncidentCommandExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

type RuntimeNodeState =
  | 'healthy'
  | 'at_risk'
  | 'infected'
  | 'compromised_iam'
  | 'isolated'
  | 'purged'
  | 'secured';

interface RuntimeSocNode {
  id: string;
  name: string;
  role: string;
  icon: string;
  state: RuntimeNodeState;
  connectedTo: string[];
  infectionNote: string;
}

const nodesState = ref<RuntimeSocNode[]>([]);
const selectedNodeId = ref<string>('');
const encryptionProgress = ref<number>(12);
const consoleMessage = ref<string>('');
const consoleTone = ref<'info' | 'good' | 'bad'>('info');
const isStarted = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const isGameOver = ref<boolean>(false);

const suriPose = ref<SuriPose>('shield');
const suriReactionKey = ref<number>(0);

let ticker: ReturnType<typeof setInterval> | null = null;

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function initSocGame() {
  stopTicker();
  nodesState.value = props.exercise.nodes.map((n) => ({
    id: n.id,
    name: n.name,
    role: n.role,
    icon: n.icon,
    state: n.initialState,
    connectedTo: [...n.connectedTo],
    infectionNote: n.infectionNote,
  }));

  const firstProblem = nodesState.value.find(
    (n) => n.state === 'infected' || n.state === 'compromised_iam'
  );
  selectedNodeId.value = firstProblem?.id || nodesState.value[0]?.id || '';
  encryptionProgress.value = 12;
  isStarted.value = false;
  isPaused.value = false;
  isGameOver.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  consoleMessage.value = `🚨 ALERTA SOC: ${props.exercise.scenarioAlert}`;
  consoleTone.value = 'bad';
}

function startSocGame() {
  if (props.disabled || isGameOver.value) return;
  isStarted.value = true;
  isPaused.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  startTicker();
}

function togglePause() {
  if (!isStarted.value || isGameOver.value || props.disabled) return;
  isPaused.value = !isPaused.value;
}

const selectedNode = computed(() =>
  nodesState.value.find((n) => n.id === selectedNodeId.value)
);

const activeThreatsCount = computed(() =>
  nodesState.value.filter(
    (n) =>
      n.state === 'infected' ||
      n.state === 'compromised_iam' ||
      n.state === 'isolated' ||
      n.state === 'purged'
  ).length
);

function startTicker() {
  stopTicker();
  ticker = setInterval(() => {
    if (!isStarted.value || isPaused.value || isGameOver.value || props.disabled) return;

    const unisolatedInfected = nodesState.value.filter((n) => n.state === 'infected').length;
    const activeIam = nodesState.value.filter((n) => n.state === 'compromised_iam').length;

    const delta = unisolatedInfected * 2.2 + activeIam * 1.2 + 0.5;
    encryptionProgress.value = Math.min(100, Math.round((encryptionProgress.value + delta) * 10) / 10);

    if (encryptionProgress.value >= 100) {
      isGameOver.value = true;
      stopTicker();
      suriPose.value = 'error';
      suriReactionKey.value += 1;
      consoleMessage.value = '💥 El Ransomware cifró el 100% de la red antes de completar la contención.';
      consoleTone.value = 'bad';
      emit('submit', false);
    }
  }, 1000);
}

function selectNode(id: string) {
  if (!isStarted.value || isPaused.value || isGameOver.value || props.disabled) return;
  selectedNodeId.value = id;
}

function executeSocTool(action: SocActionType) {
  if (!isStarted.value || isPaused.value || isGameOver.value || props.disabled || !selectedNode.value) return;
  const node = selectedNode.value;

  if (action === 'isolate') {
    if (node.state === 'infected') {
      node.state = 'isolated';
      suriPose.value = 'ok';
      suriReactionKey.value += 1;
      consoleMessage.value = `🔌 [PASO 1 COMPLETADO] VLAN de "${node.name}" aislada. Propagación bloqueada. Ahora ejecuta Purgar Malware (EDR).`;
      consoleTone.value = 'good';
      const stillInfected = nodesState.value.some((n) => n.state === 'infected');
      if (!stillInfected) {
        nodesState.value.forEach((n) => {
          if (n.state === 'at_risk') n.state = 'healthy';
        });
      }
    } else {
      suriPose.value = 'surprised';
      suriReactionKey.value += 1;
      consoleMessage.value = `⚠️ "${node.name}" no requiere aislamiento de red en este estado. Revisa su diagnóstico.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 5);
    }
  } else if (action === 'revoke_iam') {
    if (node.state === 'compromised_iam') {
      node.state = 'secured';
      suriPose.value = 'ok';
      suriReactionKey.value += 1;
      consoleMessage.value = `🔑 ¡Sesión intrusa revocada en "${node.name}"! Credenciales rotadas con MFA.`;
      consoleTone.value = 'good';
    } else {
      suriPose.value = 'surprised';
      suriReactionKey.value += 1;
      consoleMessage.value = `⚠️ "${node.name}" no tiene robo de sesión IAM activo. Usa la herramienta correspondiente a su estado.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 5);
    }
  } else if (action === 'purge_malware') {
    if (node.state === 'isolated') {
      node.state = 'purged';
      suriPose.value = 'ok';
      suriReactionKey.value += 1;
      consoleMessage.value = `🛡️ [PASO 2 COMPLETADO] Payload de Ransomware eliminado en "${node.name}". Ahora restaura el Backup 3-2-1.`;
      consoleTone.value = 'good';
    } else if (node.state === 'infected') {
      suriPose.value = 'surprised';
      suriReactionKey.value += 1;
      consoleMessage.value = `🚨 ¡Protocolo NIST incorrecto! Primero debes AISLAR LA RED de "${node.name}" antes de purgar, o el virus se re-inyectará.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 8);
    } else {
      suriPose.value = 'surprised';
      suriReactionKey.value += 1;
      consoleMessage.value = `⚠️ "${node.name}" no está en fase de purga EDR.`;
      consoleTone.value = 'bad';
    }
  } else if (action === 'restore_backup') {
    if (node.state === 'purged') {
      node.state = 'secured';
      suriPose.value = 'ok';
      suriReactionKey.value += 1;
      consoleMessage.value = `💾 [PASO 3 COMPLETADO] "${node.name}" restaurado desde copia inmutable 3-2-1 sin pagar rescate.`;
      consoleTone.value = 'good';
    } else if (node.state === 'infected' || node.state === 'isolated') {
      suriPose.value = 'surprised';
      suriReactionKey.value += 1;
      consoleMessage.value = `🚨 ¡Peligro! No puedes restaurar el backup en "${node.name}" antes de aislar y purgar el malware activo.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 8);
    } else {
      suriPose.value = 'surprised';
      suriReactionKey.value += 1;
      consoleMessage.value = `⚠️ "${node.name}" no requiere restauración de backup.`;
      consoleTone.value = 'bad';
    }
  }

  checkVictory();
}

function checkVictory() {
  if (activeThreatsCount.value === 0 && !isGameOver.value) {
    isGameOver.value = true;
    stopTicker();
    suriPose.value = 'victory';
    suriReactionKey.value += 1;
    consoleMessage.value = '🏆 ¡INCIDENTE CONTENIDO AL 100%! Todos los activos de la PYME están limpios y operativos.';
    consoleTone.value = 'good';
    emit('submit', true);
  }
}

function getStateBadge(state: RuntimeNodeState) {
  switch (state) {
    case 'infected':
      return {
        label: '🔥 INFECTADO · 1° Aislar VLAN',
        cls: 'bg-error text-white animate-pulse',
      };
    case 'compromised_iam':
      return {
        label: '🔑 SESIÓN ROBADA · Revocar IAM',
        cls: 'bg-[#E1A653] text-[#291800] animate-bounce',
      };
    case 'isolated':
      return {
        label: '🔌 AISLADO · 2° Purgar EDR',
        cls: 'bg-tech-cyan text-[#001f24]',
      };
    case 'purged':
      return {
        label: '🧹 PURGADO · 3° Backup 3-2-1',
        cls: 'bg-[#F3B75B] text-[#291800]',
      };
    case 'at_risk':
      return {
        label: '⚠️ EN RIESGO DE CONTAGIO',
        cls: 'bg-[#E1A653]/20 text-[#F3B75B] border border-[#E1A653]/40',
      };
    case 'secured':
    case 'healthy':
      return {
        label: '✅ SEGURO / OPERATIVO',
        cls: 'bg-shield-green/20 text-shield-green border border-shield-green/40',
      };
  }
}

watch(
  () => props.exercise.id,
  () => {
    initSocGame();
  }
);

onMounted(() => {
  initSocGame();
});

onUnmounted(() => {
  stopTicker();
});
</script>

<template>
  <div class="w-full max-w-full flex flex-col gap-3.5 select-none overflow-hidden text-left">
    <!-- Top SOC Command Header (Paleta SuriLearn) -->
    <div class="bg-surface-container-lowest text-on-surface rounded-3xl p-3.5 sm:p-4 border-2 border-outline-variant/40 shadow-md flex flex-col gap-2.5 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-11 h-11 rounded-2xl bg-error/15 border border-error/40 p-0.5 flex items-center justify-center shrink-0">
            <SuriMascotAnimated
              :pose="suriPose"
              size="xs"
              :reaction-key="suriReactionKey"
              :show-shadow="false"
            />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="bg-error/15 text-error text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-error/40 w-fit max-w-full truncate">
              🚨 Consola SOC en Tiempo Real
            </span>
            <span class="text-xs sm:text-sm font-black text-on-surface break-words leading-tight mt-0.5">
              {{ exercise.threatName }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[11px] sm:text-xs font-black bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30">
            Nodos Comprometidos: <strong class="text-error">{{ activeThreatsCount }}</strong>
          </span>
          <button
            v-if="isStarted && !isGameOver"
            type="button"
            class="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] text-on-surface text-[11px] font-black border border-outline-variant/40 transition-colors"
            @click="togglePause"
          >
            {{ isPaused ? '▶ Reanudar' : '⏸ Pausar' }}
          </button>
        </div>
      </div>

      <!-- Ransomware Encryption Progress Bar -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] sm:text-[11px] font-black uppercase text-error truncate">
            Avance de Cifrado Ransomware:
          </span>
          <span class="text-xs font-black text-error shrink-0">{{ encryptionProgress }}%</span>
        </div>
        <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/40">
          <div
            class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#E1A653] to-error"
            :style="{ width: `${encryptionProgress}%` }"
          ></div>
        </div>
      </div>

      <div class="text-[11px] text-on-surface bg-surface-container-low px-3 py-2 rounded-xl border border-primary/25 break-words leading-relaxed">
        <strong class="text-primary">Protocolo NIST:</strong> {{ exercise.requiredSequenceHint }}
      </div>
    </div>

    <!-- Live SOC Telemetry Console -->
    <div
      class="px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border flex items-start gap-2.5 overflow-hidden"
      :class="
        consoleTone === 'good'
          ? 'bg-shield-green/15 text-shield-green border-shield-green/40'
          : 'bg-error/15 text-error border-error/40'
      "
    >
      <span class="material-symbols-outlined text-[18px] icon-filled shrink-0 mt-0.5">
        {{ consoleTone === 'good' ? 'check_circle' : 'terminal' }}
      </span>
      <span class="min-w-0 flex-1 break-words leading-snug">{{ consoleMessage }}</span>
    </div>

    <!-- Network Topology Nodes Grid (Warm Carbón / Arena Ocre SuriLearn) -->
    <div class="relative grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#1C1815] p-3 sm:p-4 rounded-3xl border-2 border-[#E1A653]/45 overflow-hidden">
      <button
        v-for="node in nodesState"
        :key="node.id"
        type="button"
        class="w-full min-w-0 p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden"
        :class="[
          selectedNodeId === node.id
            ? 'ring-2 ring-[#E1A653] bg-[#2B241F] border-[#E1A653]'
            : 'bg-[#231D19] border-[#44352C] hover:border-[#E1A653]/60',
        ]"
        @click="selectNode(node.id)"
      >
        <!-- Top Row: Status Pill Full-Width Responsive Strip -->
        <div class="flex items-center justify-between gap-2 w-full min-w-0">
          <span
            class="text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full max-w-full truncate"
            :class="getStateBadge(node.state).cls"
          >
            {{ getStateBadge(node.state).label }}
          </span>

          <span
            v-if="selectedNodeId === node.id"
            class="text-[9px] font-black uppercase text-[#F3B75B] bg-[#3D2D1E] px-2 py-0.5 rounded-full shrink-0 border border-[#E1A653]/40"
          >
            Seleccionado
          </span>
        </div>

        <!-- Middle Row: Server Icon + Name & Role -->
        <div class="flex items-center gap-2.5 w-full min-w-0">
          <div
            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
            :class="
              node.state === 'infected'
                ? 'bg-error/25 text-error'
                : node.state === 'compromised_iam'
                  ? 'bg-[#E1A653]/25 text-[#F3B75B]'
                  : node.state === 'isolated' || node.state === 'purged'
                    ? 'bg-tech-cyan/20 text-tech-cyan'
                    : 'bg-shield-green/20 text-shield-green'
            "
          >
            <span class="material-symbols-outlined text-[20px] sm:text-[22px] icon-filled">{{ node.icon }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <h4 class="text-xs sm:text-sm font-black text-[#FDFBF7] leading-tight break-words">
              {{ node.name }}
            </h4>
            <span class="text-[10px] text-[#D4C3B3] font-semibold block break-words leading-tight mt-0.5">
              {{ node.role }}
            </span>
          </div>
        </div>

        <!-- Bottom Row: Diagnostic Telemetry Note -->
        <p class="w-full min-w-0 text-[10px] sm:text-[11px] text-[#FFF2DA] leading-snug bg-[#161311] border border-[#44352C] p-2.5 rounded-xl font-mono break-words whitespace-normal">
          {{ node.infectionNote }}
        </p>
      </button>

      <!-- Start Overlay -->
      <div
        v-if="!isStarted"
        class="absolute inset-0 bg-[#161311]/90 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="shield" size="md" :auto-blink="false" :show-shadow="false" />
        <div class="max-w-md">
          <p class="text-sm font-black text-[#FDFBF7]">Sala de Crisis SOC — Protocolo NIST</p>
          <p class="text-[11px] text-[#D4C3B3] mt-1 leading-relaxed">
            Lee primero los nodos comprometidos. Al activar la consola iniciará el reloj de cifrado: aplica <strong class="text-[#F3B75B]">1° Aislar VLAN → 2° Purgar EDR → 3° Backup 3-2-1</strong> (y <strong class="text-[#F3B75B]">Revocar IAM</strong> si hay sesión robada).
          </p>
        </div>
        <button
          type="button"
          class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="startSocGame"
        >
          ¡Activar Consola SOC!
        </button>
      </div>

      <!-- Pause Overlay -->
      <div
        v-else-if="isPaused && !isGameOver"
        class="absolute inset-0 bg-[#161311]/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="sleeping" size="sm" :auto-blink="false" :show-shadow="false" />
        <p class="text-sm font-black text-[#F3B75B]">Consola SOC en Pausa</p>
        <button
          type="button"
          class="px-5 py-2 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="togglePause"
        >
          ▶ Reanudar Respuesta
        </button>
      </div>
    </div>

    <!-- SOC Action Deck for Selected Node -->
    <div
      v-if="selectedNode"
      class="bg-surface-container-lowest p-3.5 sm:p-4 rounded-3xl border-2 border-outline-variant/40 flex flex-col gap-3 overflow-hidden"
    >
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <span class="text-xs font-black text-on-surface break-words">
          🎯 Nodo Seleccionado: <span class="text-primary">{{ selectedNode.name }}</span>
        </span>
        <span class="text-[10px] font-bold text-on-surface-variant">
          Aplica el comando SOC correcto según su fase
        </span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
        <button
          type="button"
          :disabled="disabled || !isStarted || isPaused || isGameOver"
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-[#2B241F] hover:bg-[#3D322A] text-[#FDFBF7] border border-[#5F4030] font-black text-[11px] sm:text-xs shadow-[0_3px_0_#161311] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden disabled:opacity-50"
          @click="executeSocTool('isolate')"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[22px] text-tech-cyan icon-filled shrink-0">power_off</span>
          <span class="w-full break-words leading-tight">1. Aislar VLAN</span>
          <span class="text-[9px] text-[#D4C3B3] font-normal w-full break-words leading-tight">Corta propagación</span>
        </button>

        <button
          type="button"
          :disabled="disabled || !isStarted || isPaused || isGameOver"
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-[#E1A653] hover:bg-[#F3B75B] text-[#291800] font-black text-[11px] sm:text-xs shadow-[0_3px_0_#835502] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden disabled:opacity-50"
          @click="executeSocTool('revoke_iam')"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[22px] icon-filled shrink-0">key_off</span>
          <span class="w-full break-words leading-tight">Revocar IAM</span>
          <span class="text-[9px] text-[#5F3C00] font-bold w-full break-words leading-tight">Cierra sesión intrusa</span>
        </button>

        <button
          type="button"
          :disabled="disabled || !isStarted || isPaused || isGameOver"
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-[#006875] hover:bg-[#008394] text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#00363d] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden disabled:opacity-50"
          @click="executeSocTool('purge_malware')"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[22px] icon-filled shrink-0">cleaning_services</span>
          <span class="w-full break-words leading-tight">2. Purgar EDR</span>
          <span class="text-[9px] text-cyan-100 font-normal w-full break-words leading-tight">Elimina el virus</span>
        </button>

        <button
          type="button"
          :disabled="disabled || !isStarted || isPaused || isGameOver"
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-shield-green hover:bg-emerald-500 text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#14532d] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden disabled:opacity-50"
          @click="executeSocTool('restore_backup')"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[22px] icon-filled shrink-0">settings_backup_restore</span>
          <span class="w-full break-words leading-tight">3. Backup 3-2-1</span>
          <span class="text-[9px] text-emerald-100 font-normal w-full break-words leading-tight">Restaura datos</span>
        </button>
      </div>
    </div>
  </div>
</template>
