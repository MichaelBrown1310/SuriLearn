<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { CyberSnakeExercise, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CyberSnakeExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

interface Coord {
  x: number;
  y: number;
}

interface MalwareTrap extends Coord {
  label: string;
}

const gridSize = computed(() => props.exercise.gridSize || 12);
const targetCount = computed(() => props.exercise.targetSafeCount || 6);
const maxShields = computed(() => props.exercise.maxShields || 3);

const isStarted = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const isFinished = ref<boolean>(false);

const snake = ref<Coord[]>([
  { x: 5, y: 6 },
  { x: 4, y: 6 },
  { x: 3, y: 6 },
]);
const direction = ref<Coord>({ x: 1, y: 0 });
const pendingDirection = ref<Coord>({ x: 1, y: 0 });

const safeTarget = ref<Coord & { label: string }>({ x: 8, y: 6, label: 'HTTPS' });
const malwareTraps = ref<MalwareTrap[]>([]);
const collectedSafe = ref<number>(0);
const shieldsLeft = ref<number>(maxShields.value);
const bannerText = ref<string>('Pulsa Iniciar y guía a Suri hacia los paquetes verdes.');
const suriPose = ref<SuriPose>('idle');
const suriReactionKey = ref<number>(0);

let loopTimer: ReturnType<typeof setTimeout> | null = null;
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 0) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e: TouchEvent) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled || e.changedTouches.length === 0) {
    return;
  }
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? 1 : -1, 0);
  } else {
    setDirection(0, dy > 0 ? 1 : -1);
  }
}

const totalCells = computed(() => gridSize.value * gridSize.value);

function clearTimers() {
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
}

function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findFreeCell(occupied: Coord[], avoidNearHead?: Coord): Coord {
  const size = gridSize.value;
  for (let attempt = 0; attempt < 80; attempt++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const busy = occupied.some((c) => c.x === x && c.y === y);
    const tooClose = avoidNearHead ? manhattan({ x, y }, avoidNearHead) < 2 : false;
    if (!busy && !tooClose) return { x, y };
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!occupied.some((c) => c.x === x && c.y === y)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

function spawnItems() {
  const head = snake.value[0];
  const safePool = props.exercise.safeLabels?.length
    ? props.exercise.safeLabels
    : ['HTTPS', 'MFA', 'VPN', 'PATCH', 'BACKUP', 'AES256'];
  const badPool = props.exercise.malwareLabels?.length
    ? props.exercise.malwareLabels
    : ['PHISH', 'TROJAN', 'WORM', 'SQLI'];

  const safeLabel = safePool[collectedSafe.value % safePool.length];
  const safePos = findFreeCell(snake.value, head);
  safeTarget.value = { ...safePos, label: safeLabel };

  const traps: MalwareTrap[] = [];
  const occupied = [...snake.value, safePos];
  for (let i = 0; i < 2; i++) {
    const pos = findFreeCell(occupied, head);
    occupied.push(pos);
    traps.push({
      ...pos,
      label: badPool[(collectedSafe.value + i) % badPool.length],
    });
  }
  malwareTraps.value = traps;
}

function resetSnakeToCenter() {
  const mid = Math.floor(gridSize.value / 2);
  snake.value = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  direction.value = { x: 1, y: 0 };
  pendingDirection.value = { x: 1, y: 0 };
  spawnItems();
}

function initGame() {
  clearTimers();
  isStarted.value = false;
  isPaused.value = false;
  isFinished.value = false;
  collectedSafe.value = 0;
  shieldsLeft.value = maxShields.value;
  suriPose.value = 'idle';
  bannerText.value = 'Recoge paquetes seguros (verdes) y esquiva trampas rojas y bordes.';
  resetSnakeToCenter();
}

function scheduleNextTick() {
  clearTimers();
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  const baseSpeed = props.exercise.initialSpeedMs || 190;
  const speed = Math.max(105, baseSpeed - collectedSafe.value * 9);
  loopTimer = setTimeout(() => {
    stepGame();
    scheduleNextTick();
  }, speed);
}

function startGame() {
  if (props.disabled || isFinished.value) return;
  isStarted.value = true;
  isPaused.value = false;
  suriPose.value = 'running';
  bannerText.value = '¡En patrulla! Captura los paquetes verdes sin tocar malware.';
  scheduleNextTick();
}

function togglePause() {
  if (!isStarted.value || isFinished.value) return;
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    clearTimers();
    suriPose.value = 'idle';
    bannerText.value = 'Juego en pausa.';
  } else {
    suriPose.value = 'running';
    bannerText.value = '¡Patrulla reanudada!';
    scheduleNextTick();
  }
}

function setDirection(dx: number, dy: number) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  // Prevent instant 180-degree self-collision against the current tick direction
  if (direction.value.x === -dx && direction.value.y === -dy) return;
  pendingDirection.value = { x: dx, y: dy };
}

