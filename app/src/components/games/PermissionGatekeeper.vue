<script setup lang="ts">
import { ref, computed } from 'vue';
import { PermissionGatekeeperExercise } from '../../types/exercises';

const props = defineProps<{
  exercise: PermissionGatekeeperExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', verdict: 'deny' | 'allow'): void;
}>();

const selectedDecision = ref<'deny' | 'allow' | null>(null);
const dragOffset = ref<number>(0);
const isDragging = ref<boolean>(false);
let startX = 0;

function handleDecision(decision: 'deny' | 'allow') {
  if (props.disabled) return;
  selectedDecision.value = decision;
  emit('submit', decision);
}

function onTouchStart(e: TouchEvent) {
  if (props.disabled) return;
  isDragging.value = true;
  startX = e.touches[0].clientX;
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value || props.disabled) return;
  const currentX = e.touches[0].clientX;
  dragOffset.value = currentX - startX;
}

function onTouchEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  if (dragOffset.value > 80) {
    handleDecision('allow');
  } else if (dragOffset.value < -80) {
    handleDecision('deny');
  }
  dragOffset.value = 0;
}

const cardStyle = computed(() => {
  if (dragOffset.value === 0) return {};
  const rotation = dragOffset.value * 0.08;
  return {
    transform: `translateX(${dragOffset.value}px) rotate(${rotation}deg)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s ease',
  };
});
</script>

<template>
  <div class="w-full flex flex-col gap-space-md select-none text-left">
    <!-- Header -->
    <div class="flex items-center gap-2.5 px-1">
      <div
        class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary shadow-xs"
      >
        <span class="material-symbols-outlined text-[20px] icon-filled">security</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs font-bold uppercase tracking-wider text-primary">
          {{ exercise.title }}
        </span>
        <h2 class="text-sm font-extrabold text-on-surface leading-tight">
          {{ exercise.instruction }}
        </h2>
      </div>
    </div>

    <!-- App Permission Audit Card (With Touch Swipe Support) -->
    <div
      class="relative bg-surface-container-lowest rounded-2xl p-space-md shadow-md border-2 border-outline-variant/30 flex flex-col gap-3 cursor-grab active:cursor-grabbing transition-transform"
      :style="cardStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- Swipe Overlay Indicators -->
      <div
        v-if="dragOffset < -30"
        class="absolute top-4 right-4 z-20 bg-error text-white text-xs font-black px-3 py-1 rounded-full uppercase shadow-md rotate-12"
      >
        DENEGAR
      </div>
      <div
        v-if="dragOffset > 30"
        class="absolute top-4 left-4 z-20 bg-shield-green text-white text-xs font-black px-3 py-1 rounded-full uppercase shadow-md -rotate-12"
      >
        AUTORIZAR
      </div>

      <!-- App Header Profile -->
      <div class="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
        <div class="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 shadow-xs border border-outline-variant/30">
          <span class="material-symbols-outlined text-[28px]">{{ exercise.appInfo.iconUrl || 'apps' }}</span>
        </div>
        <div class="flex flex-col min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h3 class="text-sm font-extrabold text-on-surface truncate">
              {{ exercise.appInfo.name }}
            </h3>
            <span class="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant font-bold">
              {{ exercise.appInfo.category }}
            </span>
          </div>
          <p class="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
            {{ exercise.appInfo.statedPurpose }}
          </p>
        </div>
      </div>

      <!-- Requested Permissions List -->
      <div class="flex flex-col gap-2">
        <span class="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
          Permisos Solicitados:
        </span>

        <div
          v-for="perm in exercise.requestedPermissions"
          :key="perm.id"
          class="p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-start gap-2.5"
        >
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            :class="
              selectedDecision === null
                ? 'bg-surface-container-high text-primary'
                : perm.isJustifiedForFunction
                  ? 'bg-shield-green text-white'
                  : 'bg-error text-white'
            "
          >
            <span class="material-symbols-outlined text-[16px]">{{ perm.icon }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-on-surface truncate">{{ perm.title }}</span>
              <span
                v-if="selectedDecision !== null"
                class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0"
                :class="
                  perm.riskSeverity === 'critical' || perm.riskSeverity === 'high'
                    ? 'bg-error/20 text-error'
                    : 'bg-primary/20 text-primary'
                "
              >
                Riesgo: {{ perm.riskSeverity }}
              </span>
            </div>
            <p v-if="selectedDecision !== null" class="text-[10px] text-on-surface-variant mt-0.5 leading-tight">
              {{ perm.riskExplanation }}
            </p>
            <p v-else class="text-[10px] text-on-surface-variant/80 mt-0.5 leading-tight">
              Evalúa si este permiso es coherente con la función declarada de la app.
            </p>
          </div>
        </div>
      </div>

      <div class="text-[10px] text-on-surface-variant/70 italic text-center pt-1 border-t border-outline-variant/20">
        ↔ Desliza o usa los botones para dictar veredicto centinela
      </div>
    </div>

    <!-- Dual Gatekeeper Action Buttons -->
    <div class="grid grid-cols-2 gap-space-sm mt-1">
      <button
        type="button"
        class="h-14 py-3 rounded-2xl bg-error text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:translate-y-1 transition-all shadow-[0_4px_0_#93000a] active:shadow-[0_1px_0_#93000a]"
        :disabled="disabled"
        @click="handleDecision('deny')"
      >
        <span class="material-symbols-outlined text-[18px]">block</span>
        <span>DENEGAR / AISLAR</span>
      </button>

      <button
        type="button"
        class="h-14 py-3 rounded-2xl bg-shield-green text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:translate-y-1 transition-all shadow-[0_4px_0_#15803d] active:shadow-[0_1px_0_#15803d]"
        :disabled="disabled"
        @click="handleDecision('allow')"
      >
        <span class="material-symbols-outlined text-[18px]">check_circle</span>
        <span>AUTORIZAR</span>
      </button>
    </div>
  </div>
</template>
