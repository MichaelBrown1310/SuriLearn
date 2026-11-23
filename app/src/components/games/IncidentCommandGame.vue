<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { IncidentCommandExercise, SocActionType } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

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
const isGameOver = ref<boolean>(false);

const suriSocImg = getSuriImage('shield');

let ticker: ReturnType<typeof setInterval> | null = null;

function initSocGame() {
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
  isGameOver.value = false;
  consoleMessage.value = `🚨 ALERTA SOC: ${props.exercise.scenarioAlert}`;
  consoleTone.value = 'bad';
  startTicker();
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
    if (isGameOver.value || props.disabled) return;

    // Count un-isolated infected nodes
    const unisolatedInfected = nodesState.value.filter((n) => n.state === 'infected').length;
    const activeIam = nodesState.value.filter((n) => n.state === 'compromised_iam').length;

    const delta = unisolatedInfected * 2.2 + activeIam * 1.2 + 0.5;
    encryptionProgress.value = Math.min(100, Math.round((encryptionProgress.value + delta) * 10) / 10);

    if (encryptionProgress.value >= 100) {
      isGameOver.value = true;
      stopTicker();
      consoleMessage.value = '💥 El Ransomware cifró el 100% de la red antes de completar la contención.';
      consoleTone.value = 'bad';
      emit('submit', false);
    }
  }, 1000);
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function selectNode(id: string) {
  if (isGameOver.value || props.disabled) return;
  selectedNodeId.value = id;
}

