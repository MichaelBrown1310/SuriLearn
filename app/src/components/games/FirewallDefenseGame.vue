<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { FirewallDefenseExercise, FirewallPacketItem, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: FirewallDefenseExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

// Arcade Game State
const playerLane = ref<0 | 1 | 2>(1);
const serverHp = ref<number>(props.exercise.serverMaxHp || 100);
const score = ref<number>(0);
const combo = ref<number>(0);
const currentPacketIdx = ref<number>(0);
const packetYProgress = ref<number>(6); // 0% (top) to 86% (firewall perimeter)
const isStarted = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const isFinished = ref<boolean>(false);
const lastActionBanner = ref<{ text: string; isGood: boolean } | null>(null);
const laserEffectLane = ref<number | null>(null);
const shieldEffectLane = ref<number | null>(null);
const floatingScore = ref<{ text: string; lane: number; isGood: boolean } | null>(null);
const boardShake = ref<boolean>(false);
const correctDecisions = ref<number>(0);

const suriPose = ref<SuriPose>('shield');
const suriReactionKey = ref<number>(0);

let rafId: number | null = null;
let lastFrameTime = 0;
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
let shakeTimeout: ReturnType<typeof setTimeout> | null = null;

const activePacket = computed<FirewallPacketItem | undefined>(() => {
  return props.exercise.packets[currentPacketIdx.value];
});

const totalPackets = computed(() => props.exercise.packets.length);

const inDangerZone = computed(() => packetYProgress.value >= 65 && isStarted.value && !isFinished.value);

// Percentage progress per second
const speedPerSecond = computed(() => {
  const pkt = activePacket.value;
  if (!pkt) return 16;
  if (pkt.speedTier === 'boss') return 24;
  if (pkt.speedTier === 'fast') return 20;
  return 16;
});

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastFrameTime = 0;
}

function tick(now: number) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) {
    rafId = null;
    return;
  }

  if (!lastFrameTime) lastFrameTime = now;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  if (!activePacket.value) {
    finishGame();
    return;
  }

  packetYProgress.value += speedPerSecond.value * dt;

  if (packetYProgress.value >= 86) {
    handleTimeoutAtGate();
    if (isFinished.value) return;
  }

  rafId = requestAnimationFrame(tick);
}

function startLoop() {
  stopLoop();
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  lastFrameTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

function startGame() {
  if (props.disabled || isFinished.value) return;
  isStarted.value = true;
  isPaused.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  startLoop();
}

function togglePause() {
  if (!isStarted.value || isFinished.value || props.disabled) return;
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    stopLoop();
  } else {
    startLoop();
  }
}

function moveLane(lane: 0 | 1 | 2) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  playerLane.value = lane;
}

function triggerShake() {
  boardShake.value = false;
  if (shakeTimeout) clearTimeout(shakeTimeout);
  requestAnimationFrame(() => {
    boardShake.value = true;
    shakeTimeout = setTimeout(() => {
      boardShake.value = false;
    }, 360);
  });
}

function showFloating(text: string, lane: number, isGood: boolean) {
  floatingScore.value = { text, lane, isGood };
  if (feedbackTimeout) clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => {
    floatingScore.value = null;
  }, 850);
}

function handleTimeoutAtGate() {
  const pkt = activePacket.value;
  if (!pkt) return;

  combo.value = 0;
  suriPose.value = 'surprised';
  suriReactionKey.value += 1;
  triggerShake();

  if (pkt.isMalicious) {
    serverHp.value = Math.max(0, serverHp.value - 35);
    lastActionBanner.value = {
      text: `💥 ¡Brecha! ${pkt.protocolLabel} infiltró el servidor (-35% HP)`,
      isGood: false,
    };
    showFloating('-35% HP', pkt.lane, false);
  } else {
    serverHp.value = Math.max(0, serverHp.value - 20);
    lastActionBanner.value = {
      text: `⚠️ Tráfico legítimo ${pkt.protocolLabel} perdido por timeout (-20% HP)`,
      isGood: false,
    };
    showFloating('-20% HP', pkt.lane, false);
  }

  advanceNextPacket();
}

