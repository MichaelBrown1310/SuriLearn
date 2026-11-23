<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ThreatWhackExercise, ThreatWhackItem, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: ThreatWhackExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

const PORT_LABELS = [
  '22 · SSH',
  '80 · HTTP',
  '443 · HTTPS',
  '3389 · RDP',
  '25 · SMTP',
  '53 · DNS',
  '445 · SMB',
  '3306 · SQL',
  '8080 · API',
];

interface ActiveSlot {
  slotIndex: number;
  item: ThreatWhackItem;
  whacked: boolean;
}

const isStarted = ref<boolean>(false);
const isFinished = ref<boolean>(false);
const timeLeft = ref<number>(props.exercise.durationSeconds || 35);
const hits = ref<number>(0);
const mistakes = ref<number>(0);
const combo = ref<number>(0);
const activeSlots = ref<ActiveSlot[]>([]);
const bannerText = ref<string>('Golpea amenazas rojas. ¡NO bloquees tráfico legítimo verde!');
const suriPose = ref<SuriPose>('idle');
const suriReactionKey = ref<number>(0);

let secondTimer: ReturnType<typeof setInterval> | null = null;
let spawnTimer: ReturnType<typeof setInterval> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;

const targetHits = computed(() => props.exercise.targetHits || 8);
const maxMistakes = computed(() => props.exercise.maxMistakes || 3);
const shieldsLeft = computed(() => Math.max(0, maxMistakes.value - mistakes.value));

