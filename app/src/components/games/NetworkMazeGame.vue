<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { NetworkMazeExercise, MazeCellType } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  exercise: NetworkMazeExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

const gridState = ref<MazeCellType[][]>([]);
const playerRow = ref<number>(0);
const playerCol = ref<number>(0);
const hasVpnShield = ref<boolean>(false);
const hasMfaKey = ref<boolean>(false);
const collectedPackets = ref<number>(0);
const totalPacketsInMap = ref<number>(0);
const integrityHp = ref<number>(100);
const statusLog = ref<string>('Usa las flechas del teclado (WASD) o el D-Pad táctil para mover a Suri.');
const statusTone = ref<'info' | 'good' | 'bad'>('info');
const isFinished = ref<boolean>(false);

const suriImg = getSuriImage('running');

function initBoard() {
  const cloned = props.exercise.grid.map((row) => [...row]);
  let pktCount = 0;

  for (let r = 0; r < cloned.length; r++) {
    for (let c = 0; c < cloned[r].length; c++) {
      if (cloned[r][c] === 'start') {
        playerRow.value = r;
        playerCol.value = c;
      } else if (cloned[r][c] === 'data_packet') {
        pktCount += 1;
      }
    }
  }

  gridState.value = cloned;
  totalPacketsInMap.value = pktCount;
  collectedPackets.value = 0;
  hasVpnShield.value = !props.exercise.requireVpnBeforeGoal;
  hasMfaKey.value = !props.exercise.requireMfaBeforeGoal;
  integrityHp.value = 100;
  isFinished.value = false;
  statusLog.value = props.exercise.missionObjective;
  statusTone.value = 'info';
}

const canEnterServer = computed(() => {
  return (
    hasVpnShield.value &&
    hasMfaKey.value &&
    collectedPackets.value >= totalPacketsInMap.value
  );
});

