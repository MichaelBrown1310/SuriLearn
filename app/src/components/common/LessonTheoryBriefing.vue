<script setup lang="ts">
import { ref, computed } from 'vue';
import { TheorySlide } from '../../types/gamification';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  lessonTitle: string;
  lessonSubtitle?: string;
  gameTypeLabel?: string;
  slides: TheorySlide[];
}>();

const emit = defineEmits<{
  (e: 'start-mission'): void;
}>();

const currentIndex = ref<number>(0);

const currentSlide = computed<TheorySlide | undefined>(() => {
  return props.slides[currentIndex.value] || props.slides[0];
});

const isLastSlide = computed(() => currentIndex.value >= props.slides.length - 1);

const suriImg = getSuriImage('idea');

function nextSlide() {
  if (!isLastSlide.value) {
    currentIndex.value += 1;
  } else {
    emit('start-mission');
  }
}

function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto flex flex-col gap-5 animate-fade-in">
    <!-- Top Banner: Briefing Header -->
    <div class="bg-surface-container-high rounded-3xl p-5 border-2 border-outline-variant/40 shadow-xs">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div class="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-1 rounded-full">
          <span class="material-symbols-outlined text-[16px] icon-filled">menu_book</span>
          <span class="text-[11px] font-black uppercase tracking-wider">
            Briefing Teórico · Concepto {{ currentIndex + 1 }} de {{ slides.length }}
          </span>
        </div>

        <span
          v-if="gameTypeLabel"
          class="inline-flex items-center gap-1 bg-tertiary/15 text-tertiary px-3 py-1 rounded-full text-[11px] font-black"
        >
          <span class="material-symbols-outlined text-[15px] icon-filled">sports_esports</span>
          <span>{{ gameTypeLabel }}</span>
        </span>
      </div>

      <h1 class="text-lg sm:text-xl font-black text-on-surface leading-tight">
        {{ lessonTitle }}
      </h1>
      <p v-if="lessonSubtitle" class="text-xs text-on-surface-variant font-medium mt-0.5">
        {{ lessonSubtitle }}
      </p>

      <!-- Slide Dots Progress -->
      <div class="flex items-center gap-2 mt-4">
        <button
          v-for="(slide, idx) in slides"
          :key="slide.id"
          type="button"
          class="h-2 rounded-full transition-all duration-300"
          :class="
            idx === currentIndex
              ? 'w-10 bg-primary'
              : idx < currentIndex
                ? 'w-5 bg-shield-green'
                : 'w-5 bg-surface-container-highest'
          "
          @click="currentIndex = idx"
        ></button>
      </div>
    </div>

    <!-- Active Theory Card -->
    <div
      v-if="currentSlide"
      class="card-tactile p-5 sm:p-6 flex flex-col gap-4 bg-surface-container-lowest"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[26px] icon-filled">{{ currentSlide.icon || 'school' }}</span>
          </div>
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider text-primary block">
              {{ currentSlide.badge }}
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface leading-snug">
              {{ currentSlide.title }}
            </h2>
          </div>
        </div>

        <span
          v-if="currentSlide.standardRef"
          class="shrink-0 bg-surface-container-high text-on-surface-variant text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-outline-variant/30"
        >
          {{ currentSlide.standardRef }}
        </span>
      </div>

      <!-- Main Theoretical Explanation -->
      <div class="bg-surface-container-low/80 p-4 rounded-2xl border border-outline-variant/25">
        <p class="text-xs sm:text-sm text-on-surface leading-relaxed font-medium">
          {{ currentSlide.content }}
        </p>
      </div>

      <!-- Side-by-Side Comparison: Trap vs Safe Practice -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Trap / Attack Vector -->
        <div class="rounded-2xl p-3.5 bg-error/10 border-2 border-error/30 flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5 text-error font-black text-xs">
            <span class="material-symbols-outlined text-[18px] icon-filled">dangerous</span>
            <span>Vector de Ataque / Trampa</span>
          </div>
          <p class="text-xs text-on-surface leading-snug font-semibold">
            {{ currentSlide.trapExample }}
          </p>
        </div>

        <!-- Safe / Sentinel Practice -->
        <div class="rounded-2xl p-3.5 bg-shield-green/10 border-2 border-shield-green/30 flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5 text-shield-green font-black text-xs">
            <span class="material-symbols-outlined text-[18px] icon-filled">verified_user</span>
            <span>Defensa Centinela Segura</span>
          </div>
          <p class="text-xs text-on-surface leading-snug font-semibold">
            {{ currentSlide.safeExample }}
          </p>
        </div>
      </div>

      <!-- Suri Golden Rule Callout -->
      <div class="flex items-center gap-3.5 bg-surface-container p-3.5 rounded-2xl border border-primary/30">
        <div class="w-12 h-12 rounded-2xl bg-surface-container-lowest p-1 border border-outline-variant/30 shrink-0">
          <img :src="suriImg" alt="Suri" class="w-full h-full object-contain" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-black uppercase tracking-wider text-primary block">
            Regla de Oro para el Juego
          </span>
          <p class="text-xs font-extrabold text-on-surface leading-snug mt-0.5">
            "{{ currentSlide.suriTip }}"
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div class="flex items-center justify-between gap-3">
      <button
        type="button"
        class="h-12 px-4 rounded-2xl font-black text-xs btn-tactile-secondary flex items-center gap-1.5 disabled:opacity-40"
        :disabled="currentIndex === 0"
        @click="prevSlide"
      >
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Anterior</span>
      </button>

      <button
        type="button"
        class="h-12 px-4 rounded-2xl font-bold text-xs text-on-surface-variant hover:text-primary underline"
        @click="emit('start-mission')"
      >
        Saltar directo al juego
      </button>

      <button
        type="button"
        class="h-12 px-6 rounded-2xl font-black text-xs sm:text-sm btn-tactile-primary flex items-center gap-2"
        @click="nextSlide"
      >
        <span>{{ isLastSlide ? '¡Iniciar Videojuego!' : 'Siguiente Concepto' }}</span>
        <span class="material-symbols-outlined text-[20px] icon-filled">
          {{ isLastSlide ? 'sports_esports' : 'arrow_forward' }}
        </span>
      </button>
    </div>
  </div>
</template>