function handleCrash(reason: string) {
  shieldsLeft.value = Math.max(0, shieldsLeft.value - 1);
  suriPose.value = 'surprised';
  suriReactionKey.value += 1;

  if (shieldsLeft.value <= 0) {
    isFinished.value = true;
    clearTimers();
    suriPose.value = 'error';
    bannerText.value = `💥 ${reason} Te quedaste sin escudos.`;
    loopTimer = setTimeout(() => {
      emit('submit', false);
    }, 650);
    return;
  }

  bannerText.value = `🛡️ ${reason} Escudos restantes: ${shieldsLeft.value}. Posición reiniciada.`;
  resetSnakeToCenter();
}

function stepGame() {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;

  direction.value = { ...pendingDirection.value };
  const head = snake.value[0];
  const next: Coord = {
    x: head.x + direction.value.x,
    y: head.y + direction.value.y,
  };

  // Wall collision
  if (next.x < 0 || next.y < 0 || next.x >= gridSize.value || next.y >= gridSize.value) {
    handleCrash('¡Choque con el perímetro!');
    return;
  }

  // Malware trap collision
  const hitTrap = malwareTraps.value.find((t) => t.x === next.x && t.y === next.y);
  if (hitTrap) {
    handleCrash(`¡Trampa ${hitTrap.label} interceptada!`);
    return;
  }

  const ateSafe = next.x === safeTarget.value.x && next.y === safeTarget.value.y;
  const bodyToCheck = ateSafe ? snake.value : snake.value.slice(0, -1);
  if (bodyToCheck.some((seg) => seg.x === next.x && seg.y === next.y)) {
    handleCrash('¡Colisión con tu propia cola!');
    return;
  }

  const nextSnake = [next, ...snake.value];
  if (!ateSafe) {
    nextSnake.pop();
  }
  snake.value = nextSnake;

  if (ateSafe) {
    collectedSafe.value += 1;
    suriPose.value = 'ok';
    suriReactionKey.value += 1;
    bannerText.value = `✅ ¡Paquete ${safeTarget.value.label} asegurado! (${collectedSafe.value}/${targetCount.value})`;

    if (collectedSafe.value >= targetCount.value) {
      isFinished.value = true;
      clearTimers();
      suriPose.value = 'victory';
      loopTimer = setTimeout(() => {
        emit('submit', true);
      }, 500);
      return;
    }

    spawnItems();
  }
}

function cellCoord(idxOneBased: number): Coord {
  const zero = idxOneBased - 1;
  return {
    x: zero % gridSize.value,
    y: Math.floor(zero / gridSize.value),
  };
}

function isHead(x: number, y: number): boolean {
  return snake.value[0]?.x === x && snake.value[0]?.y === y;
}

function isBody(x: number, y: number): boolean {
  return snake.value.slice(1).some((s) => s.x === x && s.y === y);
}

function isSafeCell(x: number, y: number): boolean {
  return safeTarget.value.x === x && safeTarget.value.y === y;
}