function movePlayer(dRow: number, dCol: number) {
  if (isFinished.value || props.disabled) return;

  const targetRow = playerRow.value + dRow;
  const targetCol = playerCol.value + dCol;

  if (
    targetRow < 0 ||
    targetRow >= props.exercise.gridRows ||
    targetCol < 0 ||
    targetCol >= props.exercise.gridCols
  ) {
    return;
  }

  const targetCell = gridState.value[targetRow]?.[targetCol];
  if (!targetCell || targetCell === 'wall') {
    statusLog.value = '🧱 Firewall de subred bloqueado: busca una ruta alterna.';
    statusTone.value = 'info';
    return;
  }

  // Move Suri
  playerRow.value = targetRow;
  playerCol.value = targetCol;

  // Evaluate cell interaction
  if (targetCell === 'vpn_shield') {
    hasVpnShield.value = true;
    gridState.value[targetRow][targetCol] = 'empty';
    statusLog.value = '🛡️ ¡Túnel VPN AES-256 Activado! Ahora tu tráfico es invisible ante Sniffers Wi-Fi.';
    statusTone.value = 'good';
  } else if (targetCell === 'mfa_key') {
    hasMfaKey.value = true;
    gridState.value[targetRow][targetCol] = 'empty';
    statusLog.value = '🔑 ¡Token MFA FIDO2 Obtenido! Identidad Zero Trust verificada.';
    statusTone.value = 'good';
  } else if (targetCell === 'data_packet') {
    collectedPackets.value += 1;
    gridState.value[targetRow][targetCol] = 'empty';
    statusLog.value = `📦 Paquete confidencial asegurado (${collectedPackets.value}/${totalPacketsInMap.value}).`;
    statusTone.value = 'good';
  } else if (targetCell === 'sniffer_trap') {
    if (hasVpnShield.value) {
      statusLog.value = '😎 Pasaste frente a un Sniffer de red, pero tu túnel VPN cifró todos los paquetes.';
      statusTone.value = 'good';
    } else {
      integrityHp.value = Math.max(0, integrityHp.value - 50);
      statusLog.value = '🚨 ¡Trampa Man-in-the-Middle! Cruzaste por un Sniffer sin activar primero la VPN (-50% Escudo).';
      statusTone.value = 'bad';
      if (integrityHp.value <= 0) {
        isFinished.value = true;
        emit('submit', false);
      }
    }
  } else if (targetCell === 'evil_twin_ap') {
    integrityHp.value = Math.max(0, integrityHp.value - 50);
    statusLog.value = '📡 ¡Punto Wi-Fi "Evil Twin" Falso! Te conectaste a una red clonada por atacantes (-50% Escudo).';
    statusTone.value = 'bad';
    if (integrityHp.value <= 0) {
      isFinished.value = true;
      emit('submit', false);
    }
  } else if (targetCell === 'server_goal') {
    if (canEnterServer.value) {
      statusLog.value = '🏆 ¡Conexión Segura Completada! Datos entregados al Servidor Corporativo.';
      statusTone.value = 'good';
      isFinished.value = true;
      emit('submit', true);
    } else {
      const missing: string[] = [];
      if (!hasVpnShield.value) missing.push('Escudo VPN 🛡️');
      if (!hasMfaKey.value) missing.push('Llave MFA 🔑');
      if (collectedPackets.value < totalPacketsInMap.value) {
        missing.push(`Paquetes (${collectedPackets.value}/${totalPacketsInMap.value}) 📦`);
      }
      statusLog.value = `🔒 El Servidor Zero Trust rechaza el acceso: primero recolecta ${missing.join(' + ')}.`;
      statusTone.value = 'bad';
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (isFinished.value || props.disabled) return;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    movePlayer(-1, 0);
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    movePlayer(1, 0);
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    movePlayer(0, -1);
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    movePlayer(0, 1);
  }
}

watch(
  () => props.exercise.id,
  () => {
    initBoard();
  }
);

onMounted(() => {
  initBoard();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none">
    <!-- Top Tactical HUD -->
    <div class="bg-[#141824] text-white rounded-3xl p-4 border-2 border-slate-700 shadow-lg flex flex-col gap-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="bg-tech-cyan/20 text-tech-cyan text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-tech-cyan/40">
            🎮 Laberinto Táctico 2D
          </span>
          <h3 class="text-xs sm:text-sm font-black">{{ exercise.title }}</h3>
        </div>

        <!-- Inventory Badges -->
        <div class="flex items-center gap-2">
          <span
            class="px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border"
            :class="
              hasVpnShield
                ? 'bg-shield-green/20 text-shield-green border-shield-green/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            "
          >
            <span class="material-symbols-outlined text-[15px] icon-filled">vpn_lock</span>
            <span>{{ hasVpnShield ? 'VPN Activa' : 'Sin VPN' }}</span>
          </span>

          <span
            v-if="exercise.requireMfaBeforeGoal"
            class="px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border"
            :class="
              hasMfaKey
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            "
          >
            <span class="material-symbols-outlined text-[15px] icon-filled">key</span>
            <span>{{ hasMfaKey ? 'MFA Listo' : 'Falta MFA' }}</span>
          </span>

          <span class="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-800 text-tech-cyan border border-slate-700">
            📦 {{ collectedPackets }}/{{ totalPacketsInMap }}
          </span>
        </div>
      </div>

      <!-- Shield Integrity Bar -->
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-black uppercase text-slate-300">Escudo de Datos:</span>
        <div class="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="integrityHp > 50 ? 'bg-tech-cyan' : 'bg-error'"
            :style="{ width: `${integrityHp}%` }"
          ></div>
        </div>
        <span class="text-xs font-black">{{ integrityHp }}%</span>
      </div>
    </div>

    <!-- Live Status Console -->
    <div
      class="px-4 py-2.5 rounded-2xl text-xs font-extrabold border flex items-center gap-2"
      :class="
        statusTone === 'good'
          ? 'bg-shield-green/15 text-shield-green border-shield-green/40'
          : statusTone === 'bad'
            ? 'bg-error/15 text-error border-error/40'
            : 'bg-surface-container-high text-on-surface border-outline-variant/40'
      "
    >
      <span class="material-symbols-outlined text-[18px] icon-filled">
        {{ statusTone === 'good' ? 'verified_user' : statusTone === 'bad' ? 'gpp_bad' : 'radar' }}
      </span>
      <span>{{ statusLog }}</span>
    </div>

    <!-- 2D Grid Board + D-Pad Layout -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-5 bg-[#0F131D] p-4 rounded-3xl border-2 border-slate-700 shadow-inner">
      <!-- Grid Matrix -->
      <div
        class="grid gap-1.5 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-700"
        :style="{
          gridTemplateColumns: `repeat(${exercise.gridCols}, minmax(0, 1fr))`,
        }"
      >
        <template v-for="(row, rIdx) in gridState" :key="`r_${rIdx}`">
          <button
            v-for="(cell, cIdx) in row"
            :key="`c_${rIdx}_${cIdx}`"
            type="button"
            class="w-12 h-12 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center relative transition-all border"
            :class="[
              cell === 'wall'
                ? 'bg-slate-800 border-slate-700 cursor-not-allowed'
                : cell === 'server_goal'
                  ? canEnterServer
                    ? 'bg-shield-green/25 border-shield-green animate-pulse'
                    : 'bg-amber-500/15 border-amber-500/40'
                  : cell === 'sniffer_trap' || cell === 'evil_twin_ap'
                    ? 'bg-error/15 border-error/40'
                    : cell === 'vpn_shield'
                      ? 'bg-tech-cyan/20 border-tech-cyan/50'
                      : cell === 'mfa_key'
                        ? 'bg-amber-400/20 border-amber-400/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-600',
            ]"
            @click="
              Math.abs(rIdx - playerRow) + Math.abs(cIdx - playerCol) === 1
                ? movePlayer(rIdx - playerRow, cIdx - playerCol)
                : null
            "
          >
            <!-- Suri Player Avatar -->
            <div
              v-if="playerRow === rIdx && playerCol === cIdx"
              class="w-10 h-10 rounded-xl p-0.5 flex items-center justify-center z-20 transition-transform scale-110"
              :class="hasVpnShield ? 'bg-tech-cyan/30 ring-2 ring-tech-cyan' : 'bg-primary/30 ring-2 ring-primary'"
            >
              <img :src="suriImg" alt="Suri" class="w-full h-full object-contain" />
            </div>

            <!-- Cell Contents -->
            <template v-else>
              <span v-if="cell === 'wall'" class="material-symbols-outlined text-[20px] text-slate-600">
                grid_view
              </span>
              <span
                v-else-if="cell === 'vpn_shield'"
                class="material-symbols-outlined text-[24px] text-tech-cyan icon-filled animate-bounce"
                title="Escudo VPN AES-256"
              >
                vpn_lock
              </span>
              <span
                v-else-if="cell === 'mfa_key'"
                class="material-symbols-outlined text-[24px] text-amber-400 icon-filled animate-bounce"
                title="Llave MFA"
              >
                key
              </span>
              <span
                v-else-if="cell === 'data_packet'"
                class="material-symbols-outlined text-[22px] text-emerald-400 icon-filled"
                title="Paquete Confidencial"
              >
                folder_zip
              </span>
              <span
                v-else-if="cell === 'sniffer_trap'"
                class="material-symbols-outlined text-[22px] text-error icon-filled"
                title="Sniffer Man-in-the-Middle"
              >
                bug_report
              </span>
              <span
                v-else-if="cell === 'evil_twin_ap'"
                class="material-symbols-outlined text-[22px] text-error icon-filled"
                title="Wi-Fi Gratis Falso (Evil Twin)"
              >
                wifi_tethering_error
              </span>
              <span
                v-else-if="cell === 'server_goal'"
                class="material-symbols-outlined text-[26px] icon-filled"
                :class="canEnterServer ? 'text-shield-green' : 'text-amber-400'"
                title="Servidor Corporativo"
              >
                dns
              </span>
            </template>
          </button>
        </template>
      </div>

      <!-- Tactile D-Pad Controller & Legend -->
      <div class="flex flex-col items-center gap-3">
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Control Táctico (o Teclas WASD)
        </span>

        <div class="grid grid-cols-3 gap-1.5 w-36">
          <div></div>
          <button
            type="button"
            class="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-white flex items-center justify-center border border-slate-600 shadow-sm"
            @click="movePlayer(-1, 0)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_up</span>
          </button>
          <div></div>

          <button
            type="button"
            class="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-white flex items-center justify-center border border-slate-600 shadow-sm"
            @click="movePlayer(0, -1)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_left</span>
          </button>
          <button
            type="button"
            class="h-11 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center border border-slate-700 text-[10px] font-black"
            title="Reiniciar Mapa"
            @click="initBoard"
          >
            <span class="material-symbols-outlined text-[18px]">refresh</span>
          </button>
          <button
            type="button"
            class="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-white flex items-center justify-center border border-slate-600 shadow-sm"
            @click="movePlayer(0, 1)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_right</span>
          </button>

          <div></div>
          <button
            type="button"
            class="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-white flex items-center justify-center border border-slate-600 shadow-sm"
            @click="movePlayer(1, 0)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
          <div></div>
        </div>

        <!-- Mini Legend -->
        <div class="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 flex flex-col gap-1 w-44">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-tech-cyan icon-filled">vpn_lock</span>
            <span><strong>VPN:</strong> Cifra y protege de Sniffers</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-emerald-400 icon-filled">folder_zip</span>
            <span><strong>Datos:</strong> Recolectar todos</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-error icon-filled">bug_report</span>
            <span><strong>Sniffer / Wi-Fi Falso:</strong> Peligro</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-shield-green icon-filled">dns</span>
            <span><strong>Servidor:</strong> Meta final</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
