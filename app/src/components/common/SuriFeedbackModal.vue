<script setup lang="ts">
import { computed } from 'vue';
import { SuriPose, PedagogicalFeedback } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  isOpen: boolean;
  isCorrect: boolean;
  title?: string;
  feedback?: PedagogicalFeedback;
  earnedXp?: number;
  earnedBits?: number;
  heartsRemaining?: number;
  maxHearts?: number;
}>();

const emit = defineEmits<{
  (e: 'continue'): void;
  (e: 'close'): void;
}>();

const suriPose = computed<SuriPose>(() => {
  return props.isCorrect ? 'victory' : 'error';
});

const suriImageUrl = computed(() => {
  return getSuriImage(suriPose.value);
});
</script>

<template>
  <Transition name="sheet-slide">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs select-none"
    >
      <!-- Bottom Sheet Drawer -->
      <div
        class="w-full max-w-lg mx-auto rounded-t-3xl shadow-2xl p-space-lg flex flex-col transition-all bg-surface-container-lowest"
        :class="isCorrect ? 'border-t-2 border-primary/25' : 'border-t-4 border-error'"
      >
        <!-- Drawer drag notch -->
        <div class="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto mb-space-md"></div>

        <!-- Header: Suri Avatar & Immediate Verdict -->
        <div class="flex items-start gap-space-md mb-space-md">
          <!-- Mascot Pose Frame -->
          <div
            class="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-1"
            :class="isCorrect ? 'bg-primary-fixed' : 'bg-error-container/60'"
          >
            <img
              :src="suriImageUrl"
              :alt="isCorrect ? 'Suri celebrando acierto' : 'Suri en guardia'"
              class="w-full h-full object-contain"
            />
          </div>

          <!-- Headline Texts -->
          <div class="flex-1 min-w-0">
            <!-- Correct state banner -->
            <div v-if="isCorrect">
              <div class="inline-flex items-center gap-1 text-tertiary font-bold text-sm mb-0.5">
                <span class="material-symbols-outlined text-[18px] text-shield-green icon-filled">
                  check_circle
                </span>
                <span class="text-shield-green font-extrabold">¡Gran ojo de centinela!</span>
              </div>
              <h4 class="text-lg font-bold text-on-surface leading-tight">
                {{ title || 'Detectaste el vector malicioso a tiempo.' }}
              </h4>
            </div>

            <!-- Error state banner -->
            <div v-else>
              <div class="inline-flex items-center gap-1 text-error font-bold text-sm mb-0.5">
                <span class="material-symbols-outlined text-[18px] icon-filled">warning</span>
                <span class="font-extrabold">¡Perímetro vulnerado!</span>
              </div>
              <h4 class="text-lg font-bold text-error leading-tight">
                {{ title || 'Caíste en la trampa del atacante.' }}
              </h4>
            </div>
          </div>
        </div>

        <!-- Pedagogical 3-Step Feedback Card (Crucial for Learning on Mistake) -->
        <div
          v-if="!isCorrect && feedback"
          class="bg-surface-container-low rounded-2xl p-space-md shadow-sm border border-error/25 flex flex-col gap-2.5 mb-space-md text-left"
        >
          <!-- Step 1: Empathy with the deception -->
          <div class="flex items-start gap-2">
            <span class="text-base">🤝</span>
            <div class="flex-1 text-xs text-on-surface-variant leading-snug">
              <strong class="text-on-surface block font-bold">1. Comprensión:</strong>
              {{ feedback.empathy }}
            </div>
          </div>

          <!-- Step 2: Technical Objective Indicator -->
          <div class="flex items-start gap-2 bg-error/10 p-2 rounded-xl border border-error/20">
            <span class="text-base">🔍</span>
            <div class="flex-1 text-xs text-on-surface leading-snug">
              <strong class="text-error block font-bold">2. El Indicador Técnico:</strong>
              {{ feedback.technicalIndicator }}
            </div>
          </div>

          <!-- Step 3: Preventive Real-World Advice -->
          <div class="flex items-start gap-2">
            <span class="text-base">🛡️</span>
            <div class="flex-1 text-xs text-on-surface-variant leading-snug">
              <strong class="text-primary block font-bold">3. Consejo Centinela:</strong>
              {{ feedback.preventiveTip }}
            </div>
          </div>

          <div class="pt-1 border-t border-outline-variant/25 flex items-center gap-1.5 text-[10px] font-bold text-error">
            <span class="material-symbols-outlined text-[14px]">healing</span>
            <span>Guardado automáticamente en tu Centro de Errores para repaso</span>
          </div>
        </div>

        <!-- Reward Pills on Success -->
        <div v-if="isCorrect" class="flex items-center gap-space-sm mb-space-lg flex-wrap">
          <div class="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full shadow-xs">
            <span class="material-symbols-outlined text-primary text-[18px] icon-filled">bolt</span>
            <span class="text-xs text-primary font-extrabold">+{{ earnedXp ?? 15 }} XP</span>
          </div>

          <div class="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full shadow-xs">
            <span class="material-symbols-outlined text-tech-cyan text-[18px] icon-filled">diamond</span>
            <span class="text-xs text-on-surface font-extrabold">+{{ earnedBits ?? 10 }} Bits</span>
          </div>

          <div
            v-if="heartsRemaining !== undefined"
            class="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full shadow-xs"
          >
            <span class="material-symbols-outlined text-error text-[18px] icon-filled">favorite</span>
            <span class="text-xs text-on-surface font-extrabold">
              {{ heartsRemaining }}/{{ maxHearts ?? 5 }}
            </span>
          </div>
        </div>

        <!-- Continue Action Button (2.5D Tactile Pill) -->
        <button
          type="button"
          class="w-full h-14 rounded-full font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 active:translate-y-1 transition-all shadow-md"
          :class="
            isCorrect
              ? 'btn-tactile-primary'
              : 'bg-error text-white shadow-[0_4px_0_#93000a] active:shadow-[0_1px_0_#93000a]'
          "
          @click="emit('continue')"
        >
          <span>{{ isCorrect ? 'Continuar Misión' : 'Entendido, continuar' }}</span>
          <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.sheet-slide-enter-from,
.sheet-slide-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
