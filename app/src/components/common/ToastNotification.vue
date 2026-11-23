<script setup lang="ts">
import { useGamificationStore } from '../../stores/useGamificationStore';

const gamificationStore = useGamificationStore();
</script>

<template>
  <Transition name="toast-pop">
    <div
      v-if="gamificationStore.toastMessage"
      role="status"
      aria-live="polite"
      class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md pointer-events-auto"
    >
      <div
        class="rounded-2xl px-4 py-3 shadow-xl border-2 backdrop-blur-md flex items-center justify-between gap-3"
        :class="
          gamificationStore.toastSuccess
            ? 'bg-surface-container-lowest border-shield-green text-on-surface shadow-[0_4px_0_#15803d]'
            : 'bg-surface-container-lowest border-error text-on-surface shadow-[0_4px_0_#93000a]'
        "
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            :class="
              gamificationStore.toastSuccess
                ? 'bg-shield-green/15 text-shield-green'
                : 'bg-error/15 text-error'
            "
          >
            <span class="material-symbols-outlined text-[20px] icon-filled">
              {{ gamificationStore.toastSuccess ? 'check_circle' : 'error' }}
            </span>
          </div>
          <p class="text-xs font-extrabold leading-snug break-words">
            {{ gamificationStore.toastMessage }}
          </p>
        </div>

        <button
          type="button"
          class="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
          aria-label="Cerrar notificación"
          @click="gamificationStore.clearToast()"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, 14px);
}
</style>