function trapAt(x: number, y: number): MalwareTrap | undefined {
  return malwareTraps.value.find((t) => t.x === x && t.y === y);
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled || !isStarted.value || isFinished.value) return;
  const key = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    e.preventDefault();
  }
  if (key === 'arrowup' || key === 'w') setDirection(0, -1);
  else if (key === 'arrowdown' || key === 's') setDirection(0, 1);
  else if (key === 'arrowleft' || key === 'a') setDirection(-1, 0);
  else if (key === 'arrowright' || key === 'd') setDirection(1, 0);
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
  clearTimers();
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="w-full flex flex-col gap-3 select-none text-left">
    <!-- Top HUD -->
    <div class="flex items-center justify-between gap-2 px-1 flex-wrap">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-shield-green/15 text-shield-green flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px] icon-filled">sports_esports</span>
        </div>
        <div class="min-w-0">
          <span class="text-[11px] font-black uppercase tracking-wider text-primary block truncate">
            {{ exercise.title }}
          </span>
          <h2 class="text-sm sm:text-base font-extrabold text-on-surface leading-tight">
            {{ exercise.instruction }}
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="px-2.5 py-1 rounded-full bg-shield-green/15 text-shield-green text-xs font-black">
          🛡️ {{ collectedSafe }}/{{ targetCount }}
        </span>
        <span
          class="px-2.5 py-1 rounded-full text-xs font-black"
          :class="shieldsLeft === 1 ? 'bg-error/15 text-error' : 'bg-surface-container text-on-surface'"
        >
          Escudos: {{ shieldsLeft }}
        </span>
      </div>
    </div>

    <!-- Main Arcade Console -->
    <div class="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-md flex flex-col gap-3.5">
      <!-- Suri Reaction Strip -->
      <div class="flex items-center justify-between gap-3 bg-surface-container-low px-3.5 py-2 rounded-2xl border border-outline-variant/30">
        <div class="flex items-center gap-2.5 min-w-0">
          <SuriMascotAnimated
            :pose="suriPose"
            size="xs"
            :reaction-key="suriReactionKey"
            :show-shadow="false"
          />
          <span class="text-xs font-bold text-on-surface truncate">{{ bannerText }}</span>
        </div>

        <button
          v-if="isStarted && !isFinished"
          type="button"
          class="px-2.5 py-1 rounded-xl bg-surface-container text-on-surface text-[11px] font-black shrink-0"
          @click="togglePause"
        >
          {{ isPaused ? 'Reanudar' : 'Pausar' }}
        </button>
      </div>

      <!-- 12x12 Snake Arena Board (Carbón cálido SuriLearn + Swipe táctil) -->
      <div
        class="relative w-full max-w-[360px] mx-auto aspect-square bg-[#161311] rounded-2xl p-1.5 border-2 border-[#E1A653]/45 shadow-inner overflow-hidden"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
      >
        <div
          class="w-full h-full grid gap-[2px]"
          :style="{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }"
        >
          <div
            v-for="n in totalCells"
            :key="n"
            class="rounded-[4px] flex items-center justify-center text-[9px] font-black leading-none transition-colors"
            :class="[
              isHead(cellCoord(n).x, cellCoord(n).y)
                ? 'bg-[#00E5FF] text-[#051b24] shadow-[0_0_8px_#00E5FF]'
                : isBody(cellCoord(n).x, cellCoord(n).y)
                  ? 'bg-[#22C55E] text-white'
                  : isSafeCell(cellCoord(n).x, cellCoord(n).y)
                    ? 'bg-emerald-500 text-white animate-pulse ring-1 ring-emerald-200'
                    : trapAt(cellCoord(n).x, cellCoord(n).y)
                      ? 'bg-rose-600 text-white ring-1 ring-rose-300'
                      : 'bg-[#2B241F]/65',
            ]"
            :title="
              isSafeCell(cellCoord(n).x, cellCoord(n).y)
                ? `Paquete seguro: ${safeTarget.label}`
                : trapAt(cellCoord(n).x, cellCoord(n).y)?.label
            "
          >
            <span v-if="isHead(cellCoord(n).x, cellCoord(n).y)">🐾</span>
            <span v-else-if="isSafeCell(cellCoord(n).x, cellCoord(n).y)">✓</span>
            <span v-else-if="trapAt(cellCoord(n).x, cellCoord(n).y)">☠</span>
          </div>
        </div>

        <!-- Start Overlay -->
        <div
          v-if="!isStarted"
          class="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-20"
        >
          <SuriMascotAnimated pose="cool" size="md" :auto-blink="false" :show-shadow="false" />
          <div>
            <p class="text-sm font-black text-white">Culebrita Firewall Centinela</p>
            <p class="text-[11px] text-stone-300 mt-1">
              Come <strong class="text-emerald-400">✓ {{ targetCount }} paquetes seguros</strong> ({{ safeTarget.label }}). Evita los <strong class="text-rose-400">☠ Malware</strong> y paredes.
            </p>
          </div>
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
            @click="startGame"
          >
            ¡Iniciar Culebrita!
          </button>
        </div>
      </div>

      <!-- Tactile D-Pad + Legend -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div class="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
          <span class="px-2.5 py-1 rounded-full bg-emerald-500/15 text-shield-green">
            ✓ Objetivo: {{ safeTarget.label }}
          </span>
          <span
            v-for="(t, i) in malwareTraps"
            :key="i"
            class="px-2.5 py-1 rounded-full bg-error/15 text-error"
          >
            ☠ Evitar: {{ t.label }}
          </span>
        </div>

        <!-- Mobile & Mouse D-Pad -->
        <div class="grid grid-cols-3 gap-1.5 w-36 shrink-0">
          <div></div>
          <button
            type="button"
            aria-label="Subir"
            class="h-10 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] font-black flex items-center justify-center active:scale-90 transition-all border border-outline-variant/40"
            @click="setDirection(0, -1)"
          >
            ▲
          </button>
          <div></div>
          <button
            type="button"
            aria-label="Izquierda"
            class="h-10 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] font-black flex items-center justify-center active:scale-90 transition-all border border-outline-variant/40"
            @click="setDirection(-1, 0)"
          >
            ◀
          </button>
          <button
            type="button"
            aria-label="Bajar"
            class="h-10 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] font-black flex items-center justify-center active:scale-90 transition-all border border-outline-variant/40"
            @click="setDirection(0, 1)"
          >
            ▼
          </button>
          <button
            type="button"
            aria-label="Derecha"
            class="h-10 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] font-black flex items-center justify-center active:scale-90 transition-all border border-outline-variant/40"
            @click="setDirection(1, 0)"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