function handleAction(action: 'allow' | 'block') {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled || !activePacket.value) {
    return;
  }

  const pkt = activePacket.value;
  const wasPreAligned = playerLane.value === pkt.lane;
  playerLane.value = pkt.lane;

  if (action === 'block') {
    laserEffectLane.value = pkt.lane;
    setTimeout(() => {
      laserEffectLane.value = null;
    }, 260);
  } else {
    shieldEffectLane.value = pkt.lane;
    setTimeout(() => {
      shieldEffectLane.value = null;
    }, 260);
  }

  const isCorrect =
    (action === 'block' && pkt.isMalicious) || (action === 'allow' && !pkt.isMalicious);

  if (isCorrect) {
    combo.value += 1;
    correctDecisions.value += 1;
    const basePts = 100 * Math.min(combo.value, 4);
    const aimBonus = wasPreAligned ? 50 : 0;
    const pts = basePts + aimBonus;
    score.value += pts;
    suriPose.value = 'ok';
    suriReactionKey.value += 1;

    const bonusLabel = aimBonus > 0 ? `+${pts} PTS 🎯 Puntería +50` : `+${pts} PTS`;
    showFloating(bonusLabel, pkt.lane, true);
    lastActionBanner.value = {
      text:
        action === 'block'
          ? `⚡ ¡Amenaza neutralizada! ${bonusLabel} (${pkt.explanation})`
          : `✅ ¡Tráfico seguro autorizado! ${bonusLabel} (${pkt.explanation})`,
      isGood: true,
    };
  } else {
    combo.value = 0;
    serverHp.value = Math.max(0, serverHp.value - 35);
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    triggerShake();
    showFloating('-35% HP', pkt.lane, false);
    lastActionBanner.value = {
      text: pkt.isMalicious
        ? `🚨 ¡Error Crítico! Dejaste pasar ${pkt.protocolLabel}: ${pkt.explanation}`
        : `⚠️ ¡Falso Positivo! Bloqueaste tráfico legítimo (${pkt.protocolLabel})`,
      isGood: false,
    };
  }

  advanceNextPacket();
}

function advanceNextPacket() {
  if (serverHp.value <= 0) {
    finishGame(false);
    return;
  }

  if (currentPacketIdx.value < props.exercise.packets.length - 1) {
    currentPacketIdx.value += 1;
    packetYProgress.value = 6;
  } else {
    finishGame();
  }
}

function finishGame(forcedResult?: boolean) {
  if (isFinished.value) return;
  isFinished.value = true;
  stopLoop();

  const minCorrect = Math.ceil(props.exercise.packets.length * 0.75);
  const won =
    typeof forcedResult === 'boolean'
      ? forcedResult
      : serverHp.value > 0 && correctDecisions.value >= minCorrect;

  suriPose.value = won ? 'victory' : 'error';
  suriReactionKey.value += 1;
  emit('submit', won);
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled || isFinished.value) return;
  const key = e.key.toLowerCase();

  if (key === 'p' || e.key === 'Escape') {
    if (isStarted.value) {
      e.preventDefault();
      togglePause();
    }
    return;
  }

  if (!isStarted.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startGame();
    }
    return;
  }

  if (isPaused.value) return;

  if (e.key === '1') moveLane(0);
  else if (e.key === '2') moveLane(1);
  else if (e.key === '3') moveLane(2);
  else if (e.key === 'ArrowLeft' || key === 'a') {
    playerLane.value = Math.max(0, playerLane.value - 1) as 0 | 1 | 2;
  } else if (e.key === 'ArrowRight' || key === 'd') {
    playerLane.value = Math.min(2, playerLane.value + 1) as 0 | 1 | 2;
  } else if (e.key === ' ' || e.key === 'ArrowDown' || key === 's') {
    e.preventDefault();
    handleAction('block');
  } else if (e.key === 'ArrowUp' || key === 'w' || e.key === 'Enter') {
    e.preventDefault();
    handleAction('allow');
  }
}

