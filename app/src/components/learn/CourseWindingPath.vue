<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  type ComponentPublicInstance,
} from 'vue';
import type { LearningNode, LearningUnit } from '../../types/gamification';
import type { SuriPose } from '../../types/exercises';
import {
  buildCurvySvgPath,
  getDuolingoNodeOffsetPercent,
  type PathPoint,
} from '../../utils/pathGeometry';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  unit: LearningUnit;
  isFirstUnit?: boolean;
  isRecommended?: boolean;
  highlightedLessonId?: string | null;
  isClaimingChest?: boolean;
  isChestClaimedFn: (node: LearningNode) => boolean;
}>();

const emit = defineEmits<{
  (e: 'node-click', node: LearningNode): void;
  (e: 'open-theory', unit: LearningUnit): void;
}>();

const trackRef = ref<HTMLElement | null>(null);
const circleRefs = ref<(HTMLElement | null)[]>([]);
const svgSize = ref<{ w: number; h: number }>({ w: 400, h: 600 });
const fullPathD = ref<string>('');
const progressPathD = ref<string>('');

let resizeObserver: ResizeObserver | null = null;
let rafMeasureId: number | null = null;

const isArcadeUnit = computed(() => props.unit.unitNumber === 4);
const isMasterUnit = computed(() => props.unit.unitNumber === 15);
const isUnitLocked = computed(() => {
  const lessons = props.unit.nodes.filter((n) => n.type === 'lesson');
  return lessons.length > 0 && lessons.every((n) => n.status === 'locked');
});

const companionPose = computed<SuriPose>(() => {
  const poses: SuriPose[] = [
    'shield',
    'cool',
    'running',
    'idea',
    'wink',
    'ok',
    'victory',
    'idle',
  ];
  return poses[(Math.max(1, props.unit.unitNumber) - 1) % poses.length];
});

const companionSide = computed<'left' | 'right'>(() => {
  const nodes = props.unit.nodes;
  const midIdx = Math.min(Math.max(0, nodes.length - 1), Math.floor(nodes.length / 2));
  const midOffset = getDuolingoNodeOffsetPercent(props.unit.unitNumber, midIdx, nodes.length);
  return midOffset < 50 ? 'right' : 'left';
});

const activeProgressEndIndex = computed(() => {
  const nodes = props.unit.nodes;
  let lastCompleted = -1;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].status === 'completed') {
      lastCompleted = i;
    }
  }
  if (lastCompleted < 0) return 0;
  const nextIdx = lastCompleted + 1;
  if (nextIdx < nodes.length && (nodes[nextIdx].status === 'active' || nodes[nextIdx].status === 'completed')) {
    return nextIdx;
  }
  return lastCompleted;
});

function setCircleRef(idx: number, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) {
    circleRefs.value[idx] = el;
  } else {
    circleRefs.value[idx] = null;
  }
}

function measureCircleCenters() {
  const trackEl = trackRef.value;
  if (!trackEl) return;

  const tRect = trackEl.getBoundingClientRect();
  if (tRect.width <= 0 || tRect.height <= 0) return;

  svgSize.value = {
    w: Math.max(1, Math.round(tRect.width)),
    h: Math.max(1, Math.round(tRect.height)),
  };

  const points: PathPoint[] = [];
  for (let i = 0; i < props.unit.nodes.length; i++) {
    const circleEl = circleRefs.value[i];
    if (!circleEl) continue;
    const cRect = circleEl.getBoundingClientRect();
    points.push({
      x: cRect.left + cRect.width / 2 - tRect.left,
      y: cRect.top + cRect.height / 2 - tRect.top,
    });
  }

  fullPathD.value = buildCurvySvgPath(points);

  const endIdx = Math.min(points.length - 1, activeProgressEndIndex.value);
  progressPathD.value = endIdx >= 1 ? buildCurvySvgPath(points.slice(0, endIdx + 1)) : '';
}

function scheduleMeasure() {
  if (rafMeasureId !== null) {
    cancelAnimationFrame(rafMeasureId);
  }
  nextTick(() => {
    rafMeasureId = requestAnimationFrame(() => {
      rafMeasureId = null;
      measureCircleCenters();
    });
  });
}

