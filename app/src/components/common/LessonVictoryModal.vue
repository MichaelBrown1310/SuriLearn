<script setup lang="ts">
import { computed } from 'vue';
import SuriMascotAnimated from './SuriMascotAnimated.vue';
import { SuriPose } from '../../types/exercises';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    lessonId: string;
    lessonTitle?: string;
    unitLabel?: string;
    nextLessonId?: string | null;
    nextLessonTitle?: string | null;
    earnedXp?: number;
    earnedBits?: number;
    accuracyPercentage?: number;
    isPerfectScore?: boolean;
    heartsRemaining?: number;
    passed?: boolean;
    stars?: number;
    leaguePromoted?: boolean;
    newLeague?: string;
  }>(),
  {
    passed: true,
    stars: 3,
    leaguePromoted: false,
  }
);

const emit = defineEmits<{
  (e: 'nextLesson', nextId: string): void;
  (e: 'goToMap'): void;
  (e: 'retry'): void;
}>();

const suriVictoryPose = computed<SuriPose>(() => (props.passed ? 'ok' : 'error'));

function handleNext() {
  if (props.nextLessonId) {
    emit('nextLesson', props.nextLessonId);
  } else {
    emit('goToMap');
  }
}
</script>

<template>
  <Transition name="fade-bounce">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
    >
      <div
        class="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border-2 border-primary/20 flex flex-col items-center text-center relative overflow-hidden animate-scale-up"
      >
        <!-- Background Glow Accent -->
        <div class="absolute -top-16 -left-16 w-36 h-36 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-16 -right-16 w-36 h-36 bg-tertiary/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Module Badge -->
        <div
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2"
          :class="passed ? 'bg-primary/10 text-primary' : 'bg-error/15 text-error'"
        >
          <span class="material-symbols-outlined text-[15px] icon-filled">
            {{ passed ? 'verified' : 'gpp_maybe' }}
          </span>
          <span>
            {{ passed ? (unitLabel || 'Misión Superada') : 'Precisión insuficiente (< 60%)' }}
          </span>
        </div>

        <!-- League Promotion Banner -->
        <div
          v-if="passed && leaguePromoted && newLeague"
          class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-[11px] font-black mb-1"
        >
          <span class="material-symbols-outlined text-[14px] icon-filled">emoji_events</span>
          <span>¡Ascendiste a Liga {{ newLeague }}!</span>
        </div>

        <!-- Suri Live Animated Mascot -->
        <div class="relative my-1 flex items-center justify-center">
          <div
            class="absolute inset-0 rounded-full scale-110 animate-pulse"
            :class="passed ? 'bg-primary/15' : 'bg-error/15'"
          ></div>
          <SuriMascotAnimated
            :pose="suriVictoryPose"
            size="lg"
            :auto-blink="false"
            :interactive="true"
          />
        </div>

        <!-- Earned Stars Row -->
        <div v-if="passed" class="flex items-center gap-1 my-1">
          <span
            v-for="s in 3"
            :key="s"
            class="material-symbols-outlined text-[24px] icon-filled"
            :class="s <= (stars ?? 3) ? 'text-primary' : 'text-outline-variant/40'"
          >
            star
          </span>
        </div>

        <!-- Headline -->
        <h2 class="text-xl font-extrabold text-on-surface mt-1 mb-1">
          {{ passed ? '¡Misión Cumplida!' : 'Misión No Aprobada' }}
        </h2>
        <p class="text-xs text-on-surface-variant max-w-[270px] leading-relaxed mb-4">
          <template v-if="passed">
            Completaste con éxito <strong class="text-on-surface">{{ lessonTitle || 'la lección' }}</strong> y reforzaste la seguridad de tu manada.
          </template>
          <template v-else>
            Obtuviste <strong class="text-error">{{ accuracyPercentage ?? 0 }}%</strong> de acierto en <strong class="text-on-surface">{{ lessonTitle || 'la lección' }}</strong>. Necesitas al menos <strong>60%</strong> para aprobar y desbloquear la siguiente misión.
          </template>
        </p>

        <!-- Rewards Display Grid -->
        <div class="w-full grid grid-cols-2 gap-2.5 mb-4">
          <!-- XP Card -->
          <div
            class="rounded-2xl p-3 flex flex-col items-center justify-center border shadow-xs"
            :class="isPerfectScore && passed ? 'bg-primary/15 border-primary/40' : 'bg-surface-container-low border-outline-variant/30'"
          >
            <div class="flex items-center gap-1 text-primary font-black text-lg">
              <span class="material-symbols-outlined text-[20px] icon-filled">bolt</span>
              <span>+{{ earnedXp ?? 15 }} XP</span>
            </div>
            <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
              {{ !passed ? 'Práctica' : (isPerfectScore ? '¡Perfecto +5!' : 'Experiencia Real') }}
            </span>
          </div>

          <!-- Bits Card -->
          <div class="bg-surface-container-low rounded-2xl p-3 flex flex-col items-center justify-center border border-outline-variant/30 shadow-xs">
            <div class="flex items-center gap-1 text-secondary font-black text-lg">
              <span class="material-symbols-outlined text-[20px] icon-filled">diamond</span>
              <span>+{{ earnedBits ?? 10 }} Bits</span>
            </div>
            <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
              Recompensa
            </span>
          </div>
        </div>

        <!-- Performance Stats Row -->
        <div class="w-full bg-surface-container-low/70 rounded-xl px-3.5 py-2 mb-5 flex items-center justify-between text-xs text-on-surface-variant border border-outline-variant/20">
          <div class="flex items-center gap-1.5 font-bold">
            <span class="material-symbols-outlined text-[16px] text-tertiary icon-filled">target</span>
            <span>Precisión: <strong class="text-on-surface">{{ accuracyPercentage ?? 100 }}%</strong></span>
          </div>
          <div class="flex items-center gap-1.5 font-bold">
            <span class="material-symbols-outlined text-[16px] text-error icon-filled">favorite</span>
            <span>Vidas: <strong class="text-on-surface">{{ heartsRemaining ?? 5 }}</strong></span>
          </div>
        </div>

        <!-- Buttons -->
        <div class="w-full flex flex-col gap-2.5">
          <!-- Retry button when failed -->
          <button
            v-if="!passed"
            type="button"
            class="w-full py-3.5 px-4 btn-tactile-primary font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2"
            @click="emit('retry')"
          >
            <span class="material-symbols-outlined text-[18px]">replay</span>
            <span>Reintentar Lección</span>
          </button>

          <!-- Next Lesson Button -->
          <button
            v-else-if="nextLessonId"
            type="button"
            class="w-full py-3.5 px-4 btn-tactile-primary font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2"
            @click="handleNext"
          >
            <span>Siguiente Lección</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <!-- Return to Map Button -->
          <button
            type="button"
            class="w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            :class="!passed || nextLessonId ? 'bg-surface-container text-on-surface hover:bg-surface-container-high' : 'btn-tactile-primary font-extrabold text-sm py-3.5'"
            @click="emit('goToMap')"
          >
            <span class="material-symbols-outlined text-[16px]">map</span>
            <span>{{ !passed || nextLessonId ? 'Volver a la Ruta' : '¡Módulo Completo! Volver a la Ruta' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-bounce-enter-active,
.fade-bounce-leave-active {
  transition: opacity 0.3s ease;
}
.fade-bounce-enter-from,
.fade-bounce-leave-to {
  opacity: 0;
}
@keyframes scaleUp {
  0% {
    transform: scale(0.9) translateY(12px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
.animate-scale-up {
  animation: scaleUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
