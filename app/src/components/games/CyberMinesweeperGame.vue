<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { CyberMinesweeperExercise, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CyberMinesweeperExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

interface MineCell {
  r: number;
  c: number;
  hasMine: boolean;
  adjacentMines: number;
  revealed: boolean;
  flagged: boolean;
  quarantined: boolean;
}

const board = ref<MineCell[][]>([]);
const hasPlacedMines = ref<boolean>(false);
const mode = ref<'audit' | 'flag'>('audit');
const shieldsLeft = ref<number>(props.exercise.maxShields || 2);
const bannerText = ref<string>(
  'El primer clic siempre es seguro. Audita las celdas limpias sin activar malware.'
);
const bannerTone = ref<'info' | 'good' | 'bad'>('info');
const suriPose = ref<SuriPose>('shield');
const suriReactionKey = ref<number>(0);
const isFinished = ref<boolean>(false);

let finishTimer: ReturnType<typeof setTimeout> | null = null;

const size = computed(() => props.exercise.gridSize || 6);
const mineCount = computed(() => props.exercise.mineCount || 5);
const totalSafeCells = computed(() => size.value * size.value - mineCount.value);

const revealedSafeCount = computed(() => {
  let count = 0;
  for (const row of board.value) {
    for (const cell of row) {
      if (cell.revealed && !cell.hasMine) count += 1;
    }
  }
  return count;
});

const flaggedCount = computed(() => {
  let count = 0;
  for (const row of board.value) {
    for (const cell of row) {
      if (cell.flagged) count += 1;
    }
  }
  return count;
});

function initBoard() {
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
  const n = size.value;
  const rows: MineCell[][] = [];
  for (let r = 0; r < n; r++) {
    const row: MineCell[] = [];
    for (let c = 0; c < n; c++) {
      row.push({
        r,
        c,
        hasMine: false,
        adjacentMines: 0,
        revealed: false,
        flagged: false,
        quarantined: false,
      });
    }
    rows.push(row);
  }
  board.value = rows;
  hasPlacedMines.value = false;
  mode.value = 'audit';
  shieldsLeft.value = props.exercise.maxShields || 2;
  isFinished.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  bannerTone.value = 'info';
  bannerText.value =
    'Toca cualquier casilla para iniciar la auditoría (primer clic seguro). Cambia a 🚩 para marcar malware.';
}

function placeMinesExcluding(safeR: number, safeC: number) {
  const n = size.value;
  const candidates: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (r === safeR && c === safeC) continue;
      candidates.push({ r, c });
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const chosen = candidates.slice(0, mineCount.value);
  for (const pos of chosen) {
    board.value[pos.r][pos.c].hasMine = true;
  }

  // Compute adjacent mine numbers
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let adj = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && board.value[nr][nc].hasMine) {
            adj += 1;
          }
        }
      }
      board.value[r][c].adjacentMines = adj;
    }
  }

  hasPlacedMines.value = true;
}

function floodReveal(startR: number, startC: number) {
  const n = size.value;
  const queue: Array<{ r: number; c: number }> = [{ r: startR, c: startC }];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const cell = board.value[cur.r]?.[cur.c];
    if (!cell || cell.revealed || cell.flagged || cell.hasMine) continue;
    cell.revealed = true;
    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = cur.r + dr;
          const nc = cur.c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
            const nb = board.value[nr][nc];
            if (!nb.revealed && !nb.flagged && !nb.hasMine) {
              queue.push({ r: nr, c: nc });
            }
          }
        }
      }
    }
  }
}

function finishGame(won: boolean) {
  if (isFinished.value) return;
  isFinished.value = true;
  suriPose.value = won ? 'victory' : 'error';
  suriReactionKey.value += 1;
  finishTimer = setTimeout(() => {
    emit('submit', won);
  }, 550);
}

function toggleFlag(cell: MineCell) {
  if (isFinished.value || props.disabled || cell.revealed || cell.quarantined) return;
  cell.flagged = !cell.flagged;
  suriPose.value = 'wink';
  suriReactionKey.value += 1;
  bannerTone.value = 'info';
  bannerText.value = cell.flagged
    ? `🚩 Casilla sospechosa marcada. Banderas activas: ${flaggedCount.value}/${mineCount.value}.`
    : 'Marca retirada. Puedes auditar la casilla cuando estés seguro.';
}

function handleCellClick(cell: MineCell) {
  if (isFinished.value || props.disabled || cell.revealed || cell.quarantined) return;

  if (mode.value === 'flag') {
    toggleFlag(cell);
    return;
  }

  if (cell.flagged) {
    bannerTone.value = 'info';
    bannerText.value = 'Esta casilla está marcada con 🚩. Quita la bandera si deseas auditarla.';
    return;
  }

  if (!hasPlacedMines.value) {
    placeMinesExcluding(cell.r, cell.c);
  }

  if (cell.hasMine) {
    cell.revealed = true;
    cell.quarantined = true;
    shieldsLeft.value = Math.max(0, shieldsLeft.value - 1);
    const pool = props.exercise.threatLabels;
    const label = pool.length ? pool[(cell.r + cell.c) % pool.length] : 'Malware Oculto';
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    bannerTone.value = 'bad';

    if (shieldsLeft.value <= 0) {
      bannerText.value = `💥 Activaste ${label} y agotaste los escudos Firewall.`;
      finishGame(false);
      return;
    }

    bannerText.value = `🛡️ ¡${label} puesto en cuarentena! Escudos restantes: ${shieldsLeft.value}.`;
    return;
  }

  floodReveal(cell.r, cell.c);
  suriPose.value = 'ok';
  suriReactionKey.value += 1;
  bannerTone.value = 'good';
  bannerText.value = `✅ Sector limpio (${revealedSafeCount.value}/${totalSafeCells.value}). Los números indican amenazas adyacentes.`;

  if (revealedSafeCount.value >= totalSafeCells.value) {
    bannerText.value = '🏆 ¡Red auditada al 100%! Todas las zonas seguras despejadas sin detonar malware.';
    finishGame(true);
  }
}

