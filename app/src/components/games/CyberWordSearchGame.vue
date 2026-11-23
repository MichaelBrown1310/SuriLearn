<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  CyberWordSearchExercise,
  CyberWordSearchTarget,
  SuriPose,
} from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CyberWordSearchExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

interface CellPos {
  r: number;
  c: number;
}

const foundWords = ref<string[]>([]);
const foundCellKeys = ref<Set<string>>(new Set());
const hintCellKey = ref<string | null>(null);
const hintsUsed = ref<number>(0);

const startCell = ref<CellPos | null>(null);
const hoverCell = ref<CellPos | null>(null);
const isPointerDragging = ref<boolean>(false);

const bannerText = ref<string>(
  'Toca o arrastra horizontal/verticalmente sobre las letras para encontrar los conceptos clave.'
);
const bannerTone = ref<'info' | 'good' | 'bad'>('info');
const suriPose = ref<SuriPose>('idea');
const suriReactionKey = ref<number>(0);
const isFinished = ref<boolean>(false);

let finishTimer: ReturnType<typeof setTimeout> | null = null;

const gridMatrix = computed(() => props.exercise.grid.map((row) => row.split('')));
const maxHints = computed(() => props.exercise.maxHints ?? 2);
const hintsLeft = computed(() => Math.max(0, maxHints.value - hintsUsed.value));

function cellKey(r: number, c: number): string {
  return `${r}_${c}`;
}

function getLineCells(a: CellPos | null, b: CellPos | null): CellPos[] {
  if (!a || !b) return [];
  if (a.r === b.r) {
    const step = a.c <= b.c ? 1 : -1;
    const out: CellPos[] = [];
    for (let c = a.c; step > 0 ? c <= b.c : c >= b.c; c += step) {
      out.push({ r: a.r, c });
    }
    return out;
  }
  if (a.c === b.c) {
    const step = a.r <= b.r ? 1 : -1;
    const out: CellPos[] = [];
    for (let r = a.r; step > 0 ? r <= b.r : r >= b.r; r += step) {
      out.push({ r, c: a.c });
    }
    return out;
  }
  return [];
}

const previewCellKeys = computed(() => {
  const line = getLineCells(startCell.value, hoverCell.value || startCell.value);
  return new Set(line.map((p) => cellKey(p.r, p.c)));
});

function initGame() {
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
  foundWords.value = [];
  foundCellKeys.value = new Set();
  hintCellKey.value = null;
  hintsUsed.value = 0;
  startCell.value = null;
  hoverCell.value = null;
  isPointerDragging.value = false;
  isFinished.value = false;
  suriPose.value = 'idea';
  suriReactionKey.value += 1;
  bannerTone.value = 'info';
  bannerText.value =
    'Toca letra inicial → letra final (o arrastra en línea recta) para descifrar cada concepto.';
}

function handleCellPointerDown(r: number, c: number) {
  if (isFinished.value || props.disabled) return;

  // Second click completes selection when awaiting end cell
  if (startCell.value && !isPointerDragging.value) {
    if (startCell.value.r === r && startCell.value.c === c) {
      startCell.value = null;
      hoverCell.value = null;
      return;
    }
    evaluateSelection(startCell.value, { r, c });
    startCell.value = null;
    hoverCell.value = null;
    return;
  }

  startCell.value = { r, c };
  hoverCell.value = { r, c };
  isPointerDragging.value = true;
}

function handleCellPointerEnter(r: number, c: number) {
  if (!isPointerDragging.value || isFinished.value || props.disabled) return;
  hoverCell.value = { r, c };
}

function handleCellPointerUp(r: number, c: number) {
  if (!isPointerDragging.value || !startCell.value) return;
  isPointerDragging.value = false;

  if (startCell.value.r === r && startCell.value.c === c) {
    // Wait for second tap on end cell
    hoverCell.value = { r, c };
    return;
  }

  evaluateSelection(startCell.value, { r, c });
  startCell.value = null;
  hoverCell.value = null;
}

function evaluateSelection(a: CellPos, b: CellPos) {
  const cells = getLineCells(a, b);
  if (cells.length < 2) {
    bannerTone.value = 'bad';
    bannerText.value = 'Solo se permiten selecciones rectas (horizontales o verticales).';
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    return;
  }

  const forward = cells.map((p) => gridMatrix.value[p.r]?.[p.c] || '').join('');
  const backward = forward.split('').reverse().join('');

  const match: CyberWordSearchTarget | undefined = props.exercise.targets.find(
    (t) => !foundWords.value.includes(t.word) && (t.word === forward || t.word === backward)
  );

  if (!match) {
    bannerTone.value = 'bad';
    bannerText.value = `"${forward}" no coincide con ningún término pendiente. Revisa la lista objetivo.`;
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    return;
  }

  foundWords.value = [...foundWords.value, match.word];
  const updatedKeys = new Set(foundCellKeys.value);
  for (const p of cells) {
    updatedKeys.add(cellKey(p.r, p.c));
  }
  foundCellKeys.value = updatedKeys;
  hintCellKey.value = null;

  bannerTone.value = 'good';
  bannerText.value = `✅ ¡${match.word}! ${match.explanation}`;
  suriPose.value = 'ok';
  suriReactionKey.value += 1;

  if (foundWords.value.length >= props.exercise.targets.length && !isFinished.value) {
    isFinished.value = true;
    suriPose.value = 'victory';
    suriReactionKey.value += 1;
    finishTimer = setTimeout(() => {
      emit('submit', true);
    }, 550);
  }
}