function resetGame() {
  stopLoop();
  playerLane.value = 1;
  serverHp.value = props.exercise.serverMaxHp || 100;
  score.value = 0;
  combo.value = 0;
  currentPacketIdx.value = 0;
  packetYProgress.value = 6;
  correctDecisions.value = 0;
  lastActionBanner.value = null;
  floatingScore.value = null;
  laserEffectLane.value = null;
  shieldEffectLane.value = null;
  isStarted.value = false;
  isPaused.value = false;
  isFinished.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
}

watch(
  () => props.exercise.id,
  () => {
    resetGame();
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  stopLoop();
  if (feedbackTimeout) clearTimeout(feedbackTimeout);
  if (shakeTimeout) clearTimeout(shakeTimeout);
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none text-left">
    <!-- Top Arcade HUD (Paleta SuriLearn Adaptable) -->
    <div class="bg-surface-container-lowest text-on-surface rounded-3xl p-4 border-2 border-outline-variant/40 shadow-md">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/35 p-0.5 flex items-center justify-center shrink-0">
            <SuriMascotAnimated
              :pose="suriPose"
              size="xs"
              :reaction-key="suriReactionKey"
              :show-shadow="false"
            />
          </div>
          <div class="flex flex-col min-w-0">
            <span class="bg-primary/15 text-primary text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-primary/30 w-fit">
              🎹 Arcade Firewall · 3 Carriles
            </span>
            <span class="text-xs font-black text-on-surface mt-0.5">
              Paquete {{ currentPacketIdx + 1 }} / {{ totalPackets }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="text-xs font-black bg-surface-container px-2.5 py-1 rounded-xl border border-outline-variant/30">
            SCORE: <span class="text-primary">{{ score }}</span>
          </div>
          <div
            v-if="combo > 1"
            class="text-xs font-black bg-primary-container text-[#291800] px-2.5 py-1 rounded-xl animate-bounce"
          >
            COMBO x{{ Math.min(combo, 4) }}
          </div>
          <button
            v-if="isStarted && !isFinished"
            type="button"
            class="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] text-on-surface text-[11px] font-black border border-outline-variant/40 transition-colors"
            @click="togglePause"
          >
            {{ isPaused ? '▶ Reanudar' : '⏸ Pausar' }}
          </button>
        </div>
      </div>

      <!-- Server HP Bar -->
      <div class="flex items-center gap-3">
        <span class="text-[11px] font-black uppercase tracking-wider text-on-surface-variant shrink-0">
          Integridad Servidor:
        </span>
        <div class="flex-1 h-3 bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/40">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="
              serverHp > 60
                ? 'bg-shield-green'
                : serverHp > 30
                  ? 'bg-[#E1A653]'
                  : 'bg-error'
            "
            :style="{ width: `${serverHp}%` }"
          ></div>
        </div>
        <span class="text-xs font-black w-10 text-right">{{ serverHp }}%</span>
      </div>

      <!-- Active Firewall Rule Banner -->
      <div class="mt-2.5 bg-surface-container-low border border-primary/30 rounded-xl px-3 py-2 text-[11px] text-on-surface font-bold flex items-center gap-2">
        <span class="material-symbols-outlined text-[16px] text-primary icon-filled shrink-0">policy</span>
        <span>{{ exercise.firewallRuleBanner }}</span>
      </div>
    </div>

    <!-- Real-time Action Feedback Toast -->
    <div
      v-if="lastActionBanner"
      class="px-4 py-2 rounded-2xl text-xs font-black border flex items-center gap-2 transition-all"
      :class="
        lastActionBanner.isGood
          ? 'bg-shield-green/15 text-shield-green border-shield-green/40'
          : 'bg-error/15 text-error border-error/40'
      "
    >
      <span class="material-symbols-outlined text-[18px] icon-filled shrink-0">
        {{ lastActionBanner.isGood ? 'bolt' : 'warning' }}
      </span>
      <span>{{ lastActionBanner.text }}</span>
    </div>

    <!-- 3-Lane Cyber Battleground (Warm Carbón / Arena Ocre SuriLearn) -->
    <div
      class="relative w-full h-[320px] bg-[#1C1815] rounded-3xl border-2 border-[#E1A653]/45 overflow-hidden shadow-inner grid grid-cols-3 transition-transform"
      :class="{ 'animate-shake': boardShake }"
    >
      <!-- Lane Columns -->
      <div
        v-for="laneIdx in [0, 1, 2]"
        :key="laneIdx"
        class="relative h-full border-r last:border-r-0 border-[#44352C]/70 flex flex-col justify-between items-center py-2 cursor-pointer transition-colors"
        :class="playerLane === laneIdx ? 'bg-[#E1A653]/10' : ''"
        @click="moveLane(laneIdx as 0 | 1 | 2)"
      >
        <!-- Top Port Gate Label -->
        <div class="text-[10px] font-black uppercase tracking-wider text-[#F3B75B] bg-[#2B241F] px-2.5 py-0.5 rounded-full border border-[#5F4030] z-10">
          {{ laneIdx === 0 ? '[1] Web' : laneIdx === 1 ? '[2] Core' : '[3] Datos' }}
        </div>

        <!-- Floating Score / Damage Popup -->
        <div
          v-if="floatingScore && floatingScore.lane === laneIdx"
          class="absolute top-1/2 -translate-y-1/2 z-30 px-2.5 py-1 rounded-full text-[10px] font-black shadow-md animate-bounce pointer-events-none text-center"
          :class="floatingScore.isGood ? 'bg-shield-green text-white' : 'bg-error text-white'"
        >
          {{ floatingScore.text }}
        </div>

        <!-- Laser Beam Effect -->
        <div
          v-if="laserEffectLane === laneIdx"
          class="absolute inset-x-8 top-6 bottom-14 bg-gradient-to-t from-error via-[#F3B75B] to-transparent opacity-80 rounded-full animate-pulse z-20"
        ></div>

        <!-- Shield Absorb Effect -->
        <div
          v-if="shieldEffectLane === laneIdx"
          class="absolute inset-x-4 bottom-12 h-16 bg-shield-green/30 border-2 border-shield-green rounded-2xl animate-ping z-20"
        ></div>

        <!-- Descending Network Packet Tile (Zero Spoiler Colors) -->
        <div
          v-if="isStarted && activePacket && activePacket.lane === laneIdx"
          class="absolute inset-x-1.5 sm:inset-x-2 z-20"
          :style="{ top: `${packetYProgress}%` }"
        >
          <div class="p-2 sm:p-2.5 rounded-2xl border-2 border-[#E1A653] bg-[#2B241F] shadow-[0_4px_0_#161311] flex flex-col gap-1 text-[#FDFBF7] overflow-hidden">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 min-w-0 bg-[#3D2D1E] px-2 py-0.5 rounded-lg">
              <span class="text-[9px] sm:text-[10px] font-black text-[#F3B75B] break-words leading-tight">
                {{ activePacket.protocolLabel }}
              </span>
              <span class="text-[8px] sm:text-[9px] font-mono text-[#D4C3B3] truncate">
                {{ activePacket.sourceIp }}
              </span>
            </div>
            <p class="text-[9px] sm:text-[10px] font-mono text-[#FFF2DA] leading-tight break-words bg-[#161311] p-1.5 rounded-lg border border-[#44352C]">
              {{ activePacket.payloadPreview }}
            </p>
          </div>
        </div>

        <!-- Suri Defender Turret at Bottom of Lane -->
        <div class="mt-auto z-20 flex flex-col items-center">
          <div
            v-if="playerLane === laneIdx"
            class="w-12 h-12 rounded-2xl bg-[#E1A653]/25 border-2 border-[#E1A653] p-0.5 shadow-lg flex items-center justify-center transition-transform scale-105"
          >
            <SuriMascotAnimated
              :pose="suriPose"
              size="xs"
              :reaction-key="suriReactionKey"
              :show-shadow="false"
            />
          </div>
          <div
            v-else
            class="w-9 h-9 rounded-xl bg-[#2B241F] border border-[#44352C] flex items-center justify-center text-[#D4C3B3]/70 text-xs font-bold"
          >
            <span class="material-symbols-outlined text-[16px]">shield</span>
          </div>
        </div>
      </div>

      <!-- Firewall Perimeter Line (Danger pulse when packet is near bottom) -->
      <div
        class="absolute inset-x-0 bottom-14 h-0.5 pointer-events-none transition-colors"
        :class="
          inDangerZone
            ? 'bg-error shadow-[0_0_12px_#EF4444] animate-pulse'
            : 'bg-gradient-to-r from-[#E1A653]/40 via-[#00E5FF] to-[#E1A653]/40'
        "
      ></div>

      <!-- Start Overlay -->
      <div
        v-if="!isStarted"
        class="absolute inset-0 bg-[#161311]/88 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="shield" size="md" :auto-blink="false" :show-shadow="false" />
        <div class="max-w-sm">
          <p class="text-sm font-black text-[#FDFBF7]">Firewall Arcade: Defensa en 3 Carriles</p>
          <p class="text-[11px] text-[#D4C3B3] mt-1 leading-relaxed">
            Alinea a Suri en el carril con <strong class="text-[#F3B75B]">[1 / 2 / 3]</strong> o clic (<strong class="text-[#00E5FF]">+50 pts puntería</strong>) y decide rápido: <strong class="text-shield-green">[W / ↑] Permitir</strong> o <strong class="text-error">[Espacio / ↓] Bloquear</strong>.
          </p>
        </div>
        <button
          type="button"
          class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="startGame"
        >
          ¡Iniciar Defensa!
        </button>
      </div>

      <!-- Pause Overlay -->
      <div
        v-else-if="isPaused && !isFinished"
        class="absolute inset-0 bg-[#161311]/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-30"
      >
        <SuriMascotAnimated pose="sleeping" size="sm" :auto-blink="false" :show-shadow="false" />
        <p class="text-sm font-black text-[#F3B75B]">Defensa en Pausa</p>
        <button
          type="button"
          class="px-5 py-2 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
          @click="togglePause"
        >
          ▶ Reanudar Partida
        </button>
      </div>
    </div>

    <!-- Arcade Action Controls (Gamepad Buttons) -->
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class="h-14 rounded-2xl bg-shield-green text-white font-black text-xs sm:text-sm shadow-[0_4px_0_#15803d] active:translate-y-1 transition-all flex items-center justify-center gap-2 px-3 disabled:opacity-50"
        :disabled="disabled || !isStarted || isPaused || isFinished"
        @click="handleAction('allow')"
      >
        <span class="material-symbols-outlined text-[22px] icon-filled">check_circle</span>
        <div class="text-left leading-tight">
          <span class="block">PERMITIR PAQUETE</span>
          <span class="text-[10px] opacity-90 font-semibold">Tecla [W] o [↑] · Tráfico Seguro</span>
        </div>
      </button>

      <button
        type="button"
        class="h-14 rounded-2xl bg-error text-white font-black text-xs sm:text-sm shadow-[0_4px_0_#b91c1c] active:translate-y-1 transition-all flex items-center justify-center gap-2 px-3 disabled:opacity-50"
        :disabled="disabled || !isStarted || isPaused || isFinished"
        @click="handleAction('block')"
      >
        <span class="material-symbols-outlined text-[22px] icon-filled">bolt</span>
        <div class="text-left leading-tight">
          <span class="block">PULSO EMP / BLOQUEAR</span>
          <span class="text-[10px] opacity-90 font-semibold">Tecla [Espacio] o [↓] · Amenaza</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes suri-hit-shake {
  0%, 100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: suri-hit-shake 0.35s ease-in-out;
}
</style>