function executeSocTool(action: SocActionType) {
  if (isGameOver.value || props.disabled || !selectedNode.value) return;
  const node = selectedNode.value;

  if (action === 'isolate') {
    if (node.state === 'infected') {
      node.state = 'isolated';
      consoleMessage.value = `🔌 [PASO 1 COMPLETADO] VLAN de "${node.name}" aislada. Propagación bloqueada. Ahora ejecuta Purgar Malware (EDR).`;
      consoleTone.value = 'good';
      // Neighbours at_risk become healthy if no other infected exists
      const stillInfected = nodesState.value.some((n) => n.state === 'infected');
      if (!stillInfected) {
        nodesState.value.forEach((n) => {
          if (n.state === 'at_risk') n.state = 'healthy';
        });
      }
    } else {
      consoleMessage.value = `⚠️ "${node.name}" no requiere aislamiento de red en este estado. Revisa su diagnóstico.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 5);
    }
  } else if (action === 'revoke_iam') {
    if (node.state === 'compromised_iam') {
      node.state = 'secured';
      consoleMessage.value = `🔑 ¡Sesión intrusa revocada en "${node.name}"! Credenciales rotadas con MFA.`;
      consoleTone.value = 'good';
    } else {
      consoleMessage.value = `⚠️ "${node.name}" no tiene robo de sesión IAM activo. Usa la herramienta correspondiente a su estado.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 5);
    }
  } else if (action === 'purge_malware') {
    if (node.state === 'isolated') {
      node.state = 'purged';
      consoleMessage.value = `🛡️ [PASO 2 COMPLETADO] Payload de Ransomware eliminado en "${node.name}". Ahora restaura el Backup 3-2-1.`;
      consoleTone.value = 'good';
    } else if (node.state === 'infected') {
      consoleMessage.value = `🚨 ¡Protocolo NIST incorrecto! Primero debes AISLAR LA RED de "${node.name}" antes de purgar, o el virus se re-inyectará.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 8);
    } else {
      consoleMessage.value = `⚠️ "${node.name}" no está en fase de purga EDR.`;
      consoleTone.value = 'bad';
    }
  } else if (action === 'restore_backup') {
    if (node.state === 'purged') {
      node.state = 'secured';
      consoleMessage.value = `💾 [PASO 3 COMPLETADO] "${node.name}" restaurado desde copia inmutable 3-2-1 sin pagar rescate.`;
      consoleTone.value = 'good';
    } else if (node.state === 'infected' || node.state === 'isolated') {
      consoleMessage.value = `🚨 ¡Peligro! No puedes restaurar el backup en "${node.name}" antes de aislar y purgar el malware activo.`;
      consoleTone.value = 'bad';
      encryptionProgress.value = Math.min(100, encryptionProgress.value + 8);
    } else {
      consoleMessage.value = `⚠️ "${node.name}" no requiere restauración de backup.`;
      consoleTone.value = 'bad';
    }
  }

  checkVictory();
}

function checkVictory() {
  if (activeThreatsCount.value === 0) {
    isGameOver.value = true;
    stopTicker();
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
        cls: 'bg-amber-500 text-black animate-bounce',
      };
    case 'isolated':
      return {
        label: '🔌 AISLADO · 2° Purgar EDR',
        cls: 'bg-tech-cyan text-black',
      };
    case 'purged':
      return {
        label: '🧹 PURGADO · 3° Backup 3-2-1',
        cls: 'bg-purple-400 text-black',
      };
    case 'at_risk':
      return {
        label: '⚠️ EN RIESGO DE CONTAGIO',
        cls: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
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
  <div class="w-full max-w-full flex flex-col gap-3.5 select-none overflow-hidden">
    <!-- Top SOC Command Header -->
    <div class="bg-[#161219] text-white rounded-3xl p-3.5 sm:p-4 border-2 border-rose-500/40 shadow-lg flex flex-col gap-2.5 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/40 p-1 flex items-center justify-center shrink-0">
            <img :src="suriSocImg" alt="Suri SOC Commander" class="w-full h-full object-contain" />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="bg-error/20 text-error text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-error/40 animate-pulse w-fit max-w-full truncate">
              🚨 Consola SOC en Tiempo Real
            </span>
            <span class="text-xs sm:text-sm font-black text-amber-300 break-words leading-tight mt-0.5">
              {{ exercise.threatName }}
            </span>
          </div>
        </div>

        <span class="text-[11px] sm:text-xs font-black bg-white/10 px-3 py-1 rounded-xl shrink-0">
          Nodos Comprometidos: <strong class="text-error">{{ activeThreatsCount }}</strong>
        </span>
      </div>

      <!-- Ransomware Encryption Progress Bar (Responsive Stacked Header + Bar) -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] sm:text-[11px] font-black uppercase text-rose-300 truncate">
            Avance de Cifrado Ransomware:
          </span>
          <span class="text-xs font-black text-rose-400 shrink-0">{{ encryptionProgress }}%</span>
        </div>
        <div class="w-full h-3 bg-stone-900 rounded-full overflow-hidden p-0.5 border border-rose-500/40">
          <div
            class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-amber-500 to-error"
            :style="{ width: `${encryptionProgress}%` }"
          ></div>
        </div>
      </div>

      <div class="text-[11px] text-slate-300 bg-white/5 px-3 py-2 rounded-xl border border-white/10 break-words leading-relaxed">
        <strong class="text-amber-300">Protocolo NIST:</strong> {{ exercise.requiredSequenceHint }}
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

    <!-- Network Topology Nodes Grid (1 col on mobile/narrow, 2 cols on md+) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0E131F] p-3 sm:p-4 rounded-3xl border-2 border-slate-700 overflow-hidden">
      <button
        v-for="node in nodesState"
        :key="node.id"
        type="button"
        class="w-full min-w-0 p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden"
        :class="[
          selectedNodeId === node.id
            ? 'ring-2 ring-tech-cyan bg-slate-800/95 border-tech-cyan'
            : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500',
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
            class="text-[9px] font-black uppercase text-tech-cyan bg-tech-cyan/15 px-2 py-0.5 rounded-full shrink-0 border border-tech-cyan/30"
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
                  ? 'bg-amber-500/25 text-amber-400'
                  : node.state === 'isolated' || node.state === 'purged'
                    ? 'bg-tech-cyan/20 text-tech-cyan'
                    : 'bg-shield-green/20 text-shield-green'
            "
          >
            <span class="material-symbols-outlined text-[20px] sm:text-[22px] icon-filled">{{ node.icon }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <h4 class="text-xs sm:text-sm font-black text-white leading-tight break-words">
              {{ node.name }}
            </h4>
            <span class="text-[10px] text-slate-400 font-semibold block break-words leading-tight mt-0.5">
              {{ node.role }}
            </span>
          </div>
        </div>

        <!-- Bottom Row: Diagnostic Telemetry Note -->
        <p class="w-full min-w-0 text-[10px] sm:text-[11px] text-slate-300 leading-snug bg-black/40 p-2.5 rounded-xl font-mono break-words whitespace-normal">
          {{ node.infectionNote }}
        </p>
      </button>
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
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#0f172a] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden"
          @click="executeSocTool('isolate')"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[22px] text-tech-cyan icon-filled shrink-0">power_off</span>
          <span class="w-full break-words leading-tight">1. Aislar VLAN</span>
          <span class="text-[9px] text-slate-300 font-normal w-full break-words leading-tight">Corta propagación</span>
        </button>

        <button
          type="button"
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#78350f] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden"
          @click="executeSocTool('revoke_iam')"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[22px] icon-filled shrink-0">key_off</span>
          <span class="w-full break-words leading-tight">Revocar IAM</span>
          <span class="text-[9px] text-amber-100 font-normal w-full break-words leading-tight">Cierra sesión intrusa</span>
        </button>

        <button
          type="button"
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#312e81] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden"
          @click="executeSocTool('purge_malware')"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[22px] icon-filled shrink-0">cleaning_services</span>
          <span class="w-full break-words leading-tight">2. Purgar EDR</span>
          <span class="text-[9px] text-indigo-100 font-normal w-full break-words leading-tight">Elimina el virus</span>
        </button>

        <button
          type="button"
          class="min-w-0 p-2.5 sm:p-3 rounded-2xl bg-shield-green hover:bg-emerald-500 text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#14532d] active:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 text-center overflow-hidden"
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
