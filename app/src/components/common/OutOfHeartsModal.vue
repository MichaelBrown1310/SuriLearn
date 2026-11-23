<script setup lang="ts">
import { computed } from 'vue';
import { getSuriImage } from '../../utils/suriAssets';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    isFullScreen?: boolean;
    nextHeartTimer?: string;
    title?: string;
    message?: string;
    allowReinforcement?: boolean;
  }>(),
  {
    isFullScreen: true,
    nextHeartTimer: '',
    title: '¡Pausa táctica!',
    message:
      'Tus defensas necesitan descansar. Tómate un respiro, recupera vidas en la tienda o practica en el modo refuerzo.',
    allowReinforcement: true,
  }
);

const emit = defineEmits<{
  (e: 'goToShop'): void;
  (e: 'startReinforcement'): void;
  (e: 'goToMap'): void;
}>();

const suriSleepingImg = computed(() => getSuriImage('sleeping') || '/suri-sleeping.png');
</script>

<template>
  <Transition name="fade-scale">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none overflow-y-auto"
    >
      <!-- Modal Content Card -->
      <div
        class="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border-2 border-error/25 flex flex-col items-center text-center relative overflow-hidden my-auto animate-modal-enter"
      >
        <!-- Soft Background Ambience -->
        <div class="absolute -top-12 -right-12 w-40 h-40 bg-error/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Out of Hearts Chip -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/15 text-error text-[11px] font-extrabold uppercase tracking-wider mb-2">
          <span class="material-symbols-outlined text-[15px] icon-filled">heart_broken</span>
          <span>0 Vidas Restantes</span>
        </div>

        <!-- Suri Sleeping Illustration with Zzz Badges -->
        <div class="relative w-40 h-40 my-2 flex items-center justify-center">
          <div class="absolute inset-0 bg-error/10 rounded-full scale-105 animate-pulse"></div>
          <img
            :src="suriSleepingImg"
            alt="Suri durmiendo"
            class="relative z-10 w-full h-full object-contain drop-shadow-md"
          />
          <!-- Floating Zzz -->
          <span class="absolute top-2 right-4 text-xs font-black text-secondary animate-bounce delay-100">z</span>
          <span class="absolute -top-1 right-1 text-sm font-black text-primary animate-bounce">Z</span>
        </div>

        <!-- Headline & Explanation -->
        <h2 class="text-2xl font-black text-on-surface mb-2 tracking-tight">
          {{ title }}
        </h2>
        <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed mb-4">
          {{ message }}
        </p>

        <!-- Passive Refill Info Meter -->
        <div
          v-if="nextHeartTimer"
          class="w-full bg-surface-container-low rounded-2xl p-3 border border-outline-variant/30 flex items-center justify-between gap-3 mb-5 text-left"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-error/15 flex items-center justify-center text-error shrink-0">
              <span class="material-symbols-outlined text-[18px] icon-filled">hourglass_top</span>
            </div>
            <div class="min-w-0">
              <span class="text-[10px] uppercase font-bold text-on-surface-variant block">Regeneración pasiva</span>
              <span class="text-xs font-extrabold text-on-surface truncate block">
                +1 Vida en {{ nextHeartTimer }}
              </span>
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-1 font-black text-error text-xs">
            <span class="material-symbols-outlined text-[14px] icon-filled">favorite</span>
            <span>0/5</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="w-full flex flex-col gap-2.5">
          <!-- 1. Go to Shop to refill -->
          <button
            type="button"
            class="w-full py-3.5 px-4 bg-primary text-white font-extrabold text-sm rounded-2xl shadow-md hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            @click="emit('goToShop')"
          >
            <span class="material-symbols-outlined text-[20px] icon-filled">storefront</span>
            <span>Ir a la Tienda a recargar</span>
          </button>

          <!-- 2. Reinforcement Mode (Practicar sin costo de vidas) -->
          <button
            v-if="allowReinforcement"
            type="button"
            class="w-full py-3 px-4 bg-surface-container-high text-on-surface font-extrabold text-xs rounded-2xl hover:bg-surface-container-highest active:scale-95 transition-all flex flex-col items-center justify-center border border-outline-variant/40"
            @click="emit('startReinforcement')"
          >
            <div class="flex items-center gap-1.5 text-secondary">
              <span class="material-symbols-outlined text-[16px] icon-filled">shield</span>
              <span class="text-xs font-extrabold">Modo Refuerzo</span>
            </div>
            <span class="text-[10px] text-on-surface-variant font-medium mt-0.5">
              Repasa sin costo de vidas para ganar +1 corazón
            </span>
          </button>

          <!-- 3. Return to Map / Dismiss -->
          <button
            type="button"
            class="w-full py-2.5 px-4 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1"
            @click="emit('goToMap')"
          >
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Volver a la Ruta</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
@keyframes modalEnter {
  0% {
    transform: scale(0.92) translateY(16px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
.animate-modal-enter {
  animation: modalEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
