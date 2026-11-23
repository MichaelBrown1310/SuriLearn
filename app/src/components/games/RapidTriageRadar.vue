<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { RapidTriageRadarExercise } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  exercise: RapidTriageRadarExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

const suriRunningImg = getSuriImage('running');
const currentCardIndex = ref<number>(0);
const remainingSeconds = ref<number>(props.exercise.timeLimitSeconds || 7);
const correctCount = ref<number>(0);
const timeExpired = ref<boolean>(false);
let timerInterval: any = null;

const currentCard = computed(() => {
  return props.exercise.cards[currentCardIndex.value];
});

const timerPercentage = computed(() => {
  const total = props.exercise.timeLimitSeconds || 7;
  return (remainingSeconds.value / total) * 100;
});

function startTimer() {
  clearInterval(timerInterval);
  remainingSeconds.value = props.exercise.timeLimitSeconds || 7;
  timeExpired.value = false;

  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 1) {
      remainingSeconds.value -= 1;
    } else {
      remainingSeconds.value = 0;
      timeExpired.value = true;
      clearInterval(timerInterval);
      // Time expired counts as immediate mistake (-1 heart)
      handleVerdict(null);
    }
  }, 1000);
}

function handleVerdict(userVerdictThreat: boolean | null) {
  if (props.disabled) return;
  clearInterval(timerInterval);

  const card = currentCard.value;
  const isCorrect = userVerdictThreat !== null && card && userVerdictThreat === card.isThreat;

  if (!isCorrect) {
    // Immediate failure on mistake or timeout -> triggers -1 heart and 3-step feedback
    emit('submit', false);
    return;
  }

  correctCount.value += 1;

  if (currentCardIndex.value < props.exercise.cards.length - 1) {
    currentCardIndex.value += 1;
    startTimer();
  } else {
    // All cards evaluated successfully!
    emit('submit', true);
  }
}

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  clearInterval(timerInterval);
});
</script>

<template>
  <div class="w-full flex flex-col gap-space-md select-none text-left">
    <!-- Header with 7-second Circular Radar Timer & Running Suri -->
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2.5">
        <div class="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
          <img :src="suriRunningImg" alt="Suri a toda velocidad" class="w-full h-full object-contain p-0.5" />
          <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-tech-cyan animate-ping"></span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">bolt</span>
            {{ exercise.title }}
          </span>
          <h2 class="text-sm font-extrabold text-on-surface leading-tight">
            Tarjeta {{ currentCardIndex + 1 }} de {{ exercise.cards.length }}
          </h2>
        </div>
      </div>

      <!-- Circular Radar Countdown Timer (7s) -->
      <div class="relative w-13 h-13 flex items-center justify-center">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            class="text-surface-container stroke-current"
            stroke-width="3.5"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="stroke-current transition-all duration-1000 ease-linear"
            :class="remainingSeconds <= 3 ? 'text-error animate-pulse' : 'text-primary-container'"
            stroke-width="3.5"
            stroke-dasharray="100, 100"
            :stroke-dashoffset="100 - timerPercentage"
            stroke-linecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div class="absolute flex flex-col items-center justify-center">
          <span
            class="text-xs font-black"
            :class="remainingSeconds <= 3 ? 'text-error animate-ping' : 'text-on-surface'"
          >
            {{ remainingSeconds }}s
          </span>
        </div>
      </div>
    </div>

    <!-- Active Flashcard -->
    <div
      v-if="currentCard"
      class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md border-2 border-outline-variant/30 flex flex-col gap-3 min-h-[210px] justify-between transition-all"
      :class="remainingSeconds <= 2 ? 'border-error/60 bg-error-container/10' : ''"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wider bg-surface-container px-2.5 py-0.5 rounded-full text-primary border border-primary/20">
            {{ currentCard.category }}
          </span>
          <span class="text-xs text-on-surface-variant font-mono truncate max-w-[170px] bg-surface-container-high/50 px-2 py-0.5 rounded-md">
            {{ currentCard.senderSnippet }}
          </span>
        </div>

        <h3 class="text-base font-extrabold text-on-surface mt-1">
          {{ currentCard.title }}
        </h3>

        <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
          <p class="text-xs text-on-surface leading-relaxed font-medium">
            "{{ currentCard.bodySnippet }}"
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between text-[11px] text-on-surface-variant/80 border-t border-outline-variant/20 pt-2">
        <span class="flex items-center gap-1 text-primary font-bold">
          <span class="material-symbols-outlined text-[14px]">timer</span>
          Reflejo rápido: 7s
        </span>
        <span class="text-stone-400 font-medium">¿Amenaza o Seguro?</span>
      </div>
    </div>

    <!-- Fast Verdict Actions: [SEGURO] and [AMENAZA] -->
    <div class="grid grid-cols-2 gap-space-sm mt-1">
      <button
        type="button"
        class="h-14 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm active:translate-y-1 transition-all border border-outline-variant/30"
        :disabled="disabled"
        @click="handleVerdict(false)"
      >
        <span class="material-symbols-outlined text-[20px] text-shield-green icon-filled">verified</span>
        <span>SEGURO</span>
      </button>

      <button
        type="button"
        class="h-14 rounded-2xl bg-error text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:translate-y-1 transition-all shadow-[0_4px_0_#93000a] active:shadow-[0_1px_0_#93000a]"
        :disabled="disabled"
        @click="handleVerdict(true)"
      >
        <span class="material-symbols-outlined text-[20px] icon-filled">warning</span>
        <span>AMENAZA</span>
      </button>
    </div>
  </div>
</template>
