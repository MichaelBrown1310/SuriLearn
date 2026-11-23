<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { NetworkMazeExercise, MazeCellType, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

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
const stepsCount = ref<number>(0);
const visitedCells = ref<Set<string>>(new Set());
const facingLeft = ref<boolean>(false);
const boardShake = ref<boolean>(false);
const statusLog = ref<string>('Usa las flechas del teclado (WASD), desliza o usa el D-Pad táctil para mover a Suri.');
const statusTone = ref<'info' | 'good' | 'bad'>('info');
const isFinished = ref<boolean>(false);

const suriReactionPose = ref<SuriPose | null>(null);
const suriReactionKey = ref<number>(0);

let touchStartX = 0;
let touchStartY = 0;
let shakeTimeout: ReturnType<typeof setTimeout> | null = null;

const suriPose = computed<SuriPose>(() => {
  if (suriReactionPose.value) return suriReactionPose.value;
  if (hasVpnShield.value) return 'cool';
  return 'running';
});

function triggerShake() {
  boardShake.value = false;
  if (shakeTimeout) clearTimeout(shakeTimeout);
  requestAnimationFrame(() => {
    boardShake.value = true;
    shakeTimeout = setTimeout(() => {
      boardShake.value = false;
    }, 350);
  });
}

function initBoard() {
  const cloned = props.exercise.grid.map((row) => [...row]);
  let pktCount = 0;
  let startR = 0;
  let startC = 0;

  for (let r = 0; r < cloned.length; r++) {
    for (let c = 0; c < cloned[r].length; c++) {
      if (cloned[r][c] === 'start') {
        startR = r;
        startC = c;
      } else if (cloned[r][c] === 'data_packet') {
        pktCount += 1;
      }
    }
  }

  playerRow.value = startR;
  playerCol.value = startC;
  gridState.value = cloned;
  totalPacketsInMap.value = pktCount;
  collectedPackets.value = 0;
  stepsCount.value = 0;
  visitedCells.value = new Set([`${startR}_${startC}`]);
  facingLeft.value = false;
  hasVpnShield.value = !props.exercise.requireVpnBeforeGoal;
  hasMfaKey.value = !props.exercise.requireMfaBeforeGoal;
  integrityHp.value = 100;
  isFinished.value = false;
  suriReactionPose.value = null;
  suriReactionKey.value += 1;
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

function isAdjacentWalkable(r: number, c: number): boolean {
  const dist = Math.abs(r - playerRow.value) + Math.abs(c - playerCol.value);
  if (dist !== 1) return false;
  return gridState.value[r]?.[c] !== 'wall';
}

function finishGame(won: boolean) {
  if (isFinished.value) return;
  isFinished.value = true;
  suriReactionPose.value = won ? 'victory' : 'error';
  suriReactionKey.value += 1;
  emit('submit', won);
}

function movePlayer(dRow: number, dCol: number) {
  if (isFinished.value || props.disabled) return;

  if (dCol < 0) facingLeft.value = true;
  else if (dCol > 0) facingLeft.value = false;

  const targetRow = playerRow.value + dRow;
  const targetCol = playerCol.value + dCol;

  if (
    targetRow < 0 ||
    targetRow >= props.exercise.gridRows ||
    targetCol < 0 ||
    targetCol >= props.exercise.gridCols
  ) {
    triggerShake();
    return;
  }

  const targetCell = gridState.value[targetRow]?.[targetCol];
  if (!targetCell || targetCell === 'wall') {
    statusLog.value = '🧱 Firewall de subred bloqueado: busca una ruta alterna.';
    statusTone.value = 'info';
    triggerShake();
    return;
  }

  // Move Suri
  playerRow.value = targetRow;
  playerCol.value = targetCol;
  stepsCount.value += 1;
  const nextVisited = new Set(visitedCells.value);
  nextVisited.add(`${targetRow}_${targetCol}`);
  visitedCells.value = nextVisited;
  suriReactionPose.value = null;

  // Evaluate cell interaction
  if (targetCell === 'vpn_shield') {
    hasVpnShield.value = true;
    gridState.value[targetRow][targetCol] = 'empty';
    suriReactionPose.value = 'ok';
    suriReactionKey.value += 1;
    statusLog.value = '🛡️ ¡Túnel VPN AES-256 Activado! Ahora tu tráfico es invisible ante Sniffers Wi-Fi.';
    statusTone.value = 'good';
  } else if (targetCell === 'mfa_key') {
    hasMfaKey.value = true;
    gridState.value[targetRow][targetCol] = 'empty';
    suriReactionPose.value = 'ok';
    suriReactionKey.value += 1;
    statusLog.value = '🔑 ¡Token MFA FIDO2 Obtenido! Identidad Zero Trust verificada.';
    statusTone.value = 'good';
  } else if (targetCell === 'data_packet') {
    collectedPackets.value += 1;
    gridState.value[targetRow][targetCol] = 'empty';
    suriReactionPose.value = 'ok';
    suriReactionKey.value += 1;
    statusLog.value = `📦 Paquete confidencial asegurado (${collectedPackets.value}/${totalPacketsInMap.value}).`;
    statusTone.value = 'good';
  } else if (targetCell === 'sniffer_trap') {
    if (hasVpnShield.value) {
      statusLog.value = '😎 Sniffer neutralizado: tu túnel VPN AES-256 cifró todo el tráfico al pasar.';
      statusTone.value = 'good';
    } else {
      integrityHp.value = Math.max(0, integrityHp.value - 50);
      suriReactionPose.value = 'surprised';
      suriReactionKey.value += 1;
      triggerShake();
      statusLog.value = '🚨 ¡Trampa Man-in-the-Middle! Cruzaste por un Sniffer sin activar primero la VPN (-50% Escudo).';
      statusTone.value = 'bad';
      if (integrityHp.value <= 0) {
        finishGame(false);
      }
    }
  } else if (targetCell === 'evil_twin_ap') {
    integrityHp.value = Math.max(0, integrityHp.value - 50);
    suriReactionPose.value = 'surprised';
    suriReactionKey.value += 1;
    triggerShake();
    statusLog.value = '📡 ¡Punto Wi-Fi "Evil Twin" Falso! Te conectaste a una red clonada por atacantes (-50% Escudo).';
    statusTone.value = 'bad';
    if (integrityHp.value <= 0) {
      finishGame(false);
    }
  } else if (targetCell === 'server_goal') {
    if (canEnterServer.value) {
      statusLog.value = `🏆 ¡Conexión Segura Completada en ${stepsCount.value} pasos! Datos entregados al Servidor Corporativo.`;
      statusTone.value = 'good';
      finishGame(true);
    } else {
      const missing: string[] = [];
      if (!hasVpnShield.value) missing.push('Escudo VPN 🛡️');
      if (!hasMfaKey.value) missing.push('Llave MFA 🔑');
      if (collectedPackets.value < totalPacketsInMap.value) {
        missing.push(`Paquetes (${collectedPackets.value}/${totalPacketsInMap.value}) 📦`);
      }
      suriReactionPose.value = 'surprised';
      suriReactionKey.value += 1;
      triggerShake();
      statusLog.value = `🔒 El Servidor Zero Trust rechaza el acceso: primero recolecta ${missing.join(' + ')}.`;
      statusTone.value = 'bad';
    }
  }
}

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 0) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e: TouchEvent) {
  if (isFinished.value || props.disabled || e.changedTouches.length === 0) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    movePlayer(0, dx > 0 ? 1 : -1);
  } else {
    movePlayer(dy > 0 ? 1 : -1, 0);
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (isFinished.value || props.disabled) return;
  const key = e.key.toLowerCase();
  if (e.key === 'ArrowUp' || key === 'w') {
    e.preventDefault();
    movePlayer(-1, 0);
  } else if (e.key === 'ArrowDown' || key === 's') {
    e.preventDefault();
    movePlayer(1, 0);
  } else if (e.key === 'ArrowLeft' || key === 'a') {
    e.preventDefault();
    movePlayer(0, -1);
  } else if (e.key === 'ArrowRight' || key === 'd') {
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
  if (shakeTimeout) clearTimeout(shakeTimeout);
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none text-left">
    <!-- Top Tactical HUD (Paleta SuriLearn) -->
    <div class="bg-surface-container-lowest text-on-surface rounded-3xl p-4 border-2 border-outline-variant/40 shadow-md flex flex-col gap-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/35 p-0.5 flex items-center justify-center shrink-0">
            <SuriMascotAnimated
              :pose="suriPose"
              size="xs"
              :reaction-key="suriReactionKey"
              :show-shadow="false"
            />
          </div>
          <div class="min-w-0">
            <span class="bg-primary/15 text-primary text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-primary/30 w-fit inline-block">
              🧭 Laberinto Táctico 2.5D
            </span>
            <h3 class="text-xs sm:text-sm font-black text-on-surface mt-0.5">{{ exercise.title }}</h3>
          </div>
        </div>

        <!-- Inventory Badges -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span
            class="px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border"
            :class="
              hasVpnShield
                ? 'bg-shield-green/15 text-shield-green border-shield-green/40'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
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
                ? 'bg-primary/15 text-primary border-primary/40'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
            "
          >
            <span class="material-symbols-outlined text-[15px] icon-filled">key</span>
            <span>{{ hasMfaKey ? 'MFA Listo' : 'Falta MFA' }}</span>
          </span>

          <span class="px-2.5 py-1 rounded-xl text-[11px] font-black bg-surface-container text-on-surface border border-outline-variant/40">
            📦 {{ collectedPackets }}/{{ totalPacketsInMap }}
          </span>

          <span class="px-2.5 py-1 rounded-xl text-[11px] font-black bg-surface-container-low text-on-surface-variant border border-outline-variant/30">
            Pasos: {{ stepsCount }}
          </span>
        </div>
      </div>

      <!-- Shield Integrity Bar -->
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-black uppercase text-on-surface-variant shrink-0">Escudo de Datos:</span>
        <div class="flex-1 h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/30">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="integrityHp > 50 ? 'bg-tech-cyan' : 'bg-error'"
            :style="{ width: `${integrityHp}%` }"
          ></div>
        </div>
        <span class="text-xs font-black text-on-surface">{{ integrityHp }}%</span>
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
      <span class="material-symbols-outlined text-[18px] icon-filled shrink-0">
        {{ statusTone === 'good' ? 'verified_user' : statusTone === 'bad' ? 'gpp_bad' : 'radar' }}
      </span>
      <span>{{ statusLog }}</span>
    </div>

    <!-- 2D Grid Board + D-Pad Layout ("Madriguera Digital 2.5D") -->
    <div
      class="flex flex-col sm:flex-row items-center justify-center gap-5 bg-[#231D19] p-4 rounded-3xl border-2 border-[#E1A653]/45 shadow-inner transition-transform"
      :class="{ 'animate-shake': boardShake }"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    >
      <!-- Grid Matrix -->
      <div
        class="grid gap-1.5 bg-[#161311] p-2.5 rounded-2xl border border-[#44352C]"
        :style="{
          gridTemplateColumns: `repeat(${exercise.gridCols}, minmax(0, 1fr))`,
        }"
      >
        <template v-for="(row, rIdx) in gridState" :key="`r_${rIdx}`">
          <button
            v-for="(cell, cIdx) in row"
            :key="`c_${rIdx}_${cIdx}`"
            type="button"
            class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center relative transition-all border"
            :class="[
              cell === 'wall'
                ? 'bg-[#44352C] border-[#5F4030] shadow-[inset_0_-3px_0_#161311] cursor-not-allowed'
                : cell === 'server_goal'
                  ? canEnterServer
                    ? 'bg-shield-green/25 border-shield-green animate-pulse'
                    : 'bg-[#E1A653]/20 border-[#E1A653]/60'
                  : cell === 'sniffer_trap'
                    ? hasVpnShield
                      ? 'bg-tech-cyan/10 border-tech-cyan/40'
                      : 'bg-error/20 border-error/60 animate-pulse'
                    : cell === 'evil_twin_ap'
                      ? 'bg-error/20 border-error/60'
                      : cell === 'vpn_shield'
                        ? 'bg-tech-cyan/20 border-tech-cyan/50'
                        : cell === 'mfa_key'
                          ? 'bg-[#E1A653]/25 border-[#E1A653]/60'
                          : visitedCells.has(`${rIdx}_${cIdx}`)
                            ? hasVpnShield
                              ? 'bg-tech-cyan/12 border-tech-cyan/30'
                              : 'bg-[#E1A653]/12 border-[#E1A653]/25'
                            : 'bg-[#231D19] border-[#342B24]',
              isAdjacentWalkable(rIdx, cIdx)
                ? 'ring-1 ring-[#E1A653]/40 hover:border-[#E1A653] hover:bg-[#342B24] cursor-pointer'
                : '',
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
              :class="hasVpnShield ? 'bg-tech-cyan/25 ring-2 ring-tech-cyan' : 'bg-[#E1A653]/30 ring-2 ring-[#E1A653]'"
            >
              <div :class="{ 'scale-x-[-1]': facingLeft }">
                <SuriMascotAnimated
                  :pose="suriPose"
                  size="xs"
                  :reaction-key="suriReactionKey"
                  :show-shadow="false"
                  :auto-blink="false"
                />
              </div>
            </div>

            <!-- Cell Contents -->
            <template v-else>
              <span v-if="cell === 'wall'" class="material-symbols-outlined text-[18px] text-[#795746]/80">
                shield_locked
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
                class="material-symbols-outlined text-[24px] text-[#F3B75B] icon-filled animate-bounce"
                title="Llave MFA"
              >
                key
              </span>
              <span
                v-else-if="cell === 'data_packet'"
                class="material-symbols-outlined text-[22px] text-shield-green icon-filled"
                title="Paquete Confidencial"
              >
                folder_zip
              </span>
              <span
                v-else-if="cell === 'sniffer_trap'"
                class="material-symbols-outlined text-[22px] icon-filled"
                :class="hasVpnShield ? 'text-tech-cyan' : 'text-error'"
                :title="hasVpnShield ? 'Sniffer neutralizado por VPN' : 'Sniffer Man-in-the-Middle'"
              >
                {{ hasVpnShield ? 'verified_user' : 'bug_report' }}
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
                :class="canEnterServer ? 'text-shield-green' : 'text-[#F3B75B]'"
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
        <span class="text-[10px] font-black uppercase tracking-wider text-[#D4C3B3]">
          Control Táctico (WASD / Desliza)
        </span>

        <div class="grid grid-cols-3 gap-1.5 w-36">
          <div></div>
          <button
            type="button"
            aria-label="Mover arriba"
            class="h-11 rounded-xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] active:translate-y-0.5 text-[#FDFBF7] flex items-center justify-center border border-[#5F4030] shadow-[0_3px_0_#161311] transition-colors"
            @click="movePlayer(-1, 0)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_up</span>
          </button>
          <div></div>

          <button
            type="button"
            aria-label="Mover izquierda"
            class="h-11 rounded-xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] active:translate-y-0.5 text-[#FDFBF7] flex items-center justify-center border border-[#5F4030] shadow-[0_3px_0_#161311] transition-colors"
            @click="movePlayer(0, -1)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_left</span>
          </button>
          <button
            type="button"
            class="h-11 rounded-xl bg-[#161311] text-[#F3B75B] hover:bg-[#342B24] flex items-center justify-center border border-[#5F4030] text-[10px] font-black shadow-[0_3px_0_#000000]"
            title="Reiniciar Mapa"
            @click="initBoard"
          >
            <span class="material-symbols-outlined text-[18px]">refresh</span>
          </button>
          <button
            type="button"
            aria-label="Mover derecha"
            class="h-11 rounded-xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] active:translate-y-0.5 text-[#FDFBF7] flex items-center justify-center border border-[#5F4030] shadow-[0_3px_0_#161311] transition-colors"
            @click="movePlayer(0, 1)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_right</span>
          </button>

          <div></div>
          <button
            type="button"
            aria-label="Mover abajo"
            class="h-11 rounded-xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] active:translate-y-0.5 text-[#FDFBF7] flex items-center justify-center border border-[#5F4030] shadow-[0_3px_0_#161311] transition-colors"
            @click="movePlayer(1, 0)"
          >
            <span class="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
          <div></div>
        </div>

        <!-- Mini Legend -->
        <div class="bg-[#161311] p-2.5 rounded-xl border border-[#44352C] text-[10px] text-[#D4C3B3] flex flex-col gap-1 w-48">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-tech-cyan icon-filled">vpn_lock</span>
            <span><strong>VPN:</strong> Neutraliza Sniffers</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-shield-green icon-filled">folder_zip</span>
            <span><strong>Datos:</strong> Recolectar todos</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-error icon-filled">bug_report</span>
            <span><strong>Sniffer / Wi-Fi:</strong> Peligro</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-[#F3B75B] icon-filled">dns</span>
            <span><strong>Servidor:</strong> Meta final</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes suri-maze-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px);
  }
  75% {
    transform: translateX(-3px);
  }
}

.animate-shake {
  animation: suri-maze-shake 0.34s ease-in-out;
}
</style>