function numberColorClass(num: number): string {
  if (num === 1) return 'text-tech-cyan';
  if (num === 2) return 'text-shield-green';
  if (num === 3) return 'text-[#F3B75B]';
  return 'text-error';
}

watch(
  () => props.exercise.id,
  () => {
    initBoard();
  },
  { immediate: true }
);

onUnmounted(() => {
  if (finishTimer) clearTimeout(finishTimer);
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none text-left">
    <!-- Top HUD -->
    <div class="flex items-center justify-between gap-2 px-1 flex-wrap">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px] icon-filled">radar</span>
        </div>
        <div class="min-w-0">
          <span class="text-[11px] font-black uppercase tracking-wider text-primary block truncate">
            {{ exercise.title }}
          </span>
          <h2 class="text-sm sm:text-base font-extrabold text-on-surface leading-tight">
            {{ exercise.instruction }}
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0 flex-wrap">
        <span class="px-2.5 py-1 rounded-full bg-shield-green/15 text-shield-green text-xs font-black">
          ✅ {{ revealedSafeCount }}/{{ totalSafeCells }}
        </span>
        <span class="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-black">
          🚩 {{ flaggedCount }}/{{ mineCount }}
        </span>
        <span
          class="px-2.5 py-1 rounded-full text-xs font-black"
          :class="shieldsLeft <= 1 ? 'bg-error/15 text-error' : 'bg-surface-container text-on-surface'"
        >
          Escudos: {{ shieldsLeft }}
        </span>
      </div>
    </div>

    <!-- Main Container -->
    <div class="bg-surface-container-lowest rounded-3xl p-4 border-2 border-outline-variant/40 shadow-md flex flex-col gap-3.5">
      <!-- Suri Reaction Strip + Mode Toggle -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div
          class="flex items-center gap-2.5 px-3 py-2 rounded-2xl border flex-1 min-w-0"
          :class="
            bannerTone === 'good'
              ? 'bg-shield-green/12 border-shield-green/40 text-shield-green'
              : bannerTone === 'bad'
                ? 'bg-error/12 border-error/40 text-error'
                : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
          "
        >
          <SuriMascotAnimated
            :pose="suriPose"
            size="xs"
            :reaction-key="suriReactionKey"
            :show-shadow="false"
          />
          <span class="text-xs font-bold leading-snug">{{ bannerText }}</span>
        </div>

        <div class="flex items-center gap-1.5 bg-surface-container p-1 rounded-2xl border border-outline-variant/40 shrink-0 self-center">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl text-xs font-black transition-all"
            :class="mode === 'audit' ? 'bg-primary text-[#291800] shadow-xs' : 'text-on-surface-variant'"
            @click="mode = 'audit'"
          >
            🔍 Auditar
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl text-xs font-black transition-all"
            :class="mode === 'flag' ? 'bg-[#E1A653] text-[#291800] shadow-xs' : 'text-on-surface-variant'"
            @click="mode = 'flag'"
          >
            🚩 Marcar
          </button>
        </div>
      </div>

      <!-- 2.5D Warm Minesweeper Grid (Paleta SuriLearn) -->
      <div class="bg-[#1C1815] p-3 rounded-2xl border-2 border-[#E1A653]/45 shadow-inner mx-auto">
        <div
          class="grid gap-1.5"
          :style="{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }"
        >
          <template v-for="(row, rIdx) in board" :key="`ms_r_${rIdx}`">
            <button
              v-for="cell in row"
              :key="`ms_c_${cell.r}_${cell.c}`"
              type="button"
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl font-black text-sm sm:text-base flex items-center justify-center border transition-all active:scale-95"
              :class="[
                cell.quarantined
                  ? 'bg-error/25 border-error text-error'
                  : cell.revealed
                    ? 'bg-[#231D19] border-[#44352C]'
                    : cell.flagged
                      ? 'bg-[#3D2D1E] border-[#E1A653] text-[#F3B75B] shadow-[inset_0_-3px_0_#161311]'
                      : 'bg-[#3D322A] hover:bg-[#4E4036] border-[#5F4030] shadow-[inset_0_-3px_0_#161311]',
              ]"
              :disabled="disabled || isFinished"
              @click="handleCellClick(cell)"
              @contextmenu.prevent="toggleFlag(cell)"
            >
              <span v-if="cell.quarantined" class="material-symbols-outlined text-[20px] icon-filled">
                bug_report
              </span>
              <span v-else-if="cell.flagged" class="text-base">🚩</span>
              <span
                v-else-if="cell.revealed && cell.adjacentMines > 0"
                :class="numberColorClass(cell.adjacentMines)"
              >
                {{ cell.adjacentMines }}
              </span>
              <span v-else-if="cell.revealed" class="w-2 h-2 rounded-full bg-shield-green/40"></span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
