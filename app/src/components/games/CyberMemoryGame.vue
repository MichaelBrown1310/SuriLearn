<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { CyberMemoryExercise, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CyberMemoryExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

interface MemoryCard {
  uid: string;
  pairId: string;
  kind: 'threat' | 'defense';
  label: string;
  icon: string;
  explanation: string;
}

const cards = ref<MemoryCard[]>([]);
const flippedUids = ref<string[]>([]);
const matchedPairIds = ref<string[]>([]);
const movesLeft = ref<number>(props.exercise.maxMoves || 14);
const combo = ref<number>(0);
const isCheckingPair = ref<boolean>(false);
const suriPose = ref<SuriPose>('idea');
const suriReactionKey = ref<number>(0);
const feedbackBanner = ref<string>('Empareja cada amenaza con su contramedida correcta.');

let flipTimer: ReturnType<typeof setTimeout> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;

const totalPairs = computed(() => props.exercise.pairs?.length || 0);
const isAllMatched = computed(
  () => totalPairs.value > 0 && matchedPairIds.value.length >= totalPairs.value
);

function clearTimers() {
  if (flipTimer) {
    clearTimeout(flipTimer);
    flipTimer = null;
  }
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
}

function buildShuffledDeck(): MemoryCard[] {
  const deck: MemoryCard[] = [];
  for (const pair of props.exercise.pairs || []) {
    deck.push({
      uid: `${pair.id}_t`,
      pairId: pair.id,
      kind: 'threat',
      label: pair.threatLabel,
      icon: pair.threatIcon,
      explanation: pair.explanation,
    });
    deck.push({
      uid: `${pair.id}_d`,
      pairId: pair.id,
      kind: 'defense',
      label: pair.defenseLabel,
      icon: pair.defenseIcon,
      explanation: pair.explanation,
    });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

function initGame() {
  clearTimers();
  cards.value = buildShuffledDeck();
  flippedUids.value = [];
  matchedPairIds.value = [];
  movesLeft.value = props.exercise.maxMoves || 14;
  combo.value = 0;
  isCheckingPair.value = false;
  suriPose.value = 'idea';
  feedbackBanner.value = 'Toca 2 tarjetas para emparejar cada amenaza con su defensa.';
}

function isCardRevealed(card: MemoryCard): boolean {
  return matchedPairIds.value.includes(card.pairId) || flippedUids.value.includes(card.uid);
}

function flipCard(card: MemoryCard) {
  if (
    props.disabled ||
    isCheckingPair.value ||
    isAllMatched.value ||
    movesLeft.value <= 0 ||
    isCardRevealed(card)
  ) {
    return;
  }

  flippedUids.value = [...flippedUids.value, card.uid];
  if (flippedUids.value.length < 2) return;

  movesLeft.value = Math.max(0, movesLeft.value - 1);
  isCheckingPair.value = true;

  const first = cards.value.find((c) => c.uid === flippedUids.value[0]);
  const second = cards.value.find((c) => c.uid === flippedUids.value[1]);

  if (first && second && first.pairId === second.pairId) {
    matchedPairIds.value = [...matchedPairIds.value, first.pairId];
    flippedUids.value = [];
    isCheckingPair.value = false;
    combo.value += 1;
    suriPose.value = 'ok';
    suriReactionKey.value += 1;
    feedbackBanner.value = `✅ ¡Pareja encontrada! ${first.explanation}`;

    if (isAllMatched.value) {
      suriPose.value = 'victory';
      finishTimer = setTimeout(() => {
        emit('submit', true);
      }, 650);
    }
    return;
  }

  combo.value = 0;
  suriPose.value = 'surprised';
  suriReactionKey.value += 1;
  feedbackBanner.value = 'No coinciden. Memoriza la ubicación de amenaza y defensa.';

  flipTimer = setTimeout(() => {
    flippedUids.value = [];
    isCheckingPair.value = false;

    if (movesLeft.value <= 0 && !isAllMatched.value) {
      suriPose.value = 'error';
      feedbackBanner.value = 'Se agotaron los movimientos antes de completar los pares.';
      finishTimer = setTimeout(() => {
        emit('submit', false);
      }, 600);
    }
  }, 750);
}

watch(
  () => props.exercise.id,
  () => {
    initGame();
  }
);

onMounted(() => {
  initGame();
});

onUnmounted(() => {
  clearTimers();
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none text-left">
    <!-- Top Header -->
    <div class="flex items-center justify-between gap-2 px-1 flex-wrap">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px] icon-filled">grid_view</span>
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
          Pares: {{ matchedPairIds.length }}/{{ totalPairs }}
        </span>
        <span
          class="px-2.5 py-1 rounded-full text-xs font-black"
          :class="movesLeft <= 3 ? 'bg-error/15 text-error' : 'bg-surface-container text-on-surface'"
        >
          Turnos: {{ movesLeft }}
        </span>
      </div>
    </div>

    <!-- Main Memory Arena -->
    <div class="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-md flex flex-col gap-3.5">
      <!-- Live Suri Feedback Strip -->
      <div class="flex items-center gap-3 bg-surface-container-low px-3.5 py-2.5 rounded-2xl border border-outline-variant/30">
        <SuriMascotAnimated
          :pose="suriPose"
          size="xs"
          :reaction-key="suriReactionKey"
          :show-shadow="false"
        />
        <p class="text-xs font-bold text-on-surface leading-snug flex-1">
          {{ feedbackBanner }}
        </p>
        <span
          v-if="combo >= 2"
          class="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black shrink-0"
        >
          {{ combo }}x Combo
        </span>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        <button
          v-for="card in cards"
          :key="card.uid"
          type="button"
          :disabled="disabled || isCheckingPair || isCardRevealed(card)"
          class="min-h-[92px] sm:min-h-[104px] rounded-2xl p-2 border-2 flex flex-col items-center justify-center text-center gap-1 transition-all duration-200 active:scale-95"
          :class="
            matchedPairIds.includes(card.pairId)
              ? 'bg-shield-green/15 border-shield-green text-on-surface shadow-xs'
              : isCardRevealed(card)
                ? card.kind === 'threat'
                  ? 'bg-error/10 border-error text-on-surface shadow-sm'
                  : 'bg-tertiary/10 border-tertiary text-on-surface shadow-sm'
                : 'bg-surface-container-high hover:border-primary/60 border-outline-variant/50 text-on-surface-variant shadow-xs'
          "
          @click="flipCard(card)"
        >
          <template v-if="isCardRevealed(card)">
            <span
              class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full"
              :class="
                card.kind === 'threat'
                  ? 'bg-error/20 text-error'
                  : 'bg-tertiary/20 text-tertiary'
              "
            >
              {{ card.kind === 'threat' ? 'Amenaza' : 'Defensa' }}
            </span>
            <span
              class="material-symbols-outlined text-[22px] icon-filled"
              :class="card.kind === 'threat' ? 'text-error' : 'text-tertiary'"
            >
              {{ card.icon }}
            </span>
            <span class="text-[11px] font-extrabold leading-tight line-clamp-2">
              {{ card.label }}
            </span>
          </template>
          <template v-else>
            <span class="material-symbols-outlined text-[24px] text-primary">shield</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/80">
              Suri
            </span>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