function clearTimers() {
  if (secondTimer) {
    clearInterval(secondTimer);
    secondTimer = null;
  }
  if (spawnTimer) {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
}

function spawnTargets() {
  const pool = props.exercise.spawnPool || [];
  if (pool.length === 0) return;

  const count = Math.random() < 0.65 ? 2 : 1;
  const chosenIndices = new Set<number>();
  while (chosenIndices.size < count) {
    chosenIndices.add(Math.floor(Math.random() * 9));
  }

  const next: ActiveSlot[] = [];
  chosenIndices.forEach((slotIdx) => {
    const item = pool[Math.floor(Math.random() * pool.length)];
    next.push({
      slotIndex: slotIdx,
      item,
      whacked: false,
    });
  });
  activeSlots.value = next;
}

function initGame() {
  clearTimers();
  isStarted.value = false;
  isFinished.value = false;
  timeLeft.value = props.exercise.durationSeconds || 35;
  hits.value = 0;
  mistakes.value = 0;
  combo.value = 0;
  activeSlots.value = [];
  suriPose.value = 'idle';
  bannerText.value = `Intercepta ${targetHits.value} amenazas antes de que termine el tiempo.`;
}

function startGame() {
  if (props.disabled || isFinished.value) return;
  isStarted.value = true;
  suriPose.value = 'running';
  bannerText.value = '¡Patrulla de puertos activa! Toca los intrusos rojos.';
  spawnTargets();

  secondTimer = setInterval(() => {
    if (props.disabled || isFinished.value) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (timeLeft.value <= 0) {
      finishGame(hits.value >= targetHits.value);
    }
  }, 1000);

  spawnTimer = setInterval(() => {
    if (props.disabled || isFinished.value) return;
    spawnTargets();
  }, 1550);
}

function finishGame(won: boolean) {
  if (isFinished.value) return;
  isFinished.value = true;
  clearTimers();
  activeSlots.value = [];
  suriPose.value = won ? 'victory' : 'error';
  suriReactionKey.value += 1;
  bannerText.value = won
    ? `🏆 ¡Perímetro despejado! Neutralizaste ${hits.value} amenazas.`
    : '💥 Se agotó el tiempo o los escudos del puerto.';
  finishTimer = setTimeout(() => {
    emit('submit', won);
  }, 550);
}

function slotItemAt(slotIdx: number): ActiveSlot | undefined {
  return activeSlots.value.find((s) => s.slotIndex === slotIdx && !s.whacked);
}

function handleWhack(slotIdx: number) {
  if (!isStarted.value || isFinished.value || props.disabled) return;
  const active = slotItemAt(slotIdx);
  if (!active) return;

  active.whacked = true;

  if (active.item.isThreat) {
    hits.value += 1;
    combo.value += 1;
    suriPose.value = 'ok';
    suriReactionKey.value += 1;
    bannerText.value = `🎯 ¡${active.item.label} bloqueado! ${active.item.tip}`;

    if (hits.value >= targetHits.value) {
      finishGame(true);
    }
  } else {
    mistakes.value += 1;
    combo.value = 0;
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    bannerText.value = `⚠️ ¡Bloqueaste tráfico legítimo (${active.item.label})! ${active.item.tip}`;

    if (mistakes.value >= maxMistakes.value) {
      finishGame(false);
    }
  }
}

watch(
  () => props.exercise.id,
  () => {
    initGame();
  }
);

onMounted(() => {
  initGame();
});

onUnmounted(() => {
  clearTimers();
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none text-left">
    <!-- Top HUD -->
    <div class="flex items-center justify-between gap-2 px-1 flex-wrap">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-error/15 text-error flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px] icon-filled">bolt</span>
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
          🎯 {{ hits }}/{{ targetHits }}
        </span>
        <span class="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-black">
          ⏱️ {{ timeLeft }}s
        </span>
        <span
          class="px-2.5 py-1 rounded-full text-xs font-black"
          :class="shieldsLeft <= 1 ? 'bg-error/15 text-error' : 'bg-surface-container text-on-surface'"
        >
          Escudos: {{ shieldsLeft }}
        </span>
      </div>
    </div>

    <!-- Main Arena -->
    <div class="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-md flex flex-col gap-3.5 relative overflow-hidden">
      <!-- Live Suri Feedback Bar -->
      <div class="flex items-center gap-3 bg-surface-container-low px-3.5 py-2 rounded-2xl border border-outline-variant/30">
        <SuriMascotAnimated
          :pose="suriPose"
          size="xs"
          :reaction-key="suriReactionKey"
          :show-shadow="false"
        />
        <p class="text-xs font-bold text-on-surface leading-snug flex-1">
          {{ bannerText }}
        </p>
        <span
          v-if="combo >= 2"
          class="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black shrink-0"
        >
          {{ combo }}x Combo
        </span>
      </div>

      <!-- 3x3 Ports Grid -->
      <div class="relative">
        <div class="grid grid-cols-3 gap-2.5">
          <button
            v-for="(portLabel, idx) in PORT_LABELS"
            :key="portLabel"
            type="button"
            :disabled="!isStarted || isFinished || disabled"
            class="min-h-[96px] sm:min-h-[108px] rounded-2xl p-2 border-2 flex flex-col items-center justify-between text-center transition-all active:scale-95"
            :class="
              slotItemAt(idx)
                ? slotItemAt(idx)?.item.isThreat
                  ? 'bg-error/15 border-error shadow-md animate-pulse'
                  : 'bg-shield-green/15 border-shield-green shadow-md'
                : 'bg-surface-container-low border-outline-variant/40 opacity-75'
            "
            @click="handleWhack(idx)"
          >
            <span class="text-[9px] font-mono font-black text-on-surface-variant">
              {{ portLabel }}
            </span>

            <template v-if="slotItemAt(idx)">
              <span
                class="material-symbols-outlined text-[28px] icon-filled"
                :class="slotItemAt(idx)?.item.isThreat ? 'text-error' : 'text-shield-green'"
              >
                {{ slotItemAt(idx)?.item.icon }}
              </span>
              <span
                class="text-[11px] font-black leading-tight line-clamp-2"
                :class="slotItemAt(idx)?.item.isThreat ? 'text-error' : 'text-shield-green'"
              >
                {{ slotItemAt(idx)?.item.label }}
              </span>
            </template>

            <template v-else>
              <span class="material-symbols-outlined text-[22px] text-outline/50">router</span>
              <span class="text-[10px] font-bold text-on-surface-variant/60">Tranquilo</span>
            </template>
          </button>
        </div>

        <!-- Start Overlay -->
        <div
          v-if="!isStarted"
          class="absolute inset-0 rounded-2xl bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-20"
        >
          <SuriMascotAnimated pose="running" size="md" :auto-blink="false" :show-shadow="false" />
          <div>
            <p class="text-sm font-black text-white">Atrapa al Hacker en los Puertos</p>
            <p class="text-[11px] text-stone-300 mt-1">
              Toca rápido <strong class="text-rose-400">{{ targetHits }} amenazas rojas</strong>. Deja pasar los <strong class="text-emerald-400">servicios verdes</strong>.
            </p>
          </div>
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
            @click="startGame"
          >
            ¡Iniciar Patrulla!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
