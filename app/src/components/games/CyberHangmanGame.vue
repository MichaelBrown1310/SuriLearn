<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { CyberHangmanExercise, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CyberHangmanExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const roundIdx = ref<number>(0);
const guessedLetters = ref<string[]>([]);
const mistakes = ref<number>(0);
const hintUsed = ref<boolean>(false);
const suriPose = ref<SuriPose>('idea');
const suriReactionKey = ref<number>(0);
const statusText = ref<string>('Descubre el término oculto antes de que caiga el escudo.');

let endTimer: ReturnType<typeof setTimeout> | null = null;

const rounds = computed(() => props.exercise.rounds || []);
const currentRound = computed(() => rounds.value[roundIdx.value]);
const targetWord = computed(() => (currentRound.value?.word || 'FIREWALL').toUpperCase());
const wordLetters = computed(() => targetWord.value.split(''));

const isWordSolved = computed(() =>
  wordLetters.value.every((ch) => guessedLetters.value.includes(ch))
);
const isRoundFailed = computed(() => mistakes.value >= (props.exercise.maxMistakes || 6));
const isLastRound = computed(() => roundIdx.value >= rounds.value.length - 1);

function clearPendingTimers() {
  if (endTimer) {
    clearTimeout(endTimer);
    endTimer = null;
  }
}

function initGame() {
  clearPendingTimers();
  roundIdx.value = 0;
  resetRoundState();
}

function resetRoundState() {
  guessedLetters.value = [];
  mistakes.value = 0;
  hintUsed.value = false;
  suriPose.value = 'idea';
  statusText.value = 'Descubre el término oculto antes de que caiga el escudo.';
}

function isLetterGuessed(letter: string): boolean {
  return guessedLetters.value.includes(letter);
}

function isLetterCorrect(letter: string): boolean {
  return isLetterGuessed(letter) && targetWord.value.includes(letter);
}

function isLetterWrong(letter: string): boolean {
  return isLetterGuessed(letter) && !targetWord.value.includes(letter);
}

function pickLetter(rawLetter: string) {
  if (props.disabled || isWordSolved.value || isRoundFailed.value) return;
  const letter = rawLetter.toUpperCase();
  if (!/^[A-Z]$/.test(letter) || isLetterGuessed(letter)) return;

  guessedLetters.value = [...guessedLetters.value, letter];

  if (targetWord.value.includes(letter)) {
    suriPose.value = 'ok';
    suriReactionKey.value += 1;
    if (isWordSolved.value) {
      statusText.value = '¡Código descifrado! Excelente lectura táctica.';
    } else {
      statusText.value = `¡Bien! La letra "${letter}" forma parte del escudo.`;
    }
  } else {
    mistakes.value += 1;
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    const remaining = (props.exercise.maxMistakes || 6) - mistakes.value;
    if (remaining <= 0) {
      suriPose.value = 'error';
      statusText.value = `¡Perímetro caído! La palabra era ${targetWord.value}.`;
      clearPendingTimers();
      endTimer = setTimeout(() => {
        emit('submit', false);
      }, 1100);
    } else {
      statusText.value = `La letra "${letter}" no está. Te quedan ${remaining} intentos.`;
    }
  }
}

function useHint() {
  if (props.disabled || hintUsed.value || isWordSolved.value || isRoundFailed.value) return;
  const remaining = wordLetters.value.filter((ch) => !guessedLetters.value.includes(ch));
  if (remaining.length === 0) return;
  hintUsed.value = true;
  const reveal = remaining[0];
  guessedLetters.value = [...guessedLetters.value, reveal];
  suriPose.value = 'wink';
  suriReactionKey.value += 1;
  statusText.value = `Pista activada: revelamos la letra "${reveal}".`;
}

function advanceRoundOrFinish() {
  if (props.disabled) return;
  if (!isLastRound.value) {
    roundIdx.value += 1;
    resetRoundState();
  } else {
    emit('submit', true);
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled || isWordSolved.value || isRoundFailed.value) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toUpperCase();
  if (/^[A-Z]$/.test(key)) {
    pickLetter(key);
  }
}

watch(
  () => props.exercise.id,
  () => {
    initGame();
  }
);

onMounted(() => {
  initGame();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  clearPendingTimers();
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none text-left">
    <!-- Top Header -->
    <div class="flex items-center justify-between gap-2 px-1">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-xs">
          <span class="material-symbols-outlined text-[22px] icon-filled">spellcheck</span>
        </div>
        <div class="min-w-0">
          <span class="text-[11px] font-black uppercase tracking-wider text-primary block truncate">
            {{ exercise.title }} · Palabra {{ roundIdx + 1 }}/{{ rounds.length }}
          </span>
          <h2 class="text-sm sm:text-base font-extrabold text-on-surface leading-tight">
            {{ exercise.instruction }}
          </h2>
        </div>
      </div>

      <span
        class="px-2.5 py-1 rounded-full text-xs font-black shrink-0 border"
        :class="mistakes >= 4 ? 'bg-error/15 text-error border-error/40' : 'bg-surface-container text-on-surface border-outline-variant/40'"
      >
        Fallos: {{ mistakes }}/{{ exercise.maxMistakes || 6 }}
      </span>
    </div>

    <!-- Main Arcade Card -->
    <div class="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 border border-outline-variant/30 shadow-md flex flex-col gap-4">
      <!-- Top Visual Stage: SVG Hangman Scaffold + Live Animated Suri -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/30">
        <!-- SVG Cyber Gallows (6-Stage Integrity) -->
        <div class="flex flex-col items-center justify-center">
          <svg viewBox="0 0 180 140" class="w-40 h-32">
            <!-- Base & Cyber Frame -->
            <line x1="18" y1="128" x2="115" y2="128" stroke="currentColor" class="text-on-surface-variant" stroke-width="5" stroke-linecap="round" />
            <line x1="42" y1="128" x2="42" y2="16" stroke="currentColor" class="text-on-surface-variant" stroke-width="5" stroke-linecap="round" />
            <line x1="42" y1="16" x2="122" y2="16" stroke="currentColor" class="text-on-surface-variant" stroke-width="5" stroke-linecap="round" />
            <line x1="122" y1="16" x2="122" y2="34" stroke="#E1A653" stroke-width="3.5" stroke-dasharray="3 2" stroke-linecap="round" />
            <!-- 1: Head -->
            <circle v-if="mistakes >= 1" cx="122" cy="46" r="12" fill="none" stroke="#EF4444" stroke-width="3.5" />
            <!-- 2: Torso -->
            <line v-if="mistakes >= 2" x1="122" y1="58" x2="122" y2="90" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
            <!-- 3: Left Arm -->
            <line v-if="mistakes >= 3" x1="122" y1="67" x2="104" y2="80" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
            <!-- 4: Right Arm -->
            <line v-if="mistakes >= 4" x1="122" y1="67" x2="140" y2="80" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
            <!-- 5: Left Leg -->
            <line v-if="mistakes >= 5" x1="122" y1="90" x2="107" y2="112" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
            <!-- 6: Right Leg -->
            <line v-if="mistakes >= 6" x1="122" y1="90" x2="137" y2="112" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
          </svg>
          <span class="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
            {{ currentRound?.category || 'Ciberseguridad' }}
          </span>
        </div>

        <!-- Suri Live Coaching Bubble -->
        <div class="flex flex-col items-center text-center gap-2">
          <SuriMascotAnimated
            :pose="suriPose"
            size="md"
            :reaction-key="suriReactionKey"
            :bubble-text="statusText"
          />
          <p class="text-[11px] font-semibold text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-outline-variant/30">
            <strong class="text-primary">Pista:</strong> {{ currentRound?.clue }}
          </p>
        </div>
      </div>

      <!-- Secret Word Letter Tiles -->
      <div class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-2">
        <div
          v-for="(ch, idx) in wordLetters"
          :key="`${roundIdx}_${idx}`"
          class="w-8 h-10 sm:w-10 sm:h-12 rounded-xl border-2 flex items-center justify-center font-mono text-base sm:text-xl font-black transition-all"
          :class="
            isLetterGuessed(ch)
              ? 'bg-shield-green/15 border-shield-green text-shield-green shadow-xs'
              : isRoundFailed
                ? 'bg-error/15 border-error text-error'
                : 'bg-surface-container-low border-outline-variant text-on-surface'
          "
        >
          {{ isLetterGuessed(ch) || isRoundFailed ? ch : '' }}
        </div>
      </div>

      <!-- Round Solved Banner -->
      <div
        v-if="isWordSolved"
        class="p-4 rounded-2xl bg-shield-green/10 border border-shield-green/40 flex flex-col gap-3"
      >
        <div class="flex items-start gap-2.5">
          <span class="material-symbols-outlined text-shield-green text-[22px] icon-filled shrink-0">check_circle</span>
          <div class="text-xs text-on-surface leading-relaxed">
            <strong class="block text-shield-green text-sm font-black mb-0.5">
              ¡Palabra "{{ targetWord }}" decodificada!
            </strong>
            <span>{{ currentRound?.explanation }}</span>
          </div>
        </div>
        <button
          type="button"
          class="w-full py-3 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          @click="advanceRoundOrFinish"
        >
          <span>{{ isLastRound ? '¡Misión Completada!' : 'Siguiente Palabra' }}</span>
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>

      <!-- Interactive A-Z Keyboard -->
      <div v-else class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Toca las letras o usa tu teclado físico
          </span>
          <button
            type="button"
            :disabled="hintUsed || disabled || isRoundFailed"
            class="px-2.5 py-1 rounded-full text-[11px] font-black bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-40 transition-colors flex items-center gap-1"
            @click="useHint"
          >
            <span class="material-symbols-outlined text-[14px]">lightbulb</span>
            <span>{{ hintUsed ? 'Pista usada' : 'Revelar 1 letra' }}</span>
          </button>
        </div>

        <div class="flex flex-col gap-1.5 items-center">
          <div
            v-for="(row, rIdx) in KEYBOARD_ROWS"
            :key="rIdx"
            class="flex flex-wrap justify-center gap-1 sm:gap-1.5 w-full"
          >
            <button
              v-for="letter in row"
              :key="letter"
              type="button"
              :disabled="isLetterGuessed(letter) || disabled || isRoundFailed"
              class="min-w-[30px] sm:min-w-[36px] h-10 rounded-xl font-mono font-black text-xs sm:text-sm border transition-all active:scale-95"
              :class="
                isLetterCorrect(letter)
                  ? 'bg-shield-green text-white border-shield-green shadow-xs'
                  : isLetterWrong(letter)
                    ? 'bg-error/20 text-error border-error/40 opacity-55 line-through'
                    : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/60 text-on-surface shadow-xs'
              "
              @click="pickLetter(letter)"
            >
              {{ letter }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