function useSuriHint() {
  if (hintsLeft.value <= 0 || isFinished.value || props.disabled) return;
  const nextPending = props.exercise.targets.find((t) => !foundWords.value.includes(t.word));
  if (!nextPending) return;

  hintsUsed.value += 1;
  hintCellKey.value = cellKey(nextPending.startRow, nextPending.startCol);
  suriPose.value = 'wink';
  suriReactionKey.value += 1;
  bannerTone.value = 'info';
  bannerText.value = `💡 Pista para ${nextPending.word}: ${nextPending.clue} (Primera letra resaltada).`;
}

watch(
  () => props.exercise.id,
  () => {
    initGame();
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
          <span class="material-symbols-outlined text-[22px] icon-filled">grid_on</span>
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

      <div class="flex items-center gap-2 shrink-0">
        <span class="px-2.5 py-1 rounded-full bg-shield-green/15 text-shield-green text-xs font-black">
          🔎 {{ foundWords.length }}/{{ exercise.targets.length }}
        </span>
        <button
          type="button"
          :disabled="hintsLeft <= 0 || isFinished || disabled"
          class="px-3 py-1 rounded-full bg-primary/15 hover:bg-primary hover:text-[#291800] text-primary text-xs font-black border border-primary/35 disabled:opacity-45 transition-colors"
          @click="useSuriHint"
        >
          💡 Pista ({{ hintsLeft }})
        </button>
      </div>
    </div>

    <!-- Main Container -->
    <div class="bg-surface-container-lowest rounded-3xl p-4 border-2 border-outline-variant/40 shadow-md flex flex-col gap-3.5">
      <!-- Suri Reaction Strip -->
      <div
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border"
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
        <p class="text-xs font-bold leading-snug flex-1">
          {{ bannerText }}
        </p>
      </div>

      <!-- Board + Target Words Layout -->
      <div class="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4">
        <!-- Letter Matrix (Paleta SuriLearn Carbón / Arena Ocre) -->
        <div class="bg-[#1C1815] p-2.5 sm:p-3 rounded-2xl border-2 border-[#E1A653]/45 shadow-inner">
          <div
            class="grid gap-1"
            :style="{ gridTemplateColumns: `repeat(${gridMatrix[0]?.length || 8}, minmax(0, 1fr))` }"
          >
            <template v-for="(row, rIdx) in gridMatrix" :key="`ws_r_${rIdx}`">
              <button
                v-for="(letter, cIdx) in row"
                :key="`ws_c_${rIdx}_${cIdx}`"
                type="button"
                class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-mono font-black text-sm sm:text-base flex items-center justify-center border transition-all touch-none"
                :class="[
                  foundCellKeys.has(cellKey(rIdx, cIdx))
                    ? 'bg-shield-green text-white border-emerald-300 shadow-sm'
                    : previewCellKeys.has(cellKey(rIdx, cIdx))
                      ? 'bg-[#E1A653] text-[#291800] border-[#FFF2DA] scale-105'
                      : hintCellKey === cellKey(rIdx, cIdx)
                        ? 'bg-[#3D2D1E] text-[#00E5FF] border-tech-cyan ring-2 ring-tech-cyan animate-pulse'
                        : 'bg-[#2B241F] text-[#FDFBF7] border-[#44352C] hover:border-[#E1A653]',
                ]"
                :disabled="disabled || isFinished"
                @pointerdown="handleCellPointerDown(rIdx, cIdx)"
                @pointerenter="handleCellPointerEnter(rIdx, cIdx)"
                @pointerup="handleCellPointerUp(rIdx, cIdx)"
              >
                {{ letter }}
              </button>
            </template>
          </div>
        </div>

        <!-- Target Concept Chips -->
        <div class="w-full sm:w-52 flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-on-surface-variant px-1">
            Palabras Centinela a Buscar:
          </span>
          <div class="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
            <div
              v-for="t in exercise.targets"
              :key="t.word"
              class="px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center justify-between gap-2 transition-all"
              :class="
                foundWords.includes(t.word)
                  ? 'bg-shield-green/15 border-shield-green/45 text-shield-green line-through'
                  : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
              "
            >
              <span class="font-mono tracking-wide">{{ t.word }}</span>
              <span class="material-symbols-outlined text-[16px] icon-filled">
                {{ foundWords.includes(t.word) ? 'check_circle' : 'search' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
