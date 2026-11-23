<script setup lang="ts">
import { ref } from 'vue';
import { UrlInspectorExercise } from '../../types/exercises';

const props = defineProps<{
  exercise: UrlInspectorExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', selectedSegmentId: string): void;
}>();

const selectedSegmentId = ref<string | null>(null);

function selectSegment(id: string) {
  if (props.disabled) return;
  selectedSegmentId.value = id;
}

function handleConfirm() {
  if (!selectedSegmentId.value || props.disabled) return;
  emit('submit', selectedSegmentId.value);
}
</script>

<template>
  <div class="w-full flex flex-col gap-space-md select-none text-left">
    <!-- Header -->
    <div class="flex items-center gap-2.5 px-1">
      <div
        class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary shadow-xs"
      >
        <span class="material-symbols-outlined text-[20px] icon-filled">link</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs font-bold uppercase tracking-wider text-primary">
          {{ exercise.title }}
        </span>
        <h2 class="text-base font-extrabold text-on-surface leading-tight">
          {{ exercise.instruction }}
        </h2>
      </div>
    </div>

    <!-- Browser Address Bar Interactive Simulator -->
    <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-md border border-outline-variant/30 flex flex-col gap-3">
      <!-- Address Bar Frame -->
      <div class="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30">
        <span
          class="material-symbols-outlined text-[18px] shrink-0"
          :class="exercise.rawUrl.startsWith('https://') ? 'text-shield-green' : 'text-error'"
        >
          {{ exercise.rawUrl.startsWith('https://') ? 'lock' : 'lock_open' }}
        </span>
        <div class="h-3 w-[1px] bg-outline-variant/50"></div>
        <span class="text-xs font-mono text-on-surface truncate flex-1">
          {{ exercise.rawUrl }}
        </span>
      </div>

      <!-- Segmented Clickable Blocks -->
      <div class="flex flex-col gap-1.5 mt-2">
        <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          Selecciona el fragmento sospechoso:
        </span>

        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="seg in exercise.segments"
            :key="seg.id"
            type="button"
            class="flex items-center justify-between p-3 rounded-xl border-2 transition-all active:scale-[0.98] text-left"
            :class="[
              selectedSegmentId === seg.id
                ? 'border-tech-cyan bg-tech-cyan/10 shadow-[0_3px_0_#00c3d9]'
                : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container',
            ]"
            :disabled="disabled"
            @click="selectSegment(seg.id)"
          >
            <div class="flex flex-col min-w-0">
              <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                {{ seg.type }}
              </span>
              <span class="font-mono text-xs font-extrabold text-on-surface truncate">
                {{ seg.text }}
              </span>
            </div>

            <!-- Radio indicator -->
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
              :class="
                selectedSegmentId === seg.id
                  ? 'bg-tech-cyan text-on-surface border-tech-cyan'
                  : 'bg-surface-container border-outline-variant'
              "
            >
              <span
                v-if="selectedSegmentId === seg.id"
                class="material-symbols-outlined text-[14px] font-extrabold"
              >
                check
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Technique hint box -->
      <div class="p-2.5 bg-surface-container rounded-xl flex items-start gap-2 text-xs">
        <span class="material-symbols-outlined text-[16px] text-primary shrink-0 icon-filled">
          help
        </span>
        <span class="text-[11px] text-on-surface-variant leading-tight">
          <strong>Pista de Suri:</strong> {{ exercise.hint }}
        </span>
      </div>
    </div>

    <!-- Confirm Button -->
    <button
      type="button"
      class="w-full h-14 rounded-full font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 btn-tactile-primary"
      :disabled="!selectedSegmentId || disabled"
      :class="{ 'opacity-50 pointer-events-none': !selectedSegmentId }"
      @click="handleConfirm"
    >
      <span>Comprobar Fragmento</span>
      <span class="material-symbols-outlined text-[18px]">verified</span>
    </button>
  </div>
</template>