watch(
  () => [props.unit.nodes, props.highlightedLessonId],
  () => {
    scheduleMeasure();
  },
  { deep: true }
);

onMounted(() => {
  scheduleMeasure();
  if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
    resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });
    resizeObserver.observe(trackRef.value);
  }
  window.addEventListener('resize', scheduleMeasure);
});

onUnmounted(() => {
  if (rafMeasureId !== null) {
    cancelAnimationFrame(rafMeasureId);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('resize', scheduleMeasure);
});
</script>

<template>
  <div class="w-full flex flex-col">
    <!-- Separador horizontal de curso estilo Duolingo -->
    <div
      class="flex items-center gap-3 w-full my-2"
      :class="isFirstUnit ? 'mt-0 mb-3' : 'mt-4 mb-4'"
    >
      <div class="flex-1 h-[2px] bg-outline-variant/60 rounded-full"></div>
      <span
        class="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-2xs shrink-0 flex items-center gap-1.5"
        :class="
          isArcadeUnit
            ? 'bg-tertiary/15 text-tertiary border-tertiary/40'
            : 'bg-surface-container-low text-primary border-primary/35'
        "
      >
        <span class="material-symbols-outlined text-[14px] icon-filled">
          {{ unit.icon || 'shield' }}
        </span>
        <span>Curso {{ unit.unitNumber }} · {{ unit.moduleBadge }}</span>
      </span>
      <div class="flex-1 h-[2px] bg-outline-variant/60 rounded-full"></div>
    </div>

    <!-- Tarjeta Encabezado del Curso -->
    <div
      class="relative overflow-hidden rounded-3xl p-5 lg:p-6 shadow-xs border-2 transition-colors"
      :class="
        isArcadeUnit
          ? 'bg-gradient-to-r from-surface-container-high via-surface-container to-tertiary/10 border-tertiary/45'
          : 'bg-surface-container-high border-outline-variant/40'
      "
    >
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-1.5 mb-2">
            <div
              class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full"
              :class="isArcadeUnit ? 'bg-tertiary/15 text-tertiary' : 'bg-primary/15 text-primary'"
            >
              <span class="material-symbols-outlined text-[15px] icon-filled">{{ unit.icon || 'shield' }}</span>
              <span class="text-[10px] font-black uppercase tracking-wider">{{ unit.moduleBadge }}</span>
            </div>

            <span
              v-if="unit.difficultyTier"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/40 text-[10px] font-extrabold tracking-wide"
            >
              {{ unit.difficultyTier }}
            </span>

            <span
              v-if="isRecommended"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E1A653] text-[#291800] text-[10px] font-black uppercase tracking-wider shadow-2xs"
            >
              ⭐ Recomendado
            </span>

            <span
              v-if="isArcadeUnit || isMasterUnit"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
              :class="isMasterUnit ? 'bg-primary text-[#291800]' : 'bg-tertiary text-white'"
            >
              {{ isMasterUnit ? 'Desafío Final' : 'Zona Arcade' }}
            </span>

            <span
              v-if="unit.unitNumber > 1 && isUnitLocked"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant border border-outline-variant/40 text-[10px] font-bold"
            >
              <span class="material-symbols-outlined text-[12px]">lock</span>
              <span>Bloqueado · Completa el Curso {{ unit.unitNumber - 1 }}</span>
            </span>
          </div>

          <h2 class="text-base lg:text-lg font-black text-on-surface leading-snug">
            {{ unit.title }}
          </h2>
          <p class="text-xs text-on-surface-variant mt-1 leading-snug">
            {{ unit.description }}
          </p>
        </div>

        <!-- Botón Manual Teórico del Curso -->
        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl bg-surface-container-lowest text-primary font-black text-xs shadow-sm border-2 border-primary/40 hover:bg-primary hover:text-[#291800] active:scale-95 transition-all shrink-0 flex items-center gap-2"
          title="Abrir Códice y Teoría Completa del Curso"
          @click="emit('open-theory', unit)"
        >
          <span class="material-symbols-outlined text-[20px] icon-filled">menu_book</span>
          <div class="text-left leading-tight">
            <span class="block">Manual Teórico</span>
            <span class="text-[10px] opacity-80 font-bold">
              {{ unit.theoryGuide?.estimatedStudyMinutes || 15 }} min lectura
            </span>
          </div>
        </button>
      </div>

      <!-- Barra de Progreso del Curso -->
      <div class="mt-4 relative z-10">
        <div class="flex justify-between items-center text-on-surface-variant text-xs mb-1.5 font-bold">
          <span>Progreso del Curso {{ unit.unitNumber }}</span>
          <span class="font-black" :class="isArcadeUnit ? 'text-tertiary' : 'text-primary'">
            {{ unit.progressPercentage }}%
          </span>
        </div>
        <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            class="h-full rounded-full relative overflow-hidden transition-all duration-700"
            :class="isArcadeUnit ? 'bg-tertiary' : 'bg-primary'"
            :style="{ width: `${unit.progressPercentage}%` }"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Camino Curvo Continuo Estilo Duolingo -->
    <div
      ref="trackRef"
      class="relative w-full max-w-[440px] mx-auto py-8 overflow-x-clip"
    >
      <!-- SVG Curvo en Capa Trasera (z-0) detrás de los círculos -->
      <svg
        v-if="fullPathD"
        class="absolute inset-0 w-full h-full pointer-events-none z-0"
        :viewBox="`0 0 ${svgSize.w} ${svgSize.h}`"
        preserveAspectRatio="none"
        fill="none"
      >
        <!-- Trazo 1: Camino completo base -->
        <path
          :d="fullPathD"
          stroke="var(--color-outline-variant, #E5D5BC)"
          stroke-width="14"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Trazo 2: Guía punteada sutil sobre todo el camino -->
        <path
          :d="fullPathD"
          stroke="var(--color-surface-container-lowest, #FFFFFF)"
          stroke-opacity="0.45"
          stroke-width="3.5"
          stroke-dasharray="6 12"
          stroke-linecap="round"
        />
        <!-- Trazo 3: Camino completado/activo -->
        <path
          v-if="progressPathD"
          :d="progressPathD"
          :stroke="isArcadeUnit ? '#00A8BD' : '#E1A653'"
          stroke-width="14"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Trazo 4: Corriente animada sobre el tramo recorrido -->
        <path
          v-if="progressPathD"
          :d="progressPathD"
          stroke="#FFF8F1"
          stroke-width="3.5"
          stroke-dasharray="6 14"
          stroke-linecap="round"
          class="suri-path-flow"
        />
      </svg>

      <!-- Compañero Suri decorativo al costado libre de la curva -->
      <div
        class="hidden sm:flex flex-col items-center absolute top-[42%] -translate-y-1/2 z-10 pointer-events-auto"
        :class="companionSide === 'right' ? 'right-1 sm:right-2' : 'left-1 sm:left-2'"
      >
        <SuriMascotAnimated
          :pose="companionPose"
          size="md"
          :interactive="true"
          :auto-blink="true"
          :show-shadow="true"
        />
      </div>

      <!-- Lista de Nodos en Zonas Curvas -->
      <div
        v-for="(node, idx) in unit.nodes"
        :key="node.id"
        class="relative z-10 w-full mb-10 last:mb-2"
      >
        <div
          class="relative flex flex-col items-center w-max max-w-[180px] sm:max-w-[220px] -translate-x-1/2"
          :style="{ left: `${getDuolingoNodeOffsetPercent(unit.unitNumber, idx, unit.nodes.length)}%` }"
        >
          <!-- Case A: Reward Chest -->
          <template v-if="node.type === 'reward_chest'">
            <!-- Claimed Chest -->
            <div
              v-if="isChestClaimedFn(node)"
              class="relative flex flex-col items-center select-none cursor-default"
              title="Cofre de unidad ya reclamado"
            >
              <button
                :ref="(el) => setCircleRef(idx, el)"
                type="button"
                class="relative z-10 w-[64px] h-[64px] rounded-2xl bg-surface-container-highest flex items-center justify-center shadow-inner border-2 border-outline-variant cursor-not-allowed"
                disabled
              >
                <span class="material-symbols-outlined text-[28px] text-on-surface-variant/70">lock_open</span>
              </button>
              <span class="relative z-20 mt-2 text-xs font-bold text-on-surface-variant bg-surface-container-low px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-outline-variant/40">
                <span class="material-symbols-outlined text-[12px] text-shield-green icon-filled">check_circle</span>
                <span>Reclamado</span>
              </span>
            </div>

            <!-- Active / Available Chest -->
            <div
              v-else-if="node.status === 'active'"
              class="relative flex flex-col items-center group cursor-pointer"
              :class="{ 'opacity-60 pointer-events-none': isClaimingChest }"
              @click="emit('node-click', node)"
            >
              <button
                :ref="(el) => setCircleRef(idx, el)"
                type="button"
                class="relative z-10 w-[64px] h-[64px] rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-md active:translate-y-1 transition-transform border-2 border-[#E1A653] disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isClaimingChest"
              >
                <div class="absolute inset-0 rounded-2xl bg-[#b87b2e] -bottom-1 -z-10"></div>
                <span class="material-symbols-outlined text-[30px] text-primary icon-filled">inventory_2</span>
                <span v-if="!isClaimingChest" class="absolute -top-1 -right-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </button>
              <span class="relative z-20 mt-2 text-xs font-bold text-primary bg-surface-container-lowest border border-primary/30 px-2.5 py-0.5 rounded-full shadow-xs">
                {{ isClaimingChest ? 'Abriendo...' : `+${node.bitsReward || 50} Bits` }}
              </span>
            </div>

            <!-- Locked Chest (Opaco para tapar la línea SVG detrás) -->
            <div
              v-else
              class="relative flex flex-col items-center cursor-not-allowed"
              @click="emit('node-click', node)"
            >
              <button
                :ref="(el) => setCircleRef(idx, el)"
                type="button"
                class="relative z-10 w-[64px] h-[64px] rounded-2xl bg-surface-container-highest border-2 border-outline-variant flex items-center justify-center shadow-sm cursor-not-allowed"
                disabled
              >
                <div class="absolute inset-0 rounded-2xl bg-outline-variant -bottom-1 -z-10"></div>
                <span class="material-symbols-outlined text-[26px] text-on-surface-variant/65 icon-filled">lock</span>
              </button>
              <span class="relative z-20 mt-2 text-xs text-on-surface-variant bg-surface-container-low border border-outline-variant/40 px-2.5 py-0.5 rounded-full font-semibold text-center">
                {{ node.title }} (+{{ node.bitsReward || 50 }} Bits)
              </span>
            </div>
          </template>

          <!-- Case B: Lesson Node -->
          <template v-else>
            <!-- 1. COMPLETED Lesson Node -->
            <div
              v-if="node.status === 'completed'"
              class="relative flex flex-col items-center group cursor-pointer"
              @click="emit('node-click', node)"
            >
              <div class="relative z-20 -mb-2.5 flex items-center gap-0.5 bg-surface-container-lowest px-2 py-0.5 rounded-full shadow-xs border border-outline-variant/40">
                <span
                  v-for="starIdx in 3"
                  :key="starIdx"
                  class="material-symbols-outlined text-[13px] icon-filled"
                  :class="starIdx <= (node.stars || 3) ? 'text-primary' : 'text-outline-variant/50'"
                >
                  star
                </span>
              </div>

              <button
                :ref="(el) => setCircleRef(idx, el)"
                type="button"
                class="relative z-10 w-[68px] h-[68px] rounded-full bg-shield-green text-white flex items-center justify-center shadow-md active:translate-y-1 transition-all border-2 border-[#166534]"
              >
                <div class="absolute inset-0 rounded-full bg-[#15803d] -bottom-1 -z-10"></div>
                <span class="material-symbols-outlined text-[30px] font-black">check</span>
              </button>

              <span class="relative z-20 mt-2 text-xs font-bold text-on-surface bg-surface-container-lowest border border-outline-variant/40 px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 text-center">
                <span>{{ node.title }}</span>
                <span class="material-symbols-outlined text-[13px] text-shield-green icon-filled shrink-0">check_circle</span>
              </span>
            </div>

            <!-- 2. ACTIVE / CURRENT Lesson Node -->
            <div
              v-else-if="node.status === 'active'"
              class="relative flex flex-col items-center"
            >
              <!-- Suri con Globo de Diálogo solo en el nodo destacado global -->
              <div
                v-if="highlightedLessonId === node.id"
                class="relative z-20 flex flex-col items-center mb-1.5"
              >
                <div class="bg-surface-container-lowest px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 mb-1 relative border border-primary/30">
                  <span class="text-xs font-extrabold text-primary whitespace-nowrap">
                    {{ node.isVideoGame ? '🎮 ¡Videojuego Listo!' : '¡Te toca a ti!' }}
                  </span>
                  <span class="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                  <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-[6px] border-t-surface-container-lowest"></div>
                </div>
                <SuriMascotAnimated
                  :pose="node.isVideoGame ? 'cool' : 'idle'"
                  size="sm"
                  :interactive="true"
                  :auto-blink="true"
                  :show-shadow="false"
                />
              </div>

              <!-- Círculo Activo Pulsante -->
              <div
                class="relative flex flex-col items-center cursor-pointer"
                @click="emit('node-click', node)"
              >
                <div class="relative flex items-center justify-center">
                  <div
                    class="absolute -inset-2 rounded-full animate-ping pointer-events-none"
                    :class="node.isVideoGame ? 'bg-tertiary/30' : 'bg-primary/30'"
                  ></div>
                  <button
                    :ref="(el) => setCircleRef(idx, el)"
                    type="button"
                    class="relative z-10 w-[76px] h-[76px] rounded-full flex items-center justify-center shadow-lg active:translate-y-1.5 transition-transform border-2"
                    :class="
                      node.isVideoGame
                        ? 'bg-tertiary text-white border-[#004b55] shadow-[0_4px_0_#004b55]'
                        : 'bg-[#E1A653] text-[#291800] border-[#b87b2e] shadow-[0_4px_0_#b87b2e]'
                    "
                  >
                    <span class="material-symbols-outlined text-[36px] icon-filled">{{ node.icon || 'play_arrow' }}</span>
                  </button>
                </div>

                <div class="relative z-20 mt-2 flex flex-col items-center text-center">
                  <span class="text-xs font-black text-[#291800] bg-primary-fixed border border-[#E1A653]/50 px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px] shrink-0">
                      {{ node.isVideoGame ? 'sports_esports' : 'play_arrow' }}
                    </span>
                    <span>{{ node.title }}</span>
                  </span>
                  <span
                    v-if="node.gameTypeLabel"
                    class="text-[10px] font-black text-tertiary bg-surface-container-lowest border border-tertiary/30 px-2.5 py-0.5 rounded-full mt-1"
                  >
                    {{ node.gameTypeLabel }} • 📘 Teoría
                  </span>
                  <span class="text-[10px] text-on-surface-variant bg-surface px-2 rounded-full font-bold mt-0.5">
                    +{{ node.expReward }} EXP • {{ node.estimatedMinutes }} min
                  </span>
                </div>
              </div>
            </div>

            <!-- 3. LOCKED Lesson Node (100% opaco para tapar la línea SVG detrás) -->
            <div
              v-else
              class="relative flex flex-col items-center cursor-not-allowed"
              @click="emit('node-click', node)"
            >
              <button
                :ref="(el) => setCircleRef(idx, el)"
                type="button"
                class="relative z-10 w-[64px] h-[64px] rounded-full bg-surface-container-highest border-2 border-outline-variant flex items-center justify-center shadow-sm cursor-not-allowed"
                disabled
              >
                <div class="absolute inset-0 rounded-full bg-outline-variant -bottom-1 -z-10"></div>
                <span class="material-symbols-outlined text-[26px] text-on-surface-variant/65 icon-filled">lock</span>
              </button>
              <span class="relative z-20 mt-2 text-xs text-on-surface-variant bg-surface-container-low border border-outline-variant/40 px-2.5 py-0.5 rounded-full font-semibold text-center">
                {{ node.title }}
              </span>
              <span
                v-if="node.gameTypeLabel"
                class="relative z-20 text-[10px] text-on-surface-variant/80 bg-surface px-2 rounded-full font-bold mt-0.5 text-center"
              >
                {{ node.gameTypeLabel }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes suri-path-dash {
  from {
    stroke-dashoffset: 40;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.suri-path-flow {
  animation: suri-path-dash 1.8s linear infinite;
}
</style>
