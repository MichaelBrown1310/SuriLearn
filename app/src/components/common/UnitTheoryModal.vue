<script setup lang="ts">
import { ref } from 'vue';
import { LearningUnit } from '../../types/gamification';
import { getSuriImage } from '../../utils/suriAssets';

defineProps<{
  isOpen: boolean;
  unit: LearningUnit;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-lesson', lessonId: string): void;
}>();

const activeTab = ref<'concepts' | 'lessons' | 'rules'>('concepts');
const suriImg = getSuriImage('shield');
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-3xl bg-surface rounded-3xl border-2 border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="bg-surface-container-high p-5 sm:p-6 border-b border-outline-variant/40 flex items-start justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[28px] icon-filled">menu_book</span>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full">
                  Códice Teórico · {{ unit.moduleBadge }}
                </span>
                <span
                  v-if="unit.theoryGuide?.frameworkBadge"
                  class="text-[10px] font-extrabold bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full border border-outline-variant/30"
                >
                  {{ unit.theoryGuide.frameworkBadge }}
                </span>
              </div>
              <h2 class="text-lg sm:text-xl font-black text-on-surface leading-tight">
                {{ unit.title }}
              </h2>
              <p class="text-xs text-on-surface-variant mt-0.5">
                {{ unit.theoryGuide?.subtitle || unit.description }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface shrink-0"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 px-5 pt-3 pb-2 bg-surface-container-low border-b border-outline-variant/30">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
            :class="
              activeTab === 'concepts'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            "
            @click="activeTab = 'concepts'"
          >
            <span class="material-symbols-outlined text-[16px]">school</span>
            <span>Marco Teórico ({{ unit.theoryGuide?.sections?.length || 0 }})</span>
          </button>

          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
            :class="
              activeTab === 'lessons'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            "
            @click="activeTab = 'lessons'"
          >
            <span class="material-symbols-outlined text-[16px]">sports_esports</span>
            <span>Temario y Juegos</span>
          </button>

          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
            :class="
              activeTab === 'rules'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            "
            @click="activeTab = 'rules'"
          >
            <span class="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Reglas de Oro</span>
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <!-- TAB 1: MARCO TEÓRICO -->
          <template v-if="activeTab === 'concepts'">
            <div
              v-if="unit.theoryGuide?.overview"
              class="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-start gap-3"
            >
              <img :src="suriImg" alt="Suri" class="w-12 h-12 object-contain shrink-0" />
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-primary block">
                  Resumen Ejecutivo del Curso
                </span>
                <p class="text-xs sm:text-sm text-on-surface leading-relaxed mt-0.5">
                  {{ unit.theoryGuide.overview }}
                </p>
              </div>
            </div>

            <div
              v-for="(sec, idx) in unit.theoryGuide?.sections || []"
              :key="idx"
              class="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border-2 border-outline-variant/30 flex flex-col gap-3"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px] icon-filled">{{ sec.icon }}</span>
                </div>
                <h3 class="text-sm sm:text-base font-black text-on-surface">
                  {{ idx + 1 }}. {{ sec.title }}
                </h3>
              </div>

              <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {{ sec.summary }}
              </p>

              <ul class="flex flex-col gap-1.5 pl-1">
                <li
                  v-for="(pt, pIdx) in sec.keyPoints"
                  :key="pIdx"
                  class="flex items-start gap-2 text-xs text-on-surface font-semibold"
                >
                  <span class="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5 icon-filled">
                    check_circle
                  </span>
                  <span>{{ pt }}</span>
                </li>
              </ul>

              <div class="bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-xs">
                <span class="font-black text-primary uppercase text-[10px] block mb-0.5">
                  🏢 Caso Real en PYME:
                </span>
                <span class="text-on-surface font-medium">{{ sec.realWorldCase }}</span>
              </div>
            </div>
          </template>

          <!-- TAB 2: TEMARIO Y VIDEOJUEGOS -->
          <template v-else-if="activeTab === 'lessons'">
            <div
              v-for="node in unit.nodes.filter((n) => n.type === 'lesson')"
              :key="node.id"
              class="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 flex items-center justify-between gap-4"
            >
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[22px] icon-filled">{{ node.icon }}</span>
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <h4 class="text-sm font-black text-on-surface">{{ node.title }}</h4>
                    <span
                      v-if="node.gameTypeLabel"
                      class="text-[10px] font-black bg-tertiary/15 text-tertiary px-2 py-0.5 rounded-full"
                    >
                      {{ node.gameTypeLabel }}
                    </span>
                  </div>
                  <p class="text-xs text-on-surface-variant mt-0.5">{{ node.subtitle }}</p>
                  <span class="text-[10px] text-primary font-bold mt-1 block">
                    📘 {{ node.theorySlides?.length || 2 }} diapositivas teóricas • +{{ node.expReward }} XP
                  </span>
                </div>
              </div>

              <button
                v-if="node.status !== 'locked'"
                type="button"
                class="shrink-0 h-9 px-3.5 rounded-xl text-xs font-black btn-tactile-primary flex items-center gap-1"
                @click="emit('select-lesson', node.id)"
              >
                <span>Practicar</span>
                <span class="material-symbols-outlined text-[16px]">play_arrow</span>
              </button>
              <span
                v-else
                class="shrink-0 text-[11px] font-bold text-outline flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg"
              >
                <span class="material-symbols-outlined text-[14px]">lock</span>
                <span>Bloqueado</span>
              </span>
            </div>
          </template>

          <!-- TAB 3: REGLAS DE ORO -->
          <template v-else>
            <div class="grid grid-cols-1 gap-3">
              <div
                v-for="(rule, rIdx) in unit.theoryGuide?.goldenRules || []"
                :key="rIdx"
                class="bg-surface-container-lowest p-4 rounded-2xl border-l-4 border-l-shield-green border border-outline-variant/30 flex items-start gap-3"
              >
                <span class="w-7 h-7 rounded-full bg-shield-green/15 text-shield-green font-black text-xs flex items-center justify-center shrink-0">
                  {{ rIdx + 1 }}
                </span>
                <p class="text-xs sm:text-sm font-bold text-on-surface leading-snug">
                  {{ rule }}
                </p>
              </div>
            </div>
          </template>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 bg-surface-container-high border-t border-outline-variant/30 flex items-center justify-end">
          <button
            type="button"
            class="h-10 px-6 rounded-xl font-black text-xs btn-tactile-primary"
            @click="emit('close')"
          >
            Entendido, volver a la ruta
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
